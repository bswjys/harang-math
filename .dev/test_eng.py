#!/usr/bin/env python3
"""공부하랑핑 v7 — 🔤 초등 1학년 영어 검증
 · 4개 코스 76문항 (그림 24 / 듣기 20 / 생활 16 / 빈칸 16) · 보기 4개 · 해설 있음
 · 영어 듣기 MP3(en-US-AnaNeural) 76개 · 보통 1.0 / 천천히 0.72 · 폴백
 · 정답 감 +1 / 오답 감 +0 · 오답 복습 · 리포트 3과목 분리 · 미션·감 합산
 · 3개 탭 390px 한 줄 · 넘침 0 · 콘솔 오류 0 · 390/820/1280
명령: LD_LIBRARY_PATH=... python3 .dev/test_eng.py
"""
import asyncio, threading, functools, http.server, socketserver, json, sys, os, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SHOT = os.path.abspath(os.path.join(ROOT, '..', '..', 'downloads', 'harang_eng')) + '/'
os.makedirs(SHOT, exist_ok=True)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def start_server():
    handler = functools.partial(Quiet, directory=ROOT)
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    global URL, BASE
    BASE = f"http://127.0.0.1:{httpd.server_address[1]}"
    URL = BASE + "/index.html?test=1"


from playwright.async_api import async_playwright

EXPECT = {'pic': 24, 'listen': 20, 'talk': 16, 'blank': 16}


async def overflow(page):
    return await page.evaluate("""() => {
      const sw = document.documentElement.scrollWidth, iw = window.innerWidth;
      const wide = [...document.querySelectorAll('body *')].filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.right > iw + 1.5 || r.left < -1.5) && getComputedStyle(e).position !== 'fixed';
      }).slice(0, 5).map(e => e.tagName + '.' + (e.className && e.className.baseVal != null ? e.className.baseVal : e.className));
      return { sw, iw, wide };
    }""")


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
        page.on("request", lambda r: audio_reqs.append(r.url) if "/audio/eng/" in r.url else None)
        await page.goto(URL, wait_until="load")
        await page.evaluate("localStorage.clear()")
        await page.reload(wait_until="load")
        await page.wait_for_timeout(500)

        # 1) 코스 데이터
        courses = await page.evaluate("__harang.eng.courses()")
        ok(len(courses) == 4, f"영어 코스 4개 {[c['key'] for c in courses]}")
        counts = {c["key"]: c["count"] for c in courses}
        ok(counts == EXPECT, f"코스별 문항 수 {counts} (총 {sum(counts.values())})")
        ok(sum(counts.values()) >= 60, f"전체 문항 60개 이상 ({sum(counts.values())})")

        # 2) MP3 76개 실제 파일 · 색인 일치
        idx = json.loads(urllib.request.urlopen(f"{BASE}/audio/eng/index.json", timeout=20).read())
        bad = [k for k, v in idx.items() if not v.get("text") or v.get("size", 0) < 3072]
        ok(len(idx) == 76 and not bad, f"영어 MP3 76개 · 색인 정상 (문제 {bad[:3]})")
        misses = []
        for c in courses:
            for i, say in enumerate(c["voices"]):
                key = f"{c['key']}-{i + 1}"
                if key not in idx or idx[key]["text"] != say:
                    misses.append((key, say, idx.get(key, {}).get("text")))
        ok(not misses, f"MP3 색인 문장 일치 (불일치 {misses[:3]})")
        voices = {v["voice"] for v in idx.values()}
        ok(voices <= {"en-US-AnaNeural", "en-US-JennyNeural"}, f"영어 목소리 {voices}")

        # 3) 상단 3개 탭 — 390px 한 줄, 넘침 0
        tabs = await page.evaluate("""() => [...document.querySelectorAll('.subj-tab')].map(b => {
            const r = b.getBoundingClientRect();
            return { text: b.textContent.trim(), w: Math.round(r.width), right: Math.round(r.right), top: Math.round(r.top) };
        })""")
        ok(len(tabs) == 3 and "수학" in tabs[0]["text"] and "받아쓰기" in tabs[1]["text"] and "영어" in tabs[2]["text"],
           f"과목 탭 3개 {[t['text'] for t in tabs]}")
        ok(len({t["top"] for t in tabs}) == 1 and max(t["right"] for t in tabs) <= 391,
           f"탭 한 줄에 들어감 {tabs}")
        ov = await overflow(page)
        ok(ov["sw"] <= ov["iw"] + 1, f"390px 가로 넘침 없음 {ov['sw']}/{ov['iw']} {ov['wide'][:3]}")

        s = await page.evaluate("__harang.subject('eng')")
        ok(s["engHidden"] is False and s["mathHidden"] and s["dictHidden"], f"영어 탭 전환 {s}")
        s2 = await page.evaluate("__harang.subject('dict')")
        ok(s2["dictHidden"] is False and s2["engHidden"], f"받아쓰기 탭 전환 {s2}")
        await page.evaluate("__harang.subject('eng')")

        # 4) 그림 영단어 — 보기 4개 · 정답 포함 · 정답 +1
        await page.evaluate("__harang.eng.select('pic')")
        await page.wait_for_timeout(250)
        it = await page.evaluate("__harang.eng.item")
        ok(len(it["options"]) == 4 and it["answer"] in it["options"], f"보기 4개·정답 포함 {it['options']} → {it['answer']}")
        ok(it["en"] == "cat" and it["ko"] == "고양이", f"첫 문항 {it['en']} / {it['ko']}")
        st0 = await page.evaluate("__harang.state.orange")
        await page.evaluate("__harang.eng.answerCorrect()")
        await page.wait_for_timeout(250)
        st1 = await page.evaluate("__harang.state.orange")
        stats = await page.evaluate("__harang.eng.stats")
        fb = await page.evaluate("__harang.eng.feedback")
        ok(st1 == st0 + 1, f"영어 정답 → 감 +1 ({st0}→{st1})")
        ok(stats["subj"]["eng"] == {"solved": 1, "correct": 1} and stats["eng"]["byCourse"]["pic"]["correct"] == 1,
           f"영어 과목 기록 {stats['subj']['eng']} / 코스 {stats['eng']['byCourse']['pic']}")
        ok(fb["good"] and "cat" in fb["explain"] and "고양이" in fb["explain"], f"정답 해설 {fb['explain'][:60]}")
        buttons = await page.evaluate("__harang.eng.buttons")
        ok(sum(1 for x in buttons if x["correct"]) == 1, f"정답 버튼 표시 {buttons}")

        # 5) 영어 듣기 — MP3 요청 · 보통 1.0 / 천천히 0.72
        await page.evaluate("__harang.eng.stop()")
        await page.wait_for_timeout(150)
        await page.click("#engListenNormal")
        await page.wait_for_timeout(500)
        aud = await page.evaluate("__harang.eng.audio")
        pb = await page.evaluate("__harang.eng.playback")
        ok(bool(aud) and aud[-1]["kind"] == "mp3" and aud[-1]["src"] == "audio/eng/pic-1.mp3",
           f"영어 듣기 MP3 {aud[-1] if aud else None}")
        ok(bool(pb) and pb["src"].endswith("/audio/eng/pic-1.mp3") and abs(pb["rate"] - 1.0) < 0.01,
           f"보통 속도 재생 {pb}")
        ok(any(u.endswith("/audio/eng/pic-1.mp3") for u in audio_reqs), f"MP3 실제 요청 {audio_reqs[:2]}")
        txt = await page.inner_text("#engListenNormal")
        ok("멈추기" in txt, f"듣기 버튼 토글 {txt}")
        await page.click("#engListenSlow")
        await page.wait_for_timeout(400)
        aud2 = await page.evaluate("__harang.eng.audio")
        ok(bool(aud2) and abs(aud2[-1]["rate"] - 0.72) < 0.01, f"천천히 듣기 0.72배 {aud2[-1] if aud2 else None}")
        pb2 = await page.evaluate("__harang.eng.playback")
        ok(bool(pb2) and abs(pb2["rate"] - 0.72) < 0.01, f"천천히 재생 속도 {pb2}")
        await page.screenshot(path=SHOT + "01_eng_pic_390.png")
        await page.evaluate("__harang.eng.stop()")

        # 6) 오답 → 감 +0 · 다시 풀어보기 · 오답 목록
        await page.evaluate("__harang.eng.next()")
        await page.wait_for_timeout(200)
        o0 = await page.evaluate("__harang.state.orange")
        wrong_val = await page.evaluate("__harang.eng.answerWrong()")
        await page.wait_for_timeout(250)
        o1 = await page.evaluate("__harang.state.orange")
        fb2 = await page.evaluate("__harang.eng.feedback")
        wl = await page.evaluate("__harang.eng.wrongList")
        ok(o1 == o0, f"영어 오답 → 감 +0 ({o0}→{o1}, 고른 답 {wrong_val})")
        ok((not fb2["good"]) and "다시 풀어보기" in " ".join(fb2["actions"]), f"오답 피드백·다시 풀기 {fb2['actions']}")
        ok(len(wl) == 1, f"오답 목록 저장 {wl}")
        retried = await page.evaluate("__harang.eng.retry()")
        await page.wait_for_timeout(200)
        enabled = await page.evaluate("""() => [...document.querySelectorAll('#engAnswerGrid .answer-btn')].every(b => !b.disabled)""")
        ok(retried and enabled, "다시 풀어보기 → 보기 다시 활성")
        await page.evaluate("__harang.eng.answerCorrect()")
        await page.wait_for_timeout(200)
        o2 = await page.evaluate("__harang.state.orange")
        wl2 = await page.evaluate("__harang.eng.wrongList")
        ok(o2 == o1 + 1 and not wl2, f"다시 풀어 맞히면 감 +1·오답 졸업 ({o1}→{o2}, {wl2})")
        await page.screenshot(path=SHOT + "02_eng_feedback_390.png")

        # 7) 나머지 3개 코스 — 문항 구성 · 정답 처리 · 듣기 소스
        for key in ("listen", "talk", "blank"):
            await page.evaluate(f"__harang.eng.select('{key}')")
            await page.wait_for_timeout(200)
            it = await page.evaluate("__harang.eng.item")
            src = await page.evaluate("__harang.eng.audioSrc()")
            ok(it["course"] == key and len(it["options"]) == 4 and it["answer"] in it["options"],
               f"{key} 문항·보기 {it['answer']} / {it['options']}")
            ok(src == f"audio/eng/{key}-1.mp3", f"{key} 첫 문제 MP3 경로 {src}")
            before = await page.evaluate("__harang.state.orange")
            await page.evaluate("__harang.eng.answerCorrect()")
            await page.wait_for_timeout(200)
            after = await page.evaluate("__harang.state.orange")
            ok(after == before + 1, f"{key} 정답 → 감 +1 ({before}→{after})")
            st = await page.evaluate("__harang.eng.stage")
            ok(bool(st), f"{key} 문제 화면 {st[:40].replace(chr(10),' / ')}")
            if key == "listen":
                await page.screenshot(path=SHOT + "03_eng_listen_390.png")
            if key == "talk":
                await page.screenshot(path=SHOT + "04_eng_talk_390.png")
            if key == "blank":
                await page.screenshot(path=SHOT + "05_eng_blank_390.png")

        # 7-b) 76문항 전체 보기 검사 — 4개·중복 없음·정답 포함
        audit = []
        for c in courses:
            key = c["key"]
            await page.evaluate(f"__harang.eng.select('{key}')")
            await page.wait_for_timeout(80)
            for i in range(c["count"]):
                it = await page.evaluate("__harang.eng.item")
                opts = it["options"]
                audit.append({
                    "id": it["id"], "course": key,
                    "n": len(opts), "uniq": len(set(opts)), "has": it["answer"] in opts,
                    "answer": it["answer"], "opts": opts
                })
                if i < c["count"] - 1:
                    await page.evaluate("__harang.eng.next()")
                    await page.wait_for_timeout(35)
        ok(len(audit) == 76, f"76문항 모두 순회 {len(audit)}")
        ok(all(a["n"] == 4 and a["uniq"] == 4 for a in audit),
           f"모든 문항 보기 4개(중복 없음) {[a['id'] for a in audit if a['n'] != 4 or a['uniq'] != 4][:3]}")
        ok(all(a["has"] for a in audit), f"모든 문항에 정답 포함 {[a['id'] for a in audit if not a['has']][:3]}")
        blank_bad = [a for a in audit if a["course"] == "blank" and a["answer"] not in "aeiou"]
        ok(not blank_bad, f"빈칸 문제 정답은 알파벳 {blank_bad[:2]}")
        letter_opts = [a for a in audit if a["course"] == "listen" and len(a["answer"]) == 1]
        ok(len(letter_opts) >= 10, f"듣기 알파벳 문항 {len(letter_opts)}개")
        letter_audio = [c["voices"][i] for c in courses if c["key"] == "listen" for i in range(12)]
        # a·e·f는 알파벳 이름 소리로 적어 주고(다른 글자는 대문자만으로 이름으로 읽힘 — 음성 비교로 확인),
        # 나머지 10개는 대문자 그대로 씁니다.
        names = ["ay", "B", "C", "D", "ee", "eff", "G", "H", "K", "M", "S", "T"]
        ok(letter_audio == names, f"알파벳 12개는 알파벳 이름으로 읽어 줌 {letter_audio}")

        # 8) 오답 복습 (틀린 영어)
        await page.evaluate("__harang.eng.select('talk')")
        await page.wait_for_timeout(150)
        await page.evaluate("__harang.eng.next()")     # 앞에서 이미 맞힌 talk-1 말고 새 문항
        await page.wait_for_timeout(150)
        await page.evaluate("__harang.eng.answerWrong()")
        await page.wait_for_timeout(200)
        rv = await page.evaluate("__harang.eng.review()")
        ok(rv["reviewMode"] and rv["queue"] >= 1, f"영어 오답 복습 시작 {rv}")
        banner = await page.is_visible("#engReviewBanner")
        ok(banner, "복습 배너 표시")
        before = await page.evaluate("__harang.state.orange")
        await page.evaluate("__harang.eng.answerCorrect()")
        await page.wait_for_timeout(300)
        after = await page.evaluate("__harang.state.orange")
        wl3 = await page.evaluate("__harang.eng.wrongList")
        ok(after == before + 1 and len(wl3) == 0, f"복습 정답 → 감 +1·오답 졸업 ({before}→{after}, 남은 {len(wl3)})")
        await page.evaluate("__harang.eng.endReview()")

        # 9) 리포트 — 3과목 카드 · 영어 코스별 4줄
        await page.evaluate("__harang.subject('eng')")
        await page.click("#engReportBtn")
        await page.wait_for_timeout(350)
        cards = await page.evaluate("__harang.repSubjCards")
        ok(len(cards) == 3 and {c["subj"] for c in cards} == {"math", "dict", "eng"}, f"리포트 3과목 카드 {cards}")
        eng_card = [c for c in cards if c["subj"] == "eng"][0]
        ok("%" in eng_card["rate"], f"영어 정답률 카드 {eng_card}")
        bars = await page.evaluate("__harang.reportEngBars()")
        ok(len(bars) == 4 and {x["course"] for x in bars} == set(EXPECT), f"리포트 영어 코스별 4줄 {bars}")
        rep = await page.inner_text("#reportBody")
        ok("영어 코스별" in rep and "그림 영단어" in rep and "빈칸 알파벳" in rep, "리포트 영어 항목 표기")
        await page.screenshot(path=SHOT + "06_report_390.png")
        await page.evaluate("__harang.closeModals ? 0 : 0")
        await page.click("#reportDone")
        await page.wait_for_timeout(200)

        # 10) 3과목 합산 — 오늘 미션·감은 하나
        today = await page.evaluate("__harang.state.today.solved")
        ok(today >= 7, f"3과목 합산 오늘 푼 문제 {today}개")
        mission = await page.evaluate("__harang.mission")
        ok(mission["done"] or mission["solved"] >= 5, f"오늘 미션 합산 {mission}")

        # 11) 새로고침해도 영어 기록 유지
        before_stats = await page.evaluate("__harang.eng.stats")
        await page.reload(wait_until="load")
        await page.wait_for_timeout(700)
        after_stats = await page.evaluate("__harang.eng.stats")
        ok(after_stats["subj"]["eng"] == before_stats["subj"]["eng"]
           and after_stats["eng"]["byCourse"] == before_stats["eng"]["byCourse"],
           f"영어 기록 저장·복원 {after_stats['subj']['eng']}")
        subj_now = await page.evaluate("__harang.state.subject")
        ok(subj_now == "eng", f"마지막 과목(영어)으로 열기 {subj_now}")

        # 12) 태블릿 · PC 넘침
        for w in (820, 1280):
            await page.set_viewport_size({"width": w, "height": 900})
            await page.wait_for_timeout(250)
            ov = await overflow(page)
            ok(ov["sw"] <= ov["iw"] + 1, f"{w}px 가로 넘침 없음 {ov['sw']}/{ov['iw']} {ov['wide'][:3]}")
        await page.set_viewport_size({"width": 390, "height": 844})

        ok(len(errors) == 0, f"콘솔 오류 0건 {' / '.join(errors[:4])}")

        await b.close()

    print("\n===== 영어 검증 =====")
    for st, msg in report:
        print(f"{st} | {msg}")
    passed = sum(1 for st, _ in report if st == "PASS")
    print(f"\n{passed}/{len(report)} passed")
    return 0 if passed == len(report) else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
