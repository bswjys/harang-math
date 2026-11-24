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

/* ---------- 단원 분류 (리포트용) ---------- */
const CATEGORIES = [
  { key: 'add',   name: '덧셈',      emoji: '➕', types: ['add1', 'add2', 'make10', 'three', 'blankAdd'] },
  { key: 'sub',   name: '뺄셈',      emoji: '➖', types: ['sub10', 'sub2', 'blankSub'] },
  { key: 'num',   name: '수/비교',   emoji: '🔢', types: ['countNext', 'countBefore', 'countSeq', 'bundles', 'compare', 'hundred'] },
  { key: 'clock', name: '시계',      emoji: '⏰', types: ['clock'] },
  { key: 'shape', name: '모양/규칙', emoji: '🔺', types: ['pattern', 'shape'] }
];
const CAT_OF = {};
CATEGORIES.forEach((c) => c.types.forEach((t) => { CAT_OF[t] = c.key; }));
const catOf = (q) => CAT_OF[(q && q.type) || ''] || 'num';

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
    v: 5,
    orange: 0,
    totalOrange: 0,
    journey: 1,
    sound: true,
    wishes: [],
    today: { date: todayKey(), solved: 0, correct: 0, wrong: 0, missionDone: false },
    total: { solved: 0, correct: 0, wrong: 0 },
    byCat: {},
    wrongList: [],
    combo: 0,
    bestCombo: 0,
    seenLevel: 0,
    subject: 'math',
    subj: { math: { solved: 0, correct: 0 }, dict: { solved: 0, correct: 0 }, eng: { solved: 0, correct: 0 } },
    dict: { byRound: {}, wrong: [], lastRound: 'r1' },
    eng: { byCourse: {}, wrong: [], lastCourse: 'pic' }
  };
}

function loadState() {
  let s = defaultState();
  let savedV = 0;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      savedV = Number(saved.v) || 0;
      s = Object.assign(s, saved);
      s.today = Object.assign({ date: todayKey(), solved: 0, correct: 0, wrong: 0, missionDone: false }, saved.today || {});
      s.total = Object.assign({ solved: 0, correct: 0, wrong: 0 }, saved.total || {});
      if (!Array.isArray(s.wishes)) s.wishes = [];
      if (!Array.isArray(s.wrongList)) s.wrongList = [];
      if (!s.byCat || typeof s.byCat !== 'object') s.byCat = {};
      /* 과목별 기록 — 예전 저장값이면 수학 기록을 단원별 합계에서 되살려요 */
      if (!saved.subj) {
        const agg = Object.keys(s.byCat).reduce((a, k) => {
          const r = s.byCat[k] || {};
          return { solved: a.solved + (Number(r.solved) || 0), correct: a.correct + (Number(r.correct) || 0) };
        }, { solved: 0, correct: 0 });
        s.subj = { math: agg, dict: { solved: 0, correct: 0 }, eng: { solved: 0, correct: 0 } };
      } else {
        s.subj = Object.assign({ math: { solved: 0, correct: 0 }, dict: { solved: 0, correct: 0 }, eng: { solved: 0, correct: 0 } }, saved.subj || {});
      }
      ['math', 'dict', 'eng'].forEach((k) => {
        const r = s.subj[k] || (s.subj[k] = { solved: 0, correct: 0 });
        r.solved = Number(r.solved) || 0;
        r.correct = Number(r.correct) || 0;
      });
      if (!s.dict || typeof s.dict !== 'object') s.dict = { byRound: {}, wrong: [], lastRound: 'r1' };
      if (!['math', 'dict', 'eng'].includes(s.subject)) s.subject = 'math';
    }
  } catch (e) { /* 저장값이 깨져도 앱은 열려야 함 */ }
  if (s.today.date !== todayKey()) {
    s.today = { date: todayKey(), solved: 0, correct: 0, wrong: 0, missionDone: false };
  }
  s.orange = Math.max(0, Math.min(100, Number(s.orange) || 0));
  s.journey = Math.max(1, Number(s.journey) || 1);
  s.wrongList = s.wrongList.filter((w) => w && w.id && w.q).slice(-50);
  /* v5: 소원을 저장하면 그 자리에서 감을 0/100으로 리셋 — 예전 저장값(100개 + 저장한 소원)도 새 도전으로 이어 줌 */
  if (savedV < 5 && s.orange >= 100 && s.wishes.some((w) => w && w.journey === s.journey)) {
    s.orange = 0;
    s.journey += 1;
    s.seenLevel = 0;
  }
  s.v = 5;
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
    } else if (name === 'rain') {
      /* 가벼운 감 떨어지는 소리 — 짧게 톡톡 */
      [1319, 1175, 1568, 988, 1319].forEach((f, i) => note(f, i * 0.055, 0.14, 0.05, 'sine'));
    }
  } catch (e) { /* 소리는 실패해도 괜찮아요 */ }
}

/* ---------- 반짝이 효과 + 🍊 감 비 ---------- */
const fxCanvas = $('fx');
const fxCtx = fxCanvas.getContext('2d');
let particles = [];      // 반짝이(💖·✨…) — 화면 위에서 짧게 터지는 효과
let oranges = [];        // 감 비(🍊) — 위에서 우수수 떨어지는 감
let fxRunning = false;
const MAX_ORANGES = 180; /* 연속으로 눌러도 이만큼까지만 (느려지지 않게) */
const ORANGE_EMOJI = '🍊';
let fxDpr = 1;

/* 감 그림은 한 번만 그려 두고 복사해서 씀 — 180개가 떨어져도 끊기지 않게 */
const ORANGE_SPRITE = (() => {
  const S = 96;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  g.font = `${S - 10}px serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(ORANGE_EMOJI, S / 2, S / 2 + 2);
  return c;
})();

function startFx() {
  if (fxRunning) return;
  fxRunning = true;
  requestAnimationFrame(fxLoop);
}

function sizeFx() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  fxDpr = dpr;
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
  startFx();
}

/* 🍊 감 비 — 크고 작은 감이 회전·좌우 흔들림과 함께 위에서 우수수 (최대 MAX_ORANGES개) */
function orangeRain(count = 24) {
  const w = window.innerWidth;
  const room = Math.max(0, MAX_ORANGES - oranges.length);
  const add = Math.min(count, room);
  const born = performance.now();
  for (let i = 0; i < add; i++) {
    oranges.push({
      x0: w * (0.03 + Math.random() * 0.94),
      y: -40 - Math.random() * 280,
      vy: 2.1 + Math.random() * 2.9,
      size: 18 + Math.random() * 28,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.16,
      amp: 8 + Math.random() * 20,
      freq: 0.7 + Math.random() * 1.1,
      phase: Math.random() * Math.PI * 2,
      born,
      life: 1
    });
  }
  startFx();
  return add;
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

  if (oranges.length) {
    const now = performance.now();
    fxCtx.globalAlpha = 1;
    for (let i = 0; i < oranges.length; i++) {
      const o = oranges[i];
      const age = (now - o.born) / 1000;
      o.y += o.vy;
      o.vy += 0.055;
      o.rot += o.vr;
      const x = o.x0 + Math.sin(age * o.freq * Math.PI * 2 + o.phase) * o.amp;
      if (o.y > h * 0.86) o.life -= 0.035;
      const s = o.size * 1.08;
      const half = s / 2;
      fxCtx.globalAlpha = Math.max(0, o.life);
      fxCtx.setTransform(fxDpr, 0, 0, fxDpr, x, o.y);
      fxCtx.rotate(o.rot);
      fxCtx.drawImage(ORANGE_SPRITE, -half, -half, s, s);
    }
    fxCtx.globalAlpha = 1;
    fxCtx.setTransform(fxDpr, 0, 0, fxDpr, 0, 0);
    oranges = oranges.filter((o) => o.life > 0 && o.y < h + 90);
  }

  if (particles.length || oranges.length) {
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
    say: `${a} 더하기 ${b}는 얼마일까요?`,
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

/* 1-b) 두 자리 수 덧셈 (받아올림 없이 — 1학년 2학기) */
gen(function genAdd2() {
  const mode = Math.random();
  let a, b, total, explain;
  if (mode < 0.5) {
    /* (몇십몇) + (몇) */
    const t = randInt(1, 7);
    const o = randInt(1, 8);
    a = t * 10 + o;
    b = randInt(1, 9 - o);
    total = a + b;
    explain = `${a}는 ${t * 10}하고 ${o}. 낱개 ${o}개에 ${b}개를 더하면 <b>${o + b}개</b>! 십은 그대로라서 <b>${total}</b>이에요.<br><span class="eq">${a} + ${b} = ${total}</span>`;
  } else if (mode < 0.82) {
    /* (몇십몇) + (몇십) */
    const t = randInt(1, 6);
    const o = randInt(1, 9);
    const t2 = randInt(1, 8 - t);
    a = t * 10 + o;
    b = t2 * 10;
    total = a + b;
    explain = `${a} + ${b}: 십의 자리끼리 더하면 ${t} + ${t2} = <b>${t + t2}십</b>! 낱개 ${o}는 그대로라서 <b>${total}</b>이에요.<br><span class="eq">${a} + ${b} = ${total}</span>`;
  } else {
    /* (몇십) + (몇십) */
    const t = randInt(1, 5);
    const t2 = randInt(1, 4);
    a = t * 10;
    b = t2 * 10;
    total = a + b;
    explain = `${t}십 + ${t2}십 = <b>${t + t2}십</b>! 그래서 <b>${total}</b>이에요.<br><span class="eq">${a} + ${b} = ${total}</span>`;
  }
  return {
    type: 'add2',
    tag: '두 자리 더하기',
    say: `${a} 더하기 ${b}는 얼마일까요?`,
    stage: eqLine(`${NF(a)} ${OP('+')} ${NF(b)} ${OP('=')} ${BLANK()}`),
    options: numberChoices(total, 4, 4, 0),
    answer: String(total),
    explain,
    hint: null
  };
});

/* 2) 10이 되는 짝 */
gen(function genMake10() {
  const a = randInt(2, 8);
  const b = 10 - a;
  return {
    type: 'make10',
    tag: '10이 되는 짝',
    say: `${a}에 얼마를 더하면 십이 될까요? 빈 칸에 들어갈 수를 골라 주세요.`,
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
    say: `십에서 ${b}를 빼면 얼마가 남을까요?`,
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
    say: `${a}에서 ${b}를 빼면 얼마일까요?`,
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
    say: `${a} 더하기 ${b} 더하기 ${c}는 얼마일까요?`,
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
    say: `네모에 들어갈 수는 무엇일까요? 네모 더하기 ${b}는 ${total}이에요.`,
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
    say: `${a}에서 얼마를 빼면 ${left}가 될까요?`,
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
    say: `${n} 바로 다음에 오는 수는 무엇일까요?`,
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
    say: `${n} 바로 앞에 오는 수는 무엇일까요?`,
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
    say: `수를 이어서 써 볼까요? ${start}, ${start + 1}, 그다음에 오는 수는 무엇일까요?`,
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
    say: `십 개씩 ${tens}묶음과 낱개 ${ones}개는 모두 몇 개일까요?`,
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
    say: `${a}하고 ${b}, 동그라미 안에 들어갈 기호를 골라 주세요.`,
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
    say: `십이 십 개 모이면 얼마일까요?`,
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
    say: `시계를 보고 몇 시인지 맞혀 보세요.`,
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
    say: `무늬가 어떻게 되풀이되는지 보고, 물음표에 알맞은 것을 골라 주세요.`,
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
    say: `이 모양의 이름은 무엇일까요?`,
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
const ARITH_GENS = ['add1', 'add2', 'make10', 'sub10', 'sub2', 'three', 'blankAdd', 'blankSub'];
const NUM_GENS = ['countNext', 'countBefore', 'countSeq', 'bundles', 'compare', 'hundred'];
const CLOCK_GENS = ['clock'];
const SHAPE_GENS = ['pattern', 'shape'];

/* 출제 비율 — 산수(더하기·빼기·10이 되는 짝·세 수) 80%, 나머지 1학년 2학기 개념 20% */
const MATH_MIX = [
  { share: 0.80, gens: ARITH_GENS },
  { share: 0.08, gens: NUM_GENS },
  { share: 0.06, gens: CLOCK_GENS },
  { share: 0.06, gens: SHAPE_GENS }
];
function pickGenIds() {
  const r = Math.random();
  let acc = 0;
  for (const m of MATH_MIX) {
    acc += m.share;
    if (r < acc) return m.gens;
  }
  return ARITH_GENS;
}

let lastType = '';
function makeQuestion() {
  for (let attempt = 0; attempt < 30; attempt++) {
    const ids = pickGenIds();
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
let current = null;          // 지금 화면에 그려진 문제
let active = null;           // 지금 화면에 그려진 히스토리 항목
let answered = false;
let rewarded = false;
let retried = false;
let firstAttempt = true;
let questionNo = 0;

const history = [];          // 푼 문제 히스토리 (◀ 이전 문제)
let hIndex = -1;
const HISTORY_MAX = 40;
const HISTORY_KEY = 'harang-math-history-v1';   // 앱을 닫아도 남는 문제 기록

/* 히스토리 저장/불러오기 — 앱을 닫았다 열어도 ◀ 이전 문제로 복습할 수 있게 */
function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ v: 1, no: questionNo, entries: history }));
  } catch (e) { /* 저장 공간이 모자라도 앱은 계속 열려야 함 */ }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    const entries = Array.isArray(saved) ? saved : (saved && saved.entries);
    if (!Array.isArray(entries)) return false;
    entries.forEach((e) => {
      const q = e && e.q;
      if (!q || typeof q.stage !== 'string' || !Array.isArray(q.options)
          || typeof q.answer !== 'string' || q.options.indexOf(q.answer) < 0) return;
      history.push({
        q,
        mode: 'normal',              // 지난번 복습 모드는 새로 열면 의미가 없어요
        no: Number(e.no) || 0,
        answered: !!e.answered,
        chosen: e.chosen === undefined ? null : e.chosen,
        correct: e.correct === undefined ? null : e.correct,
        rewarded: !!e.rewarded,      // 감 중복 적립 방지의 핵심
        retried: !!e.retried,
        counted: !!e.counted
      });
    });
    if (history.length > HISTORY_MAX) history.splice(0, history.length - HISTORY_MAX);
    const savedNo = Number(saved && saved.no) || 0;
    const maxNo = history.reduce((m, h) => Math.max(m, h.no || 0), 0);
    questionNo = Math.max(questionNo, savedNo, maxNo);
    return history.length > 0;
  } catch (e) {
    history.length = 0;
    return false;
  }
}

let reviewActive = false;    // 🌸 헷갈린 문제 복습 모드
let reviewQueue = [];

const ui = {
  rankBadge: $('rankBadge'), levelEmoji: $('levelEmoji'), levelName: $('levelName'),
  orangeCount: $('orangeCount'), progressBar: $('progressBar'), progressOuter: $('progressOuter'),
  orangeBadge: $('orangeChip'),
  todayProgress: $('todayProgress'), comboChip: $('comboChip'),
  qTag: $('qTag'), qNum: $('qNum'), stage: $('questionStage'),
  answerGrid: $('answerGrid'), hintRow: $('hintRow'), hintBtn: $('hintBtn'), hintArea: $('hintArea'),
  feedback: $('feedback'), fbEmoji: $('fbEmoji'), fbTitle: $('fbTitle'), fbSub: $('fbSub'),
  fbExplain: $('fbExplain'), fbActions: $('fbActions'),
  soundBtn: $('soundBtn'), wishBoxBtn: $('wishBoxBtn'), wishBadge: $('wishBadge'),
  wishModal: $('wishModal'), couponModal: $('couponModal'),
  missionCard: $('missionCard'), missionCount: $('missionCount'), missionStars: $('missionStars'),
  missionState: $('missionState'),
  fairyModal: $('fairyModal'), fairyCard: $('fairyCard'), fairyText: $('fairyText'),
  fairyActions: $('fairyActions'), fairyTip: $('fairyTip'),
  prevBtn: $('prevBtn'), nextBtn: $('nextBtn'),
  reviewBtn: $('reviewBtn'), reportBtn: $('reportBtn'),
  reviewBanner: $('reviewBanner'), reviewLeft: $('reviewLeft'),
  reportModal: $('reportModal'), reportBody: $('reportBody'), reportDate: $('reportDate'),
  toast: $('toast')
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

  const sSolved = $('statSolved');
  if (sSolved) {
    sSolved.textContent = String(state.today.solved);
    $('statCorrect').textContent = String(state.today.correct);
    $('statBest').textContent = String(state.bestCombo);
  }

  renderMission();
  renderReviewButton();
}

/* ---------- 오늘의 미니 미션 ---------- */
function renderMission() {
  const solved = Math.max(0, Number(state.today.solved) || 0);
  const shown = Math.min(5, solved);
  const done = solved >= 5;
  if (ui.missionCount) ui.missionCount.textContent = `${shown} / 5`;
  if (ui.missionStars) {
    [...ui.missionStars.children].forEach((el, i) => el.classList.toggle('on', i < shown));
  }
  if (ui.missionCard) ui.missionCard.classList.toggle('done', done);
  if (ui.missionState) {
    ui.missionState.textContent = done
      ? '🌟 오늘 미션 성공! 하랑이 최고!'
      : `${5 - solved}문제만 더 풀면 성공이에요`;
  }
}

function celebrateMission() {
  showToast('🌟', '오늘 미션 성공! 하랑이 최고!', 'gold', 4200);
  playSound('level');
  burst(44, true);
  setTimeout(() => burst(28, true), 420);
  if (ui.missionCard) {
    ui.missionCard.classList.remove('sparkle');
    void ui.missionCard.offsetWidth;
    ui.missionCard.classList.add('sparkle');
  }
}

function checkMission() {
  if (state.today.solved >= 5 && !state.today.missionDone) {
    state.today.missionDone = true;
    saveState();
    celebrateMission();
  }
}

/* ---------- 토스트 ---------- */
let toastTimer = null;
function showToast(emoji, text, kind = '', ms = 2600) {
  if (!ui.toast) return;
  const em = $('toastEmoji');
  const tx = $('toastText');
  if (em) em.textContent = emoji || '✨';
  if (tx) tx.textContent = text || '';
  ui.toast.className = 'toast' + (kind ? ' ' + kind : '');
  ui.toast.hidden = false;
  ui.toast.style.animation = 'none';
  void ui.toast.offsetWidth;
  ui.toast.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { ui.toast.hidden = true; }, ms);
}

/* ---------- 🍊 감 배지 → 감 비 ---------- */
const ORANGE_RAIN_TOASTS = [
  (n) => `감 비가 주르륵~ 🍊 지금 ${n}개!`,
  (n) => `통통통! 소원까지 ${100 - n}개 남았어! ✨`,
  () => '달콤한 감 폭포! 🍊💖',
  (n) => `우수수~ 감이 쏟아져요! 지금 ${n}개 🍊`,
  () => '감이 통통 튀어요! 감 비 한 번 더? 🍊'
];
let lastOrangeTap = 0;
let orangeTapRun = 0;      // 연속으로 누른 횟수 — 많이 누를수록 더 신나게

function orangeBadgeTap() {
  const n = state.orange;
  const now = Date.now();
  orangeTapRun = (now - lastOrangeTap < 1200) ? Math.min(orangeTapRun + 1, 6) : 0;
  lastOrangeTap = now;
  const count = Math.min(44, 24 + orangeTapRun * 6);
  const added = orangeRain(count);
  playSound('rain');
  if (ui.orangeBadge) {
    ui.orangeBadge.classList.remove('tapped');
    void ui.orangeBadge.offsetWidth;
    ui.orangeBadge.classList.add('tapped');
  }
  const msg = n >= 100
    ? '감 100개! 소원 쿠폰함을 열어 봐요 🎁'
    : pick(ORANGE_RAIN_TOASTS)(n);
  showToast('🍊', msg, 'gold', 2400);
  return { n, added, oranges: oranges.length, toast: msg };
}

/* ---------- 🧚 요정 응원 ---------- */
const FAIRY_CHEERS = [
  '하랑아 화이팅! 🌟',
  '열심히 해! 할 수 있어 💪',
  '지금까지 정말 잘하고 있어! 💖',
  '한 문제만 더 도전해 볼까? ✨',
  '하랑핑 오늘도 반짝반짝! 🌸',
  '틀려도 괜찮아, 다시 하면 돼! 🍀'
];
const FAIRY_100_TEXT = '우와~ 100개 다 모았어! 정말 잘했어요! 🎉🧚‍♀️';
let lastCheer = -1;

function nextCheer() {
  if (FAIRY_CHEERS.length < 2) return FAIRY_CHEERS[0] || '하랑아 화이팅! 🌟';
  let i = Math.floor(Math.random() * FAIRY_CHEERS.length);
  if (i === lastCheer) i = (i + 1) % FAIRY_CHEERS.length;
  lastCheer = i;
  return FAIRY_CHEERS[i];
}

function fairyModalOpen() {
  return !!ui.fairyModal && !ui.fairyModal.hidden;
}

function closeFairy() {
  if (!ui.fairyModal) return;
  ui.fairyModal.hidden = true;
  const others = [ui.wishModal, ui.couponModal, ui.reportModal].some((m) => m && !m.hidden);
  if (!others) document.body.style.overflow = '';
}

function openFairy(celebrate) {
  if (!ui.fairyModal) return;
  const party = celebrate === undefined ? state.orange >= 100 : !!celebrate;
  ui.fairyCard.classList.toggle('celebrate', party);
  ui.fairyText.textContent = party ? FAIRY_100_TEXT : nextCheer();
  ui.fairyActions.innerHTML = '';

  if (party) {
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'btn btn-gold big';
    go.id = 'fairyWishBtn';
    go.textContent = '소원 말하러 가기 🎁';
    go.addEventListener('click', () => {
      closeFairy();
      openWishModal(false);
    });
    ui.fairyActions.appendChild(go);

    const later = document.createElement('button');
    later.type = 'button';
    later.className = 'btn btn-ghost';
    later.id = 'fairyLaterBtn';
    later.textContent = '조금 있다가 정할래요';
    later.addEventListener('click', closeFairy);
    ui.fairyActions.appendChild(later);
    ui.fairyTip.textContent = '감 100개 달성! 🎁 소원 쿠폰함도 열려 있어요';
  } else {
    ui.fairyTip.textContent = '배지나 빈 곳을 눌러 닫을 수 있어요';
  }

  ui.fairyModal.hidden = false;
  document.body.style.overflow = 'hidden';

  if (party) {
    playSound('wish');
    burst(34, true);
    setTimeout(() => burst(20, true), 450);
  } else {
    playSound('tap');
    burst(12, true);
  }
}

/* ---------- 문제 / 히스토리 ---------- */
function newQuestion(q, mode) {
  const entry = {
    q,
    mode: mode || 'normal',
    no: ++questionNo,
    answered: false,
    chosen: null,
    correct: null,
    rewarded: false,
    retried: false,
    counted: false
  };
  history.push(entry);
  if (history.length > HISTORY_MAX) history.shift();
  hIndex = history.length - 1;
  renderEntry(entry);
  renderStatus();
  saveHistory();
  return entry;
}

function renderQuestion(q) { return newQuestion(q, 'normal'); }   // 예전 이름 유지

function renderEntry(entry) {
  active = entry;
  current = entry.q;
  answered = !!entry.answered;
  rewarded = !!entry.rewarded;
  retried = !!entry.retried;
  firstAttempt = !entry.counted;

  const q = entry.q;
  ui.qTag.textContent = q.tag;
  ui.qNum.textContent = `${entry.no}번째 문제`;
  ui.stage.innerHTML = q.stage;
  ui.feedback.hidden = true;
  ui.feedback.className = 'feedback';

  const symbolOnly = q.options.every((o) => ['>', '<', '='].includes(o));
  ui.answerGrid.className = 'answers ' + (q.options.length === 3 ? 'three' : q.options.length === 4 ? 'four' : '') + (symbolOnly ? ' symbols' : '');
  ui.answerGrid.innerHTML = '';
  q.options.forEach((opt) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'answer-btn';
    b.dataset.value = opt;
    b.textContent = opt;
    b.addEventListener('click', () => onAnswer(opt, b));
    if (entry.answered) {
      b.disabled = true;
      if (opt === q.answer) b.classList.add('correct');
      else if (opt === entry.chosen) b.classList.add('wrong');
    }
    ui.answerGrid.appendChild(b);
  });

  if (q.hint) {
    ui.hintRow.hidden = false;
    ui.hintBtn.textContent = q.hint.label || '그림 힌트 보기 🍬';
    ui.hintBtn.disabled = false;
  } else {
    ui.hintRow.hidden = true;
  }
  ui.hintArea.hidden = true;
  ui.hintArea.innerHTML = '';

  const inReview = entry.mode === 'review';
  if (ui.reviewBanner) ui.reviewBanner.hidden = !inReview;
  if (inReview && ui.reviewLeft) {
    ui.reviewLeft.textContent = reviewQueue.length ? `${reviewQueue.length}문제 더 있어요` : '마지막 문제예요';
  }

  renderNav();

  if (entry.answered) showFeedback(entry.correct);
}

function renderNav() {
  if (!ui.prevBtn) return;
  const canPrev = hIndex > 0;
  // 첫 문제에서는 흐리게만 보이고, 누르면 안내 토스트가 떠요 (무반응 아님)
  ui.prevBtn.classList.toggle('off', !canPrev);
  ui.prevBtn.title = canPrev ? '방금 푼 문제로 돌아가기' : '한 문제 더 풀면 돌아갈 수 있어요';
  if (ui.nextBtn) ui.nextBtn.hidden = !(hIndex < history.length - 1);
}

function goForward() {
  if (hIndex >= history.length - 1) return false;
  hIndex += 1;
  renderEntry(history[hIndex]);
  playSound('tap');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return true;
}

function goBack() {
  if (hIndex <= 0) return false;
  hIndex -= 1;
  renderEntry(history[hIndex]);
  playSound('tap');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return true;
}

function goNext() {
  if (hIndex < history.length - 1) { return goForward(); }
  if (reviewActive) { nextReview(); return true; }
  newQuestion(makeQuestion());
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return true;
}

/* ---------- 채점 ---------- */
function rollDayIfNeeded() {
  if (state.today.date === todayKey()) return false;
  state.today = { date: todayKey(), solved: 0, correct: 0, wrong: 0, missionDone: false };
  state.combo = 0;
  saveState();
  renderMission();
  return true;
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { rollDayIfNeeded(); renderStatus(); }
});

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
  const crossed = before < 100 && state.orange >= 100;
  if (crossed && !currentJourneyWish()) {
    setTimeout(() => openFairy(true), 850);
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
  if (!active || answered || active.answered) return;
  rollDayIfNeeded();
  const entry = active;
  const correct = value === current.answer;

  const wasFirst = !entry.counted;
  entry.answered = true;
  entry.chosen = value;
  entry.correct = correct;
  answered = true;

  if (wasFirst) {
    entry.counted = true;
    state.today.solved += 1;
    state.total.solved += 1;
    const key = catOf(current);
    const rec = state.byCat[key] || (state.byCat[key] = { solved: 0, correct: 0 });
    rec.solved += 1;
    if (!state.subj || !state.subj.math) state.subj = Object.assign({ dict: { solved: 0, correct: 0 } }, state.subj || {}, { math: { solved: 0, correct: 0 } });
    state.subj.math.solved += 1;
    if (correct) {
      state.today.correct += 1;
      state.total.correct += 1;
      rec.correct += 1;
      state.subj.math.correct += 1;
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
    const graduated = forgetWrong(current);
    if (!entry.rewarded) {
      entry.rewarded = true;
      rewarded = true;
      showFeedback(true);
      playSound('correct');
      burst(12, false);
      addOrange(1);
    } else {
      showFeedback(true);
      playSound('correct');
    }
    if (graduated && entry.mode === 'review') {
      showToast('🌸', '헷갈린 문제 졸업! 이제 잘할 수 있어요', 'mint', 3000);
      burst(20, false);
    }
  } else {
    btn.classList.add('wrong');
    markButtons(current.answer);
    state.combo = 0;
    if (wasFirst) rememberWrong(current);
    playSound('wrong');
    showFeedback(false);
  }

  if (wasFirst) checkMission();
  renderStatus();
  saveState();
  saveHistory();
}

function showFeedback(good) {
  const entry = active;
  const fb = ui.feedback;
  fb.hidden = false;
  fb.className = 'feedback ' + (good ? 'good' : 'bad');

  if (good) {
    ui.fbEmoji.textContent = pick(['🎉', '💖', '🌟', '🥳', '✨']);
    ui.fbTitle.textContent = entry && entry.retried ? '다시 해내다니 정말 멋져, 김하랑! 💪' : pick(PRAISES);
    ui.fbSub.textContent = entry && entry.retried
      ? '포기하지 않고 맞혔어요! 감 1개를 모았어요 🍊'
      : '정답이에요! 감 1개를 모았어요 🍊';
    if (entry && entry.mode === 'review' && !isWrongStill()) {
      ui.fbTitle.textContent = '헷갈린 문제 졸업! 정말 멋져 김하랑! 🎓';
      ui.fbSub.textContent = '이제 이 문제는 안 틀릴 거예요! 감 1개도 받았어요 🍊';
    }
  } else {
    ui.fbEmoji.textContent = pick(['🌸', '💗', '🫶', '🌈']);
    ui.fbTitle.textContent = pick(ENCOURAGES);
    ui.fbSub.textContent = '괜찮아요! 틀린 문제는 감 0개, 맞히면 감 1개를 받아요 🍊';
  }

  ui.fbExplain.innerHTML = `<b>해설</b> · ${current.explain}`;
  ui.fbActions.innerHTML = '';

  const isLatest = hIndex === history.length - 1;

  if (!good && isLatest && entry && !entry.rewarded) {
    const retry = document.createElement('button');
    retry.className = 'btn btn-soft';
    retry.type = 'button';
    retry.id = 'fbRetryBtn';
    retry.textContent = '다시 풀어보기 💪';
    retry.addEventListener('click', () => {
      entry.retried = true;
      entry.answered = false;
      entry.chosen = null;
      entry.correct = null;
      answered = false;
      retried = true;
      saveHistory();
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
    moveOn.id = 'fbMoveOnBtn';
    moveOn.textContent = '알겠어요! 다음 문제 🌸';
    moveOn.addEventListener('click', () => {
      if (entry) {
        /* v6: 틀린 문제는 해설을 봐도 감 0개 — 맞혔을 때만 +1 */
        ui.fbSub.textContent = '해설을 읽었으니 다음에 또 만나요! 맞히면 감 1개를 받아요 🍊';
      }
      saveHistory();
      playSound('tap');
      goNext();
    });

    ui.fbActions.appendChild(retry);
    ui.fbActions.appendChild(moveOn);
  } else {
    const next = document.createElement('button');
    next.className = 'btn btn-primary';
    next.type = 'button';
    next.id = 'fbNextBtn';
    if (!isLatest) {
      next.textContent = '다음 문제 ▶';
      next.addEventListener('click', () => { goForward(); });
    } else if (reviewActive) {
      next.textContent = reviewQueue.length ? '다음 복습 문제 🌸' : '복습 끝! 새 문제 💖';
      next.addEventListener('click', () => { playSound('tap'); goNext(); });
    } else {
      next.textContent = '다음 문제 💖';
      next.addEventListener('click', () => { playSound('tap'); goNext(); });
    }
    ui.fbActions.appendChild(next);
  }

  const r = fb.getBoundingClientRect();
  if (r.top > window.innerHeight * 0.55) {
    fb.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ---------- 🌸 헷갈린 문제 (오답 복습) ---------- */
function wrongKey(q) {
  return `${q.type}|${q.stage}`;
}

function isWrongStill() {
  return !!current && state.wrongList.some((w) => w.id === wrongKey(current));
}

function rememberWrong(q) {
  const key = wrongKey(q);
  const found = state.wrongList.find((w) => w.id === key);
  if (found) {
    found.misses = (Number(found.misses) || 1) + 1;
    found.at = Date.now();
  } else {
    state.wrongList.push({
      id: key,
      type: q.type,
      cat: catOf(q),
      q: {
        type: q.type,
        tag: q.tag,
        say: q.say || '',
        stage: q.stage,
        options: q.options.slice(),
        answer: q.answer,
        explain: q.explain,
        hint: q.hint || null
      },
      misses: 1,
      at: Date.now()
    });
    if (state.wrongList.length > 50) state.wrongList.shift();
  }
  saveState();
  renderReviewButton();
}

function forgetWrong(q) {
  const key = wrongKey(q);
  const i = state.wrongList.findIndex((w) => w.id === key);
  if (i < 0) return false;
  state.wrongList.splice(i, 1);
  saveState();
  renderReviewButton();
  return true;
}

function renderReviewButton() {
  if (!ui.reviewBtn) return;
  const n = state.wrongList.length;
  ui.reviewBtn.textContent = `🌸 헷갈린 문제 (${n})`;
  ui.reviewBtn.disabled = n === 0;
  ui.reviewBtn.classList.toggle('off', n === 0);
  ui.reviewBtn.title = n ? '틀린 문제만 모아서 다시 풀어 봐요' : '틀린 문제가 없어요!';
  ui.reviewBtn.setAttribute('aria-label', n ? `헷갈린 문제 ${n}개 다시 풀기` : '틀린 문제가 없어요');
}

function startReview() {
  if (!state.wrongList.length) {
    showToast('🌸', '틀린 문제가 없어요! 최고예요', '', 2600);
    return;
  }
  closeModals();
  reviewActive = true;
  reviewQueue = shuffle(state.wrongList.map((w) => w.id));
  playSound('tap');
  nextReview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextReview() {
  while (reviewQueue.length) {
    const id = reviewQueue.shift();
    const w = state.wrongList.find((x) => x.id === id);
    if (w) {
      newQuestion(w.q, 'review');
      return true;
    }
  }
  reviewActive = false;
  reviewQueue = [];
  showToast('🌸', '헷갈린 문제를 모두 풀었어요! 최고예요', 'mint', 3200);
  burst(24, false);
  newQuestion(makeQuestion());
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return true;
}

function endReview() {
  reviewActive = false;
  reviewQueue = [];
  showToast('🌸', '복습을 그만하고 새 문제를 풀어요', '', 2400);
  newQuestion(makeQuestion());
  renderStatus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- 📊 부모님 미니 리포트 ---------- */
function pctOf(correct, solved) {
  if (!solved) return 0;
  return Math.max(0, Math.min(100, Math.round((correct / solved) * 100)));
}

function byCatGet(key) {
  const r = state.byCat[key];
  return { solved: Number(r && r.solved) || 0, correct: Number(r && r.correct) || 0 };
}

function koreanToday() {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

function renderReport() {
  if (!ui.reportBody) return;
  const t = state.today;
  const tot = state.total;
  const todayRate = pctOf(t.correct, t.solved);
  const totalRate = pctOf(tot.correct, tot.solved);
  const missionShown = Math.min(5, t.solved);
  const missionDone = t.solved >= 5;

  /* 과목별(수학 / 받아쓰기 / 영어) 기록은 따로 보여 줘요 */
  const subj = state.subj || { math: { solved: 0, correct: 0 }, dict: { solved: 0, correct: 0 }, eng: { solved: 0, correct: 0 } };
  const mS = subj.math || { solved: 0, correct: 0 };
  const dS = subj.dict || { solved: 0, correct: 0 };
  const eS = subj.eng || { solved: 0, correct: 0 };
  const mP = pctOf(mS.correct, mS.solved);
  const dP = pctOf(dS.correct, dS.solved);
  const eP = pctOf(eS.correct, eS.solved);
  const subjCards = `
    <div class="rep-subj">
      <div class="rep-subj-card math" data-subj="math">
        <span class="rs-emoji" aria-hidden="true">🔢</span>
        <span class="rs-name">수학</span>
        <b class="rs-rate">${mS.solved ? mP + '%' : '–'}</b>
        <span class="rs-foot">${mS.solved ? `${mS.solved}문제 중 ${mS.correct}개 정답` : '아직 안 풀었어요'}</span>
      </div>
      <div class="rep-subj-card dict" data-subj="dict">
        <span class="rs-emoji" aria-hidden="true">✏️</span>
        <span class="rs-name">받아쓰기</span>
        <b class="rs-rate">${dS.solved ? dP + '%' : '–'}</b>
        <span class="rs-foot">${dS.solved ? `${dS.solved}문장 중 ${dS.correct}개 정답` : '아직 안 했어요'}</span>
      </div>
      <div class="rep-subj-card eng" data-subj="eng">
        <span class="rs-emoji" aria-hidden="true">🔤</span>
        <span class="rs-name">영어</span>
        <b class="rs-rate">${eS.solved ? eP + '%' : '–'}</b>
        <span class="rs-foot">${eS.solved ? `${eS.solved}문제 중 ${eS.correct}개 정답` : '아직 안 했어요'}</span>
      </div>
    </div>`;
  const dictRows = (window.harangDict && typeof window.harangDict.reportRows === 'function')
    ? window.harangDict.reportRows()
    : '';
  const engRows = (window.harangEng && typeof window.harangEng.reportRows === 'function')
    ? window.harangEng.reportRows()
    : '';
  const dictWrong = (state.dict && Array.isArray(state.dict.wrong)) ? state.dict.wrong.length : 0;
  const engWrong = (state.eng && Array.isArray(state.eng.wrong)) ? state.eng.wrong.length : 0;

  const rows = CATEGORIES.map((c) => {
    const r = byCatGet(c.key);
    const p = pctOf(r.correct, r.solved);
    return `<div class="rep-cat" data-cat="${c.key}">
        <div class="rep-cat-head"><span>${c.emoji} ${c.name}</span><b>${r.solved ? p + '%' : '–'}</b></div>
        <div class="rep-bar"><i style="width:${r.solved ? Math.max(p, 5) : 0}%"></i></div>
        <p class="rep-cat-foot">${r.solved ? `${r.solved}문제 중 ${r.correct}개 정답` : '아직 안 풀었어요'}</p>
      </div>`;
  }).join('');

  const scored = CATEGORIES
    .map((c) => {
      const r = byCatGet(c.key);
      return { name: c.name, emoji: c.emoji, solved: r.solved, correct: r.correct, rate: pctOf(r.correct, r.solved) };
    })
    .filter((c) => c.solved > 0)
    .sort((a, b) => (b.rate - a.rate) || (b.solved - a.solved));

  let good = '아직 기록이 없어요. 문제를 몇 개 풀면 알려 줄게요 🌱';
  let practice = '모든 단원을 골고루 풀어 보면 더 좋아요!';
  if (scored.length) {
    const best = scored[0];
    const worst = scored[scored.length - 1];
    good = `${best.emoji} ${best.name} ${best.rate}% · ${best.solved}문제 중 ${best.correct}개 정답`;
    if (scored.length > 1 && worst.rate < 80) {
      practice = `${worst.emoji} ${worst.name} ${worst.rate}% · 조금만 더 연습해 보면 좋아요`;
    } else {
      practice = '모든 단원을 골고루 잘하고 있어요! 🌈';
    }
  }

  ui.reportBody.innerHTML = `
    <div class="rep-grid">
      <div class="rep-stat"><span>오늘 푼 문제</span><b>${t.solved}문제</b></div>
      <div class="rep-stat"><span>오늘 정답률</span><b>${t.solved ? todayRate + '%' : '–'}</b></div>
      <div class="rep-stat"><span>오늘 미션</span><b class="${missionDone ? 'ok' : ''}">${missionDone ? '달성 🌟' : missionShown + ' / 5'}</b></div>
    </div>
    <h3 class="rep-h">과목별 정답률</h3>
    ${subjCards}
    <div class="rep-grid">
      <div class="rep-stat"><span>누적 푼 문제</span><b>${tot.solved}문제</b></div>
      <div class="rep-stat"><span>누적 정답률</span><b>${tot.solved ? totalRate + '%' : '–'}</b></div>
      <div class="rep-stat"><span>헷갈린 문제</span><b>${state.wrongList.length + dictWrong + engWrong}개</b></div>
    </div>
    <h3 class="rep-h">🔢 수학 단원별</h3>
    <div class="rep-cats">${rows}</div>
    <h3 class="rep-h">✏️ 받아쓰기 회차별</h3>
    <div class="rep-cats rep-dict-cats">${dictRows}</div>
    <h3 class="rep-h">🔤 영어 코스별</h3>
    <div class="rep-cats rep-eng-cats">${engRows}</div>
    <div class="rep-summary">
      <p class="rep-good"><b>하랑이가 잘하는 것</b><span>${good}</span></p>
      <p class="rep-practice"><b>조금 더 연습하면 좋은 것</b><span>${practice}</span></p>
    </div>
    <p class="rep-note">${t.solved >= 5 ? '오늘 미니 미션 성공! 칭찬해 주세요 💖' : '5문제를 풀면 오늘 미니 미션이 성공해요 🌟'}</p>`;
  if (ui.reportDate) ui.reportDate.textContent = koreanToday();
}

function openReport() {
  renderReport();
  ui.reportModal.hidden = false;
  document.body.style.overflow = 'hidden';
  playSound('tap');
}

/* ---------- 소원 ---------- */
const wishInput = $('wishInput');
const wishChips = $('wishChips');
const wishForm = $('wishForm');
const wishSavedBox = $('wishSavedBox');
let wishJustSaved = null;   // 방금 저장한 소원 — 감이 0으로 돌아간 뒤에도 확인 카드를 보여 주려고

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
  const existing = wishJustSaved || currentJourneyWish();
  const closeBtn = $('wishCloseBtn');
  const title = $('wishTitle');
  const lead = $('wishLead');
  if (title) {
    title.innerHTML = wishJustSaved
      ? '소원 쿠폰이 완성됐어요! 🎁'
      : '축하해요 김하랑!<br>감 100개 다 모았어요! 🎉';
  }
  if (lead) {
    lead.textContent = wishJustSaved ? '이제 새로운 100개를 모아요 🌱' : '엄마 아빠에게 소원 말하기 🎁';
  }
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
  const wish = {
    id: 'w' + Date.now(),
    journey: state.journey,
    text,
    createdAt: new Date().toISOString(),
    fulfilledAt: null
  };
  state.wishes.push(wish);
  wishJustSaved = wish;
  /* 감 100개 완성 → 선물 쿠폰 생성과 동시에 새 100개 모으기 시작 (누적 총 감·오늘 문제·콤보·쿠폰·리포트 기록은 그대로) */
  resetOrangeCycle();
  playSound('wish');
  burst(22, true);
  openWishModal(false);
}

/* 감 카운터만 0/100으로 — 새 도전 시작 */
function resetOrangeCycle() {
  state.orange = 0;
  state.journey += 1;
  state.seenLevel = 0;
  saveState();
  renderStatus();
}

function startNewJourney() {
  resetOrangeCycle();
  closeModals();
  burst(40, true);
  playSound('level');
  showLevelToast(LEVELS[0]);
}

function closeModals() {
  ui.wishModal.hidden = true;
  ui.couponModal.hidden = true;
  if (ui.reportModal) ui.reportModal.hidden = true;
  if (ui.fairyModal) ui.fairyModal.hidden = true;
  wishJustSaved = null;
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

/* ---------- 과목 탭 (🔢 수학 / ✏️ 받아쓰기 / 🔤 영어) ---------- */
const SUBJECTS = ['math', 'dict', 'eng'];
const PANE_OF = { math: 'mathPane', dict: 'dictPane', eng: 'engPane' };
const TAB_OF = { math: 'tabMath', dict: 'tabDict', eng: 'tabEng' };

function setSubject(name) {
  const subj = SUBJECTS.includes(name) ? name : 'math';
  const panes = SUBJECTS.map((k) => ({ k, el: $(PANE_OF[k]) }));
  if (panes.some((p) => !p.el)) return subj;
  state.subject = subj;
  try { saveState(); } catch (e) {}
  panes.forEach((p) => { p.el.hidden = p.k !== subj; });
  SUBJECTS.forEach((k) => {
    const b = $(TAB_OF[k]);
    if (!b) return;
    b.classList.toggle('on', k === subj);
    b.setAttribute('aria-selected', k === subj ? 'true' : 'false');
  });
  if (window.harangDict && window.harangDict.stop) window.harangDict.stop();
  if (window.harangEng && window.harangEng.stop) window.harangEng.stop();
  if (subj === 'dict' && window.harangDict && window.harangDict.refresh) window.harangDict.refresh();
  if (subj === 'eng' && window.harangEng && window.harangEng.refresh) window.harangEng.refresh();
  return subj;
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

/* 🍊 감 배지 → 감이 우수수 + 짧은 응원 토스트 */
if (ui.orangeBadge) {
  ui.orangeBadge.addEventListener('click', () => { orangeBadgeTap(); });
}

/* 🧚 칭호 배지 → 요정 응원 */
if (ui.rankBadge) {
  ui.rankBadge.addEventListener('click', () => {
    openFairy(state.orange >= 100);
  });
}
if (ui.fairyModal) {
  $('fairyClose').addEventListener('click', closeFairy);
  ui.fairyModal.addEventListener('click', (e) => { if (e.target === ui.fairyModal) closeFairy(); });
}

/* ◀ 이전 문제 / 다음 문제 ▶ */
if (ui.prevBtn) ui.prevBtn.addEventListener('click', () => {
  if (hIndex <= 0) {
    showToast('◀', '한 문제 풀고 넘어가면 돌아갈 수 있어요 😊', '', 2800);
    playSound('tap');
    return;
  }
  goBack();
});
if (ui.nextBtn) ui.nextBtn.addEventListener('click', goForward);

/* 🌸 헷갈린 문제 복습 */
if (ui.reviewBtn) ui.reviewBtn.addEventListener('click', startReview);
const reviewExitBtn = $('reviewExit');
if (reviewExitBtn) reviewExitBtn.addEventListener('click', endReview);

/* 📊 리포트 */
if (ui.reportBtn) ui.reportBtn.addEventListener('click', openReport);

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
if (ui.reportModal) {
  $('reportClose').addEventListener('click', closeModals);
  $('reportDone').addEventListener('click', closeModals);
  ui.reportModal.addEventListener('click', (e) => { if (e.target === ui.reportModal) closeModals(); });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModals();
});

/* 과목 탭 */
['tabMath', 'tabDict', 'tabEng'].forEach((id) => {
  const b = $(id);
  if (!b) return;
  const key = { tabMath: 'math', tabDict: 'dict', tabEng: 'eng' }[id];
  b.addEventListener('click', () => {
    setSubject(key);
    playSound('tap');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

/* ---------- 시작 ---------- */
loadHistory();                     // 지난번에 풀던 문제들 되살리기
renderStatus();
renderQuestion(makeQuestion());
renderMission();
renderReviewButton();
setSubject(state.subject || 'math');   // 마지막에 보던 과목으로 열기
if (state.orange >= 100 && !currentJourneyWish()) {
  setTimeout(() => openFairy(true), 700);
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
      const b = ui.fbActions.querySelector('#fbNextBtn')
        || [...ui.fbActions.querySelectorAll('button')].find((x) => /다음 문제/.test(x.textContent));
      if (b) b.click();
      return !!b;
    },
    retry() {
      const btn = ui.fbActions.querySelector('#fbRetryBtn')
        || [...ui.fbActions.querySelectorAll('button')].find((b) => /다시 풀어보기/.test(b.textContent));
      if (btn) btn.click();
      return !!btn;
    },
    setOrange(n) {
      state.orange = n;
      saveState();
      renderStatus();
    },
    /* --- 5종 업그레이드용 확인 도구 --- */
    get entry() { return active; },
    get historyInfo() { return { len: history.length, index: hIndex, no: active ? active.no : 0, mode: active ? active.mode : null }; },
    historyStore() {
      try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const saved = raw ? JSON.parse(raw) : null;
        return saved ? { no: saved.no, len: (saved.entries || []).length } : null;
      } catch (e) { return null; }
    },
    prev() { return goBack(); },
    forward() { return goForward(); },
    goNext() { return goNext(); },
    nextId() {
      const b = ui.fbActions.querySelector('button');
      return b ? b.id : '';
    },
    get fairy() {
      return {
        open: fairyModalOpen(),
        celebrate: !!(ui.fairyCard && ui.fairyCard.classList.contains('celebrate')),
        text: ui.fairyText ? ui.fairyText.textContent : '',
        actions: ui.fairyActions ? [...ui.fairyActions.querySelectorAll('button')].map((b) => b.textContent) : []
      };
    },
    openFairy(on) { openFairy(on); return this.fairy; },
    closeFairy() { closeFairy(); return this.fairy; },
    tapRank() { if (ui.rankBadge) ui.rankBadge.click(); return this.fairy; },
    get mission() { return { solved: state.today.solved, done: !!state.today.missionDone, shown: (ui.missionCount || {}).textContent || '' }; },
    setTodaySolved(n) {
      state.today.solved = Math.max(0, Number(n) || 0);
      state.today.correct = Math.min(state.today.correct, state.today.solved);
      state.today.missionDone = state.today.solved >= 5 && state.today.missionDone;
      saveState();
      renderStatus();
    },
    get wrong() { return state.wrongList.map((w) => ({ id: w.id, type: w.type, misses: w.misses })); },
    get byCat() { return JSON.parse(JSON.stringify(state.byCat)); },
    startReview() { startReview(); return { active: reviewActive, queue: reviewQueue.length, mode: active ? active.mode : null }; },
    endReview() { endReview(); },
    openReport() { openReport(); return true; },
    reportText() { return ui.reportBody ? ui.reportBody.innerText : ''; },
    reportBars() {
      return [...ui.reportBody.querySelectorAll('.rep-cat')]
        .filter((el) => el.dataset.cat)
        .map((el) => ({
          cat: el.dataset.cat,
          pct: el.querySelector('.rep-cat-head b').textContent,
          width: el.querySelector('.rep-bar i').style.width
        }));
    },
    reportEngBars() {
      return [...ui.reportBody.querySelectorAll('.rep-cat')]
        .filter((el) => el.dataset.course)
        .map((el) => ({
          course: el.dataset.course,
          pct: el.querySelector('.rep-cat-head b').textContent,
          foot: el.querySelector('.rep-cat-foot').textContent
        }));
    },
    get repSubjCards() {
      return [...ui.reportBody.querySelectorAll('.rep-subj-card')].map((el) => ({
        subj: el.dataset.subj,
        rate: el.querySelector('.rs-rate').textContent,
        foot: el.querySelector('.rs-foot').textContent
      }));
    },
    reportDictBars() {
      return [...ui.reportBody.querySelectorAll('.rep-cat')]
        .filter((el) => el.dataset.round)
        .map((el) => ({
          round: el.dataset.round,
          pct: el.querySelector('.rep-cat-head b').textContent
        }));
    },
    openWish() { openWishModal(false); },
    coupons() { renderCoupons(); ui.couponModal.hidden = false; document.body.style.overflow = 'hidden'; },
    resetJourney() { startNewJourney(); },
    clearFx() {
      particles = [];
      oranges = [];
      fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    },
    /* v6: 🍊 감 배지 · 감 비 */
    tapOrange() { return orangeBadgeTap(); },
    get fx() {
      return {
        oranges: oranges.length,
        particles: particles.length,
        running: fxRunning,
        pixels: (() => {
          try {
            const d = fxCtx.getImageData(0, 0, fxCanvas.width, fxCanvas.height).data;
            let n = 0;
            for (let i = 3; i < d.length; i += 4) { if (d[i] > 8) n++; }
            return n;
          } catch (e) { return -1; }
        })()
      };
    },
    get orangeBadge() {
      const el = ui.orangeBadge;
      return el ? {
        tag: el.tagName,
        label: el.getAttribute('aria-label') || '',
        text: el.textContent.trim(),
        tapped: el.classList.contains('tapped'),
        minHeight: Math.round(el.getBoundingClientRect().height)
      } : null;
    },
    get toastInfo() {
      return ui.toast ? { hidden: ui.toast.hidden, text: ui.toast.textContent.trim() } : null;
    },
    get feedbackSub() { return ui.fbSub ? ui.fbSub.textContent : ''; },
    /* v4 과목 탭 */
    subject(name) { const s = setSubject(name); return { subject: s, mathHidden: $('mathPane').hidden, dictHidden: $('dictPane').hidden, engHidden: $('engPane').hidden }; },
    get subj() { return JSON.parse(JSON.stringify(state.subj || {})); },
    makeQuestion
  };
}
