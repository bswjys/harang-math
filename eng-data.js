/* ===== 공부하랑핑 v7 — 🔤 초등 1학년 영어 데이터 =====
   · 4가지 코스: 🐾 그림 영단어 / 🔊 소리 듣고 찾기 / 💬 생활 영어 한마디 / 🧩 빈칸 알파벳
   · 총 76문항 — 모든 문항에 영어 듣기(en-US-AnaNeural MP3)와 한 줄 해설
   · say 는 그대로 읽어 주는 영어 문장입니다 (MP3 파일 이름: audio/eng/{코스}-{번호}.mp3)
*/
'use strict';

window.ENG_COURSES = [
  /* ---------------------------------------------------------------
     1) 🐾 그림 영단어 — 그림 + 뜻을 보고 알맞은 영어 낱말 고르기
     --------------------------------------------------------------- */
  {
    key: 'pic',
    label: '그림 영단어',
    emoji: '🐾',
    rule: '그림과 뜻을 보고 알맞은 영어 낱말을 골라요',
    items: [
      { id: 'pic-1',  group: 'animal', emoji: '🐱', ko: '고양이',   en: 'cat',        say: 'cat',        tip: 'cat [캣] 은 고양이! 짧게 캣- 하고 읽어요.' },
      { id: 'pic-2',  group: 'animal', emoji: '🐶', ko: '강아지',   en: 'dog',        say: 'dog',        tip: 'dog [독] 은 강아지! 멍멍 소리 나는 낱말이에요.' },
      { id: 'pic-3',  group: 'animal', emoji: '🐷', ko: '돼지',     en: 'pig',        say: 'pig',        tip: 'pig [피그] 는 돼지! 꿀꿀 돼지예요.' },
      { id: 'pic-4',  group: 'animal', emoji: '🦆', ko: '오리',     en: 'duck',       say: 'duck',       tip: 'duck [덕] 은 오리! 꽥꽥 오리예요.' },
      { id: 'pic-5',  group: 'animal', emoji: '🐰', ko: '토끼',     en: 'rabbit',     say: 'rabbit',     tip: 'rabbit [래빗] 은 토끼! 깡총깡총 토끼예요.' },
      { id: 'pic-6',  group: 'animal', emoji: '🐯', ko: '호랑이',   en: 'tiger',      say: 'tiger',      tip: 'tiger [타이거] 는 호랑이! 어흥 호랑이예요.' },
      { id: 'pic-7',  group: 'animal', emoji: '🐵', ko: '원숭이',   en: 'monkey',     say: 'monkey',     tip: 'monkey [멍키] 는 원숭이! 나무를 잘 타요.' },

      { id: 'pic-8',  group: 'fruit',  emoji: '🍎', ko: '사과',     en: 'apple',      say: 'apple',      tip: 'apple [애플] 은 사과! 아삭아삭 사과예요.' },
      { id: 'pic-9',  group: 'fruit',  emoji: '🍌', ko: '바나나',   en: 'banana',     say: 'banana',     tip: 'banana [버내너] 는 바나나! 노란 바나나예요.' },
      { id: 'pic-10', group: 'fruit',  emoji: '🍇', ko: '포도',     en: 'grapes',     say: 'grapes',     tip: 'grapes [그레이프스] 는 포도! 알알이 모여 있어요.' },
      { id: 'pic-11', group: 'fruit',  emoji: '🍓', ko: '딸기',     en: 'strawberry', say: 'strawberry', tip: 'strawberry [스트로베리] 는 딸기! 빨갛고 달콤해요.' },
      { id: 'pic-12', group: 'fruit',  emoji: '🍊', ko: '오렌지',   en: 'orange',     say: 'orange',     tip: 'orange [오린지] 는 오렌지! 색깔 이름도 같아요.' },
      { id: 'pic-13', group: 'fruit',  emoji: '🍉', ko: '수박',     en: 'watermelon', say: 'watermelon', tip: 'watermelon [워터멜론] 은 수박! 여름 과일이에요.' },

      { id: 'pic-14', group: 'color',  emoji: '🔴', ko: '빨강',     en: 'red',        say: 'red',        tip: 'red [레드] 는 빨강! 사과 색깔이에요.' },
      { id: 'pic-15', group: 'color',  emoji: '🔵', ko: '파랑',     en: 'blue',       say: 'blue',       tip: 'blue [블루] 는 파랑! 하늘 색깔이에요.' },
      { id: 'pic-16', group: 'color',  emoji: '🟡', ko: '노랑',     en: 'yellow',     say: 'yellow',     tip: 'yellow [옐로] 는 노랑! 바나나 색깔이에요.' },
      { id: 'pic-17', group: 'color',  emoji: '🟢', ko: '초록',     en: 'green',      say: 'green',      tip: 'green [그린] 은 초록! 나뭇잎 색깔이에요.' },
      { id: 'pic-18', group: 'color',  emoji: '🌸', ko: '분홍',     en: 'pink',       say: 'pink',       tip: 'pink [핑크] 는 분홍! 하랑핑 색깔이에요.' },
      { id: 'pic-19', group: 'color',  emoji: '⚫', ko: '검정',     en: 'black',      say: 'black',      tip: 'black [블랙] 은 검정! 까만 밤 색깔이에요.' },

      { id: 'pic-20', group: 'family', emoji: '👩', ko: '엄마',     en: 'mother',     say: 'mother',     tip: 'mother [마더] 는 엄마! 다정한 엄마예요.' },
      { id: 'pic-21', group: 'family', emoji: '👨', ko: '아빠',     en: 'father',     say: 'father',     tip: 'father [파더] 는 아빠! 힘센 아빠예요.' },
      { id: 'pic-22', group: 'family', emoji: '👧', ko: '언니·누나', en: 'sister',    say: 'sister',     tip: 'sister [시스터] 는 자매! 언니도 누나도 sister예요.' },
      { id: 'pic-23', group: 'family', emoji: '👦', ko: '오빠·형',   en: 'brother',   say: 'brother',    tip: 'brother [브라더] 는 형제! 오빠도 형도 brother예요.' },
      { id: 'pic-24', group: 'family', emoji: '👶', ko: '아기',     en: 'baby',       say: 'baby',       tip: 'baby [베이비] 는 아기! 응애응애 아기예요.' }
    ]
  },

  /* ---------------------------------------------------------------
     2) 🔊 소리 듣고 찾기 — 영어 발음을 듣고 알파벳(대소문자) / 기초 단어 찾기
     --------------------------------------------------------------- */
  {
    key: 'listen',
    label: '소리 듣고 찾기',
    emoji: '🔊',
    rule: '영어 소리를 듣고 알파벳이나 낱말을 찾아요',
    items: [
      { id: 'lis-1',  kind: 'letter', letter: 'a', say: 'ay', tip: 'A는 [에이] 하고 읽어요. 대문자 A, 소문자 a!' },
      { id: 'lis-2',  kind: 'letter', letter: 'b', say: 'B', tip: 'B는 [비] 하고 읽어요. 대문자 B, 소문자 b!' },
      { id: 'lis-3',  kind: 'letter', letter: 'c', say: 'C', tip: 'C는 [씨] 하고 읽어요. 대문자 C, 소문자 c!' },
      { id: 'lis-4',  kind: 'letter', letter: 'd', say: 'D', tip: 'D는 [디] 하고 읽어요. 대문자 D, 소문자 d!' },
      { id: 'lis-5',  kind: 'letter', letter: 'e', say: 'ee', tip: 'E는 [이] 하고 읽어요. 대문자 E, 소문자 e!' },
      { id: 'lis-6',  kind: 'letter', letter: 'f', say: 'eff', tip: 'F는 [에프] 하고 읽어요. 대문자 F, 소문자 f!' },
      { id: 'lis-7',  kind: 'letter', letter: 'g', say: 'G', tip: 'G는 [지] 하고 읽어요. 대문자 G, 소문자 g!' },
      { id: 'lis-8',  kind: 'letter', letter: 'h', say: 'H', tip: 'H는 [에이치] 하고 읽어요. 대문자 H, 소문자 h!' },
      { id: 'lis-9',  kind: 'letter', letter: 'k', say: 'K', tip: 'K는 [케이] 하고 읽어요. 대문자 K, 소문자 k!' },
      { id: 'lis-10', kind: 'letter', letter: 'm', say: 'M', tip: 'M은 [엠] 하고 읽어요. 대문자 M, 소문자 m!' },
      { id: 'lis-11', kind: 'letter', letter: 's', say: 'S', tip: 'S는 [에스] 하고 읽어요. 대문자 S, 소문자 s!' },
      { id: 'lis-12', kind: 'letter', letter: 't', say: 'T', tip: 'T는 [티] 하고 읽어요. 대문자 T, 소문자 t!' },

      { id: 'lis-13', kind: 'word', word: 'apple',  emoji: '🍎', ko: '사과',   say: 'apple',  tip: 'apple [애플] 은 사과예요.' },
      { id: 'lis-14', kind: 'word', word: 'dog',    emoji: '🐶', ko: '강아지', say: 'dog',    tip: 'dog [독] 은 강아지예요.' },
      { id: 'lis-15', kind: 'word', word: 'milk',   emoji: '🥛', ko: '우유',   say: 'milk',   tip: 'milk [밀크] 는 우유예요.' },
      { id: 'lis-16', kind: 'word', word: 'star',   emoji: '⭐', ko: '별',     say: 'star',   tip: 'star [스타] 는 별이에요.' },
      { id: 'lis-17', kind: 'word', word: 'book',   emoji: '📚', ko: '책',     say: 'book',   tip: 'book [북] 은 책이에요.' },
      { id: 'lis-18', kind: 'word', word: 'fish',   emoji: '🐟', ko: '물고기', say: 'fish',   tip: 'fish [피시] 는 물고기예요.' },
      { id: 'lis-19', kind: 'word', word: 'moon',   emoji: '🌙', ko: '달',     say: 'moon',   tip: 'moon [문] 은 달이에요.' },
      { id: 'lis-20', kind: 'word', word: 'bus',    emoji: '🚌', ko: '버스',   say: 'bus',    tip: 'bus [버스] 는 버스예요. 우리 말과 비슷해요!' }
    ]
  },

  /* ---------------------------------------------------------------
     3) 💬 생활 영어 한마디 — 이런 때는 뭐라고 말할까?
     --------------------------------------------------------------- */
  {
    key: 'talk',
    label: '생활 영어 한마디',
    emoji: '💬',
    rule: '이런 때는 영어로 뭐라고 말할까요?',
    items: [
      { id: 'talk-1',  when: '아침에 선생님을 만났어요',      en: 'Good morning!',        ko: '좋은 아침이에요!',   say: 'Good morning!',        tip: '아침 인사는 Good morning! 이에요.' },
      { id: 'talk-2',  when: '친구를 만나서 인사해요',        en: 'Hello!',               ko: '안녕!',              say: 'Hello!',               tip: '가볍게 만났을 때는 Hello! 하고 인사해요.' },
      { id: 'talk-3',  when: '선물을 받아서 고마워요',        en: 'Thank you!',           ko: '고마워요!',          say: 'Thank you!',           tip: '고마울 때는 Thank you! 예요.' },
      { id: 'talk-4',  when: '친구 물건을 떨어뜨려서 미안해요', en: 'I\'m sorry.',         ko: '미안해요.',          say: 'I am sorry.',          tip: '미안할 때는 I am sorry. 예요.' },
      { id: 'talk-5',  when: '가족에게 사랑한다고 말해요',    en: 'I love you!',          ko: '사랑해요!',          say: 'I love you!',          tip: '사랑한다는 말은 I love you! 예요.' },
      { id: 'talk-6',  when: '밤에 자러 갈 때',               en: 'Good night!',          ko: '잘 자요!',           say: 'Good night!',          tip: '잘 자요 인사는 Good night! 이에요.' },
      { id: 'talk-7',  when: '헤어질 때',                     en: 'Good bye!',            ko: '안녕히 가세요!',     say: 'Good bye!',            tip: '헤어질 때는 Good bye! 예요.' },
      { id: 'talk-8',  when: '또 만나자고 말할 때',           en: 'See you!',             ko: '또 봐!',             say: 'See you!',             tip: '또 만나자는 말은 See you! 예요.' },
      { id: 'talk-9',  when: '친구 안부를 물을 때',           en: 'How are you?',         ko: '잘 지내?',           say: 'How are you?',         tip: '안부를 물을 때는 How are you? 예요.' },
      { id: 'talk-10', when: '기분 좋다고 대답할 때',         en: 'I\'m fine, thank you.', ko: '잘 지내, 고마워!',  say: 'I am fine, thank you.', tip: 'How are you? 에는 I am fine, thank you. 하고 대답해요.' },
      { id: 'talk-11', when: '내 이름을 말할 때',             en: 'My name is Harang.',   ko: '내 이름은 하랑이에요.', say: 'My name is Harang.',  tip: '내 이름은 My name is 하랑. 하고 말해요.' },
      { id: 'talk-12', when: '처음 만난 친구에게',            en: 'Nice to meet you!',    ko: '만나서 반가워!',     say: 'Nice to meet you!',    tip: '처음 만나면 Nice to meet you! 예요.' },
      { id: 'talk-13', when: '친구 생일을 축하해요',          en: 'Happy birthday!',      ko: '생일 축하해!',       say: 'Happy birthday!',      tip: '생일 축하는 Happy birthday! 예요.' },
      { id: 'talk-14', when: '같이 가자고 해요',              en: 'Let\'s go!',           ko: '가자!',              say: 'Let us go!',           tip: '같이 가자는 말은 Let us go! 예요.' },
      { id: 'talk-15', when: '배가 고플 때',                  en: 'I\'m hungry.',         ko: '배고파요.',          say: 'I am hungry.',         tip: '배고플 때는 I am hungry. 예요.' },
      { id: 'talk-16', when: '기분이 아주 좋을 때',           en: 'I\'m happy!',          ko: '행복해요!',          say: 'I am happy!',          tip: '기분이 좋으면 I am happy! 예요.' }
    ]
  },

  /* ---------------------------------------------------------------
     4) 🧩 빈칸 알파벳 — 그림과 뜻을 보고 빠진 알파벳 넣기
     --------------------------------------------------------------- */
  {
    key: 'blank',
    label: '빈칸 알파벳',
    emoji: '🧩',
    rule: '그림과 뜻을 보고 빠진 알파벳을 넣어요',
    items: [
      { id: 'blk-1',  en: 'cat',  emoji: '🐱', ko: '고양이',   blank: 1, answer: 'a', choices: ['a', 'e', 'o', 'u'], tip: 'c-a-t! 가운데는 a예요. cat [캣] 고양이!' },
      { id: 'blk-2',  en: 'dog',  emoji: '🐶', ko: '강아지',   blank: 1, answer: 'o', choices: ['o', 'a', 'i', 'u'], tip: 'd-o-g! 가운데는 o예요. dog [독] 강아지!' },
      { id: 'blk-3',  en: 'pig',  emoji: '🐷', ko: '돼지',     blank: 1, answer: 'i', choices: ['i', 'a', 'e', 'u'], tip: 'p-i-g! 가운데는 i예요. pig [피그] 돼지!' },
      { id: 'blk-4',  en: 'sun',  emoji: '☀️', ko: '해',       blank: 1, answer: 'u', choices: ['u', 'a', 'o', 'e'], tip: 's-u-n! 가운데는 u예요. sun [썬] 해!' },
      { id: 'blk-5',  en: 'bed',  emoji: '🛏️', ko: '침대',     blank: 1, answer: 'e', choices: ['e', 'a', 'i', 'o'], tip: 'b-e-d! 가운데는 e예요. bed [베드] 침대!' },
      { id: 'blk-6',  en: 'hat',  emoji: '🎩', ko: '모자',     blank: 1, answer: 'a', choices: ['a', 'e', 'i', 'o'], tip: 'h-a-t! 가운데는 a예요. hat [햇] 모자!' },
      { id: 'blk-7',  en: 'box',  emoji: '📦', ko: '상자',     blank: 1, answer: 'o', choices: ['o', 'a', 'e', 'u'], tip: 'b-o-x! 가운데는 o예요. box [박스] 상자!' },
      { id: 'blk-8',  en: 'cup',  emoji: '🥤', ko: '컵',       blank: 1, answer: 'u', choices: ['u', 'a', 'e', 'i'], tip: 'c-u-p! 가운데는 u예요. cup [컵] 컵!' },
      { id: 'blk-9',  en: 'fish', emoji: '🐟', ko: '물고기',   blank: 1, answer: 'i', choices: ['i', 'a', 'e', 'o'], tip: 'f-i-s-h! 두 번째는 i예요. fish [피시] 물고기!' },
      { id: 'blk-10', en: 'milk', emoji: '🥛', ko: '우유',     blank: 1, answer: 'i', choices: ['i', 'e', 'a', 'u'], tip: 'm-i-l-k! 두 번째는 i예요. milk [밀크] 우유!' },
      { id: 'blk-11', en: 'book', emoji: '📚', ko: '책',       blank: 1, answer: 'o', choices: ['o', 'e', 'a', 'u'], tip: 'b-o-o-k! 두 번째는 o예요. book [북] 책!' },
      { id: 'blk-12', en: 'star', emoji: '⭐', ko: '별',       blank: 2, answer: 'a', choices: ['a', 'e', 'i', 'o'], tip: 's-t-a-r! 세 번째는 a예요. star [스타] 별!' },
      { id: 'blk-13', en: 'red',  emoji: '🔴', ko: '빨강',     blank: 1, answer: 'e', choices: ['e', 'a', 'i', 'u'], tip: 'r-e-d! 가운데는 e예요. red [레드] 빨강!' },
      { id: 'blk-14', en: 'blue', emoji: '🔵', ko: '파랑',     blank: 2, answer: 'u', choices: ['u', 'o', 'a', 'e'], tip: 'b-l-u-e! 세 번째는 u예요. blue [블루] 파랑!' },
      { id: 'blk-15', en: 'kite', emoji: '🪁', ko: '연',       blank: 1, answer: 'i', choices: ['i', 'a', 'e', 'o'], tip: 'k-i-t-e! 두 번째는 i예요. kite [카이트] 연!' },
      { id: 'blk-16', en: 'tree', emoji: '🌳', ko: '나무',     blank: 2, answer: 'e', choices: ['e', 'a', 'i', 'o'], tip: 't-r-e-e! 세 번째는 e예요. tree [트리] 나무!' }
    ]
  }
];
