#!/usr/bin/env python3
"""감 비 성능 확인 — 180개(상한) 떨어질 때 프레임 시간 / 유휴 상태와 비교"""
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

s = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT))
s.daemon_threads = True
threading.Thread(target=s.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{s.server_address[1]}/index.html?test=1'

FRAME_SAMPLE = """() => new Promise((resolve) => {
  const times = [];
  let last = performance.now();
  const t0 = last;
  function loop(t) {
    times.push(t - last); last = t;
    if (t - t0 < 1500) requestAnimationFrame(loop);
    else {
      times.sort((a, b) => a - b);
      const sum = times.reduce((a, b) => a + b, 0);
      resolve({frames: times.length, avg: +(sum / times.length).toFixed(2),
               p95: +times[Math.floor(times.length * 0.95)].toFixed(2),
               worst: +times[times.length - 1].toFixed(2)});
    }
  }
  requestAnimationFrame(loop);
})"""

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2,
                        locale='ko-KR', is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.goto(URL, wait_until='load')
    page.evaluate('localStorage.clear()')
    page.reload(wait_until='load')
    page.wait_for_selector('.answer-btn')
    page.wait_for_timeout(700)

    idle = page.evaluate(FRAME_SAMPLE)
    print('유휴(효과 없음):', idle)

    page.evaluate('window.__harang.clearFx()')
    for _ in range(10):
        page.evaluate('window.__harang.tapOrange()')
        page.wait_for_timeout(30)
    fx = page.evaluate('window.__harang.fx')
    print('감 개수(상한):', fx['oranges'])
    busy = page.evaluate(FRAME_SAMPLE)
    print('감 비 180개:', busy)
    print('결과:', 'OK' if busy['avg'] < idle['avg'] * 1.6 + 3 and busy['p95'] < 40 else 'CHECK')
    b.close()
s.shutdown()
