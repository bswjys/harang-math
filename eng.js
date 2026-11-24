/* ===== 공부하랑핑 v7 — 🔤 초등 1학년 영어 모듈 =====
   · 4가지 코스: 🐾 그림 영단어 / 🔊 소리 듣고 찾기 / 💬 생활 영어 한마디 / 🧩 빈칸 알파벳
   · 문제마다 영어 듣기(MP3 · 보통 1.0배 / 천천히 0.72배) + 한 줄 해설 + 오답 복습
   · 맞히면 감 +1, 틀리면 감 +0 — 수학·받아쓰기와 하나로 합산됩니다.
*/
'use strict';

(function () {
  const COURSES = window.ENG_COURSES || [];
  if (!COURSES.length) return;

  const $id = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => {
    const x = a.slice();
    for (let i = x.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [x[i], x[j]] = [x[j], x[i]];
    }
    return x;
  };

  const courseOf = (key) => COURSES.find((c) => c.key === key) || COURSES[0];
  const ALL_ITEMS = {};
  COURSES.forEach((c) => c.items.forEach((it) => { ALL_ITEMS[it.id] = { course: c, item: it }; }));

  /* 알파벳 이름이 서로 비슷한 것끼리 묶어서, 듣기 문제의 오답은 다른 묶음에서 골라요 */
  const RHYME = {
    b: 'ee', c: 'ee', d: 'ee', e: 'ee', g: 'ee', p: 'ee', t: 'ee', v: 'ee', z: 'ee',
    a: 'ay', h: 'ay', j: 'ay', k: 'ay',
    f: 'eh', l: 'eh', m: 'eh', n: 'eh', s: 'eh', x: 'eh',
    i: 'eye', y: 'eye',
    o: 'oh',
    q: 'you', u: 'you', w: 'you',
    r: 'ar'
  };
  const LETTER_POOL = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'k', 'm', 'n', 'p', 's', 't'];

  /* ---------- 저장 상태 (수학·받아쓰기와 같은 저장소) ---------- */
  function ensure() {
    if (!state.eng || typeof state.eng !== 'object') state.eng = {};
    const e = state.eng;
    if (!e.byCourse || typeof e.byCourse !== 'object') e.byCourse = {};
    if (!Array.isArray(e.wrong)) e.wrong = [];
    if (!COURSES.some((c) => c.key === e.lastCourse)) e.lastCourse = COURSES[0].key;
    if (!state.subj || typeof state.subj !== 'object') state.subj = {};
    ['math', 'dict', 'eng'].forEach((k) => {
      if (!state.subj[k] || typeof state.subj[k] !== 'object') state.subj[k] = { solved: 0, correct: 0 };
      state.subj[k].solved = Number(state.subj[k].solved) || 0;
      state.subj[k].correct = Number(state.subj[k].correct) || 0;
    });
    COURSES.forEach((c) => {
      const r = e.byCourse[c.key];
      if (!r || typeof r !== 'object') e.byCourse[c.key] = { solved: 0, correct: 0 };
      const rr = e.byCourse[c.key];
      rr.solved = Number(rr.solved) || 0;
      rr.correct = Number(rr.correct) || 0;
    });
    e.wrong = e.wrong.filter((w) => w && w.id && ALL_ITEMS[w.id]);
    return e;
  }
  const E = () => ensure();

  function courseRec(key) {
    const e = E();
    const r = e.byCourse[key] || (e.byCourse[key] = { solved: 0, correct: 0 });
    r.solved = Number(r.solved) || 0;
    r.correct = Number(r.correct) || 0;
    return r;
  }

  /* ---------- 진행 상태 ---------- */
  let curKey = null;
  let idx = 0;
  let audioEl = null;
  let utter = null;
  let listenMode = '';                        // '' | 'normal' | 'slow'
  const audioLog = [];
  const results = {};                         // 'pic-1' -> {chosen, correct, typed?}
  const rewarded = {};                        // 'pic-1' -> true (감 중복 방지)
  const optCache = {};                        // 'pic-1' -> [보기...] (앞뒤로 오가도 그대로)
  let reviewMode = false;
  let reviewQueue = [];
  let reviewLeft = 0;

  const curCourse = () => courseOf(curKey);

  /* 복습 중에는 틀린 문제 큐에서 꺼내고, 그 문제의 코스를 현재 코스로 삼아요 */
  function curItem() {
    if (reviewMode && reviewQueue.length) {
      const it = reviewQueue[Math.min(idx, reviewQueue.length - 1)];
      if (it) {
        const box = ALL_ITEMS[it.id];
        if (box) curKey = box.course.key;
        return it;
      }
    }
    return curCourse().items[idx] || curCourse().items[0];
  }
  const queueLen = () => (reviewMode ? reviewQueue.length : curCourse().items.length);

  /* ---------- 보기 만들기 ---------- */
  function buildOptions(item) {
    if (optCache[item.id]) return optCache[item.id];
    const course = COURSES.find((c) => c.items.some((i) => i.id === item.id));
    let opts = [];

    if (curKey === 'pic') {
      const same = COURSES[0].items.filter((i) => i.group === item.group && i.en !== item.en);
      const others = COURSES[0].items.filter((i) => i.en !== item.en);
      const pool = shuffle(same).concat(shuffle(others));
      for (const i of pool) {
        if (opts.length >= 3) break;
        if (!opts.includes(i.en)) opts.push(i.en);
      }
      opts.push(item.en);
    } else if (curKey === 'listen') {
      if (item.kind === 'letter') {
        const my = RHYME[item.letter];
        const far = LETTER_POOL.filter((l) => l !== item.letter && RHYME[l] !== my);
        const near = LETTER_POOL.filter((l) => l !== item.letter && RHYME[l] === my);
        const pool = shuffle(far).concat(shuffle(near));
        for (const l of pool) {
          if (opts.length >= 3) break;
          opts.push(l);
        }
      } else {
        const others = course.items.filter((i) => i.kind === 'word' && i.word !== item.word);
        for (const i of shuffle(others)) {
          if (opts.length >= 3) break;
          if (!opts.includes(i.word)) opts.push(i.word);
        }
      }
      opts.push(item.kind === 'letter' ? item.letter : item.word);
    } else if (curKey === 'talk') {
      const others = course.items.filter((i) => i.en !== item.en);
      for (const i of shuffle(others)) {
        if (opts.length >= 3) break;
        if (!opts.includes(i.en)) opts.push(i.en);
      }
      opts.push(item.en);
    } else {
      /* blank — 미리 정해 둔 알파벳 4개 */
      opts = (item.choices || ['a', 'e', 'i', 'o']).filter((c, i, arr) => arr.indexOf(c) === i).slice(0, 4);
      if (!opts.includes(item.answer)) opts[opts.length - 1] = item.answer;
    }

    opts = shuffle(opts);
    optCache[item.id] = opts;
    return opts;
  }

  function answerOf(item) {
    if (item.kind === 'letter') return item.letter;
    if (item.kind === 'word') return item.word;
    if (item.answer) return item.answer;
    return item.en;
  }

  function optionLabel(value) {
    if (curKey === 'listen' && curItem().kind === 'letter') return `${String(value).toUpperCase()} ${value}`;
    return value;
  }

  /* ---------- 소리 (내장 MP3 · 보통 1.0 / 천천히 0.72) ---------- */
  const MP3_RATE = { normal: 1.0, slow: 0.72 };

  function audioSrc(item) {
    const c = COURSES.find((cc) => cc.items.some((i) => i.id === item.id));
    const n = c.items.findIndex((i) => i.id === item.id) + 1;
    return `audio/eng/${c.key}-${n}.mp3`;
  }

  function pushLog(rec) {
    audioLog.push(Object.assign({ at: Date.now() }, rec));
    if (audioLog.length > 40) audioLog.shift();
    window.__engSpeech = window.__engSpeech || [];
    window.__engSpeech.push(rec);
    if (window.__engSpeech.length > 40) window.__engSpeech.shift();
  }

  function resetListen() {
    listenMode = '';
    renderListen();
  }

  function stopSpeak() {
    if (audioEl) {
      const a = audioEl;
      audioEl = null;
      try { a.onended = null; a.onerror = null; a.onplaying = null; a.onloadedmetadata = null; } catch (e) { /* 무시 */ }
      try { a.pause(); } catch (e) { /* 무시 */ }
      try { a.removeAttribute('src'); a.load(); } catch (e) { /* 무시 */ }
    }
    if (utter) {
      utter = null;
      try { window.speechSynthesis.cancel(); } catch (e) { /* 무시 */ }
    }
    resetListen();
  }

  function applyRate(a, slow) {
    const rate = slow ? MP3_RATE.slow : MP3_RATE.normal;
    try {
      a.defaultPlaybackRate = rate;
      a.playbackRate = rate;
      a.preservesPitch = true;
      a.webkitPreservesPitch = true;
    } catch (e) { /* 무시 */ }
  }

  function speakFallback(slow, want, text) {
    const synth = window.speechSynthesis;
    const U = window.SpeechSynthesisUtterance;
    if (!synth || typeof U !== 'function') {
      if (window.showToast) showToast('🔊', '이 브라우저에서는 영어 듣기를 쓸 수 없어요', '', 2600);
      return false;
    }
    try {
      const u = new U(text);
      u.lang = 'en-US';
      u.rate = slow ? 0.62 : 0.9;
      u.pitch = 1.15;
      try {
        const vs = synth.getVoices() || [];
        const en = vs.find((v) => /^en([-_]|$)/i.test(v.lang || '')) || null;
        if (en) u.voice = en;
      } catch (e) { /* 목소리 목록은 없어도 괜찮아요 */ }
      u.onend = () => { if (listenMode === want) resetListen(); };
      u.onerror = () => { if (listenMode === want) resetListen(); };
      utter = u;
      listenMode = want;
      renderListen();
      pushLog({ kind: 'tts', text, lang: 'en-US', rate: u.rate, reason: 'mp3-fallback' });
      synth.speak(u);
      if (window.playSound) playSound('tap');
      return true;
    } catch (e) {
      resetListen();
      return false;
    }
  }

  function speakMp3(slow, want, text) {
    const item = curItem();
    const src = audioSrc(item);
    let a;
    try { a = new Audio(src); } catch (e) { return speakFallback(slow, want, text); }
    a.preload = 'auto';
    applyRate(a, slow);
    a.onloadedmetadata = () => { if (audioEl === a) applyRate(a, slow); };
    a.onplaying = () => { if (audioEl === a) applyRate(a, slow); };
    a.onended = () => { if (audioEl === a && listenMode === want) { audioEl = null; resetListen(); } };
    a.onerror = () => {
      if (audioEl !== a || listenMode !== want) return;
      audioEl = null;
      resetListen();
      speakFallback(slow, want, text);
    };
    audioEl = a;
    listenMode = want;
    renderListen();
    pushLog({ kind: 'mp3', src, text, rate: slow ? MP3_RATE.slow : MP3_RATE.normal, playbackRate: a.playbackRate });
    let p = null;
    try { p = a.play(); } catch (e) { p = null; }
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        if (audioEl !== a || listenMode !== want) return;
        audioEl = null;
        resetListen();
        speakFallback(slow, want, text);
      });
    }
    if (window.playSound) playSound('tap');
    return true;
  }

  function speak(slow) {
    const want = slow ? 'slow' : 'normal';
    const samePlaying = listenMode === want;
    stopSpeak();
    if (samePlaying) { renderListen(); return false; }
    return speakMp3(slow, want, curItem().say || answerOf(curItem()));
  }

  /* ---------- DOM ---------- */
  const ui = {};
  function grab() {
    ui.pane = $id('engPane');
    ui.courseBtn = $id('engCourseBtn');
    ui.courseList = $id('engCourses');
    ui.courseName = $id('engCourseName');
    ui.courseEmoji = $id('engCourseEmoji');
    ui.idx = $id('engIdx');
    ui.total = $id('engTotal');
    ui.rule = $id('engRule');
    ui.stage = $id('engStage');
    ui.grid = $id('engAnswerGrid');
    ui.listen = $id('engListenNormal');
    ui.listenSlow = $id('engListenSlow');
    ui.feedback = $id('engFeedback');
    ui.fbEmoji = $id('engFbEmoji');
    ui.fbTitle = $id('engFbTitle');
    ui.fbSub = $id('engFbSub');
    ui.fbExplain = $id('engFbExplain');
    ui.fbActions = $id('engFbActions');
    ui.prev = $id('engPrev');
    ui.next = $id('engNext');
    ui.review = $id('engReviewBtn');
    ui.report = $id('engReportBtn');
    ui.reviewBanner = $id('engReviewBanner');
    ui.reviewLeft = $id('engReviewLeft');
    ui.reviewExit = $id('engReviewExit');
  }

  /* ---------- 그리기 ---------- */
  function renderCourses() {
    if (!ui.courseList) return;
    ui.courseList.innerHTML = '';
    COURSES.forEach((c) => {
      const rec = courseRec(c.key);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'eng-course' + (c.key === curKey ? ' on' : '');
      b.dataset.course = c.key;
      b.innerHTML = `<span class="ec-emoji" aria-hidden="true">${c.emoji}</span><span class="ec-name">${esc(c.label)}</span><span class="ec-count">${rec.solved}/${c.items.length}</span>`;
      b.addEventListener('click', () => { chooseCourse(c.key); });
      ui.courseList.appendChild(b);
    });
  }

  function renderListen() {
    if (ui.listen) {
      ui.listen.textContent = listenMode === 'normal' ? '⏹ 멈추기' : '🔊 보통';
      ui.listen.classList.toggle('on', listenMode === 'normal');
    }
    if (ui.listenSlow) {
      ui.listenSlow.textContent = listenMode === 'slow' ? '⏹ 멈추기' : '🐢 천천히';
      ui.listenSlow.classList.toggle('on', listenMode === 'slow');
    }
  }

  function blankWord(item) {
    return item.en.split('').map((ch, i) => {
      if (i !== item.blank) return `<span class="eb-letter">${esc(ch)}</span>`;
      return '<span class="eb-blank">?</span>';
    }).join('');
  }

  function stageHtml() {
    const item = curItem();
    if (curKey === 'pic') {
      return `<div class="eng-art">${item.emoji}</div>
        <p class="eng-ask"><b>${esc(item.ko)}</b>를 영어로 뭐라고 할까요?</p>`;
    }
    if (curKey === 'listen') {
      if (item.kind === 'letter') {
        return `<div class="eng-ear">👂</div>
          <p class="eng-ask">어떤 <b>알파벳</b>이 들렸나요?</p>
          <p class="eng-sub">🔊 <b>보통</b>이나 <b>🐢 천천히</b>를 눌러 들어 보세요</p>`;
      }
      return `<div class="eng-ear">👂</div>
        <p class="eng-ask">어떤 <b>낱말</b>이 들렸나요?</p>
        <p class="eng-sub">🔊 <b>보통</b>이나 <b>🐢 천천히</b>를 눌러 들어 보세요</p>`;
    }
    if (curKey === 'talk') {
      return `<p class="eng-when">${esc(item.when)}</p>
        <p class="eng-ask">영어로 뭐라고 말할까요?</p>`;
    }
    return `<div class="eng-art">${item.emoji}</div>
      <div class="eng-blank-word">${blankWord(item)}</div>
      <p class="eng-ask"><b>${esc(item.ko)}</b> · 빠진 알파벳은?</p>`;
  }

  function explainHtml(item) {
    if (curKey === 'listen' && item.kind === 'letter') {
      return `<b>${item.letter.toUpperCase()} ${item.letter}</b> — ${item.tip}`;
    }
    if (curKey === 'blank') {
      const spelled = item.en.split('').join(' ');
      return `<b>${esc(spelled)}</b> = <b>${esc(item.en)}</b> (${esc(item.ko)}) ${item.emoji}<br>${item.tip}`;
    }
    if (curKey === 'talk') {
      return `<b>${esc(item.en)}</b> — ${esc(item.ko)}<br>${item.tip}`;
    }
    if (curKey === 'listen') {
      return `<b>${esc(item.word)}</b> ${item.emoji} (${esc(item.ko)})<br>${item.tip}`;
    }
    return `<b>${esc(item.en)}</b> = ${esc(item.ko)} ${item.emoji}<br>${item.tip}`;
  }

  function renderStage() {
    const item = curItem();
    if (ui.stage) ui.stage.innerHTML = stageHtml();
    const c = curCourse();
    if (ui.courseName) ui.courseName.textContent = reviewMode ? '틀린 영어 복습' : c.label;
    if (ui.courseEmoji) ui.courseEmoji.textContent = reviewMode ? '🌸' : c.emoji;
    if (ui.rule) ui.rule.textContent = reviewMode ? '틀린 문제를 다시 풀어 보면 진짜 내 것이 돼요' : c.rule;
    if (ui.idx) ui.idx.textContent = String(idx + 1);
    if (ui.total) ui.total.textContent = String(queueLen());
    return item;
  }

  function renderAnswers() {
    if (!ui.grid) return;
    const item = curItem();
    const opts = buildOptions(item);
    const res = results[item.id];
    ui.grid.innerHTML = '';
    ui.grid.classList.toggle('letters', curKey === 'listen' && item.kind === 'letter');
    ui.grid.classList.toggle('phrases', curKey === 'talk');
    opts.forEach((value) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'answer-btn eng-opt';
      b.dataset.value = value;
      b.textContent = optionLabel(value);
      if (res) {
        b.disabled = true;
        if (value === answerOf(item)) b.classList.add('correct');
        else if (value === res.chosen) b.classList.add('wrong');
        else b.classList.add('dim');
      }
      b.addEventListener('click', () => answer(value, b));
      ui.grid.appendChild(b);
    });
  }

  function renderFeedback() {
    const item = curItem();
    const res = results[item.id];
    if (!ui.feedback) return;
    if (!res) { ui.feedback.hidden = true; return; }
    const good = !!res.correct;
    ui.feedback.hidden = false;
    ui.feedback.className = 'feedback ' + (good ? 'good' : 'bad');
    ui.fbEmoji.textContent = good ? pickOne(['🎉', '💖', '🌟', '🥳', '✨']) : pickOne(['🌸', '💗', '🫶', '🌈']);
    ui.fbTitle.textContent = good
      ? pickOne(['정답이에요! 💖', '우와, 영어 천재다! 🎉', '반짝반짝 잘했어요! ✨', '또 맞혔어! 최고야! 🌟'])
      : pickOne(['괜찮아! 해설 보고 다시 해 보자 💪', '조금만 더! 소리를 다시 들어 봐요 🌸']);
    ui.fbSub.textContent = good
      ? (res.retried ? '다시 해내다니 멋져요! 감 1개를 모았어요 🍊' : '영어 정답! 감 1개를 모았어요 🍊')
      : '틀린 문제는 감 0개예요. 맞히면 감 1개! 🍊';
    ui.fbExplain.innerHTML = explainHtml(item);
    ui.fbActions.innerHTML = '';

    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'btn btn-soft small';
    replay.textContent = '🔊 다시 듣기';
    replay.addEventListener('click', () => speak(false));
    ui.fbActions.appendChild(replay);

    if (!good) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'btn btn-soft';
      retry.id = 'engRetryBtn';
      retry.textContent = '다시 풀어보기 💪';
      retry.addEventListener('click', () => {
        res.retried = true;
        delete results[item.id];
        renderAll();
        playSound('tap');
      });
      ui.fbActions.appendChild(retry);
    }

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn btn-primary';
    next.id = 'engNextBtn';
    next.textContent = idx + 1 >= queueLen() ? '처음 문제로 ▶' : '다음 문제 ▶';
    next.addEventListener('click', () => go(1));
    ui.fbActions.appendChild(next);

    ui.feedback.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function renderNav() {
    if (ui.prev) {
      ui.prev.classList.toggle('off', idx === 0);
      ui.prev.disabled = idx === 0;
    }
    if (ui.next) {
      ui.next.textContent = idx + 1 >= queueLen() ? '처음 문제로 ▶' : '다음 문제 ▶';
    }
  }

  function renderReviewBtn() {
    if (!ui.review) return;
    const n = E().wrong.length;
    ui.review.textContent = `🌸 틀린 영어 복습 (${n})`;
    ui.review.classList.toggle('off', n === 0);
    if (ui.reviewBanner) ui.reviewBanner.hidden = !reviewMode;
    if (ui.reviewLeft) ui.reviewLeft.textContent = String(n);
  }

  function renderAll() {
    renderCourses();
    renderStage();
    renderAnswers();
    renderFeedback();
    renderNav();
    renderReviewBtn();
    renderListen();
  }

  /* ---------- 채점 ---------- */
  function addWrong(item, course) {
    const e = E();
    const found = e.wrong.find((w) => w.id === item.id);
    if (found) {
      found.misses = (Number(found.misses) || 1) + 1;
      found.at = Date.now();
    } else {
      e.wrong.push({
        id: item.id,
        course: course.key,
        en: item.en || item.word || item.letter,
        ko: item.ko || '',
        misses: 1,
        at: Date.now()
      });
      if (e.wrong.length > 60) e.wrong.shift();
    }
    saveState();
    renderReviewBtn();
  }

  function removeWrong(item) {
    const e = E();
    const i = e.wrong.findIndex((w) => w.id === item.id);
    if (i >= 0) {
      e.wrong.splice(i, 1);
      saveState();
      renderReviewBtn();
      return true;
    }
    return false;
  }

  function answer(value, btn) {
    const item = curItem();
    if (results[item.id]) return;
    const course = curCourse();
    const correct = value === answerOf(item);
    const first = true;

    results[item.id] = { chosen: value, correct };

    ensure();
    state.today.solved += 1;
    state.total.solved += 1;
    state.subj.eng.solved += 1;
    const rec = courseRec(course.key);
    rec.solved += 1;
    if (correct) {
      state.today.correct += 1;
      state.total.correct += 1;
      state.subj.eng.correct += 1;
      rec.correct += 1;
    } else {
      state.today.wrong += 1;
      state.total.wrong += 1;
    }

    if (correct) {
      const graduated = removeWrong(item);
      if (!rewarded[item.id]) {
        rewarded[item.id] = true;
        addOrange(1);
      }
      playSound('correct');
      burst(12, false);
      if (window.showToast) showToast('🔤', '영어 정답! 감 1개를 모았어요', 'mint', 1700);
      if (graduated && reviewMode && E().wrong.length === 0) {
        setTimeout(() => {
          if (window.showToast) showToast('🌸', '틀린 영어를 모두 졸업했어요! 최고예요', 'mint', 2600);
          endReview();
        }, 1500);
      }
    } else {
      addWrong(item, course);
      playSound('wrong');
      if (btn) btn.classList.add('wrong');
    }

    if (first && window.checkMission) checkMission();
    saveState();
    if (window.renderStatus) renderStatus();
    renderAll();
  }

  /* ---------- 이동 ---------- */
  function chooseCourse(key) {
    curKey = key;
    idx = 0;
    reviewMode = false;
    reviewQueue = [];
    stopSpeak();
    E().lastCourse = key;
    saveState();
    renderAll();
    toggleList(false);
    playSound('tap');
    autoListen();
  }

  function toggleList(open) {
    if (!ui.courseList) return;
    const on = open == null ? !ui.courseList.classList.contains('open') : !!open;
    ui.courseList.classList.toggle('open', on);
    if (ui.courseBtn) ui.courseBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  function go(step) {
    const len = queueLen();
    if (!len) return;
    let next = idx + step;
    if (next < 0) next = 0;
    if (next >= len) next = 0;
    idx = next;
    stopSpeak();
    renderAll();
    autoListen();
  }

  function autoListen() {
    if (curKey !== 'listen') return;
    try { speak(false); } catch (e) { /* 무시 */ }
  }

  /* ---------- 오답 복습 ---------- */
  function startReview() {
    const e = E();
    if (!e.wrong.length) {
      if (window.showToast) showToast('🌸', '틀린 영어가 없어요! 최고예요', 'mint', 2200);
      return;
    }
    reviewMode = true;
    reviewQueue = e.wrong.map((w) => ALL_ITEMS[w.id]).filter(Boolean).map((b) => b.item);
    reviewLeft = reviewQueue.length;
    reviewQueue.forEach((it) => { delete results[it.id]; });
    curKey = ALL_ITEMS[reviewQueue[0].id].course.key;
    idx = 0;
    stopSpeak();
    renderAll();
    if (window.showToast) showToast('🌸', `틀린 영어 ${reviewLeft}개를 다시 풀어 봐요`, '', 2200);
  }

  function endReview() {
    reviewMode = false;
    reviewQueue = [];
    reviewLeft = 0;
    idx = 0;
    stopSpeak();
    renderAll();
  }

  /* ---------- 공개 도구 ---------- */
  function summary() {
    ensure();
    const s = state.subj.eng;
    const p = s.solved ? Math.round((s.correct / s.solved) * 100) : 0;
    return { solved: s.solved, correct: s.correct, rate: p };
  }

  function reportRows() {
    return COURSES.map((c) => {
      const rec = courseRec(c.key);
      const p = rec.solved ? Math.round((rec.correct / rec.solved) * 100) : 0;
      return `<div class="rep-cat" data-course="${c.key}">
        <div class="rep-cat-head"><span>${c.emoji} ${esc(c.label)}</span><b>${rec.solved ? p + '%' : '–'}</b></div>
        <div class="rep-bar"><i style="width:${rec.solved ? Math.max(p, 5) : 0}%"></i></div>
        <p class="rep-cat-foot">${rec.solved ? `${rec.solved}문제 중 ${rec.correct}개 정답` : '아직 안 했어요'}</p>
      </div>`;
    }).join('');
  }

  /* ---------- 이벤트 ---------- */
  function bind() {
    if (ui.courseBtn) ui.courseBtn.addEventListener('click', () => { toggleList(); playSound('tap'); });
    if (ui.listen) ui.listen.addEventListener('click', () => speak(false));
    if (ui.listenSlow) ui.listenSlow.addEventListener('click', () => speak(true));
    if (ui.prev) ui.prev.addEventListener('click', () => { if (idx > 0) { go(-1); playSound('tap'); } });
    if (ui.next) ui.next.addEventListener('click', () => { go(1); playSound('tap'); });
    if (ui.review) ui.review.addEventListener('click', startReview);
    if (ui.reviewExit) ui.reviewExit.addEventListener('click', endReview);
    if (ui.report && window.openReport) ui.report.addEventListener('click', () => window.openReport());
  }

  function init() {
    grab();
    if (!ui.pane) return;
    ensure();
    curKey = state.eng.lastCourse;
    idx = 0;
    bind();
    renderAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.harangEng = {
    get courses() { return COURSES.map((c) => ({ key: c.key, label: c.label, count: c.items.length })); },
    summary,
    reportRows,
    stop: () => { stopSpeak(); },
    refresh: () => { renderCourses(); renderReviewBtn(); renderStage(); },
    open: () => { if (window.openReport) window.openReport(); }
  };

  if (window.__harang) {
    window.__harang.eng = {
      courses: () => COURSES.map((c) => ({ key: c.key, label: c.label, count: c.items.length, voices: c.items.map((i) => i.say || i.en) })),
      select: (key) => { chooseCourse(key); return { course: curKey, total: curCourse().items.length }; },
      get item() {
        const it = curItem();
        return {
          id: it.id, course: curKey, idx, total: curCourse().items.length,
          kind: it.kind || curKey, en: it.en || it.word || it.letter,
          ko: it.ko || '', answer: answerOf(it), options: buildOptions(it).slice(),
          answered: !!results[it.id], review: reviewMode
        };
      },
      answer: (v) => {
        const b = [...ui.grid.children].find((x) => x.dataset.value === v);
        if (b) b.click();
        return !!b;
      },
      answerCorrect: () => {
        const item = curItem();
        const b = [...ui.grid.children].find((x) => x.dataset.value === answerOf(item));
        if (b) b.click();
        return !!b;
      },
      answerWrong: () => {
        const item = curItem();
        const b = [...ui.grid.children].find((x) => x.dataset.value !== answerOf(item)) || null;
        if (b) b.click();
        return b ? b.dataset.value : null;
      },
      next: () => { go(1); return { course: curKey, idx }; },
      prev: () => { go(-1); return { course: curKey, idx }; },
      listen: (slow) => speak(!!slow),
      get listening() { return listenMode; },
      get audio() { return audioLog.slice(-6); },
      audioSrc: () => audioSrc(curItem()),
      get feedback() {
        return ui.feedback ? {
          hidden: ui.feedback.hidden,
          good: ui.feedback.classList.contains('good'),
          title: ui.fbTitle ? ui.fbTitle.textContent : '',
          explain: ui.fbExplain ? ui.fbExplain.innerText : '',
          actions: ui.fbActions ? [...ui.fbActions.querySelectorAll('button')].map((b) => b.textContent) : []
        } : null;
      },
      retry: () => {
        const b = ui.fbActions.querySelector('#engRetryBtn');
        if (b) b.click();
        return !!b;
      },
      get buttons() {
        return ui.grid ? [...ui.grid.children].map((b) => ({ text: b.textContent, value: b.dataset.value, correct: b.classList.contains('correct'), wrong: b.classList.contains('wrong') })) : [];
      },
      get stage() { return ui.stage ? ui.stage.innerText : ''; },
      review: () => { startReview(); return { reviewMode, queue: reviewQueue.length, left: reviewLeft }; },
      endReview: () => { endReview(); return reviewMode; },
      get wrongList() { return state.eng.wrong.map((w) => ({ id: w.id, course: w.course, misses: w.misses })); },
      get stats() { ensure(); return JSON.parse(JSON.stringify({ subj: state.subj, eng: state.eng })); },
      stop: () => stopSpeak(),
      get playback() { return audioEl ? { src: audioEl.currentSrc || audioEl.src, rate: audioEl.playbackRate, paused: audioEl.paused } : null; }
    };
  }
})();
