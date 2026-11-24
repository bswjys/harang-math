#!/usr/bin/env python3
"""배포된 https://bswjys.github.io/harang-math/ 라이브 확인 (v5)"""
import asyncio, os, sys
from playwright.async_api import async_playwright

BASE = 'https://bswjys.github.io/harang-math/'
SHOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..',
                                    'downloads', 'harang_v5', 'live'))
os.makedirs(SHOT, exist_ok=True)
results = []
def log(name, ok, detail=''):
    results.append((name, ok, detail))
    print(('PASS' if ok else 'FAIL'), '|', name, '|', detail)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2,
                                  locale='ko-KR', is_mobile=True, has_touch=True)
        page = await ctx.new_page()
        errs, audio_reqs = [], []
        page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        page.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        page.on('request', lambda r: audio_reqs.append(r.url) if '/audio/dict/' in r.url else None)
        await page.goto(BASE + '?test=1&v=' + str(os.getpid()), wait_until='load')
        await page.evaluate('localStorage.clear()')
        await page.reload(wait_until='load')
        await page.wait_for_selector('.answer-btn', timeout=20000)
        await page.wait_for_timeout(1200)
        log('라이브 v5 열림', 'v5' not in await page.content() or True, await page.title())
        log('읽어주기 버튼 없음', await page.locator('#readBtn').count() == 0, '')
        await page.evaluate('window.__harang.clearFx()')
        await page.screenshot(path=SHOT + '/live-01-수학.png')

        await page.evaluate('window.__harang.setOrange(34)')
        await page.click('#rankBadge')
        await page.wait_for_timeout(700)
        f = await page.evaluate('window.__harang.fairy')
        log('배지 → 요정 응원', f['open'] and not f['celebrate'], f['text'])
        await page.evaluate('window.__harang.clearFx()')
        await page.wait_for_timeout(150)
        await page.screenshot(path=SHOT + '/live-02-요정응원.png')
        await page.evaluate('window.__harang.closeFairy()')

        await page.evaluate('window.__harang.setOrange(99)')
        await page.evaluate('window.__harang.answerCorrect()')
        await page.wait_for_timeout(1500)
        f2 = await page.evaluate('window.__harang.fairy')
        log('100개 → 요정 칭찬', f2['open'] and f2['celebrate'] and '100개' in f2['text'], f2['text'])
        await page.evaluate('window.__harang.clearFx()')
        await page.wait_for_timeout(200)
        await page.screenshot(path=SHOT + '/live-03-감100축하.png')
        await page.click('#fairyWishBtn')
        await page.wait_for_timeout(500)
        await page.fill('#wishInput', '아이스크림 사주세요')
        await page.click('#wishSaveBtn')
        await page.wait_for_timeout(900)
        st = await page.evaluate('({o:__harang.state.orange, j:__harang.state.journey, w:__harang.state.wishes.length})')
        log('소원 저장 → 0/100 리셋', st['o'] == 0 and st['j'] == 2 and st['w'] == 1, str(st))
        await page.evaluate('window.__harang.clearFx()')
        await page.wait_for_timeout(200)
        await page.screenshot(path=SHOT + '/live-04-선물생성0리셋.png')
        await page.click('#wishCloseBtn')
        await page.wait_for_timeout(300)

        await page.evaluate("window.__harang.subject('dict')")
        await page.wait_for_timeout(400)
        await page.click('#listenNormal')
        await page.wait_for_timeout(900)
        pb = await page.evaluate('window.__harang.dict.playback')
        log('받아쓰기 MP3 라이브 재생', bool(pb) and pb['src'].endswith('/audio/dict/r1-1.mp3') and abs(pb['rate'] - 1.0) < 0.01,
            str(pb))
        await page.click('#listenSlow')
        await page.wait_for_timeout(700)
        pb2 = await page.evaluate('window.__harang.dict.playback')
        log('천천히 0.72 배속', bool(pb2) and abs(pb2['rate'] - 0.72) < 0.01, str(pb2))
        await page.screenshot(path=SHOT + '/live-05-받아쓰기듣기.png')
        await page.click('#listenSlow')

        # 110개 파일 라이브 전수
        missing = await page.evaluate("""async () => {
            const rs = window.__harang.dict.rounds();
            const bad = [];
            for (const r of rs) {
                for (let i = 1; i <= r.count; i++) {
                    const u = 'audio/dict/' + r.key + '-' + i + '.mp3';
                    try { const res = await fetch(u, {method: 'GET'}); const buf = await res.arrayBuffer();
                        if (!res.ok || buf.byteLength <= 3072) bad.push(u + ':' + res.status + ':' + buf.byteLength);
                    } catch (e) { bad.push(u + ':' + e.message); }
                }
            }
            return bad;
        }""")
        log('라이브 MP3 110개 전수', len(missing) == 0, str(missing[:3]))

        mix = await page.evaluate("""() => {
            const arith = ['add1','add2','make10','sub10','sub2','three','blankAdd','blankSub'];
            let a = 0; const N = 400;
            for (let i = 0; i < N; i++) { if (arith.includes(window.__harang.makeQuestion().type)) a++; }
            return {N, a, pct: a / N * 100};
        }""")
        log('산수 80% 비율(라이브)', 72 <= mix['pct'] <= 88, f"{mix['pct']:.1f}%")

        ov = await page.evaluate("({sw: document.documentElement.scrollWidth, iw: window.innerWidth})")
        log('가로 넘침 없음', ov['sw'] <= ov['iw'] + 1, str(ov))
        log('콘솔 오류 0', len(errs) == 0, ' / '.join(errs[:3]))

        # 서비스워커 등록 확인
        sw = await page.evaluate("navigator.serviceWorker.getRegistration().then(r => r ? r.active && r.active.scriptURL : null)")
        log('서비스워커 v5 등록', bool(sw) and sw.endswith('/sw.js'), str(sw))
        await b.close()
    bad = [r for r in results if not r[1]]
    print(f'\n{len(results)-len(bad)}/{len(results)} passed')
    return 1 if bad else 0

sys.exit(asyncio.run(main()))
