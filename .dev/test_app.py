#!/usr/bin/env python3
"""공부하랑핑 검증: 모바일(390) / 태블릿 / PC 동작·레이아웃·소원·PWA"""
import http.server
import socketserver
import threading
import functools
import os
import sys
import json
import time

from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SHOTS = os.path.abspath(os.path.join(ROOT, '..', '..', 'downloads', 'harang_math'))
os.makedirs(SHOTS, exist_ok=True)

PORT = 0
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass
handler = functools.partial(Quiet, directory=ROOT)
socketserver.ThreadingTCPServer.allow_reuse_address = True
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', PORT), handler)
httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
PORT = httpd.server_address[1]

BASE = f'http://127.0.0.1:{PORT}/?test=1'
results = []
errors = []

def log(name, ok, detail=''):
    results.append((name, ok, detail))
    print(('PASS' if ok else 'FAIL'), '|', name, '|', detail)

def shot(page, name, settle=1700):
    if settle:
        page.wait_for_timeout(settle)
    path = os.path.join(SHOTS, name + '.png')
    page.screenshot(path=path)
    return path

def overflow(page):
    return page.evaluate("""() => {
        const de = document.documentElement;
        return {sw: de.scrollWidth, iw: window.innerWidth,
                wide: [...document.querySelectorAll('body *')].filter(el => {
                    const r = el.getBoundingClientRect();
                    return r.width > 0 && r.right > window.innerWidth + 1.5;
                }).slice(0,6).map(el => el.tagName + '.' + (el.className||'').toString().slice(0,40))};
    }""")

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2,
                                  locale='ko-KR', is_mobile=True, has_touch=True)
        page = ctx.new_page()
        console_errors = []
        page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)
        page.on('pageerror', lambda e: console_errors.append('pageerror: ' + str(e)))

        page.goto(BASE, wait_until='load')
        page.wait_for_selector('.answer-btn', timeout=10000)
        page.wait_for_timeout(600)

        # 1) 기본 화면
        title = page.title()
        brand = page.inner_text('.brand h1')
        log('타이틀/브랜드', '공부하랑핑' in title and brand == '공부하랑핑', f'{title} / {brand}')
        shot(page, '01-모바일390-첫화면')
        ov = overflow(page)
        log('가로 넘침 없음 (390)', ov['sw'] <= ov['iw'] + 1, json.dumps(ov, ensure_ascii=False))

        st = page.evaluate('window.__harang.state')
        log('초기 상태', st['orange'] == 0 and st['journey'] == 1, json.dumps({k: st[k] for k in ('orange','journey')}))
        font_ok = page.evaluate("document.fonts.check('20px HarangSans')")
        log('한글 폰트 로드', bool(font_ok), 'HarangSans')
        badge = page.evaluate("getComputedStyle(document.getElementById('wishBadge')).display")
        log('소원 배지 숨김', badge == 'none', badge)

        # 2) 힌트 토글 (그림 힌트 있는 문제가 나올 때까지)
        hint_done = False
        for _ in range(30):
            has_hint = page.evaluate("!document.getElementById('hintRow').hidden")
            if has_hint:
                page.click('#hintBtn')
                page.wait_for_timeout(350)
                visible = page.evaluate("!document.getElementById('hintArea').hidden")
                if visible:
                    shot(page, '02-그림힌트-펼침')
                    page.click('#hintBtn')
                log('그림 힌트 토글', visible, page.evaluate("window.__harang.current.type"))
                hint_done = visible
                break
            page.evaluate('window.__harang.answerCorrect()')
            page.wait_for_timeout(120)
            if page.locator('.modal:not([hidden])').count():
                page.click('#wishCloseBtn')
            page.evaluate('window.__harang.next()')
            page.wait_for_timeout(140)
        if not hint_done:
            log('그림 힌트 토글', False, '힌트 문제를 못 만남')

        # 3) 여러 유형 둘러보기 (정답 응원 + 해설)
        seen = set()
        if hint_done:
            seen.add(page.evaluate('window.__harang.current.type'))
        for i in range(120):
            if page.locator('.modal:not([hidden])').count():
                # 100개 달성 팝업은 따로 검증하므로 여기서는 닫기
                page.click('#wishCloseBtn')
                page.wait_for_timeout(150)
            qtype = page.evaluate('window.__harang.current.type')
            if qtype not in seen:
                seen.add(qtype)
                shot(page, f'03-문제-{len(seen):02d}-{qtype}', 2400)
                page.evaluate('window.__harang.answerCorrect()')
                page.wait_for_timeout(420)
                shot(page, f'04-정답응원-{len(seen):02d}-{qtype}', 1750)
            else:
                page.evaluate('window.__harang.answerCorrect()')
                page.wait_for_timeout(120)
            page.evaluate('window.__harang.next()')
            page.wait_for_timeout(130)
            if len(seen) >= 13:
                break
        log('다양한 유형 출제', len(seen) >= 8, f'{len(seen)}종: ' + ', '.join(sorted(seen)))

        # 4) 감 적립 / 상태바
        page.wait_for_timeout(400)
        st = page.evaluate('window.__harang.state')
        log('감 적립', st['orange'] > 0, f"orange={st['orange']} total={st['totalOrange']}")
        bar = page.evaluate("document.getElementById('progressBar').style.width")
        log('진행바 반영', bar not in ('', '0%'), bar)

        # 5) 오답 격려 + 해설 + 재도전
        if page.locator('.modal:not([hidden])').count():
            page.click('#wishCloseBtn')
        page.evaluate("window.__harang.next && null")
        setlev = page.evaluate('window.__harang.setOrange(10)')
        lvl10 = page.inner_text('#levelName')
        log('칭호 10개 단계', lvl10 == '반짝 하랑핑', lvl10)
        page.evaluate('window.__harang.setOrange(0)')
        wrong = page.evaluate('window.__harang.wrongValue()')
        page.evaluate(f'window.__harang.answer({json.dumps(wrong)})')
        page.wait_for_timeout(450)
        fb_title = page.inner_text('#fbTitle')
        fb_explain = page.inner_text('#fbExplain')
        log('오답 격려(이름/해설)', ('하랑' in fb_title or '하랑' in page.inner_text('#fbSub')) and len(fb_explain) > 10,
            fb_title + ' | ' + fb_explain[:40].replace('\n', ' '))
        shot(page, '05-오답격려-해설')
        orange_before = page.evaluate('window.__harang.state.orange')
        page.click('text=다시 풀어보기')
        page.wait_for_timeout(200)
        page.evaluate('window.__harang.answerCorrect()')
        page.wait_for_timeout(450)
        orange_after = page.evaluate('window.__harang.state.orange')
        retry_title = page.inner_text('#fbTitle')
        log('재도전 정답 + 감 지급', orange_after == min(100, orange_before + 1) and '다시' in retry_title,
            f'{orange_before}->{orange_after} / {retry_title}')
        shot(page, '06-재도전성공')

        # 5-b) 틀린 뒤 해설 보고 넘어가기 → 노력 감 1개
        page.click('text=다음 문제')
        page.wait_for_timeout(300)
        if page.locator('#wishModal:not([hidden])').count():
            page.click('#wishCloseBtn')
        before_effort = page.evaluate('window.__harang.state.orange')
        ow = page.evaluate('window.__harang.wrongValue()')
        page.evaluate(f'window.__harang.answer({json.dumps(ow)})')
        page.wait_for_timeout(350)
        page.click('text=알겠어요')
        page.wait_for_timeout(600)
        after_effort = page.evaluate('window.__harang.state.orange')
        log('노력 감 지급(틀려도 +1)', after_effort == min(100, before_effort + 1),
            f'{before_effort}->{after_effort}')
        if page.locator('#wishModal:not([hidden])').count():
            page.click('#wishCloseBtn')

        # 6) 100개 달성 → 소원 팝업
        page.evaluate('window.__harang.setOrange(99)')
        page.evaluate('window.__harang.next()')
        page.wait_for_timeout(200)
        if page.locator('.modal:not([hidden])').count():
            page.click('#wishCloseBtn')
            page.wait_for_timeout(150)
        page.evaluate('window.__harang.answerCorrect()')
        page.wait_for_timeout(1500)
        modal_open = page.locator('#wishModal:not([hidden])').count() > 0
        lvl = page.inner_text('#levelName')
        log('감100 소원 팝업', modal_open and lvl == '소원요정 하랑핑', f'칭호={lvl}')
        if modal_open:
            page.wait_for_timeout(500)
            shot(page, '07-감100-소원팝업')
            page.click('.wish-chip >> nth=0')
            page.wait_for_timeout(200)
            page.click('#wishSaveBtn')
            page.wait_for_timeout(800)
            saved_text = page.inner_text('#wishSavedText')
            log('소원 저장', len(saved_text) > 3, saved_text)
            shot(page, '08-소원저장-쿠폰함안내')
            page.click('#wishCloseBtn')
            page.wait_for_timeout(300)

        # 7) 소원 쿠폰함 + 엄마아빠 확인 + 새 도전
        page.click('#wishBoxBtn')
        page.wait_for_timeout(500)
        shot(page, '09-소원쿠폰함')
        log('쿠폰함 노출', page.locator('.coupon').count() >= 1, f"coupons={page.locator('.coupon').count()}")
        page.click('.coupon .c-actions button')
        page.wait_for_timeout(700)
        start_btn = page.locator('text=새로운 100개 도전 시작').count()
        log('소원 확인 후 새 도전 버튼', start_btn > 0, f'buttons={start_btn}')
        shot(page, '10-소원확인-새도전')
        if start_btn:
            page.click('text=새로운 100개 도전 시작')
            page.wait_for_timeout(600)
            st = page.evaluate('window.__harang.state')
            log('새 100개 도전 시작', st['orange'] == 0 and st['journey'] == 2, f"orange={st['orange']}, journey={st['journey']}")
            shot(page, '11-새도전시작')

        # 8) 새로고침 유지
        before = page.evaluate('window.__harang.state')
        page.reload(wait_until='load')
        page.wait_for_selector('.answer-btn')
        page.wait_for_timeout(700)
        after = page.evaluate('window.__harang.state')
        log('새로고침 후 저장 유지',
            after['journey'] == before['journey'] and after['orange'] == before['orange']
            and len(after['wishes']) == len(before['wishes']),
            f"journey={after['journey']} orange={after['orange']} wishes={len(after['wishes'])}")

        # 9) 효과음 토글
        page.click('#soundBtn')
        page.wait_for_timeout(250)
        snd = page.evaluate('window.__harang.state.sound')
        icon = page.inner_text('#soundBtn')
        log('효과음 토글', snd is False and icon == '🔇', f'sound={snd}, icon={icon}')
        page.click('#soundBtn')
        page.wait_for_timeout(200)
        log('효과음 다시 켜기', page.evaluate('window.__harang.state.sound') is True, '')

        # 10) 콘솔 오류 / 넘침
        ov = overflow(page)
        log('가로 넘침 없음 (모바일 최종)', ov['sw'] <= ov['iw'] + 1, json.dumps(ov, ensure_ascii=False))
        log('콘솔 오류 0건', len(console_errors) == 0, ' / '.join(console_errors[:4]))

        # 11) 태블릿 / PC
        for name, vw, vh, mobile in [('태블릿-820', 820, 1180, True), ('PC-1280', 1280, 900, False)]:
            c2 = browser.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=1,
                                     locale='ko-KR', is_mobile=mobile, has_touch=mobile)
            pg = c2.new_page()
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(BASE, wait_until='load')
            pg.wait_for_selector('.answer-btn')
            pg.wait_for_timeout(600)
            ov2 = overflow(pg)
            log(f'가로 넘침 없음 ({name})', ov2['sw'] <= ov2['iw'] + 1, json.dumps(ov2, ensure_ascii=False))
            shot(pg, f'12-{name}-문제')
            pg.evaluate('window.__harang.answerCorrect()')
            pg.wait_for_timeout(500)
            shot(pg, f'13-{name}-정답응원')
            log(f'오류 없음 ({name})', len(errs) == 0, ' '.join(errs[:2]))
            c2.close()

        # 12) 오프라인 PWA
        try:
            page.evaluate("navigator.serviceWorker.ready.then(()=>true)")
            page.wait_for_timeout(1200)
            page.reload(wait_until='load')
            page.wait_for_selector('.answer-btn', timeout=8000)
            ctx.set_offline(True)
            page.reload(wait_until='load')
            page.wait_for_selector('.answer-btn', timeout=8000)
            ok_off = page.inner_text('.brand h1') == '공부하랑핑'
            log('오프라인에서 열림', ok_off, 'service worker 캐시')
            shot(page, '14-오프라인')
        except Exception as e:
            log('오프라인에서 열림', False, str(e)[:120])
        finally:
            ctx.set_offline(False)

        ctx.close()
        browser.close()

    print('\n===== 요약 =====')
    passed = sum(1 for r in results if r[1])
    print(f'{passed}/{len(results)} 통과')
    with open(os.path.join(SHOTS, 'test-report.json'), 'w', encoding='utf-8') as f:
        json.dump([{'name': n, 'ok': o, 'detail': d} for n, o, d in results], f, ensure_ascii=False, indent=2)
    return 0 if passed == len(results) else 1

try:
    sys.exit(run())
finally:
    httpd.shutdown()
