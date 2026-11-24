/* ===== 공부하랑핑 v4 — ✏️ 받아쓰기 모듈 =====
   · 듣기 2종(보통·천천히), ✍️ 공책에 쓰기 / ⌨️ 직접 치기
   · 채점하면 감(+1)·오늘 미션·소원이 수학과 하나로 합산됩니다.
*/
'use strict';

(function () {
  const ROUNDS = window.DICT_ROUNDS || [];
  if (!ROUNDS.length) return;

  const $id = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const roundOf = (key) => ROUNDS.find((r) => r.key === key) || ROUNDS[0];
  const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const stripEnd = (s) => norm(s).replace(/[.?!]+$/, '');
  const pickOne = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- 저장 상태 (수학과 같은 저장소) ---------- */
  function ensure() {
    if (!state.dict || typeof state.dict !== 'object') state.dict = {};
    const d = state.dict;
    if (!d.byRound || typeof d.byRound !== 'object') d.byRound = {};
    if (!Array.isArray(d.wrong)) d.wrong = [];
    if (!ROUNDS.some((r) => r.key === d.lastRound)) d.lastRound = ROUNDS[0].key;
    if (!state.subj || typeof state.subj !== 'object') state.subj = {};
    ['math', 'dict'].forEach((k) => {
      if (!state.subj[k] || typeof state.subj[k] !== 'object') state.subj[k] = { solved: 0, correct: 0 };
      state.subj[k].solved = Number(state.subj[k].solved) || 0;
      state.subj[k].correct = Number(state.subj[k].correct) || 0;
    });
    return d;
  }
  const D = () => ensure();

  function roundRec(key) {
    const d = D();
    if (!d.byRound[key] || typeof d.byRound[key] !== 'object') d.byRound[key] = { solved: 0, correct: 0 };
    const r = d.byRound[key];
    r.solved = Number(r.solved) || 0;
    r.correct = Number(r.correct) || 0;
    return r;
  }

  /* ---------- 진행 상태 ---------- */
  let curKey = null;
  let idx = 0;
  let mode = 'note';
  let answerShown = false;
  let listenMode = '';                       // '' | 'normal' | 'slow'
  let audioEl = null;                        // 내장 MP3 플레이어
  let utter = null;                          // MP3 실패 시에만 쓰는 speechSynthesis 폴백
  const audioLog = [];                       // 재생 기록(테스트·디버그용)
  let reviewMode = false;
  let reviewQueue = [];
  const results = {};                        // 'r1:3' -> {good, typed}
  const rewarded = {};                       // 'r1:3' -> true (감 중복 방지)

  const curRound = () => roundOf(curKey);
  const curItem = () => (curRound().items[idx] || curRound().items[0]);
  const itemId = (key, i) => 'd|' + key + '|' + i;

  /* ---------- DOM ---------- */
  const ui = {};
  function grab() {
    ui.pane = $id('dictPane');
    ui.roundBtn = $id('dictRoundBtn');
    ui.roundList = $id('dictRounds');
    ui.roundName = $id('dictRoundName');
    ui.idx = $id('dictIdx');
    ui.total = $id('dictTotal');
    ui.noteBtn = $id('modeNote');
    ui.typeBtn = $id('modeType');
    ui.listen = $id('listenNormal');
    ui.listenSlow = $id('listenSlow');
    ui.noteMode = $id('dictNoteMode');
    ui.typeMode = $id('dictTypeMode');
    ui.showBtn = $id('dictShowAnswer');
    ui.answerBox = $id('dictAnswerBox');
    ui.paper = $id('dictPaper');
    ui.tip = $id('dictTip');
    ui.gradeRow = $id('dictGradeRow');
    ui.markRight = $id('dictMarkRight');
    ui.markWrong = $id('dictMarkWrong');
    ui.input = $id('dictInput');
    ui.checkBtn = $id('dictCheck');
    ui.result = $id('dictCheckResult');
    ui.banner = $id('dictBanner');
    ui.bannerText = $id('dictBannerText');
    ui.prev = $id('dictPrev');
    ui.next = $id('dictNext');
    ui.review = $id('dictReviewBtn');
    ui.report = $id('dictReportBtn');
    ui.reviewBanner = $id('dictReviewBanner');
    ui.reviewExit = $id('dictReviewExit');
    ui.state = $id('dictState');
  }

  /* ---------- 그리기 ---------- */
  function paperHtml(text, typed) {
    const exp = [...String(text || '')];
    const t = typed == null ? null : [...norm(typed)];
    return exp.map((ch, i) => {
      if (ch === ' ') return '<span class="dcell space" aria-hidden="true"></span>';
      let cls = 'dcell';
      if (t && t[i] !== ch) cls += ' bad';
      return `<span class="${cls}">${esc(ch)}</span>`;
    }).join('');
  }

  function renderRounds() {
    if (!ui.roundList) return;
    ui.roundList.innerHTML = '';
    ROUNDS.forEach((r) => {
      const rec = roundRec(r.key);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dict-round' + (r.key === curKey ? ' on' : '') + (r.practice ? ' practice' : '');
      b.dataset.round = r.key;
      b.innerHTML = `<span class="dr-name">${esc(r.label)}</span><span class="dr-count">${rec.solved}/${r.items.length}</span>`;
      b.addEventListener('click', () => { chooseRound(r.key); });
      ui.roundList.appendChild(b);
    });
  }

  function renderModeButtons() {
    if (ui.noteBtn) {
      ui.noteBtn.classList.toggle('on', mode === 'note');
      ui.noteBtn.setAttribute('aria-selected', mode === 'note' ? 'true' : 'false');
    }
    if (ui.typeBtn) {
      ui.typeBtn.classList.toggle('on', mode === 'type');
      ui.typeBtn.setAttribute('aria-selected', mode === 'type' ? 'true' : 'false');
    }
    if (ui.noteMode) ui.noteMode.hidden = mode !== 'note';
    if (ui.typeMode) ui.typeMode.hidden = mode !== 'type';
  }

  function renderListen() {
    if (ui.listen) {
      ui.listen.textContent = listenMode === 'normal' ? '⏹ 멈추기' : '🔊 보통 속도로 듣기';
      ui.listen.classList.toggle('on', listenMode === 'normal');
    }
    if (ui.listenSlow) {
      ui.listenSlow.textContent = listenMode === 'slow' ? '⏹ 멈추기' : '🐢 천천히 듣기';
      ui.listenSlow.classList.toggle('on', listenMode === 'slow');
    }
  }

  function renderItem() {
    const round = curRound();
    const item = curItem();
    const key = curKey + ':' + idx;
    const done = results[key];

    if (ui.roundName) ui.roundName.textContent = round.label;
    if (ui.roundBtn) {
      const em = ui.roundBtn.querySelector('.dict-round-emoji');
      if (em) em.textContent = round.practice ? '⭐' : '✏️';
    }
    if (ui.idx) ui.idx.textContent = String(idx + 1);
    if (ui.total) ui.total.textContent = String(round.items.length);
    renderModeButtons();
    renderListen();
    stopSpeak(true);

    if (ui.reviewBanner) ui.reviewBanner.hidden = !reviewMode;
    if (ui.state) {
      ui.state.textContent = done
        ? (done.good ? '이 문장은 맞혔어요! 한 번 더 해 봐도 좋아요 🍊' : '틀린 문장이에요. 다시 듣고 또 해 봐요 🌸')
        : '잘 듣고 써 보세요!';
    }

    // 공책 모드
    answerShown = false;
    if (ui.answerBox) ui.answerBox.hidden = true;
    if (ui.paper) ui.paper.innerHTML = paperHtml(item.text);
    if (ui.tip) ui.tip.textContent = '';
    if (ui.gradeRow) ui.gradeRow.hidden = true;
    if (ui.showBtn) {
      ui.showBtn.hidden = false;
      ui.showBtn.textContent = '정답 보기 👀';
    }

    // 타자 모드
    if (ui.input) { ui.input.value = ''; ui.input.disabled = false; }
    if (ui.checkBtn) { ui.checkBtn.disabled = false; ui.checkBtn.hidden = false; }
    if (ui.result) { ui.result.hidden = true; ui.result.innerHTML = ''; }

    renderNav();
    renderBanner();
  }
  function renderNav() {
    if (ui.prev) ui.prev.disabled = idx === 0 && !reviewMode;
    if (ui.next) {
      const last = idx >= curRound().items.length - 1;
      ui.next.textContent = last ? '이 회 마치기 🎉' : '다음 문장 ▶';
    }
  }

  function renderBanner() {
    const round = curRound();
    const all = round.items.every((_, i) => results[curKey + ':' + i]);
    if (!ui.banner) return;
    ui.banner.hidden = !all;
    if (all && ui.bannerText) {
      const rec = roundRec(curRound().key);
      ui.bannerText.textContent = `${pickOne(window.DICT_PRAISE || ['10문장 완성! 🎉'])} (${rec.solved}문장 중 ${rec.correct}개 정답)`;
    }
  }

  function mineHtml(typed, answer) {
    const t = [...norm(typed)];
    const a = [...norm(answer)];
    return t.map((ch, i) => (a[i] === ch ? esc(ch) : `<u class="bad">${esc(ch)}</u>`)).join('');
  }

  function showResult(good, typed, restore) {
    const item = curItem();
    const note = restore
      ? '아까 채점한 문장이에요. 다시 해 보고 싶으면 또 해 봐도 좋아요.'
      : (good ? '감 1개를 모았어요 🍊' : '팁을 읽고 다시 들어 보면 금방 좋아져요 🌸');

    if (mode === 'type') {
      if (ui.showBtn) ui.showBtn.hidden = true;
      if (ui.gradeRow) ui.gradeRow.hidden = true;
      if (ui.answerBox) ui.answerBox.hidden = true;
      if (ui.input) ui.input.disabled = true;
      if (ui.checkBtn) ui.checkBtn.hidden = true;
      if (ui.result) {
        const t = typed || '';
        ui.result.hidden = false;
        ui.result.innerHTML = `
          <p class="dict-rlabel">${good ? '⭕ 맞았어요! 이렇게 썼어요' : '❌ 이렇게 써야 해요'}</p>
          <div class="dict-paper">${paperHtml(item.text, t)}</div>
          ${t ? `<p class="dict-mine"><span>내가 쓴 문장</span><b>${mineHtml(t, item.text)}</b></p>` : ''}
          <p class="dict-tip"><b>${good ? '팁' : '이 부분을 봐요'}</b> ${esc(item.tip || '')}</p>
          <p class="dict-note">${note}</p>`;
      }
      return;
    }

    /* ✍️ 공책에 쓰기 */
    if (ui.showBtn) ui.showBtn.hidden = true;
    if (ui.gradeRow) ui.gradeRow.hidden = true;
    if (ui.answerBox) ui.answerBox.hidden = false;
    if (ui.paper) ui.paper.innerHTML = paperHtml(item.text);
    if (ui.tip) {
      ui.tip.innerHTML = `<b>${good ? '⭕ 맞았어요!' : '❌ 다시 연습해 볼까요?'}</b> ${esc(item.tip || '')}`;
    }
    if (ui.result) {
      ui.result.hidden = false;
      ui.result.innerHTML = `<p class="dict-note">${note}</p>`;
    }
    if (ui.input) ui.input.disabled = true;
    if (ui.checkBtn) ui.checkBtn.hidden = true;
  }

  /* ---------- 소리 (내장 MP3 · 보통 1.0 / 천천히 0.72) ---------- */
  const MP3_RATE = { normal: 1.0, slow: 0.72 };

  function audioSrc(key, i) {
    return `audio/dict/${key}-${i + 1}.mp3`;
  }

  function pushLog(rec) {
    audioLog.push(Object.assign({ at: Date.now() }, rec));
    if (audioLog.length > 40) audioLog.shift();
    window.__dictSpeech = window.__dictSpeech || [];
    window.__dictSpeech.push(rec);
    if (window.__dictSpeech.length > 40) window.__dictSpeech.shift();
  }

  function resetListen() {
    listenMode = '';
    renderListen();
  }

  function stopSpeak(silent) {
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
    return silent;
  }

  function applyRate(a, slow) {
    const rate = slow ? MP3_RATE.slow : MP3_RATE.normal;
    try {
      a.defaultPlaybackRate = rate;
      a.playbackRate = rate;
      a.preservesPitch = true;          /* 천천히 들어도 목소리 높낮이는 그대로 */
      a.webkitPreservesPitch = true;
    } catch (e) { /* 무시 */ }
  }

  /* MP3가 정말 재생되지 않을 때만 쓰는 예전 방식 */
  function speakFallback(slow, want, text, reason) {
    const synth = window.speechSynthesis;
    const U = window.SpeechSynthesisUtterance;
    if (!synth || typeof U !== 'function') {
      if (window.showToast) showToast('🔊', '이 브라우저에서는 듣기를 쓸 수 없어요', '', 2600);
      return false;
    }
    try {
      const u = new U(text);
      u.lang = 'ko-KR';
      u.rate = slow ? 0.6 : 0.95;
      u.pitch = 1.05;
      try {
        const vs = synth.getVoices() || [];
        const ko = vs.find((v) => /^ko([-_]|$)/i.test(v.lang || ''));
        if (ko) u.voice = ko;
      } catch (e) { /* 목소리 목록은 없어도 괜찮아요 */ }
      u.onend = () => { if (listenMode === want) resetListen(); };
      u.onerror = () => { if (listenMode === want) resetListen(); };
      utter = u;
      listenMode = want;
      renderListen();
      pushLog({ kind: 'tts', text, lang: 'ko-KR', rate: u.rate, reason: reason || '' });
      synth.speak(u);
      if (window.playSound) playSound('tap');
      return true;
    } catch (e) {
      resetListen();
      return false;
    }
  }

  function speakMp3(slow, want, text) {
    const src = audioSrc(curKey, idx);
    let a;
    try { a = new Audio(src); } catch (e) { return speakFallback(slow, want, text, 'no-audio'); }
    a.preload = 'auto';
    applyRate(a, slow);
    /* iOS Safari는 재생이 시작될 때 재생 속도를 1.0으로 되돌리는 경우가 있어 한 번 더 잡아 줌 */
    a.onloadedmetadata = () => applyRate(a, slow);
    a.onplaying = () => applyRate(a, slow);
    a.onended = () => { if (listenMode === want) { audioEl = null; resetListen(); } };
    a.onerror = () => {
      if (listenMode !== want) return;
      audioEl = null;
      resetListen();
      speakFallback(slow, want, text, 'mp3-error');
    };
    audioEl = a;
    listenMode = want;
    renderListen();
    pushLog({ kind: 'mp3', src, text, rate: slow ? MP3_RATE.slow : MP3_RATE.normal, playbackRate: a.playbackRate });
    let p = null;
    try { p = a.play(); } catch (e) { p = null; }
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        if (listenMode !== want) return;
        audioEl = null;
        resetListen();
        speakFallback(slow, want, text, 'play-rejected');
      });
    }
    if (window.playSound) playSound('tap');
    return true;
  }

  function speak(slow) {
    const want = slow ? 'slow' : 'normal';
    const samePlaying = listenMode === want;
    stopSpeak(true);
    if (samePlaying) { renderListen(); return false; }
    return speakMp3(slow, want, curItem().text);
  }

  /* ---------- 채점 ---------- */
  function addWrong(item) {
    const d = D();
    const id = itemId(curKey, idx);
    const found = d.wrong.find((w) => w.id === id);
    if (found) {
      found.misses = (Number(found.misses) || 1) + 1;
      found.at = Date.now();
    } else {
      d.wrong.push({
        id,
        key: curKey,
        text: item.text,
        tip: item.tip || '',
        round: curRound().label,
        misses: 1,
        at: Date.now()
      });
      if (d.wrong.length > 60) d.wrong.shift();
    }
    saveState();
    renderReviewBtn();
  }

  function removeWrong() {
    const d = D();
    const id = itemId(curKey, idx);
    const i = d.wrong.findIndex((w) => w.id === id);
    if (i >= 0) { d.wrong.splice(i, 1); saveState(); renderReviewBtn(); return true; }
    return false;
  }

  function grade(good, typed) {
    const key = curKey + ':' + idx;
    const item = curItem();
    const first = !results[key];
    results[key] = { good: !!good, typed: typed || '' };

    if (first) {
      D();
      state.today.solved += 1;
      state.total.solved += 1;
      state.subj.dict.solved += 1;
      const rec = roundRec(curKey);
      rec.solved += 1;
      if (good) {
        state.today.correct += 1;
        state.total.correct += 1;
        state.subj.dict.correct += 1;
        rec.correct += 1;
      } else {
        state.today.wrong += 1;
        state.total.wrong += 1;
      }
    }

    if (good) {
      removeWrong();
      if (!rewarded[key]) {
        rewarded[key] = true;
        addOrange(1);
        if (window.playSound) playSound('correct');
        if (window.burst) burst(12, false);
      }
    } else {
      addWrong(item);
      if (window.playSound) playSound('wrong');
    }

    if (first && window.checkMission) checkMission();
    saveState();
    if (window.renderStatus) renderStatus();
    renderRounds();
    showResult(!!good, typed || '', false);
    renderNav();
    renderBanner();
    if (window.showToast && good) {
      showToast('🍊', '받아쓰기 정답! 감 1개를 모았어요', 'mint', 1800);
    }
  }

  function checkType() {
    const typed = norm(ui.input ? ui.input.value : '');
    const item = curItem();
    const answer = norm(item.text);
    if (!typed) {
      if (window.showToast) showToast('⌨️', '먼저 문장을 써 보세요', '', 1800);
      if (ui.input) ui.input.focus();
      return false;
    }
    const exact = typed === answer;
    const flexible = !exact && stripEnd(typed) === stripEnd(answer);
    if (exact) {
      grade(true, typed);
      return true;
    }
    if (flexible) {
      grade(true, typed);
      if (ui.tip) {
        ui.tip.innerHTML = `<b>⭕ 맞았어요!</b> 문장 끝에 <b>${esc((answer.match(/[.?!]+$/) || [''])[0] || '마침표')}</b>를 찍는 것도 잊지 마세요! ${esc(item.tip || '')}`;
      }
      return true;
    }
    grade(false, typed);
    return false;
  }

  /* ---------- 모드/회차 이동 ---------- */
  function setMode(m) {
    mode = m === 'type' ? 'type' : 'note';
    stopSpeak(true);
    renderItem();
    if (mode === 'type' && ui.input) ui.input.focus();
  }

  function chooseRound(key) {
    stopSpeak(true);
    curKey = key;
    idx = 0;
    reviewMode = false;
    reviewQueue = [];
    D().lastRound = key;
    saveState();
    renderRounds();
    renderItem();
    if (ui.roundList) ui.roundList.classList.remove('open');
    if (ui.roundBtn) ui.roundBtn.setAttribute('aria-expanded', 'false');
  }

  function go(delta) {
    stopSpeak(true);
    const total = curRound().items.length;
    const next = idx + delta;
    if (next < 0) return;
    if (next >= total) {
      // 마지막 문장 다음 → 회 마치기
      if (window.playSound) playSound('level');
      if (window.burst) burst(36, true);
      renderBanner();
      if (ui.banner && !ui.banner.hidden) {
        ui.banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (window.showToast) {
        showToast('🌸', '한 문장씩 다 채점하면 축하 배너가 떠요!', '', 2400);
      }
      return;
    }
    if (reviewMode && delta > 0) {
      // 복습: 큐에서 다음 문장
      if (!nextReviewItem()) return;
      return;
    }
    idx = next;
    renderItem();
  }

  /* ---------- 오답 복습 ---------- */
  function renderReviewBtn() {
    if (!ui.review) return;
    const n = D().wrong.length;
    ui.review.disabled = n === 0;
    ui.review.classList.toggle('off', n === 0);
    ui.review.textContent = `🌸 틀린 문장 복습 (${n})`;
    ui.review.title = n ? '틀린 받아쓰기 문장만 다시 해 봐요' : '틀린 문장이 없어요!';
  }

  function startReview() {
    const d = D();
    if (!d.wrong.length) {
      if (window.showToast) showToast('🌸', '틀린 문장이 없어요! 최고예요', '', 2600);
      return;
    }
    reviewMode = true;
    reviewQueue = d.wrong.map((w) => ({ key: w.key, i: 0, id: w.id, data: w }));
    // 각 오답의 문장 위치 찾기
    reviewQueue = reviewQueue.map((q) => {
      const round = roundOf(q.key);
      const i = round.items.findIndex((it, k) => itemId(q.key, k) === q.data.id);
      return { key: q.key, idx: Math.max(0, i), data: q.data };
    }).filter((q) => !!q.data);
    if (!reviewQueue.length) { reviewMode = false; return; }
    nextReviewItem(true);
    if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextReviewItem(first) {
    if (!reviewQueue.length) {
      reviewMode = false;
      if (ui.reviewBanner) ui.reviewBanner.hidden = true;
      if (window.showToast) showToast('🌸', '틀린 문장을 모두 다시 해 봤어요! 최고예요', 'mint', 3200);
      if (window.burst) burst(24, false);
      renderItem();
      return false;
    }
    const q = reviewQueue.shift();
    curKey = q.key;
    idx = q.idx;
    renderRounds();
    renderItem();
    if (ui.reviewBanner) ui.reviewBanner.hidden = false;
    return true;
  }

  function endReview() {
    reviewMode = false;
    reviewQueue = [];
    if (ui.reviewBanner) ui.reviewBanner.hidden = true;
    renderItem();
  }

  /* ---------- 이벤트 ---------- */
  function bind() {
    if (ui.roundBtn) {
      ui.roundBtn.addEventListener('click', () => {
        const open = ui.roundList.classList.toggle('open');
        ui.roundBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (window.playSound) playSound('tap');
      });
    }
    if (ui.noteBtn) ui.noteBtn.addEventListener('click', () => { setMode('note'); if (window.playSound) playSound('tap'); });
    if (ui.typeBtn) ui.typeBtn.addEventListener('click', () => { setMode('type'); if (window.playSound) playSound('tap'); });
    if (ui.listen) ui.listen.addEventListener('click', () => speak(false));
    if (ui.listenSlow) ui.listenSlow.addEventListener('click', () => speak(true));
    if (ui.showBtn) {
      ui.showBtn.addEventListener('click', () => {
        answerShown = true;
        if (ui.answerBox) ui.answerBox.hidden = false;
        if (ui.paper) ui.paper.innerHTML = paperHtml(curItem().text);
        if (ui.tip) ui.tip.innerHTML = `<b>이렇게 써요</b> ${esc(curItem().tip || '')}`;
        if (ui.gradeRow) ui.gradeRow.hidden = false;
        if (ui.showBtn) ui.showBtn.hidden = true;
        if (window.playSound) playSound('tap');
      });
    }
    if (ui.markRight) ui.markRight.addEventListener('click', () => grade(true, ''));
    if (ui.markWrong) ui.markWrong.addEventListener('click', () => grade(false, ''));
    if (ui.checkBtn) ui.checkBtn.addEventListener('click', checkType);
    if (ui.input) {
      ui.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); checkType(); }
      });
    }
    if (ui.prev) ui.prev.addEventListener('click', () => { if (window.playSound) playSound('tap'); go(-1); });
    if (ui.next) ui.next.addEventListener('click', () => { if (window.playSound) playSound('tap'); go(1); });
    if (ui.review) ui.review.addEventListener('click', startReview);
    if (ui.reviewExit) ui.reviewExit.addEventListener('click', endReview);
    if (ui.report) ui.report.addEventListener('click', () => { if (window.openReport) openReport(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopSpeak(true); });
  }

  /* ---------- 리포트용 ---------- */
  function reportRows() {
    return ROUNDS.map((r) => {
      const rec = roundRec(r.key);
      const p = rec.solved ? Math.round((rec.correct / rec.solved) * 100) : 0;
      return `<div class="rep-cat" data-round="${r.key}">
        <div class="rep-cat-head"><span>${r.practice ? '⭐' : '✏️'} ${esc(r.label.replace(/^⭐ /, ''))}</span><b>${rec.solved ? p + '%' : '–'}</b></div>
        <div class="rep-bar"><i style="width:${rec.solved ? Math.max(p, 5) : 0}%"></i></div>
        <p class="rep-cat-foot">${rec.solved ? `${rec.solved}문장 중 ${rec.correct}개 정답` : '아직 안 했어요'}</p>
      </div>`;
    }).join('');
  }

  function summary() {
    ensure();
    const s = state.subj.dict;
    const p = s.solved ? Math.round((s.correct / s.solved) * 100) : 0;
    return { solved: s.solved, correct: s.correct, rate: p };
  }

  /* ---------- 시작 ---------- */
  function init() {
    grab();
    if (!ui.pane) return;
    ensure();
    curKey = state.dict.lastRound;
    idx = 0;
    bind();
    renderRounds();
    renderItem();
    renderReviewBtn();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* ---------- 리포트/테스트에서 쓰는 공개 도구 ---------- */
  window.harangDict = {
    get rounds() { return ROUNDS.map((r) => ({ key: r.key, label: r.label, count: r.items.length })); },
    summary,
    reportRows,
    open: () => { if (window.openReport) openReport(); },
    stop: () => stopSpeak(true),
    refresh: () => { renderRounds(); renderReviewBtn(); renderItem(); }
  };

  if (window.__harang) {
    window.__harang.dict = {
      rounds: () => ROUNDS.map((r) => ({ key: r.key, label: r.label, count: r.items.length, texts: r.items.map((i) => i.text) })),
      select: (key) => { chooseRound(key); return curKey; },
      get item() { return { round: curKey, idx, total: curRound().items.length, text: curItem().text, tip: curItem().tip, mode, reviewMode }; },
      setMode: (m) => { setMode(m); return mode; },
      showAnswer: () => { if (ui.showBtn) ui.showBtn.click(); return answerShown; },
      mark: (good) => { grade(!!good, ''); return results[curKey + ':' + idx]; },
      type: (text) => { if (ui.input) ui.input.value = text; return checkType(); },
      listen: (slow) => speak(!!slow),
      get listening() { return listenMode; },
      get audio() { return audioLog.slice(-5); },
      audioSrc: (key, i) => audioSrc(key == null ? curKey : key, i == null ? idx : i),
      next: () => { go(1); return { idx, round: curKey }; },
      prev: () => { go(-1); return { idx, round: curKey }; },
      get result() { return results[curKey + ':' + idx] || null; },
      get stats() { ensure(); return JSON.parse(JSON.stringify({ subj: state.subj, dict: state.dict })); },
      review: () => { startReview(); return { reviewMode, queue: reviewQueue.length }; },
      endReview: () => { endReview(); return reviewMode; },
      stop: () => { stopSpeak(true); return listenMode; },
      get speech() { return (window.__dictSpeech || []).slice(-3); },
      get playback() { return audioEl ? { src: audioEl.currentSrc || audioEl.src, rate: audioEl.playbackRate, paused: audioEl.paused } : null; }
    };
  }
})();
