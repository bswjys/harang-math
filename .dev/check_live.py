#!/usr/bin/env python3
"""배포된 https://bswjys.github.io/harang-math/ 라이브 확인 (v6 — 🍊 감 비 · 오답 감 0)"""
import asyncio, json, os, sys
from playwright.async_api import async_playwright

BASE = 'https://bswjys.github.io/harang-math/'
SHOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..',
                                    'downloads', 'harang_v6', 'live'))
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
        log('라이브 v6 열림', '공부하랑핑' in await page.title(), await page.title())

        html = await page.evaluate("fetch('index.html').then(r => r.text()).catch(() => '')")
        sw_txt = await page.evaluate("fetch('sw.js').then(r => r.text()).catch(() => '')")
        log('라이브 에셋 v=6', 'styles.css?v=6' in html and 'app.js?v=6' in html
            and 'dict.js?v=6' in html and 'dict-data.js?v=6' in html, 'index.html 쿼리')
        log('라이브 서비스워커 v6', "harang-math-v6" in sw_txt, sw_txt.split('\n')[1][:60])

        # 🍊 감 배지 → 감 비
        badge = await page.evaluate('window.__harang.orangeBadge')
        log('감 배지가 버튼', badge and badge['tag'] == 'BUTTON' and '감' in badge['label'],
            json.dumps(badge, ensure_ascii=False))
        await page.evaluate('window.__harang.setOrange(23)')
        await page.wait_for_timeout(150)
        tap = await page.evaluate('window.__harang.tapOrange()')
        await page.wait_for_timeout(800)
        fx = await page.evaluate('window.__harang.fx')
        toast_i = await page.evaluate('window.__harang.toastInfo')
        log('감 배지 클릭 → 감 비(캔버스에 실제로 그려짐)',
            20 <= tap['added'] <= 30 and fx['oranges'] >= 20 and fx['running'] and fx['pixels'] > 5000,
            f"added={tap['added']} oranges={fx['oranges']} pixels={fx['pixels']}")
        log('감 비 응원 토스트', (not toast_i['hidden']) and any(k in toast_i['text'] for k in
            ['주르륵', '통통통', '폭포', '우수수', '통통 튀']), toast_i['text'].replace('\n', ' '))
        log('감 배지 클릭은 감 개수를 바꾸지 않음',
            await page.evaluate('window.__harang.state.orange') == 23, '')
        await page.screenshot(path=SHOT + '/live-01-감배지-감비.png')
        first = fx['oranges']
        for _ in range(12):
            await page.evaluate('window.__harang.tapOrange()')
            await page.wait_for_timeout(40)
        fx2 = await page.evaluate('window.__harang.fx')
        log('연속 클릭 → 더 많이 · 180개 이하', fx2['oranges'] > first and fx2['oranges'] <= 180,
            f"{first} -> {fx2['oranges']}")
        await page.screenshot(path=SHOT + '/live-02-감비-연속클릭.png')
        await page.wait_for_timeout(200)
        await page.evaluate('window.__harang.clearFx()')

        # 틀리면 +0 (해설 보고 넘어가기)
        await page.evaluate('window.__harang.setOrange(23)')
        ow = await page.evaluate('window.__harang.wrongValue()')
        await page.evaluate(f'window.__harang.answer({json.dumps(ow)})')
        await page.wait_for_timeout(400)
        o_wrong = await page.evaluate('window.__harang.state.orange')
        sub = await page.evaluate('window.__harang.feedbackSub')
        await page.screenshot(path=SHOT + '/live-03-오답-감0.png')
        await page.click('text=알겠어요')
        await page.wait_for_timeout(600)
        o_move = await page.evaluate('window.__harang.state.orange')
        log('라이브: 틀리면 감 +0 (해설 보고 넘어가기)', o_wrong == 23 and o_move == 23 and '0개' in sub,
            f'23 -> {o_wrong} -> {o_move} / {sub}')

        # 맞히면 +1
        await page.evaluate('window.__harang.answerCorrect()')
        await page.wait_for_timeout(500)
        o_right = await page.evaluate('window.__harang.state.orange')
        log('라이브: 맞히면 감 +1', o_right == 24, f'{o_move} -> {o_right}')

        # 받아쓰기 ❌ 다시 연습할래요 → +0
        await page.evaluate("window.__harang.subject('dict')")
        await page.wait_for_timeout(400)
        await page.evaluate("window.__harang.dict.select('r2')")
        await page.wait_for_timeout(250)
        await page.evaluate("window.__harang.dict.showAnswer()")
        o_d0 = await page.evaluate('window.__harang.state.orange')
        await page.click('#dictMarkWrong')
        await page.wait_for_timeout(450)
        o_d1 = await page.evaluate('window.__harang.state.orange')
        log('라이브: 받아쓰기 ❌ 다시 연습할래요 → 감 +0', o_d1 == o_d0, f'{o_d0} -> {o_d1}')
        await page.screenshot(path=SHOT + '/live-04-받아쓰기-감0.png')

        # 듣기 · 넘침 · 오류
        await page.click('#listenNormal')
        await page.wait_for_timeout(900)
        pb = await page.evaluate('window.__harang.dict.playback')
        log('받아쓰기 MP3 라이브 재생', bool(pb) and pb['src'].endswith('/audio/dict/r2-1.mp3')
            and abs(pb['rate'] - 1.0) < 0.01, str(pb))
        await page.click('#listenNormal')
        await page.evaluate("window.__harang.subject('math')")
        await page.wait_for_timeout(300)
        ov = await page.evaluate("({sw: document.documentElement.scrollWidth, iw: window.innerWidth})")
        log('가로 넘침 없음', ov['sw'] <= ov['iw'] + 1, str(ov))
        log('콘솔 오류 0', len(errs) == 0, ' / '.join(errs[:3]))

        sw = await page.evaluate("navigator.serviceWorker.getRegistration().then(r => r ? r.active && r.active.scriptURL : null)")
        log('서비스워커 등록', bool(sw) and sw.endswith('/sw.js'), str(sw))
        await b.close()
    bad = [r for r in results if not r[1]]
    print(f'\n{len(results)-len(bad)}/{len(results)} passed')
    return 1 if bad else 0

sys.exit(asyncio.run(main()))
