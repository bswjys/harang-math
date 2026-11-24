/* ===== 공부하랑핑 💖 — 김하랑 1학년 수학 ===== */
'use strict';

/* ---------- 작은 도구들 ---------- */
const $ = (id) => document.getElementById(id);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function numberChoices(correct, spread = 3, count = 4, min = 0) {
  const set = new Set([String(correct)]);
  let guard = 0;
  while (set.size < count && guard++ < 200) {
    const v = correct + randInt(-spread, spread);
    if (v >= min && v !== correct) set.add(String(v));
  }
  let fill = correct + 1;
  while (set.size < count) { set.add(String(fill++)); }
  return shuffle([...set]);
}

/* ---------- 칭호 ---------- */
const LEVELS = [
  { at: 0,   emoji: '🌱', name: '새싹 하랑핑' },
  { at: 10,  emoji: '✨', name: '반짝 하랑핑' },
  { at: 20,  emoji: '💗', name: '하트 하랑핑' },
  { at: 30,  emoji: '⭐', name: '별빛 하랑핑' },
  { at: 40,  emoji: '🌈', name: '무지개 하랑핑' },
  { at: 50,  emoji: '👑', name: '공주 하랑핑' },
  { at: 60,  emoji: '🪄', name: '마법 하랑핑' },
  { at: 70,  emoji: '💎', name: '보석 하랑핑' },
  { at: 80,  emoji: '🌙', name: '달빛 하랑핑' },
  { at: 90,  emoji: '👸', name: '왕관 하랑핑' },
  { at: 100, emoji: '🧚', name: '소원요정 하랑핑' }
];

const PRAISES = [
  '김하랑 천재다! 🎉',
  '우와 하랑핑 최고야! 💖',
  '역시 우리 하랑이! ✨',
  '하랑이가 또 해냈어! 🌟',
  '와! 정답이야 김하랑! 🥳',
  '하랑핑 반짝반짝 빛난다! ✨'
];
const ENCOURAGES = [
  '괜찮아 하랑아! 다음엔 꼭 맞힐 수 있어 💪',
  '하랑핑 힘내라! 해설 한번 보고 다시 가보자 🌸',
  '틀려도 괜찮아! 하랑이는 계속 똑똑해지고 있어 💗',
  '조금만 더 힘내자 하랑아! 해설을 보면 금방 알 수 있어 ✨'
];
const EMOJIS = ['🌸', '⭐', '💖', '🍓', '🌈', '🐰', '🍊', '🦋', '🍭'];
const WISH_SUGGESTIONS = [
  '아이스크림 사주세요 🍦',
  '놀이터에서 실컷 놀고 싶어요 🎠',
  '공주 드레스 사주세요 👗',
  '동물원에 가고 싶어요 🦁',
  '하루 늦게 자도 되게 해주세요 🌙',
  '엄마 아빠랑 영화 보고 싶어요 🎬'
];

/* ---------- 저장 ---------- */
const STORE_KEY = 'harang-math-v1';

function todayKey() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function defaultState() {
  return {
    v: 1,
    orange: 0,
    totalOrange: 0,
    journey: 1,
    sound: true,
    wishes: [],
    today: { date: todayKey(), solved: 0, correct: 0, wrong: 0 },
    total: { solved: 0, correct: 0, wrong: 0 },
    combo: 0,
    bestCombo: 0,
    seenLevel: 0
  };
}

function loadState() {
  let s = defaultState();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      s = Object.assign(s, saved);
      s.today = Object.assign({ date: todayKey(), solved: 0, correct: 0, wrong: 0 }, saved.today || {});
      s.total = Object.assign({ solved: 0, correct: 0, wrong: 0 }, saved.total || {});
      if (!Array.isArray(s.wishes)) s.wishes = [];
    }
  } catch (e) { /* 저장값이 깨져도 앱은 열려야 함 */ }
  if (s.today.date !== todayKey()) {
    s.today = { date: todayKey(), solved: 0, correct: 0, wrong: 0 };
  }
  s.orange = Math.max(0, Math.min(100, Number(s.orange) || 0));
  s.journey = Math.max(1, Number(s.journey) || 1);
  return s;
}

let state = loadState();

function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
}

const levelFor = (orange) => LEVELS.reduce((acc, lv) => (orange >= lv.at ? lv : acc), LEVELS[0]);

/* ---------- 소리 (Web Audio) ---------- */
let actx = null;
function audio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
  }
  if (actx.state === 'suspended') actx.resume().catch(() => {});
  return actx;
}

function note(freq, at, dur, gain = 0.11, type = 'sine') {
  const ctx = audio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + at;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function playSound(name) {
  if (!state.sound) return;
  try {
    if (name === 'correct') {
      note(784, 0, 0.16);
      note(988, 0.08, 0.18);
      note(1319, 0.16, 0.26);
    } else if (name === 'wrong') {
      note(392, 0, 0.18, 0.09, 'triangle');
      note(311, 0.12, 0.26, 0.08, 'triangle');
    } else if (name === 'level') {
      [659, 784, 988, 1319].forEach((f, i) => note(f, i * 0.09, 0.22, 0.095, 'triangle'));
    } else if (name === 'wish') {
      [523, 659, 784, 1047, 1319].forEach((f, i) => note(f, i * 0.1, 0.3, 0.1));
    } else if (name === 'tap') {
      note(880, 0, 0.06, 0.05, 'sine');
    }
  } catch (e) { /* 소리는 실패해도 괜찮아요 */ }
}

/* ---------- 반짝이 효과 ---------- */
const fxCanvas = $('fx');
const fxCtx = fxCanvas.getContext('2d');
let particles = [];
let fxRunning = false;

function sizeFx() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  fxCanvas.width = Math.floor(window.innerWidth * dpr);
  fxCanvas.height = Math.floor(window.innerHeight * dpr);
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
sizeFx();
window.addEventListener('resize', sizeFx);

function burst(count = 46, fromTop = true) {
  const emojis = ['💖', '✨', '⭐', '🌸', '🍊', '🎉', '💗', '🫧'];
  const w = window.innerWidth;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: fromTop ? w * (0.15 + Math.random() * 0.7) : w / 2,
      y: fromTop ? -20 - Math.random() * 120 : window.innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 2.6,
      vy: fromTop ? 1.6 + Math.random() * 2.6 : -3 - Math.random() * 3,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.18,
      size: 14 + Math.random() * 16,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      life: 1
    });
  }
  if (!fxRunning) { fxRunning = true; requestAnimationFrame(fxLoop); }
}

function fxLoop() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  fxCtx.clearRect(0, 0, w, h);
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += fromGravity(p);
    p.rot += p.vr;
    if (p.y > h * 0.55) p.life -= 0.03;
    fxCtx.save();
    fxCtx.globalAlpha = Math.max(0, p.life);
    fxCtx.translate(p.x, p.y);
    fxCtx.rotate(p.rot);
    fxCtx.font = `${p.size}px serif`;
    fxCtx.textAlign = 'center';
    fxCtx.fillText(p.emoji, 0, 0);
    fxCtx.restore();
  });
  particles = particles.filter((p) => p.life > 0 && p.y < h + 60);
  if (particles.length) {
    requestAnimationFrame(fxLoop);
  } else {
    fxRunning = false;
    fxCtx.clearRect(0, 0, w, h);
  }
}
function fromGravity(p) { return p.vy > 0 ? 0.035 : 0.09; }

/* ---------- 문제 만들기 ---------- */
const NF = (n) => `<span class="num">${n}</span>`;
const OP = (o) => `<span class="op">${o}</span>`;
const BLANK = (t = '?') => `<span class="blank">${t}</span>`;
const eqLine = (inner, small = false) => `<div class="q-line${small ? ' small' : ''}">${inner}</div>`;
const sentence = (inner) => `<p class="q-sentence">${inner}</p>`;

const candies = (n, emoji = '🍬') => Array.from({ length: n }, () => `<span class="e">${emoji}</span>`).join('');

function explainAdd(a, b) {
  const s = a + b;
  if (s <= 10) {
    return `${NF(a)}에서 ${b}번 더 세어 보면 <b>${s}</b>!<br>그래서 <span class="eq">${a} + ${b} = ${s}</span>`;
  }
  const need = 10 - a;
  return `${a}에 무엇을 더하면 10이 될까요? <b>${need}</b>!<br>${b}개를 ${need}개와 ${b - need}개로 나누어 보세요. 그래서 10 + ${b - need} = <b>${s}</b>! <span class="eq">${a} + ${b} = ${s}</span>`;
}

const GENS = [];
function gen(fn) { GENS.push(fn); return fn; }

/* 1) 한 자리 수 덧셈 */
gen(function genAdd1() {
  const a = randInt(4, 9);
  const b = randInt(2, 9);
  const sum = a + b;
  return {
    type: 'add1',
    tag: '더하기',
    stage: eqLine(`${NF(a)} ${OP('+')} ${NF(b)} ${OP('=')} ${BLANK()}`),
    options: numberChoices(sum, 3),
    answer: String(sum),
    explain: `${explainAdd(a, b)}`,
    hint: {
      label: '그림 힌트 보기 🍬',
      html: `<div class="hint-groups">
          <div class="hint-group">${candies(a)}</div>
          <div class="hint-group sub">${candies(b, '🍓')}</div>
        </div><p class="hint-note">🍬 ${a}개하고 🍓 ${b}개를 합쳐서 세어 보세요!</p>`
    }
  };
});

/* 2) 10이 되는 짝 */
gen(function genMake10() {
  const a = randInt(2, 8);
  const b = 10 - a;
  return {
    type: 'make10',
    tag: '10이 되는 짝',
    stage: eqLine(`${NF(a)} ${OP('+')} ${BLANK()} ${OP('=')} ${NF(10)}`),
    options: numberChoices(b, 2),
    answer: String(b),
    explain: `${a}에 <b>${b}</b>를 더하면 딱 10이 돼요.<br>그래서 <span class="eq">${a} + ${b} = 10</span>!`,
    hint: {
      label: '10칸 판 보기 🔟',
      html: `<div class="ten-frame">${Array.from({ length: 10 }, (_, i) =>
        `<i class="${i < a ? 'on' : ''}">${i < a ? '🍬' : ''}</i>`).join('')}</div>
        <p class="hint-note">10칸 중에 ${a}칸이 채워져 있어요. 빈 칸은 몇 칸일까요?</p>`
    }
  };
});

/* 3) 10에서 빼기 */
gen(function genSub10() {
  const b = randInt(2, 8);
  const ans = 10 - b;
  return {
    type: 'sub10',
    tag: '빼기',
    stage: eqLine(`${NF(10)} ${OP('-')} ${NF(b)} ${OP('=')} ${BLANK()}`),
    options: numberChoices(ans, 2),
    answer: String(ans),
    explain: `10에서 ${b}를 빼면 <b>${ans}</b>!<br>10은 ${ans}개와 ${b}개로 나뉘어요. 그래서 <span class="eq">10 - ${b} = ${ans}</span>`,
    hint: {
      label: '그림 힌트 보기 🍬',
      html: `<div class="hint-groups">
          <div class="hint-group">${candies(ans)}</div>
          <div class="hint-group dim">${candies(b)}</div>
        </div><p class="hint-note">사탕 10개 중에서 ${b}개를 빼면 몇 개가 남을까요?</p>`
    }
  };
});

/* 4) 두 자리 - 한 자리 (십의 자리에서 하나 풀어서) */
gen(function genSub2() {
  const a = randInt(11, 18);
  const b = randInt(2, 9);
  if (a - b < 2 || b <= a - 10) return genSub2();
  const ans = a - b;
  const toTen = a - 10;
  return {
    type: 'sub2',
    tag: '빼기',
    stage: eqLine(`${NF(a)} ${OP('-')} ${NF(b)} ${OP('=')} ${BLANK()}`),
    options: numberChoices(ans, 3, 4, 0),
    answer: String(ans),
    explain: `${a}에서 ${toTen}만큼 먼저 빼면 10이 돼요. ${b}에서 ${toTen}만큼을 빼고 <b>${b - toTen}개</b>가 남아요.<br>그래서 10 - ${b - toTen} = <b>${ans}</b>! <span class="eq">${a} - ${b} = ${ans}</span>`,
    hint: {
      label: '그림 힌트 보기 🍓',
      html: `<div class="hint-groups">
          <div class="hint-group">${candies(ans, '🍓')}</div>
          <div class="hint-group dim">${candies(b, '🍓')}</div>
        </div><p class="hint-note">🍓 ${a}개 중에서 ${b}개를 빼면 몇 개가 남을까요?</p>`
    }
  };
});

/* 5) 세 수의 계산 */
gen(function genThree() {
  const a = randInt(1, 6);
  const b = randInt(2, 7);
  const c = randInt(1, 6);
  const total = a + b + c;
  return {
    type: 'three',
    tag: '세 수의 계산',
    stage: eqLine(`${NF(a)} ${OP('+')} ${NF(b)} ${OP('+')} ${NF(c)} ${OP('=')} ${BLANK()}`, true),
    options: numberChoices(total, 3),
    answer: String(total),
    explain: `앞에서부터 차근차근! ${a} + ${b} = <b>${a + b}</b>, 그리고 ${a + b} + ${c} = <b>${total}</b>!<br><span class="eq">${a} + ${b} + ${c} = ${total}</span>`,
    hint: {
      label: '그림 힌트 보기 🍬',
      html: `<div class="hint-groups">
          <div class="hint-group">${candies(a)}</div>
          <div class="hint-group sub">${candies(b, '🍓')}</div>
          <div class="hint-group sub">${candies(c, '⭐')}</div>
        </div><p class="hint-note">🍬 ${a}개, 🍓 ${b}개, ⭐ ${c}개를 모두 세어 보세요!</p>`
    }
  };
});

/* 6) 빈칸 채우기 (더하기) */
gen(function genBlankAdd() {
  const a = randInt(2, 8);
  const b = randInt(1, 10 - a);
  const total = a + b;
  return {
    type: 'blankAdd',
    tag: '빈칸 채우기',
    stage: eqLine(`${BLANK('□')} ${OP('+')} ${NF(b)} ${OP('=')} ${NF(total)}`),
    options: numberChoices(a, 2),
    answer: String(a),
    explain: `${total}에서 ${b}만큼을 빼면 <b>${a}</b>! 넣어 보면 ${a} + ${b} = ${total}, 딱 맞아요!<br><span class="eq">□ = ${a}</span>`,
    hint: {
      label: '10칸 판 보기 🔟',
      html: `<div class="ten-frame">${Array.from({ length: 10 }, (_, i) => `<i class="${i < total ? 'on' : ''}">${i < total ? '🍬' : ''}</i>`).join('')}</div>
        <p class="hint-note">10칸 중에 ${total}칸이 채워져 있어요. 그중 ${b}칸을 빼면 몇 칸일까요?</p>`
    }
  };
});

/* 7) 빈칸 채우기 (빼기) */
gen(function genBlankSub() {
  const a = randInt(11, 18);
  const b = randInt(2, 9);
  if (a - b < 1) return genBlankSub();
  const left = a - b;
  return {
    type: 'blankSub',
    tag: '빈칸 채우기',
    stage: eqLine(`${NF(a)} ${OP('-')} ${BLANK('□')} ${OP('=')} ${NF(left)}`, true),
    options: numberChoices(b, 2),
    answer: String(b),
    explain: `${a}에서 몇을 빼야 ${left}개가 남을까요? ${a}에서 ${left}개를 빼면 <b>${b}개</b>!<br>${a} - ${b} = ${left}, 딱 맞아요! <span class="eq">□ = ${b}</span>`,
    hint: {
      label: '그림 힌트 보기 🍓',
      html: `<div class="hint-groups">
          <div class="hint-group">${candies(left, '🍓')}</div>
          <div class="hint-group dim">${candies(b, '🍓')}</div>
        </div><p class="hint-note">${a}개에서 몇 개를 빼면 ${left}개가 남을까요? 지워진 개수를 세어 보세요!</p>`
    }
  };
});

/* 8) 다음 수 */
gen(function genCountNext() {
  const n = randInt(11, 98);
  const ans = n + 1;
  return {
    type: 'countNext',
    tag: '100까지의 수',
    stage: `${sentence("‘<span class='hl'>" + n + "</span>’ 바로 다음에 오는 수는?")}
      <div class="pattern-row" style="margin-top:6px">
        <div class="pattern-tile">${n}</div>
        <div class="pattern-tile q">?</div>
      </div>`,
    options: numberChoices(ans, 2),
    answer: String(ans),
    explain: `${n}에서 하나 더 가면 <b>${ans}</b>!<br>수를 셀 때 ${n}, <b>${ans}</b>, ${ans + 1}처럼 이어서 세요.`,
    hint: null
  };
});

/* 9) 앞의 수 */
gen(function genCountBefore() {
  const n = randInt(21, 99);
  const ans = n - 1;
  return {
    type: 'countBefore',
    tag: '100까지의 수',
    stage: `${sentence("‘<span class='hl'>" + n + "</span>’ 바로 앞에 오는 수는?")}
      <div class="pattern-row" style="margin-top:6px">
        <div class="pattern-tile q">?</div>
        <div class="pattern-tile">${n}</div>
      </div>`,
    options: numberChoices(ans, 2),
    answer: String(ans),
    explain: `${n}보다 하나 작은 수는 <b>${ans}</b>!<br>${ans}, ${n}처럼 이어서 세면 돼요.`,
    hint: null
  };
});

/* 10) 수 이어 쓰기 */
gen(function genCountSeq() {
  const start = randInt(10, 88);
  const ans = start + 2;
  return {
    type: 'countSeq',
    tag: '100까지의 수',
    stage: `${sentence('수를 이어서 써 볼까요? 빈 곳에 알맞은 수는?')}
      <div class="pattern-row" style="margin-top:6px">
        <div class="pattern-tile">${start}</div>
        <div class="pattern-tile">${start + 1}</div>
        <div class="pattern-tile q">?</div>
        <div class="pattern-tile">${start + 3}</div>
        <div class="pattern-tile">${start + 4}</div>
      </div>`,
    options: numberChoices(ans, 2),
    answer: String(ans),
    explain: `${start}, ${start + 1}, <b>${ans}</b>, ${start + 3}… 하나씩 커져요.<br>그래서 빈 곳에 들어갈 수는 <b>${ans}</b>!`,
    hint: null
  };
});

/* 11) 10개씩 묶음과 낱개 */
gen(function genBundles() {
  const tens = randInt(2, 9);
  const ones = randInt(1, 9);
  const ans = tens * 10 + ones;
  const bundles = Array.from({ length: tens }, (_, i) =>
    `<div class="bundle"><div class="dots">${Array.from({ length: 10 }, () => '<i>🌸</i>').join('')}</div><div class="cap">10개</div></div>`).join('');
  const loose = Array.from({ length: ones }, () => '🍓').join(' ');
  return {
    type: 'bundles',
    tag: '10개씩 묶음',
    stage: `${sentence('10개씩 묶음 <span class="hl">' + tens + '묶음</span>과 낱개 <span class="hl">' + ones + '개</span>는 모두 몇 개일까요?')}
      <div class="bundle-grid" style="margin-top:4px">${bundles}</div>
      <div class="loose-grid">${loose}</div>`,
    options: numberChoices(ans, 4, 4, 1),
    answer: String(ans),
    explain: `10개씩 ${tens}묶음은 <b>${tens * 10}개</b>이고, 거기에 낱개 ${ones}개를 더하면 <b>${ans}개</b>!<br><span class="eq">${tens * 10} + ${ones} = ${ans}</span>`,
    hint: null
  };
});

/* 12) 크기 비교 */
gen(function genCompare() {
  let a = randInt(11, 99);
  let b = randInt(11, 99);
  if (Math.abs(a - b) < 3) return genCompare();
  const ans = a > b ? '>' : '<';
  const sym = a > b ? '&gt;' : '&lt;';
  return {
    type: 'compare',
    tag: '크기 비교',
    stage: `${sentence('○ 안에 들어갈 기호를 골라 주세요')}
      ${eqLine(`${NF(a)} <span class="blank" style="font-size:.75em">○</span> ${NF(b)}`, true)}`,
    options: ['>', '<', '='],
    answer: ans,
    explain: `${a}하고 ${b} 중에서 더 작은 수는 <b>${Math.min(a, b)}</b>!<br>작은 수 쪽으로 입이 벌어지게 쓰면 <span class="eq">${a} ${sym} ${b}</span>`,
    hint: null
  };
});

/* 13) 100 알기 */
gen(function genHundred() {
  return {
    type: 'hundred',
    tag: '100까지의 수',
    stage: `${sentence('10이 <span class="hl">10개</span> 모이면 얼마일까요?')}
      <div class="bundle-grid" style="margin-top:4px">${Array.from({ length: 10 }, () => '<div class="bundle"><div class="dots">' + Array.from({ length: 10 }, () => '<i>💗</i>').join('') + '</div><div class="cap">10</div></div>').join('')}</div>`,
    options: ['90', '100', '110', '20'],
    answer: '100',
    explain: `10이 10개 모이면 <b>100</b>이에요. 100은 10개씩 묶음이 10개인 큰 수예요! 🎉`,
    hint: null
  };
});

/* 14) 시계 보기 */
function clockSVG(h, m) {
  const cx = 100, cy = 100, r = 90;
  let ticks = '';
  let nums = '';
  for (let i = 1; i <= 12; i++) {
    const ang = (i * 30 - 90) * Math.PI / 180;
    const x1 = cx + Math.cos(ang) * (r - 4);
    const y1 = cy + Math.sin(ang) * (r - 4);
    const x2 = cx + Math.cos(ang) * (r - 11);
    const y2 = cy + Math.sin(ang) * (r - 11);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#ffc0dd" stroke-width="3" stroke-linecap="round"/>`;
    const tx = cx + Math.cos(ang) * (r - 26);
    const ty = cy + Math.sin(ang) * (r - 26);
    nums += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="800" fill="#9a7290" font-family="inherit">${i}</text>`;
  }
  const hourAng = ((h % 12) * 30 + m * 0.5 - 90) * Math.PI / 180;
  const minAng = (m * 6 - 90) * Math.PI / 180;
  const hx = cx + Math.cos(hourAng) * 44;
  const hy = cy + Math.sin(hourAng) * 44;
  const mx = cx + Math.cos(minAng) * 66;
  const my = cy + Math.sin(minAng) * 66;
  return `<div class="clock-wrap"><svg viewBox="0 0 200 200" role="img" aria-label="아날로그 시계">
    <defs><radialGradient id="faceG" cx="35%" cy="28%" r="80%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#fff1f9"/>
    </radialGradient></defs>
    <circle cx="100" cy="100" r="94" fill="#ffe3f2"/>
    <circle cx="100" cy="100" r="88" fill="url(#faceG)" stroke="#ffb2d7" stroke-width="4"/>
    ${ticks}${nums}
    <line x1="100" y1="100" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#a97bff" stroke-width="6" stroke-linecap="round"/>
    <line x1="100" y1="100" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#ef4b98" stroke-width="9" stroke-linecap="round"/>
    <circle cx="100" cy="100" r="7" fill="#ff6fb5" stroke="#fff" stroke-width="3"/>
  </svg></div>`;
}

gen(function genClock() {
  const h = randInt(1, 12);
  const m = Math.random() < 0.5 ? 0 : 30;
  const label = (hh, mm) => `${hh}시${mm === 30 ? ' 30분' : ''}`;
  const ans = label(h, m);
  const set = new Set([ans]);
  const cands = [label(h, m === 0 ? 30 : 0), label((h % 12) + 1, m), label(h === 1 ? 12 : h - 1, m), label((h % 12) + 1, m === 0 ? 30 : 0)];
  cands.forEach((c) => { if (set.size < 4) set.add(c); });
  let extra = 1;
  while (set.size < 4) { set.add(label(((h + extra) % 12) + 1, 0)); extra++; }
  return {
    type: 'clock',
    tag: '시계 보기',
    stage: `${sentence('시계를 보고 몇 시인지 맞혀 보세요!')}${clockSVG(h, m)}`,
    options: shuffle([...set]),
    answer: ans,
    explain: m === 0
      ? `긴바늘이 <b>12</b>를 가리키면 ‘몇 시’예요. 짧은바늘이 가리키는 숫자를 보면 <b>${h}시</b>!`
      : `긴바늘이 <b>6</b>을 가리키면 30분이에요. 짧은바늘이 ${h}시와 ${(h % 12) + 1}시 사이에 있으니까 <b>${h}시 30분</b>!`,
    hint: null
  };
});

/* 15) 규칙 찾기 */
gen(function genPattern() {
  const cycleLen = Math.random() < 0.55 ? 2 : 3;
  const cycle = shuffle(EMOJIS).slice(0, cycleLen);
  const seq = [];
  for (let i = 0; i < 5; i++) seq.push(cycle[i % cycleLen]);
  const ans = cycle[5 % cycleLen];
  const options = shuffle([...new Set([ans, ...cycle, ...shuffle(EMOJIS).slice(0, 4)])]).slice(0, 4);
  if (!options.includes(ans)) options[0] = ans;
  return {
    type: 'pattern',
    tag: '규칙 찾기',
    stage: `${sentence('무늬가 어떻게 되풀이되는지 보고, ?에 알맞은 것은?')}
      <div class="pattern-row">${seq.map((e) => `<div class="pattern-tile">${e}</div>`).join('')}
      <div class="pattern-tile q">?</div></div>`,
    options: shuffle(options),
    answer: ans,
    explain: `${cycle.join(' ')} 무늬가 <b>되풀이</b>되고 있어요. ${seq[4]} 다음에는 <b>${ans}</b>!`,
    hint: null
  };
});

/* 16) 여러 가지 모양 */
function shapeSVG(kind) {
  const stroke = '#ef4b98';
  const fill = 'url(#shapeG)';
  const defs = `<defs><linearGradient id="shapeG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffd6ec"/><stop offset="100%" stop-color="#ffa9d4"/></linearGradient></defs>`;
  let body = '';
  if (kind === '동그라미') body = `<circle cx="110" cy="110" r="82" fill="${fill}" stroke="${stroke}" stroke-width="7"/>`;
  if (kind === '세모') body = `<polygon points="110,26 194,190 26,190" fill="${fill}" stroke="${stroke}" stroke-width="7" stroke-linejoin="round"/>`;
  if (kind === '네모') body = `<rect x="30" y="30" width="160" height="160" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="7"/>`;
  return `<div class="shape-wrap"><svg viewBox="0 0 220 220" role="img" aria-label="${kind}">${defs}${body}</svg></div>`;
}

gen(function genShape() {
  const kind = pick(['동그라미', '세모', '네모']);
  return {
    type: 'shape',
    tag: '여러 가지 모양',
    stage: `${sentence('이 모양의 이름은 무엇일까요?')}${shapeSVG(kind)}`,
    options: shuffle(['동그라미', '세모', '네모']),
    answer: kind,
    explain: kind === '동그라미'
      ? '빙글빙글 둥글게 생긴 모양은 <b>동그라미</b>예요. 굴러가요! ⚪'
      : kind === '세모'
        ? '뾰족한 꼭짓점이 3개인 모양은 <b>세모</b>예요. 🔺'
        : '네모난 변이 4개이고 모두 똑같은 모양은 <b>네모</b>예요. 🟪',
    hint: null
  };
});

/* 문제 묶음 선택 */
const ARITH_GENS = ['add1', 'make10', 'sub10', 'sub2', 'three', 'blankAdd', 'blankSub'];
const NUM_GENS = ['countNext', 'countBefore', 'countSeq', 'bundles', 'compare', 'hundred'];
const CLOCK_GENS = ['clock'];
const SHAPE_GENS = ['pattern', 'shape'];

let lastType = '';
function makeQuestion() {
  for (let attempt = 0; attempt < 30; attempt++) {
    const r = Math.random();
    let ids;
    if (r < 0.55) ids = ARITH_GENS;
    else if (r < 0.80) ids = NUM_GENS;
    else if (r < 0.91) ids = CLOCK_GENS;
    else ids = SHAPE_GENS;
    const id = pick(ids);
    if (id === lastType && attempt < 10) continue;
    const g = GENS.find((fn) => fn().type === id);
    if (!g) continue;
    let q;
    try { q = g(); } catch (e) { continue; }
    if (q && q.type === id) { lastType = q.type; return q; }
  }
  lastType = 'add1';
  return GENS[0]();
}

/* ---------- 화면 그리기 ---------- */
let current = null;
let answered = false;
let rewarded = false;
let retried = false;
let firstAttempt = true;
let questionNo = 0;

const ui = {
  levelChip: $('levelChip'), levelEmoji: $('levelEmoji'), levelName: $('levelName'),
  orangeCount: $('orangeCount'), progressBar: $('progressBar'), progressOuter: $('progressOuter'),
  todayProgress: $('todayProgress'), comboChip: $('comboChip'),
  qTag: $('qTag'), qNum: $('qNum'), stage: $('questionStage'),
  answerGrid: $('answerGrid'), hintRow: $('hintRow'), hintBtn: $('hintBtn'), hintArea: $('hintArea'),
  feedback: $('feedback'), fbEmoji: $('fbEmoji'), fbTitle: $('fbTitle'), fbSub: $('fbSub'),
  fbExplain: $('fbExplain'), fbActions: $('fbActions'),
  soundBtn: $('soundBtn'), wishBoxBtn: $('wishBoxBtn'), wishBadge: $('wishBadge'),
  wishModal: $('wishModal'), couponModal: $('couponModal')
};

function renderStatus(bump = false) {
  const lv = levelFor(state.orange);
  ui.levelEmoji.textContent = lv.emoji;
  ui.levelName.textContent = lv.name;
  ui.orangeCount.textContent = String(state.orange);
  const pct = Math.max(0, Math.min(100, state.orange));
  ui.progressBar.style.width = pct + '%';
  ui.progressOuter.setAttribute('aria-valuenow', String(pct));

  const next = LEVELS.find((l) => l.at > state.orange);
  if (state.orange >= 100) {
    ui.todayProgress.textContent = `오늘 ${state.today.solved}문제 · 소원 쿠폰함을 확인해요 🎁`;
  } else {
    ui.todayProgress.textContent = `오늘 ${state.today.solved}문제 · 다음 칭호까지 ${next ? next.at - state.orange : 0}개`;
  }

  if (state.combo >= 2) {
    ui.comboChip.hidden = false;
    ui.comboChip.textContent = `🔥 콤보 ${state.combo}`;
  } else {
    ui.comboChip.hidden = true;
  }

  ui.soundBtn.textContent = state.sound ? '🔊' : '🔇';
  ui.soundBtn.classList.toggle('off', !state.sound);

  const pending = state.wishes.filter((w) => !w.fulfilledAt).length;
  if (pending > 0) {
    ui.wishBadge.hidden = false;
    ui.wishBadge.textContent = String(pending);
  } else {
    ui.wishBadge.hidden = true;
  }

  if (bump) {
    ui.orangeCount.parentElement.classList.remove('bump');
    void ui.orangeCount.parentElement.offsetWidth;
    ui.orangeCount.parentElement.classList.add('bump');
  }
}

function renderQuestion(q) {
  answered = false;
  rewarded = false;
  retried = false;
  firstAttempt = true;
  questionNo += 1;
  current = q;

  ui.qTag.textContent = q.tag;
  ui.qNum.textContent = `${questionNo}번째 문제`;
  ui.stage.innerHTML = q.stage;
  ui.feedback.hidden = true;

  ui.answerGrid.className = 'answers ' + (q.options.length === 3 ? 'three' : q.options.length === 4 ? 'four' : '');
  ui.answerGrid.innerHTML = '';
  q.options.forEach((opt) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'answer-btn';
    b.dataset.value = opt;
    b.textContent = opt;
    b.addEventListener('click', () => onAnswer(opt, b));
    ui.answerGrid.appendChild(b);
  });

  if (q.hint) {
    ui.hintRow.hidden = false;
    ui.hintBtn.textContent = q.hint.label || '그림 힌트 보기 🍬';
    ui.hintBtn.disabled = false;
    ui.hintArea.hidden = true;
    ui.hintArea.innerHTML = '';
  } else {
    ui.hintRow.hidden = true;
    ui.hintArea.hidden = true;
    ui.hintArea.innerHTML = '';
  }
}

function floatPlus() {
  const el = document.createElement('div');
  el.className = 'float-plus';
  el.textContent = '🍊 +1';
  const rect = ui.orangeCount.parentElement.getBoundingClientRect();
  el.style.left = (rect.left + rect.width / 2) + 'px';
  el.style.top = (rect.top + rect.height) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

function addOrange(amount) {
  const before = state.orange;
  state.orange = Math.min(100, state.orange + amount);
  state.totalOrange += Math.max(0, state.orange - before);
  floatPlus();
  const newLevel = levelFor(state.orange);
  const prevLevel = levelFor(before);
  if (newLevel.at > prevLevel.at) {
    state.seenLevel = newLevel.at;
    showLevelToast(newLevel);
    if (newLevel.at < 100) burst(24, true);
    playSound('level');
  }
  if (state.orange >= 100 && !currentJourneyWish()) {
    setTimeout(() => openWishModal(true), 900);
  }
  renderStatus(true);
  saveState();
}

function showLevelToast(lv) {
  const toast = $('levelToast');
  $('lvEmoji').textContent = lv.emoji;
  $('lvName').textContent = lv.name;
  toast.hidden = false;
  toast.style.animation = 'none';
  void toast.offsetWidth;
  toast.style.animation = '';
  clearTimeout(showLevelToast._t);
  showLevelToast._t = setTimeout(() => { toast.hidden = true; }, 3400);
}

function markButtons(answer) {
  [...ui.answerGrid.children].forEach((b) => {
    b.disabled = true;
    if (b.dataset.value === answer) b.classList.add('correct');
  });
}

function onAnswer(value, btn) {
  if (answered) return;
  answered = true;
  const correct = value === current.answer;
  const wasFirst = firstAttempt;
  firstAttempt = false;

  if (wasFirst) {
    state.today.solved += 1;
    state.total.solved += 1;
    if (correct) {
      state.today.correct += 1;
      state.total.correct += 1;
    } else {
      state.today.wrong += 1;
      state.total.wrong += 1;
    }
  }

  if (correct) {
    btn.classList.add('correct');
    markButtons(current.answer);
    if (wasFirst) {
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
    }
    if (!rewarded) {
      rewarded = true;
      showFeedback(true);
      playSound('correct');
      burst(12, false);
      addOrange(1);
    } else {
      showFeedback(true);
      playSound('correct');
    }
  } else {
    btn.classList.add('wrong');
    markButtons(current.answer);
    state.combo = 0;
    playSound('wrong');
    showFeedback(false);
  }
  renderStatus();
  saveState();
}

function showFeedback(good) {
  const fb = ui.feedback;
  fb.hidden = false;
  fb.className = 'feedback ' + (good ? 'good' : 'bad');

  if (good) {
    ui.fbEmoji.textContent = pick(['🎉', '💖', '🌟', '🥳', '✨']);
    ui.fbTitle.textContent = retried ? '다시 해내다니 정말 멋져, 김하랑! 💪' : pick(PRAISES);
    ui.fbSub.textContent = retried
      ? '포기하지 않고 맞혔어요! 감 1개를 모았어요 🍊'
      : '정답이에요! 감 1개를 모았어요 🍊';
  } else {
    ui.fbEmoji.textContent = pick(['🌸', '💗', '🫶', '🌈']);
    ui.fbTitle.textContent = pick(ENCOURAGES);
    ui.fbSub.textContent = '해설을 읽고 다시 한 번 도전해 봐요. 감은 하나도 안 깎였어요!';
  }

  ui.fbExplain.innerHTML = `<b>해설</b> · ${current.explain}`;
  ui.fbActions.innerHTML = '';

  if (good) {
    const next = document.createElement('button');
    next.className = 'btn btn-primary';
    next.type = 'button';
    next.textContent = '다음 문제 💖';
    next.addEventListener('click', () => {
      playSound('tap');
      renderQuestion(makeQuestion());
      renderStatus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    ui.fbActions.appendChild(next);
  } else {
    const retry = document.createElement('button');
    retry.className = 'btn btn-soft';
    retry.type = 'button';
    retry.textContent = '다시 풀어보기 💪';
    retry.addEventListener('click', () => {
      retried = true;
      answered = false;
      ui.feedback.hidden = true;
      [...ui.answerGrid.children].forEach((b) => {
        b.disabled = false;
        b.classList.remove('wrong', 'correct', 'dim');
      });
      playSound('tap');
      renderStatus();
    });

    const moveOn = document.createElement('button');
    moveOn.className = 'btn btn-primary';
    moveOn.type = 'button';
    moveOn.textContent = '알겠어요! 다음 문제 🌸';
    moveOn.addEventListener('click', () => {
      if (!rewarded) {
        rewarded = true;
        const fbSub = ui.fbSub;
        fbSub.textContent = '끝까지 해설을 본 것도 공부예요! 노력 감 1개를 드려요 🍊';
        addOrange(1);
      }
      playSound('tap');
      renderQuestion(makeQuestion());
      renderStatus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    ui.fbActions.appendChild(retry);
    ui.fbActions.appendChild(moveOn);
  }

  const r = fb.getBoundingClientRect();
  if (r.top > window.innerHeight * 0.55) {
    fb.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ---------- 소원 ---------- */
const wishInput = $('wishInput');
const wishChips = $('wishChips');
const wishForm = $('wishForm');
const wishSavedBox = $('wishSavedBox');

function currentJourneyWish() {
  return state.wishes.find((w) => w.journey === state.journey);
}

function buildWishChips() {
  wishChips.innerHTML = '';
  WISH_SUGGESTIONS.forEach((text) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'wish-chip';
    b.textContent = text;
    b.addEventListener('click', () => {
      wishInput.value = text;
      wishInput.focus();
      playSound('tap');
    });
    wishChips.appendChild(b);
  });
}

function openWishModal(auto = false) {
  const existing = currentJourneyWish();
  const closeBtn = $('wishCloseBtn');
  ui.wishModal.hidden = false;
  document.body.style.overflow = 'hidden';

  wishSavedBox.querySelectorAll('.start-journey').forEach((n) => n.remove());
  wishForm.hidden = true;
  wishSavedBox.hidden = true;
  closeBtn.hidden = false;
  closeBtn.textContent = '공부 계속하기 💖';

  const note = wishSavedBox.querySelector('.wish-saved-note');
  if (existing) {
    wishSavedBox.hidden = false;
    $('wishSavedText').textContent = existing.text;
    if (existing.fulfilledAt) {
      note.textContent = '엄마 아빠가 소원을 들어줬어요! 새로운 100개 도전을 시작해 볼까요? 🌱';
      showStartJourneyButton(wishSavedBox);
      closeBtn.textContent = '닫기 ✕';
    } else {
      note.textContent = '엄마 아빠에게 보여 주세요 💖 (소원 쿠폰함에 있어요)';
    }
  } else {
    wishForm.hidden = false;
    wishInput.value = '';
    buildWishChips();
    closeBtn.textContent = '조금 있다가 정할래요';
  }

  if (auto) {
    playSound('wish');
    burst(34, true);
    setTimeout(() => burst(26, true), 420);
  }
}

function showStartJourneyButton(container) {
  if (container.querySelector('.start-journey')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-gold big start-journey';
  btn.textContent = '새로운 100개 도전 시작 🌱';
  btn.style.marginTop = '12px';
  btn.style.width = '100%';
  btn.addEventListener('click', startNewJourney);
  container.appendChild(btn);
}

function saveWish() {
  const text = (wishInput.value || '').trim();
  if (!text) {
    wishInput.focus();
    wishInput.placeholder = '소원을 적어 주세요! 예) 아이스크림 사주세요 🍦';
    wishInput.classList.add('shake');
    setTimeout(() => wishInput.classList.remove('shake'), 500);
    return;
  }
  if (currentJourneyWish()) return;
  state.wishes.push({
    id: 'w' + Date.now(),
    journey: state.journey,
    text,
    createdAt: new Date().toISOString(),
    fulfilledAt: null
  });
  saveState();
  renderStatus();
  playSound('wish');
  burst(30, true);
  openWishModal(false);
}

function startNewJourney() {
  state.journey += 1;
  state.orange = 0;
  state.combo = 0;
  state.seenLevel = 0;
  saveState();
  renderStatus();
  closeModals();
  burst(40, true);
  playSound('level');
  showLevelToast(LEVELS[0]);
}

function closeModals() {
  ui.wishModal.hidden = true;
  ui.couponModal.hidden = true;
  document.body.style.overflow = '';
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  } catch (e) { return ''; }
}

function renderCoupons() {
  const list = $('couponList');
  const foot = $('couponFoot');
  list.innerHTML = '';
  foot.innerHTML = '';

  if (!state.wishes.length) {
    list.innerHTML = `<div class="coupon-empty">아직 소원이 없어요.<br>감 100개를 모으면 소원을 말할 수 있어요! 🍊✨</div>`;
  }

  state.wishes.slice().reverse().forEach((w) => {
    const done = !!w.fulfilledAt;
    const el = document.createElement('div');
    el.className = 'coupon' + (done ? ' done' : '');
    el.innerHTML = `
      <span class="c-emoji">${done ? '✅' : '🎁'}</span>
      <div class="c-body">
        <p class="c-wish">${escapeHtml(w.text)}</p>
        <p class="c-meta">${w.journey}번째 도전 · ${formatDate(w.createdAt)}</p>
        ${done ? '<p class="c-done">소원 들어줬어요 ✅</p>' : ''}
        <div class="c-actions"></div>
      </div>`;
    if (!done) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-gold';
      b.textContent = '소원 들어줬어요 ✅';
      b.addEventListener('click', () => {
        w.fulfilledAt = new Date().toISOString();
        saveState();
        renderStatus();
        renderCoupons();
        playSound('level');
        burst(40, false);
      });
      el.querySelector('.c-actions').appendChild(b);
    }
    list.appendChild(el);
  });

  const cw = currentJourneyWish();
  if (state.orange >= 100 && cw && cw.fulfilledAt) {
    showStartJourneyButton(foot);
  } else if (state.orange >= 100 && !cw) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-primary big';
    b.textContent = '소원 말하러 가기 🎁';
    b.addEventListener('click', () => { closeModals(); openWishModal(false); });
    foot.appendChild(b);
  } else if (state.orange >= 100 && cw && !cw.fulfilledAt) {
    const p = document.createElement('p');
    p.className = 'coupon-note';
    p.textContent = '엄마 아빠가 확인하면 새로운 100개 도전을 시작할 수 있어요 🌱';
    foot.appendChild(p);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- 이벤트 ---------- */
ui.hintBtn.addEventListener('click', () => {
  if (!current || !current.hint) return;
  if (ui.hintArea.hidden) {
    ui.hintArea.innerHTML = current.hint.html;
    ui.hintArea.hidden = false;
    ui.hintBtn.textContent = '힌트 닫기 🙈';
    playSound('tap');
  } else {
    ui.hintArea.hidden = true;
    ui.hintBtn.textContent = current.hint.label || '그림 힌트 보기 🍬';
  }
});

ui.soundBtn.addEventListener('click', () => {
  state.sound = !state.sound;
  saveState();
  renderStatus();
  if (state.sound) { playSound('tap'); setTimeout(() => playSound('correct'), 120); }
});

ui.wishBoxBtn.addEventListener('click', () => {
  playSound('tap');
  renderCoupons();
  ui.couponModal.hidden = false;
  document.body.style.overflow = 'hidden';
});

$('couponClose').addEventListener('click', closeModals);
ui.couponModal.addEventListener('click', (e) => { if (e.target === ui.couponModal) closeModals(); });
$('wishSaveBtn').addEventListener('click', saveWish);
$('wishCloseBtn').addEventListener('click', closeModals);
wishInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveWish(); });
ui.wishModal.addEventListener('click', (e) => { if (e.target === ui.wishModal) closeModals(); });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModals();
});

/* ---------- 시작 ---------- */
renderStatus();
renderQuestion(makeQuestion());
if (state.orange >= 100 && !currentJourneyWish()) {
  setTimeout(() => openWishModal(false), 700);
}

/* PWA */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

/* 테스트용 (주소에 ?test=1 일 때만) */
if (new URLSearchParams(location.search).get('test') === '1') {
  window.__harang = {
    get state() { return state; },
    get current() { return current; },
    answer(value) {
      const btn = [...ui.answerGrid.children].find((b) => b.dataset.value === value);
      if (btn) btn.click();
      return !!btn;
    },
    answerCorrect() { return this.answer(current.answer); },
    wrongValue() {
      const b = [...ui.answerGrid.children].find((x) => x.dataset.value !== current.answer);
      return b ? b.dataset.value : null;
    },
    next() {
      const btn = [...ui.fbActions.querySelectorAll('button')].find((b) => /다음 문제/.test(b.textContent));
      if (btn) btn.click();
      return !!btn;
    },
    retry() {
      const btn = [...ui.fbActions.querySelectorAll('button')].find((b) => /다시 풀어보기/.test(b.textContent));
      if (btn) btn.click();
      return !!btn;
    },
    setOrange(n) {
      state.orange = n;
      saveState();
      renderStatus();
    },
    openWish() { openWishModal(false); },
    coupons() { renderCoupons(); ui.couponModal.hidden = false; document.body.style.overflow = 'hidden'; },
    resetJourney() { startNewJourney(); },
    makeQuestion
  };
}
