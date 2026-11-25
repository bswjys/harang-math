#!/usr/bin/env python3
"""공부하랑핑 검증: 모바일(390) / 태블릿 / PC 동작·레이아웃·소원·PWA + 5종 업그레이드
(◀ 이전 문제, 🗣️ 읽어주기, 🎯 오늘 미션, 🌸 헷갈린 문제 복습, 📊 부모님 리포트)"""
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

def shot(page, name, settle=1700, clear=True):
    if settle:
        page.wait_for_timeout(settle)
    if clear:
        page.evaluate("window.__harang && window.__harang.clearFx && window.__harang.clearFx()")
        page.wait_for_timeout(120)
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

        # 1-b) 첫 문제에서 ◀ 이전 문제 → 무반응이 아니라 안내 토스트
        first_nav = page.evaluate("""() => ({
            index: window.__harang.historyInfo.index,
            len: window.__harang.historyInfo.len,
            disabled: document.getElementById('prevBtn').disabled,
            off: document.getElementById('prevBtn').classList.contains('off')
        })""")
        page.click('#prevBtn')
        page.wait_for_timeout(400)
        toast = page.evaluate("""() => ({
            hidden: document.getElementById('toast').hidden,
            text: document.getElementById('toast').textContent,
            qnum: document.getElementById('qNum').textContent
        })""")
        after_tap = page.evaluate('window.__harang.historyInfo')
        log('첫 문제 이전버튼 안내 토스트',
            first_nav['index'] == 0 and first_nav['len'] == 1 and not first_nav['disabled']
            and first_nav['off'] and not toast['hidden']
            and '한 문제 풀고 넘어가면 돌아갈 수 있어요' in toast['text']
            and after_tap['index'] == 0,
            f"disabled={first_nav['disabled']} off={first_nav['off']} / 토스트=\"{toast['text'].strip()}\"")
        shot(page, '02-첫문제-이전버튼-안내', 300, clear=False)

        # 1-c) 🍊 감 배지 → 클릭하면 감이 우수수 떨어짐 + 토스트
        badge = page.evaluate('window.__harang.orangeBadge')
        log('감 배지가 누를 수 있는 버튼',
            badge and badge['tag'] == 'BUTTON' and '감' in badge['label'] and badge['minHeight'] >= 30,
            json.dumps(badge, ensure_ascii=False))
        page.evaluate('window.__harang.setOrange(7)')
        page.wait_for_timeout(150)
        tap = page.evaluate('window.__harang.tapOrange()')
        page.wait_for_timeout(700)
        fx = page.evaluate('window.__harang.fx')
        toast_i = page.evaluate('window.__harang.toastInfo')
        log('감 배지 클릭 → 감 비(감 20~30여 개·캔버스에 실제로 그려짐)',
            20 <= tap['added'] <= 30 and fx['oranges'] >= 20 and fx['running'] and fx['pixels'] > 5000,
            f"added={tap['added']} oranges={fx['oranges']} pixels={fx['pixels']} running={fx['running']}")
        log('감 비 응원 토스트',
            (not toast_i['hidden']) and any(k in toast_i['text'] for k in
                                            ['주르륵', '통통통', '폭포', '우수수', '통통 튀']),
            toast_i['text'])
        log('감 배지 클릭은 감 개수를 바꾸지 않음', page.evaluate('window.__harang.state.orange') == 7,
            f"orange={page.evaluate('window.__harang.state.orange')}")
        log('감 배지 통통 튀는 애니메이션', page.evaluate("document.getElementById('orangeChip').classList.contains('tapped')"),
            page.evaluate("getComputedStyle(document.getElementById('orangeChip')).animationName"))
        shot(page, '02b-감배지-감비', 0, clear=False)
        first_oranges = fx['oranges']
        for _ in range(12):
            page.evaluate('window.__harang.tapOrange()')
            page.wait_for_timeout(40)
        fx2 = page.evaluate('window.__harang.fx')
        log('연속 클릭 → 더 많이 떨어지되 180개 이하(성능 보호)',
            fx2['oranges'] > first_oranges and fx2['oranges'] <= 180,
            f"{first_oranges} -> {fx2['oranges']}")
        shot(page, '02c-감비-연속클릭', 0, clear=False)
        page.wait_for_timeout(200)
        page.evaluate('window.__harang.clearFx()')
        page.evaluate('window.__harang.setOrange(0)')
        page.wait_for_timeout(150)
        page.evaluate("document.getElementById('orangeChip').classList.remove('tapped')")

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
                # 100개 달성 팝업(요정)·소원 팝업은 따로 검증하므로 여기서는 닫기
                if page.locator('#fairyModal:not([hidden])').count():
                    page.click('#fairyClose')
                elif page.locator('#wishCloseBtn').count():
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

        # 5-b) 틀린 뒤 해설 보고 넘어가기 → 감 +0 (v6: 틀려서는 절대 안 오름)
        page.click('text=다음 문제')
        page.wait_for_timeout(300)
        if page.locator('#wishModal:not([hidden])').count():
            page.click('#wishCloseBtn')
        before_effort = page.evaluate('window.__harang.state.orange')
        ow = page.evaluate('window.__harang.wrongValue()')
        page.evaluate(f'window.__harang.answer({json.dumps(ow)})')
        page.wait_for_timeout(350)
        wrong_sub = page.evaluate('window.__harang.feedbackSub')
        middle_effort = page.evaluate('window.__harang.state.orange')
        page.click('text=알겠어요')
        page.wait_for_timeout(600)
        after_effort = page.evaluate('window.__harang.state.orange')
        log('틀리면 감 +0 (해설 보고 넘어가기)', after_effort == before_effort and middle_effort == before_effort
            and '0개' in wrong_sub,
            f'{before_effort}->{middle_effort}->{after_effort} / {wrong_sub}')
        if page.locator('#wishModal:not([hidden])').count():
            page.click('#wishCloseBtn')

        # 6) 감 100개 달성 → 요정 칭찬 팝업 → 소원 저장 → 감 0/100 리셋
        page.evaluate('window.__harang.setOrange(99)')
        page.evaluate('window.__harang.next()')
        page.wait_for_timeout(200)
        if page.locator('.modal:not([hidden])').count():
            page.click('#wishCloseBtn')
            page.wait_for_timeout(150)
        page.evaluate('window.__harang.answerCorrect()')
        page.wait_for_timeout(1600)
        fairy = page.evaluate('window.__harang.fairy')
        lvl = page.inner_text('#levelName')
        log('감100 요정 칭찬 팝업', fairy['open'] and fairy['celebrate']
            and '100개 다 모았어' in fairy['text'] and '잘했어요' in fairy['text']
            and lvl == '소원요정 하랑핑',
            f"칭호={lvl} / {fairy['text']}")
        page.evaluate('window.__harang.clearFx()')
        page.wait_for_timeout(120)
        page.screenshot(path=os.path.join(SHOTS, '07-감100-요정칭찬.png'))
        page.click('#fairyWishBtn')
        page.wait_for_timeout(500)
        modal_open = page.locator('#wishModal:not([hidden])').count() > 0
        log('요정 → 소원 적기로 이어짐', modal_open and page.locator('#wishForm:not([hidden])').count() > 0, '')
        if modal_open:
            page.evaluate('window.__harang.clearFx()')
            page.wait_for_timeout(100)
            shot(page, '08-감100-소원팝업', 400)
            pre = page.evaluate("""() => ({t: __harang.state.totalOrange, s: __harang.state.today.solved,
                c: __harang.state.combo, m: __harang.state.subj.math.solved})""")
            page.click('.wish-chip >> nth=0')
            page.wait_for_timeout(200)
            page.click('#wishSaveBtn')
            page.wait_for_timeout(900)
            saved_text = page.inner_text('#wishSavedText')
            log('소원 저장', len(saved_text) > 3, saved_text)
            st = page.evaluate('window.__harang.state')
            counter = page.inner_text('#orangeCount')
            reset_view = page.evaluate("""() => ({
                width: document.getElementById('progressBar').style.width,
                level: document.getElementById('levelName').textContent
            })""")
            log('선물 생성 → 감 0/100 즉시 리셋', st['orange'] == 0 and counter == '0'
                and reset_view['width'] == '0%' and st['journey'] == 2,
                f"orange={st['orange']} journey={st['journey']} 칭호={reset_view['level']}")
            log('리셋 뒤 누적 기록 유지', st['totalOrange'] == pre['t'] and st['today']['solved'] == pre['s']
                and st['combo'] == pre['c'] and len(st['wishes']) == 1 and st['subj']['math']['solved'] == pre['m'],
                f"totalOrange {pre['t']}->{st['totalOrange']} today {pre['s']}->{st['today']['solved']} combo {pre['c']}->{st['combo']} wishes={len(st['wishes'])}")
            page.evaluate('window.__harang.clearFx()')
            page.wait_for_timeout(100)
            shot(page, '08b-선물생성-감리셋')
            page.click('#wishCloseBtn')
            page.wait_for_timeout(300)

        # 7) 소원 쿠폰함(선물)은 리셋 뒤에도 그대로 + 엄마아빠 확인
        page.click('#wishBoxBtn')
        page.wait_for_timeout(500)
        shot(page, '09-소원쿠폰함')
        log('쿠폰함 노출(리셋 뒤 유지)', page.locator('.coupon').count() >= 1,
            f"coupons={page.locator('.coupon').count()}")
        page.click('.coupon .c-actions button')
        page.wait_for_timeout(700)
        done = page.locator('.coupon.done').count()
        st2 = page.evaluate('window.__harang.state')
        log('소원 들어줬어요 표시', done >= 1 and st2['wishes'][0]['fulfilledAt'] is not None,
            f'done={done} orange={st2["orange"]}')
        shot(page, '10-소원확인'
             )
        page.click('#couponClose')
        page.wait_for_timeout(300)
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

        # 10) ◀ 이전 문제 + 감 중복 지급 방지
        page.evaluate('window.__harang.clearFx()')
        page.evaluate('window.__harang.answerCorrect()')
        page.wait_for_timeout(420)
        page.evaluate('window.__harang.next()')
        page.wait_for_timeout(320)
        page.evaluate('window.__harang.answerCorrect()')
        page.wait_for_timeout(480)
        hist = page.evaluate('window.__harang.historyInfo')
        orange_now = page.evaluate('window.__harang.state.orange')
        page.click('#prevBtn')
        page.wait_for_timeout(480)
        prev_info = page.evaluate('window.__harang.historyInfo')
        prev_view = page.evaluate("""() => ({
            qnum: document.getElementById('qNum').textContent,
            fb: !document.getElementById('feedback').hidden,
            allDisabled: [...document.querySelectorAll('#answerGrid .answer-btn')].every(b => b.disabled),
            correctMarked: !!document.querySelector('#answerGrid .answer-btn.correct'),
            nextVisible: !document.getElementById('nextBtn').hidden
        })""")
        ok_prev = (prev_info['index'] == hist['index'] - 1 and prev_view['fb']
                   and prev_view['allDisabled'] and prev_view['correctMarked'] and prev_view['nextVisible'])
        log('◀ 이전 문제 되돌아가기', ok_prev,
            f"{prev_view['qnum']} / 해설={prev_view['fb']} 잠금={prev_view['allDisabled']} 정답표시={prev_view['correctMarked']}")
        shot(page, '15-이전문제-되돌아가기')
        page.evaluate('window.__harang.answerCorrect()')
        page.wait_for_timeout(350)
        orange_prev = page.evaluate('window.__harang.state.orange')
        log('이전 문제 감 중복 없음', orange_prev == orange_now, f'{orange_now} -> {orange_prev}')
        page.click('#nextBtn')
        page.wait_for_timeout(480)
        back = page.evaluate('window.__harang.historyInfo')
        log('▶ 다음 문제로 복귀', back['index'] == hist['index'] and orange_prev == orange_now,
            f"index {back['index']}/{hist['index']} · orange {orange_prev}")

        # 10-b) 앱을 닫았다 열어도(새로고침) ◀ 이전 문제 복습 + 감 중복 없음
        page.evaluate('window.__harang.clearFx()')
        page.evaluate('window.__harang.answerCorrect()')
        page.wait_for_timeout(430)
        page.evaluate('window.__harang.next()')
        page.wait_for_timeout(330)
        page.evaluate('window.__harang.answerCorrect()')
        page.wait_for_timeout(470)
        before_reload = page.evaluate("""() => ({
            orange: window.__harang.state.orange,
            solved: window.__harang.state.today.solved,
            info: window.__harang.historyInfo,
            store: window.__harang.historyStore()
        })""")
        log('이전 문제 localStorage 저장', bool(before_reload['store']) and before_reload['store']['len'] >= 2,
            json.dumps(before_reload['store']))

        page.reload(wait_until='load')
        page.wait_for_selector('.answer-btn')
        page.wait_for_timeout(800)
        restored = page.evaluate("""() => ({
            info: window.__harang.historyInfo,
            orange: window.__harang.state.orange,
            disabled: document.getElementById('prevBtn').disabled,
            off: document.getElementById('prevBtn').classList.contains('off'),
            store: window.__harang.historyStore()
        })""")
        log('새로 열어도 이전 문제 남음',
            restored['info']['len'] >= 2 and restored['info']['index'] == restored['info']['len'] - 1
            and restored['orange'] == before_reload['orange'] and not restored['disabled']
            and not restored['off'],
            f"len={restored['info']['len']} index={restored['info']['index']} orange={restored['orange']}")

        orange_before_prev = page.evaluate('window.__harang.state.orange')
        page.click('#prevBtn')
        page.wait_for_timeout(550)
        prev_after_reload = page.evaluate("""() => ({
            info: window.__harang.historyInfo,
            answered: !!(window.__harang.entry && window.__harang.entry.answered),
            rewarded: !!(window.__harang.entry && window.__harang.entry.rewarded),
            fb: !document.getElementById('feedback').hidden,
            correctMarked: !!document.querySelector('#answerGrid .answer-btn.correct'),
            locked: [...document.querySelectorAll('#answerGrid .answer-btn')].every(b => b.disabled),
            qnum: document.getElementById('qNum').textContent
        })""")
        log('새로 열고 ◀ 이전 문제 복습',
            prev_after_reload['info']['index'] == restored['info']['index'] - 1
            and prev_after_reload['answered'] and prev_after_reload['fb']
            and prev_after_reload['locked'] and prev_after_reload['correctMarked'],
            f"{prev_after_reload['qnum']} / index={prev_after_reload['info']['index']} 해설={prev_after_reload['fb']}")
        shot(page, '15b-새로열고-이전문제복습', 400)

        page.evaluate('window.__harang.answerCorrect()')
        page.wait_for_timeout(380)
        after_prev_reload = page.evaluate("""() => ({orange: window.__harang.state.orange,
            solved: window.__harang.state.today.solved})""")
        log('새로 연 뒤 이전 문제 감 중복 없음',
            after_prev_reload['orange'] == orange_before_prev
            and after_prev_reload['solved'] == before_reload['solved']
            and prev_after_reload['rewarded'],
            f"{before_reload['solved']}문제 / orange {orange_before_prev} -> {after_prev_reload['orange']}")

        # 11) 🧚 칭호 배지 → 요정 응원 (평소) / 🗣️ 읽어주기 제거
        log('수학 읽어주기 버튼 제거', page.locator('#readBtn').count() == 0
            and page.locator('.read-btn').count() == 0 and '읽어주기' not in page.inner_text('#questionCard'),
            f"readBtn={page.locator('#readBtn').count()}")
        page.evaluate('window.__harang.setOrange(12)')
        page.wait_for_timeout(150)
        page.click('#rankBadge')
        page.wait_for_timeout(600)
        cheer = page.evaluate('window.__harang.fairy')
        log('배지 탭 → 요정 응원 팝업', cheer['open'] and not cheer['celebrate']
            and any(k in cheer['text'] for k in ['화이팅', '할 수 있어', '잘하고 있어', '도전', '반짝', '괜찮아']),
            cheer['text'])
        page.evaluate('window.__harang.clearFx()')
        page.wait_for_timeout(100)
        page.screenshot(path=os.path.join(SHOTS, '16-칭호배지-요정응원.png'))
        page.click('#fairyClose')
        page.wait_for_timeout(250)
        log('요정 닫기 버튼', page.evaluate('!document.getElementById("fairyModal").hidden') is False, '')
        page.click('#rankBadge')
        page.wait_for_timeout(400)
        page.mouse.click(195, 20)   # 바깥(빈 곳) 터치로 닫기
        page.wait_for_timeout(350)
        log('요정 바깥 터치로 닫기', page.evaluate('!document.getElementById("fairyModal").hidden') is False, '')
        cheers = set()
        for _ in range(8):
            page.click('#rankBadge')
            page.wait_for_timeout(160)
            cheers.add(page.evaluate('window.__harang.fairy')['text'])
            page.evaluate('window.__harang.closeFairy()')
            page.wait_for_timeout(60)
        log('요정 응원 문구 여러 가지', len(cheers) >= 3, ' / '.join(sorted(cheers)))
        page.evaluate('window.__harang.next()')
        page.wait_for_timeout(400)

        # 12) 🎯 오늘의 미션 (하루 5문제)
        page.evaluate('window.__harang.setTodaySolved(4)')
        page.evaluate('window.__harang.clearFx()')
        page.wait_for_timeout(300)
        card_txt = page.inner_text('#missionCard')
        log('오늘 미션 진행 표시 (4 / 5)', '4 / 5' in card_txt, card_txt.replace('\n', ' | ')[:70])
        shot(page, '17-오늘미션-4문제', 900)
        page.evaluate('window.__harang.answerCorrect()')
        page.wait_for_timeout(1000)
        m5 = page.evaluate('window.__harang.mission')
        stars_on = page.evaluate("[...document.querySelectorAll('#missionStars .mstar')].filter(e => e.classList.contains('on')).length")
        toast_txt = page.evaluate("document.getElementById('toast').hidden ? '' : document.getElementById('toast').textContent")
        log('오늘 미션 5 / 5 달성', m5['solved'] >= 5 and m5['done'] and stars_on == 5 and '5 / 5' in page.inner_text('#missionCard'),
            f"solved={m5['solved']} 별={stars_on} / {page.inner_text('#missionCard').replace(chr(10), ' ')[:46]}")
        log('미션 성공 축하 토스트', '오늘 미션 성공' in toast_txt, toast_txt.strip())
        shot(page, '18-오늘미션-성공축하', 500)

        # 13) 🌸 헷갈린 문제 저장 → 복습 → 졸업
        page.evaluate('window.__harang.next()')
        page.wait_for_timeout(350)
        w0 = page.evaluate('window.__harang.wrong')
        wv = page.evaluate('window.__harang.wrongValue()')
        page.evaluate(f'window.__harang.answer({json.dumps(wv)})')
        page.wait_for_timeout(450)
        w1 = page.evaluate('window.__harang.wrong')
        btn_txt = page.inner_text('#reviewBtn')
        log('오답 저장 (헷갈린 문제)', len(w1) == len(w0) + 1 and f'({len(w1)})' in btn_txt,
            f'{len(w0)} -> {len(w1)} / {btn_txt}')
        shot(page, '19-오답-헷갈린문제-저장')
        page.evaluate('window.__harang.next()')
        page.wait_for_timeout(450)
        rv = page.evaluate('window.__harang.startReview()')
        page.wait_for_timeout(450)
        banner = page.evaluate("!document.getElementById('reviewBanner').hidden")
        rv_type = page.evaluate('window.__harang.current.type')
        log('헷갈린 문제 복습 모드 진입', rv['active'] and rv['mode'] == 'review' and banner and rv_type in {w['type'] for w in w1},
            f"queue={rv['queue']} mode={rv['mode']} banner={banner} type={rv_type}")
        shot(page, '20-헷갈린문제-복습모드')
        before_n = len(page.evaluate('window.__harang.wrong'))
        o_rev0 = page.evaluate('window.__harang.state.orange')
        rw = page.evaluate('window.__harang.wrongValue()')
        page.evaluate(f'window.__harang.answer({json.dumps(rw)})')
        page.wait_for_timeout(450)
        o_rev1 = page.evaluate('window.__harang.state.orange')
        log('수학 오답 복습: 틀리면 감 +0', o_rev1 == o_rev0, f'{o_rev0} -> {o_rev1}')
        page.click('text=다시 풀어보기')
        page.wait_for_timeout(250)
        page.evaluate('window.__harang.answerCorrect()')
        page.wait_for_timeout(600)
        o_rev2 = page.evaluate('window.__harang.state.orange')
        after_n = len(page.evaluate('window.__harang.wrong'))
        fb_title = page.inner_text('#fbTitle')
        log('수학 오답 복습: 맞히면 감 +1', o_rev2 == o_rev1 + 1, f'{o_rev1} -> {o_rev2}')
        log('복습 정답 → 오답 졸업 + 칭찬', after_n == before_n - 1 and '졸업' in fb_title, f'{before_n} -> {after_n} / {fb_title}')
        shot(page, '21-복습-졸업칭찬')
        for _ in range(14):
            mode = page.evaluate('window.__harang.entry && window.__harang.entry.mode')
            if mode != 'review':
                break
            page.evaluate('window.__harang.answerCorrect()')
            page.wait_for_timeout(320)
            page.evaluate('window.__harang.next()')
            page.wait_for_timeout(380)
        mode_after = page.evaluate('window.__harang.entry && window.__harang.entry.mode')
        wrong_after = page.evaluate('window.__harang.wrong')
        log('복습 끝 → 일반 모드 복귀', mode_after == 'normal' and len(wrong_after) == 0,
            f'mode={mode_after} wrong={len(wrong_after)}')
        review_btn = page.evaluate("({txt: document.getElementById('reviewBtn').textContent, dis: document.getElementById('reviewBtn').disabled})")
        log('헷갈린 문제 0개 표시', review_btn['dis'] and '(0)' in review_btn['txt'], str(review_btn))
        shot(page, '22-헷갈린문제-0개', 700)

        # 14) 📊 부모님 미니 리포트
        page.click('#reportBtn')
        page.wait_for_timeout(700)
        bars = page.evaluate('window.__harang.reportBars()')
        rtext = page.evaluate('window.__harang.reportText()')
        st = page.evaluate('window.__harang.state')
        cats = [b['cat'] for b in bars]
        log('리포트 단원별 막대 5개', len(bars) == 5 and cats == ['add', 'sub', 'num', 'clock', 'shape'], str(cats))
        add = st['byCat'].get('add') or {}
        expect_pct = f"{int(add['correct'] / add['solved'] * 100 + 0.5)}%" if add.get('solved') else '-'
        log('리포트 정답률 계산', bars[0]['pct'] == expect_pct, f"{bars[0]['pct']} / 기대 {expect_pct}")
        log('리포트 오늘/누적 요약', ('오늘 푼 문제' in rtext and '누적 푼 문제' in rtext
                                  and f"{st['today']['solved']}문제" in rtext and f"{st['total']['solved']}문제" in rtext),
            rtext[:48].replace('\n', ' '))
        log('리포트 잘하는 것/연습할 것', '잘하는 것' in rtext and '연습' in rtext and '오늘 미션' in rtext,
            rtext.replace('\n', ' ')[-70:])
        shot(page, '23-부모님-리포트')
        page.click('#reportDone')
        page.wait_for_timeout(300)
        log('리포트 닫기', page.evaluate("document.getElementById('reportModal').hidden"), '')

        # 15) 콘솔 오류 / 넘침
        ov = overflow(page)
        log('가로 넘침 없음 (모바일 최종)', ov['sw'] <= ov['iw'] + 1, json.dumps(ov, ensure_ascii=False))
        log('콘솔 오류 0건', len(console_errors) == 0, ' / '.join(console_errors[:4]))

        # 16) 에셋 버전 / 서비스워커 네트워크 우선
        sw_txt = page.evaluate("fetch('sw.js').then(r => r.text())")
        html_txt = page.evaluate("fetch('index.html').then(r => r.text())")
        log('에셋 버전 v=8 (영어 포함)', 'styles.css?v=8' in html_txt and 'app.js?v=8' in html_txt
            and 'dict.js?v=8' in html_txt and 'dict-data.js?v=8' in html_txt
            and 'eng.js?v=8' in html_txt and 'eng-data.js?v=8' in html_txt,
            'index.html 쿼리')
        log('서비스워커 v8 · 네트워크 우선 · 오디오 동적 캐시',
            "CACHE = 'harang-math-v8'" in sw_txt and 'styles.css?v=8' in sw_txt
            and 'isShell(req.url)' in sw_txt and 'caches.match(req).then((cached) => cached' in sw_txt
            and 'isDictAudio(req.url)' in sw_txt and 'eng\\.js' in sw_txt,
            f"CACHE={'harang-math-v8' in sw_txt} shell={'isShell(req.url)' in sw_txt}")

        # 17) 수학 출제 비율 — 산수 80% / 1학년 2학기 개념 20%
        mix = page.evaluate("""() => {
            const arith = ['add1','add2','make10','sub10','sub2','three','blankAdd','blankSub'];
            const num = ['countNext','countBefore','countSeq','bundles','compare','hundred'];
            const clock = ['clock'];
            const shape = ['pattern','shape'];
            const g = {arith: 0, num: 0, clock: 0, shape: 0};
            const c = {};
            const N = 600;
            for (let i = 0; i < N; i++) {
                const q = window.__harang.makeQuestion();
                c[q.type] = (c[q.type] || 0) + 1;
                if (arith.includes(q.type)) g.arith++;
                else if (num.includes(q.type)) g.num++;
                else if (clock.includes(q.type)) g.clock++;
                else g.shape++;
            }
            return {N, g, c};
        }""")
        pct = mix['g']['arith'] / mix['N'] * 100
        log('수학 산수 출제 비율 80%', 73 <= pct <= 87,
            f"{pct:.1f}% ({mix['g']['arith']}/{mix['N']})")
        log('나머지 20% 개념 문제(수·시계·모양) 골고루',
            mix['g']['num'] > 10 and mix['g']['clock'] > 10 and mix['g']['shape'] > 10,
            str(mix['g']))
        log('두 자리 덧셈(add2) 포함', mix['c'].get('add2', 0) > 0, f"add2={mix['c'].get('add2', 0)}")
        log('산수 8종 모두 출제', all(mix['c'].get(k, 0) > 0 for k in
            ['add1','add2','make10','sub10','sub2','three','blankAdd','blankSub']), str(mix['c']))

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
