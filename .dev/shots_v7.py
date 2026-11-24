#!/usr/bin/env python3
"""v7 보고용 스크린샷 — 풍성한 요정 · 3과목 탭 · 영어 4코스 · 리포트
명령: LD_LIBRARY_PATH=... python3 .dev/shots_v7.py
"""
import functools, http.server, os, socketserver, threading, time
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SHOT = os.path.abspath(os.path.join(ROOT, '..', '..', 'downloads', 'harang_v7'))
os.makedirs(SHOT, exist_ok=True)


class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


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

    # 1) 첫 화면 — 상단 3과목 탭
    page.screenshot(path=p_('v7-01-첫화면-3과목탭.png'))

    # 2) 요정 응원 팝업 (평소) — 머리카락 풍성함
    page.evaluate('window.__harang.setOrange(34)')
    page.evaluate('window.__harang.openFairy(false)')
    page.wait_for_timeout(600)
    page.screenshot(path=p_('v7-02-요정-평소.png'))
    page.evaluate('window.__harang.closeFairy()')

    # 3) 감 100개 축하 요정 (왕관)
    page.evaluate('window.__harang.setOrange(100)')
    page.evaluate('window.__harang.openFairy(true)')
    page.wait_for_timeout(700)
    page.screenshot(path=p_('v7-03-요정-100개축하.png'))
    fx = page.evaluate('window.__harang.fairy')
    page.evaluate('window.__harang.closeFairy()')

    # 4) 영어 4코스
    page.evaluate('window.__harang.setOrange(12)')
    page.evaluate("window.__harang.subject('eng')")
    page.wait_for_timeout(500)
    page.screenshot(path=p_('v7-04-영어-그림영단어.png'))

    # 코스 목록 펼치기
    page.click('#engCourseBtn')
    page.wait_for_timeout(350)
    page.screenshot(path=p_('v7-05-영어-코스목록.png'))
    page.click('#engCourseBtn')

    for key, name in (('listen', '06-영어-소리듣고찾기'), ('talk', '07-영어-생활영어'), ('blank', '08-영어-빈칸알파벳')):
        page.evaluate(f"window.__harang.eng.select('{key}')")
        page.wait_for_timeout(400)
        page.evaluate('window.__harang.clearFx()')
        page.wait_for_timeout(120)
        page.screenshot(path=p_(f'v7-{name}.png'))

    # 5) 정답 피드백 (해설 + 다시 듣기)
    page.evaluate("window.__harang.eng.select('pic')")
    page.wait_for_timeout(300)
    page.evaluate('window.__harang.eng.answerCorrect()')
    page.wait_for_timeout(900)
    page.evaluate('window.__harang.clearFx()')
    page.wait_for_timeout(200)
    page.evaluate("document.getElementById('engFeedback').scrollIntoView({block:'center'})")
    page.wait_for_timeout(300)
    page.screenshot(path=p_('v7-09-영어-정답해설.png'))

    # 6) 리포트 (3과목)
    page.evaluate("window.__harang.subject('eng')")
    page.evaluate('window.__harang.openReport()')
    page.wait_for_timeout(500)
    page.evaluate('window.__harang.clearFx()')
    page.wait_for_timeout(200)
    page.screenshot(path=p_('v7-10-리포트-3과목.png'))
    page.click('#reportDone')
    page.wait_for_timeout(300)

    # 7) 받아쓰기 회귀 확인
    page.evaluate("window.__harang.subject('dict')")
    page.wait_for_timeout(400)
    page.screenshot(path=p_('v7-11-받아쓰기.png'))
    page.evaluate("window.__harang.subject('math')")
    page.wait_for_timeout(300)

    # 8) 태블릿 / PC
    for w, tag in ((820, '12-태블릿820'), (1280, '13-PC1280')):
        page.set_viewport_size({'width': w, 'height': 900})
        page.wait_for_timeout(400)
        page.screenshot(path=p_(f'v7-{tag}.png'))
        page.evaluate("window.__harang.subject('eng')")
        page.wait_for_timeout(300)
        page.screenshot(path=p_(f'v7-{tag}-영어.png'))
        page.evaluate("window.__harang.subject('math')")

    print('errors:', errs)
    print('fairy:', fx)
    browser.close()
