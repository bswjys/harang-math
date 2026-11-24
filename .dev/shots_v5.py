#!/usr/bin/env python3
"""v5 보고용 스크린샷 (390px 중심)"""
import asyncio, functools, http.server, os, socketserver, threading
from playwright.async_api import async_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SHOT = os.path.abspath(os.path.join(ROOT, '..', '..', 'downloads', 'harang_v5'))
os.makedirs(SHOT, exist_ok=True)

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def serve():
    s = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT))
    s.daemon_threads = True
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, f'http://127.0.0.1:{s.server_address[1]}/index.html?test=1'

async def main():
    httpd, url = serve()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2,
                                  locale='ko-KR', is_mobile=True, has_touch=True)
        page = await ctx.new_page()
        await page.goto(url, wait_until='load')
        await page.evaluate('localStorage.clear()')
        await page.reload(wait_until='load')
        await page.wait_for_selector('.answer-btn')
        await page.wait_for_timeout(900)
        await page.evaluate('window.__harang.clearFx()')
        await page.screenshot(path=SHOT + '/v5-01-수학-첫화면(읽어주기 없음).png')

        # 요정 응원 (평소)
        await page.evaluate('window.__harang.setOrange(34)')
        await page.wait_for_timeout(200)
        await page.click('#rankBadge')
        await page.wait_for_timeout(700)
        await page.evaluate('window.__harang.clearFx()')
        await page.wait_for_timeout(150)
        await page.screenshot(path=SHOT + '/v5-02-칭호배지-요정응원.png')

        # 100개 축하 (반짝이 보이는 순간)
        await page.evaluate('window.__harang.closeFairy()')
        await page.wait_for_timeout(200)
        await page.evaluate('window.__harang.setOrange(99)')
        await page.wait_for_timeout(150)
        await page.evaluate('window.__harang.answerCorrect()')
        await page.wait_for_timeout(1400)
        await page.screenshot(path=SHOT + '/v5-03-감100-요정축하(반짝이).png')
        await page.evaluate('window.__harang.clearFx()')
        await page.wait_for_timeout(250)
        await page.screenshot(path=SHOT + '/v5-04-감100-요정축하.png')

        # 소원 적기 → 저장 → 0/100
        await page.click('#fairyWishBtn')
        await page.wait_for_timeout(500)
        await page.evaluate('window.__harang.clearFx()')
        await page.wait_for_timeout(120)
        await page.screenshot(path=SHOT + '/v5-05-소원적기.png')
        await page.click('.wish-chip >> nth=0')
        await page.wait_for_timeout(150)
        await page.click('#wishSaveBtn')
        await page.wait_for_timeout(900)
        await page.evaluate('window.__harang.clearFx()')
        await page.wait_for_timeout(150)
        await page.screenshot(path=SHOT + '/v5-06-선물쿠폰생성-감0리셋.png')
        await page.click('#wishCloseBtn')
        await page.wait_for_timeout(400)
        await page.evaluate('window.__harang.clearFx()')
        await page.screenshot(path=SHOT + '/v5-07-리셋후-상단감0.png')
        await page.click('#wishBoxBtn')
        await page.wait_for_timeout(500)
        await page.evaluate('window.__harang.clearFx()')
        await page.wait_for_timeout(120)
        await page.screenshot(path=SHOT + '/v5-08-소원쿠폰함-유지.png')
        await page.click('#couponClose')
        await page.wait_for_timeout(250)

        # 받아쓰기 듣기 (MP3)
        await page.evaluate("__harang.subject('dict')")
        await page.wait_for_timeout(400)
        await page.evaluate("__harang.dict.select('r2')")
        await page.wait_for_timeout(250)
        await page.click('#listenNormal')
        await page.wait_for_timeout(700)
        await page.screenshot(path=SHOT + '/v5-09-받아쓰기-MP3듣기.png')
        await page.click('#listenSlow')
        await page.wait_for_timeout(500)
        await page.screenshot(path=SHOT + '/v5-10-받아쓰기-천천히듣기.png')
        await page.click('#listenSlow')

        # 두 자리 덧셈 문제 모습 (add2가 나올 때까지)
        await page.evaluate("__harang.subject('math')")
        await page.wait_for_timeout(300)
        for _ in range(40):
            q = await page.evaluate('__harang.current')
            if q['type'] == 'add2':
                break
            await page.evaluate('__harang.next()')
            await page.wait_for_timeout(120)
        await page.wait_for_timeout(300)
        await page.evaluate('window.__harang.clearFx()')
        await page.screenshot(path=SHOT + '/v5-11-두자리덧셈문제.png')

        # 태블릿 요정 팝업
        c2 = await b.new_context(viewport={'width': 820, 'height': 1180}, device_scale_factor=1,
                                 locale='ko-KR', is_mobile=True, has_touch=True)
        pg = await c2.new_page()
        await pg.goto(url, wait_until='load')
        await pg.wait_for_timeout(900)
        await pg.evaluate('window.__harang.setOrange(100)')
        await pg.click('#rankBadge')
        await pg.wait_for_timeout(1300)
        await pg.evaluate('window.__harang.clearFx()')
        await pg.wait_for_timeout(250)
        await pg.screenshot(path=SHOT + '/v5-12-태블릿-요정축하.png')
        await b.close()
    httpd.shutdown()

asyncio.run(main())
