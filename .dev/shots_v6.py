#!/usr/bin/env python3
"""v6 보고용 스크린샷 — 감 배지 감 비 · 오답 감 0"""
import functools, http.server, json, os, socketserver, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SHOT = os.path.abspath(os.path.join(ROOT, '..', '..', 'downloads', 'harang_v6'))
os.makedirs(SHOT, exist_ok=True)

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

s = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT))
s.daemon_threads = True
threading.Thread(target=s.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{s.server_address[1]}/index.html?test=1'
p_ = lambda n: os.path.join(SHOT, n)

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2,
                             locale='ko-KR', is_mobile=True, has_touch=True)
    page = ctx.new_page()
    errs = []
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    page.goto(URL, wait_until='load')
    page.evaluate('localStorage.clear()')
    page.reload(wait_until='load')
    page.wait_for_selector('.answer-btn')
    page.wait_for_timeout(700)

    page.screenshot(path=p_('v6-01-첫화면-감배지버튼.png'))

    # 감 비 — 한 번 (중간 낙하 순간)
    page.evaluate('window.__harang.setOrange(23)')
    page.wait_for_timeout(150)
    page.evaluate('window.__harang.tapOrange()')
    page.wait_for_timeout(900)
    page.screenshot(path=p_('v6-02-감비-한번(0.9초).png'))
    page.wait_for_timeout(700)
    page.screenshot(path=p_('v6-03-감비-내려오는중(1.6초).png'))

    # 연속 클릭 (더 신나게)
    page.evaluate('window.__harang.clearFx()')
    for _ in range(4):
        page.evaluate('window.__harang.tapOrange()')
        page.wait_for_timeout(180)
    page.wait_for_timeout(700)
    page.screenshot(path=p_('v6-04-감비-연속클릭.png'))
    fx = page.evaluate('window.__harang.fx')
    print('연속 클릭 oranges:', fx['oranges'], 'pixels:', fx['pixels'])

    page.evaluate('window.__harang.clearFx()')
    page.wait_for_timeout(250)

    # 오답 → 감 0 안내
    page.evaluate('window.__harang.setOrange(23)')
    wv = page.evaluate('window.__harang.wrongValue()')
    page.evaluate(f'window.__harang.answer({json.dumps(wv)})')
    page.wait_for_timeout(700)
    print('오답 후 orange:', page.evaluate('window.__harang.state.orange'))
    page.screenshot(path=p_('v6-05-오답-감0-해설.png'))

    # 알겠어요! 다음 문제 → 여전히 감 0
    page.click('text=알겠어요')
    page.wait_for_timeout(800)
    print('알겠어요 후 orange:', page.evaluate('window.__harang.state.orange'))
    page.screenshot(path=p_('v6-06-해설보고넘어가도-감0.png'))

    # 받아쓰기 공책 모드 ❌ → 감 0
    page.evaluate("window.__harang.subject('dict')")
    page.wait_for_timeout(400)
    page.evaluate("window.__harang.dict.select('r2')")
    page.wait_for_timeout(250)
    o0 = page.evaluate('window.__harang.state.orange')
    page.evaluate("window.__harang.dict.showAnswer()")
    page.click('#dictMarkWrong')
    page.wait_for_timeout(500)
    o1 = page.evaluate('window.__harang.state.orange')
    print('받아쓰기 ❌ orange:', o0, '->', o1)
    page.screenshot(path=p_('v6-07-받아쓰기-다시연습-감0.png'))

    # 태블릿 감 비
    c2 = browser.new_context(viewport={'width': 820, 'height': 1180}, device_scale_factor=1,
                             locale='ko-KR', is_mobile=True, has_touch=True)
    pg = c2.new_page()
    pg.goto(URL, wait_until='load')
    pg.wait_for_selector('.answer-btn')
    pg.wait_for_timeout(700)
    pg.evaluate('window.__harang.setOrange(64)')
    pg.evaluate('window.__harang.tapOrange()')
    pg.wait_for_timeout(1100)
    pg.screenshot(path=p_('v6-08-태블릿820-감비.png'))

    # PC
    c3 = browser.new_context(viewport={'width': 1280, 'height': 900}, device_scale_factor=1,
                             locale='ko-KR')
    pc = c3.new_page()
    pc.goto(URL, wait_until='load')
    pc.wait_for_selector('.answer-btn')
    pc.wait_for_timeout(700)
    pc.evaluate('window.__harang.setOrange(88)')
    pc.evaluate('window.__harang.tapOrange()')
    pc.wait_for_timeout(1000)
    pc.screenshot(path=p_('v6-09-PC1280-감비.png'))
    ov = pc.evaluate("({sw: document.documentElement.scrollWidth, iw: window.innerWidth})")
    print('PC overflow:', ov)

    print('console errors:', errs)
    browser.close()
s.shutdown()
