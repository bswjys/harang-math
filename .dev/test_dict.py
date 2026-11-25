#!/usr/bin/env python3
"""공부하랑핑 v4 — ✏️ 받아쓰기 검증
 · 급수 11개(1~8회 80문장 + 연습 3개 30문장) 전사 일치
 · 공책 모드 / 타자 모드 정·오답 비교(틀린 글자 표시), 마침표 유연 처리
 · 듣기 2종(ko-KR, 보통/천천히), 감·오늘 미션·과목별 기록 합산, 감 100 소원 팝업
 · 리포트 과목별 표시, 오답 복습, 콘솔 오류 0, 가로 넘침 0, 390px 스크린샷
명령: LD_LIBRARY_PATH=... python3 .dev/test_dict.py
"""
import asyncio, threading, functools, http.server, socketserver, json, sys, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SHOT = os.path.abspath(os.path.join(ROOT, '..', '..', 'downloads', 'harang_dict')) + '/'
os.makedirs(SHOT, exist_ok=True)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def start_server():
    handler = functools.partial(Quiet, directory=ROOT)
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    global URL
    URL = f"http://127.0.0.1:{httpd.server_address[1]}/index.html?test=1"

from playwright.async_api import async_playwright

EXPECT = {
 "r1": ["부러워요.","구름이 둥실둥실","쌩쌩 지나갑니다.","깡총깡총","활짝 피었습니다.","그림책을 봅니다.","깜짝 놀랐어.","뜀틀에 올랐어.","성이 무너졌어.","색연필을 빌려 줘서"],
 "r2": ["호랑이가 잡은","필통에 연필이 없다.","하늘이 이렇게 맑아서","붉게 물들었어요.","참외가 되는 건","바람 따라 여기저기","감기를 앓다.","제자리에 듭시다.","닭과 병아리가","아주 많이 무섭다."],
 "r3": ["제가 좋아하는 색은","빨갛게 익은","할머니 댁에","시장에 갔어.","흠뻑 젖었습니다.","친구를 만났다.","일곱 시에 일어났다.","농장에 가서","된장찌개","앞마을 큰길의 목소리로"],
 "r4": ["어느 날 아침","재미있는 일 없을까?","시장에 모여","미역도 맛있어.","귀한 물건을 많이","약속에 늦지 않게","반찬을 골고루","책을 읽습니다.","부자가 될 수 있겠어.","바닷속에 가라앉고"],
 "r5": ["훌라후프 돌리기","연필 한 자루","젊어지는 샘물","어떻게 해?","충전해 놓을게.","포기하지 않고","재주 많은 다섯 친구","잘 들리면 좋겠다.","안타까웠고","응원해 주고 싶었어."],
 "r6": ["모두의 안전을 위해","깡총깡총 토끼가","갈 수 없게 됩니다.","심장이 쿵쾅쿵쾅","책을 읽을 수 있겠지?","머리카락 숫자를 세었어요.","스스로 빛을 내는","꼬불꼬불 말았어요.","종이의 뒷면도 쓰면","왜 입이 안 떨어지지?"],
 "r7": ["색종이를 뒤집어 놓고","어떻게 해야 하지?","밤에도 불을 밝혀","문어의 빨판을 본 때","떨어지게 됩니다.","가시가 많이","털에 잘 붙습니다.","쉽게 붙었다 떼었다","당황했던 적이 있어.","달콤하고 짭조름했다."],
 "r8": ["하지만 괜찮아.","사랑받고 말 거니까.","좋은 생각이","내 착각이었어.","아무도 없는 곳으로","밤새 열심히 만들었어.","뭐라고 했어?","브로콜리 섞어 주고","보글보글 끓여 주면","항아리를 빼앗으려고"],
}

async def main():
    start_server()
    report = []
    ok = lambda cond, msg: report.append(("PASS" if cond else "FAIL", msg))
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        errors = []
        page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        audio_reqs = []
        page.on("request", lambda r: audio_reqs.append(r.url) if "/audio/dict/" in r.url else None)
        await page.goto(URL, wait_until="load")
        await page.evaluate("localStorage.clear()")
        await page.reload(wait_until="load")
        await page.wait_for_timeout(600)

        # 1) 과목 탭
        tab_ok = await page.evaluate("__harang.subject('dict')")
        ok(tab_ok["subject"] == "dict" and tab_ok["mathHidden"] and not tab_ok["dictHidden"], f"받아쓰기 탭 전환 {tab_ok}")
        tab_back = await page.evaluate("__harang.subject('math')")
        ok(tab_back["mathHidden"] is False, "수학 탭 복귀")
        await page.evaluate("__harang.subject('dict')")
        await page.wait_for_timeout(250)

        # 2) 급수 데이터
        rounds = await page.evaluate("__harang.dict.rounds()")
        ok(len(rounds) == 11, f"급수 {len(rounds)}개 (1~8회+연습3)")
        ok([r["label"] for r in rounds][0] == "1회 · 기분을 말해요", "첫 급수 라벨")
        ok([r["label"] for r in rounds][-1] == "⭐ 연습 3 · 띄어쓰기", "마지막 급수 라벨")
        bad = []
        for r in rounds:
            if r["key"] in EXPECT:
                if r["texts"] != EXPECT[r["key"]]:
                    bad.append((r["key"], r["texts"], EXPECT[r["key"]]))
            if r["count"] != 10:
                bad.append((r["key"], "count", r["count"]))
        ok(not bad, f"80문장 전사 일치 {bad}")
        total = sum(r["count"] for r in rounds)
        ok(total == 110, f"전체 문장 수 {total}")

        # 2-2) 받아쓰기 MP3 110개 전수 확인 (모든 파일 > 3KB, 문장과 짝 맞춤)
        import urllib.request
        base = URL.split("/index.html")[0]
        missing, small = [], []
        for r in rounds:
            for i in range(r["count"]):
                p = f"{base}/audio/dict/{r['key']}-{i + 1}.mp3"
                try:
                    with urllib.request.urlopen(p, timeout=15) as res:
                        data = res.read()
                    if res.status != 200:
                        missing.append(p)
                    elif len(data) <= 3072:
                        small.append((p, len(data)))
                except Exception as e:
                    missing.append(f"{p} ({e})")
        ok(not missing and not small, f"받아쓰기 MP3 110개 전수·모두 3KB 초과 (빠짐 {len(missing)}, 작음 {len(small)})")
        idx = json.loads(urllib.request.urlopen(f"{base}/audio/dict/index.json", timeout=15).read())
        bad_audio = [k for k, v in idx.items() if not v.get("text")]
        text_by_id = {f"{r['key']}-{i + 1}": t for r in rounds for i, t in enumerate(r["texts"])}
        mism = [k for k, t in text_by_id.items() if idx.get(k, {}).get("text") != t]
        ok(len(idx) == 110 and not bad_audio and not mism, f"MP3 색인 110개 · 문장 일치 (불일치 {len(mism)})")

        # 금지 정보(학교명/학년반) 미포함
        html = await page.evaluate("document.documentElement.outerHTML")
        ok("목암" not in html and "1학년 2반" not in html, "학교명·학년반 미노출")
        srcs = ""
        for f in ["app.js", "dict.js", "dict-data.js", "index.html"]:
            srcs += await page.evaluate(f"fetch('{f}').then(r=>r.text())")
        ok("목암" not in srcs and "1학년 2반" not in srcs, "소스에 학교명·학년반 없음")

        # 3) 공책 모드 채점 → 감/미션/기록
        before = await page.evaluate("({o: __harang.state.orange, s: __harang.state.today.solved, d: __harang.state.subj.dict.solved})")
        await page.evaluate("__harang.dict.select('r1')")
        await page.wait_for_timeout(200)
        r1_first = await page.evaluate("__harang.dict.item.text")
        ok(r1_first == "부러워요.", f"1회 1번 문장 {r1_first}")
        await page.evaluate("__harang.dict.showAnswer()")
        vis = await page.evaluate("!document.getElementById('dictAnswerBox').hidden && !document.getElementById('dictGradeRow').hidden")
        ok(vis, "정답 보기 → 원고지 정답+채점 버튼 표시")
        await page.screenshot(path=SHOT + "02_dict_note_answer_390.png")
        await page.click("#dictMarkRight")
        await page.wait_for_timeout(350)
        after = await page.evaluate("({o: __harang.state.orange, s: __harang.state.today.solved, d: __harang.state.subj.dict.solved, dc: __harang.state.subj.dict.correct})")
        ok(after["o"] == before["o"] + 1, f"감 +1 (받아쓰기) {before['o']}->{after['o']}")
        ok(after["s"] == before["s"] + 1 and after["d"] == before["d"] + 1, f"오늘 미션/과목 기록 증가 {after}")
        miss = await page.evaluate("document.getElementById('missionCount').textContent")
        ok(miss.strip().startswith("1"), f"미션 카운트 반영 {miss}")
        await page.screenshot(path=SHOT + "03_dict_note_graded_390.png")

        # 틀린 문장 → 오답 목록 (감 +0)
        await page.click("#dictNext")
        await page.wait_for_timeout(200)
        o_wrong0 = await page.evaluate("__harang.state.orange")
        await page.evaluate("__harang.dict.showAnswer()")
        await page.click("#dictMarkWrong")
        await page.wait_for_timeout(250)
        o_wrong1 = await page.evaluate("__harang.state.orange")
        ok(o_wrong1 == o_wrong0, f"공책 모드 ❌ 다시 연습할래요 → 감 +0 {o_wrong0}->{o_wrong1}")
        wrong_n = await page.evaluate("__harang.state.dict.wrong.length")
        ok(wrong_n >= 1, f"틀린 문장 오답 저장 {wrong_n}")
        rev_txt = await page.inner_text("#dictReviewBtn")
        ok("1" in rev_txt, f"복습 버튼 표시 {rev_txt}")

        # 4) 직접 치기 모드 - 정답
        await page.evaluate("__harang.dict.select('r2')")
        await page.wait_for_timeout(150)
        await page.evaluate("__harang.dict.setMode('type')")
        await page.wait_for_timeout(150)
        await page.fill("#dictInput", "호랑이가 잡은")
        await page.click("#dictCheck")
        await page.wait_for_timeout(300)
        res = await page.evaluate("__harang.dict.result")
        ok(res and res["good"], f"타자 정답 채점 {res}")
        ok(await page.evaluate("document.getElementById('dictCheckResult').innerText.includes('잡')"), "정답 팁 표시(타자 모드)")
        await page.screenshot(path=SHOT + "04_dict_type_correct_390.png")

        # 5) 직접 치기 모드 - 오답(빨간 글자 비교)
        await page.click("#dictNext")
        await page.wait_for_timeout(200)
        await page.fill("#dictInput", "필통에 연필이 업다")
        await page.click("#dictCheck")
        await page.wait_for_timeout(300)
        res2 = await page.evaluate("__harang.dict.result")
        ok(res2 and res2["good"] is False, f"타자 오답 판정 {res2}")
        o_type = await page.evaluate("__harang.state.orange")
        ok(o_type == after["o"] + 1, f"타자 모드 오답 → 감 +0 (정답 1건만 반영) {after['o'] + 1}->{o_type}")
        bad_cells = await page.evaluate("document.querySelectorAll('#dictCheckResult .dcell.bad').length")
        ok(bad_cells >= 1, f"틀린 글자 빨강 표시 {bad_cells}칸")
        mine = await page.evaluate("document.querySelectorAll('#dictCheckResult u.bad').length")
        ok(mine >= 1, f"내가 쓴 문장 틀린 글자 표시 {mine}")
        await page.screenshot(path=SHOT + "05_dict_type_wrong_390.png")

        # 6) 마침표만 빠진 경우 (유연 처리)
        await page.evaluate("__harang.dict.select('r1')")
        await page.wait_for_timeout(150)
        await page.evaluate("__harang.dict.setMode('type')")
        await page.fill("#dictInput", "부러워요")
        await page.click("#dictCheck")
        await page.wait_for_timeout(250)
        res3 = await page.evaluate("__harang.dict.result")
        tip3 = await page.inner_text("#dictTip")
        ok(res3 and res3["good"] and "마침표" in tip3, f"마침표 유연 처리 {res3} / {tip3[:30]}")

        # 7) 듣기 2종 — 내장 MP3 (보통 1.0 / 천천히 0.72)
        await page.evaluate("__harang.dict.select('r1')")
        await page.wait_for_timeout(150)
        await page.evaluate("__harang.dict.setMode('note')")
        await page.click("#listenNormal")
        await page.wait_for_timeout(700)
        aud = await page.evaluate("__harang.dict.audio")
        pb = await page.evaluate("__harang.dict.playback")
        ok(bool(aud) and aud[-1]["kind"] == "mp3" and aud[-1]["src"] == "audio/dict/r1-1.mp3"
           and abs(aud[-1]["rate"] - 1.0) < 0.01, f"보통 속도 MP3 재생 {aud[-1] if aud else None}")
        ok(bool(pb) and pb["src"].endswith("/audio/dict/r1-1.mp3") and abs(pb["rate"] - 1.0) < 0.01
           and pb["paused"] is False, f"보통 속도 재생 상태 {pb}")
        ok(any(u.endswith("/audio/dict/r1-1.mp3") for u in audio_reqs), f"MP3 실제 요청 {audio_reqs[:2]}")
        btn_txt = await page.inner_text("#listenNormal")
        ok("멈추기" in btn_txt, f"듣기 버튼 토글 문구 {btn_txt}")
        await page.click("#listenSlow")
        await page.wait_for_timeout(700)
        aud2 = await page.evaluate("__harang.dict.audio")
        pb2 = await page.evaluate("__harang.dict.playback")
        ok(bool(aud2) and aud2[-1]["kind"] == "mp3" and abs(aud2[-1]["rate"] - 0.72) < 0.01,
           f"천천히 듣기 rate {aud2[-1] if aud2 else None}")
        ok(bool(pb2) and abs(pb2["rate"] - 0.72) < 0.01 and pb2["paused"] is False, f"천천히 재생 상태 {pb2}")
        await page.click("#listenSlow")
        await page.wait_for_timeout(350)
        ok(await page.evaluate("__harang.dict.playback") is None
           and "천천히" in await page.inner_text("#listenSlow"), "다시 눌러 정지")
        await page.screenshot(path=SHOT + "06_dict_listen_390.png")

        # 8) 급수 선택 목록
        await page.click("#dictRoundBtn")
        await page.wait_for_timeout(200)
        open_ok = await page.evaluate("document.getElementById('dictRounds').classList.contains('open')")
        ok(open_ok, "급수 목록 펼침")
        await page.screenshot(path=SHOT + "07_dict_rounds_390.png")
        await page.click("#dictRounds .dict-round:nth-child(9)")  # 연습 1
        await page.wait_for_timeout(250)
        it = await page.evaluate("__harang.dict.item")
        ok(it["round"] == "p1" and it["text"] == "책을 읽고 생각해요.", f"연습 급수 선택 {it['round']} {it['text']}")
        await page.screenshot(path=SHOT + "08_dict_practice_390.png")

        # 9) 10문장 완성 배너
        for i in range(10):
            await page.evaluate("__harang.dict.setMode('note')")
            await page.evaluate("__harang.dict.showAnswer()")
            await page.evaluate("__harang.dict.mark(true)")
            if i < 9:
                await page.click("#dictNext")
                await page.wait_for_timeout(60)
        await page.wait_for_timeout(300)
        banner = await page.evaluate("!document.getElementById('dictBanner').hidden")
        ok(banner, "급수 10문장 완료 배너")
        await page.screenshot(path=SHOT + "09_dict_round_done_390.png")

        # 10) 리포트 과목별
        await page.evaluate("__harang.subject('dict')")
        await page.click("#dictReportBtn")
        await page.wait_for_timeout(300)
        rep = await page.inner_text("#reportBody")
        cards = await page.evaluate("[...document.querySelectorAll('.rep-subj-card')].map(e=>({s:e.dataset.subj,t:e.innerText}))")
        ok(len(cards) == 3, f"리포트 과목 카드 {len(cards)} (수학·받아쓰기·영어)")
        ok("수학" in rep and "받아쓰기" in rep and "영어" in rep, "리포트에 과목별 표기")
        ok("1회 · 기분을 말해요" in rep and "연습 1" in rep, "리포트 받아쓰기 회차별 표시")
        ok(any(c["s"] == "dict" and "%" in c["t"] for c in cards), f"받아쓰기 정답률 카드 {cards}")
        await page.screenshot(path=SHOT + "10_report_390.png")
        await page.click("#reportClose")
        await page.wait_for_timeout(200)

        # 11) 오답 복습
        rv = await page.evaluate("__harang.dict.review()")
        await page.wait_for_timeout(300)
        rb = await page.evaluate("!document.getElementById('dictReviewBanner').hidden")
        ok(rv["reviewMode"] and rb, f"받아쓰기 복습 시작 {rv}")
        await page.screenshot(path=SHOT + "11_dict_review_390.png")
        o_rv0 = await page.evaluate("__harang.state.orange")
        await page.evaluate("__harang.dict.mark(false)")
        await page.wait_for_timeout(250)
        o_rv1 = await page.evaluate("__harang.state.orange")
        ok(o_rv1 == o_rv0, f"받아쓰기 오답 복습: 틀리면 감 +0 {o_rv0}->{o_rv1}")
        n_before = await page.evaluate("__harang.state.dict.wrong.length")
        await page.evaluate("__harang.dict.mark(true)")
        await page.wait_for_timeout(350)
        o_rv2 = await page.evaluate("__harang.state.orange")
        n_after = await page.evaluate("__harang.state.dict.wrong.length")
        ok(o_rv2 == o_rv1 + 1, f"받아쓰기 오답 복습: 맞히면 감 +1 {o_rv1}->{o_rv2}")
        ok(n_after == n_before - 1, f"받아쓰기 복습 정답 → 오답 졸업 {n_before}->{n_after}")
        await page.click("#dictReviewExit")
        await page.wait_for_timeout(200)


        # 11-2) 감 100 → 요정 칭찬 팝업 → 소원 적기 (받아쓰기 정답으로도)
        await page.evaluate("__harang.dict.select('r8')")
        await page.evaluate("__harang.setOrange(99)")
        await page.wait_for_timeout(100)
        await page.evaluate("__harang.dict.setMode('note')")
        await page.evaluate("__harang.dict.showAnswer()")
        await page.evaluate("__harang.dict.mark(true)")
        await page.wait_for_timeout(1500)
        fairy = await page.evaluate("__harang.fairy")
        ok(fairy["open"] and fairy["celebrate"] and "100개" in fairy["text"], f"받아쓰기 정답으로 감 100 → 요정 칭찬 {fairy}")
        await page.screenshot(path=SHOT + "13_dict_wish_390.png")
        await page.click("#fairyWishBtn")
        await page.wait_for_timeout(400)
        wish = await page.evaluate("!document.getElementById('wishModal').hidden")
        ok(wish, "요정 → 소원 팝업 연결")
        await page.fill("#wishInput", "놀이터 가고 싶어요")
        await page.click("#wishSaveBtn")
        await page.wait_for_timeout(600)
        st = await page.evaluate("({o: __harang.state.orange, j: __harang.state.journey, w: __harang.state.wishes.length})")
        ok(st["o"] == 0 and st["j"] == 2 and st["w"] == 1, f"소원 저장 → 감 0/100 리셋 {st}")
        await page.click("#wishCloseBtn")
        await page.wait_for_timeout(200)

        # 11-3) 수학 탭 회귀 확인 (정답 → 감/과목기록)
        await page.evaluate("__harang.subject('math')")
        await page.wait_for_timeout(200)
        await page.evaluate("__harang.setOrange(50)")
        m0 = await page.evaluate("({o: __harang.state.orange, m: __harang.state.subj.math.solved})")
        await page.evaluate("__harang.answerCorrect()")
        await page.wait_for_timeout(300)
        m1 = await page.evaluate("({o: __harang.state.orange, m: __harang.state.subj.math.solved, c: __harang.state.subj.math.correct})")
        ok(m1["o"] == m0["o"] + 1 and m1["m"] == m0["m"] + 1, f"수학 정답 감/기록 {m0}->{m1}")
        await page.screenshot(path=SHOT + "14_math_feedback_390.png")

        # 12) 가로 넘침 / 콘솔 오류
        overflow = await page.evaluate("({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})")
        ok(overflow["sw"] <= overflow["cw"] + 1, f"가로 넘침 없음 {overflow}")
        await page.evaluate("__harang.subject('math')")
        ov2 = await page.evaluate("({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})")
        ok(ov2["sw"] <= ov2["cw"] + 1, f"수학 탭 가로 넘침 없음 {ov2}")
        ok(len(errors) == 0, f"콘솔 오류 0 {errors[:4]}")
        await page.screenshot(path=SHOT + "12_math_after_390.png", full_page=True)
        await b.close()

    fails = [r for r in report if r[0] == "FAIL"]
    for st, msg in report:
        print(st, msg)
    print(f"\n{len(report)-len(fails)}/{len(report)} passed")
    return 1 if fails else 0

sys.exit(asyncio.run(main()))
