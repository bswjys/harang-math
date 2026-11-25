#!/usr/bin/env python3
"""받아쓰기 110문장 → 또렷한 여자 목소리 MP3 생성 (edge-tts, ko-KR-SunHiNeural, pitch=+6Hz)

사용: python3 tools/make_dict_audio.py                 # 110문장 전부
      python3 tools/make_dict_audio.py r5-1 r7-10      # 지정한 문장만 (색인은 나머지 그대로)
결과: audio/dict/{회차키}-{번호}.mp3  (예: audio/dict/r1-1.mp3)
"""
import asyncio
import json
import os
import re
import sys

import edge_tts

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
DATA = os.path.join(ROOT, 'dict-data.js')
OUT = os.path.join(ROOT, 'audio', 'dict')
VOICE = 'ko-KR-SunHiNeural'
PITCH = '+6Hz'
RATE = '+0%'
PARALLEL = 8


def load_rounds():
    """dict-data.js에서 key/items[].text를 순서대로 뽑아낸다."""
    src = open(DATA, encoding='utf-8').read()
    rounds = []
    for m in re.finditer(r"key:\s*'([^']+)'", src):
        rounds.append({'key': m.group(1), 'start': m.end()})
    for i, r in enumerate(rounds):
        end = rounds[i + 1]['start'] if i + 1 < len(rounds) else len(src)
        chunk = src[r['start']:end]
        texts = re.findall(r"\{ text: '((?:[^'\\]|\\.)*)'", chunk)
        r['texts'] = [t.replace("\\'", "'") for t in texts]
        del r['start']
    return [r for r in rounds if r['texts']]


async def synth(sem, key, n, text, results):
    path = os.path.join(OUT, f'{key}-{n}.mp3')
    async with sem:
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(text, VOICE, pitch=PITCH, rate=RATE)
                await comm.save(path)
                size = os.path.getsize(path)
                if size > 1024:
                    results.append({'id': f'{key}-{n}', 'text': text, 'size': size, 'ok': True})
                    return
            except Exception as e:  # 재시도
                if attempt == 2:
                    results.append({'id': f'{key}-{n}', 'text': text, 'size': 0, 'ok': False, 'error': str(e)})
                await asyncio.sleep(1.2 * (attempt + 1))


async def main():
    only = {a for a in sys.argv[1:] if re.match(r'^[a-z]+\d+-\d+$', a)}
    rounds = load_rounds()
    total = sum(len(r['texts']) for r in rounds)
    print(f'문장 {total}개 / 회차 {len(rounds)}개 → {OUT}' + (f' · 지정 {sorted(only)}만' if only else ''))
    os.makedirs(OUT, exist_ok=True)
    sem = asyncio.Semaphore(PARALLEL)
    results = []
    tasks = []
    for r in rounds:
        for i, text in enumerate(r['texts']):
            if only and f'{r["key"]}-{i + 1}' not in only:
                continue
            tasks.append(asyncio.create_task(synth(sem, r['key'], i + 1, text, results)))
    await asyncio.gather(*tasks)
    results.sort(key=lambda x: (x['id'].split('-')[0], int(x['id'].split('-')[1])))
    bad = [x for x in results if not x['ok'] or x['size'] <= 3072]
    print(f'생성 {len(results)}개 · 3KB 초과 {len(results) - len(bad)}개 · 실패/작음 {len(bad)}개')
    for b in bad:
        print('  BAD', b)
    index_path = os.path.join(OUT, 'index.json')
    index = {}
    if only and os.path.exists(index_path):        # 일부만 다시 만들 때는 기존 색인에 덮어쓰기
        with open(index_path, encoding='utf-8') as f:
            index = json.load(f)
    for x in results:
        if x['ok']:
            index[x['id']] = {'text': x['text'], 'size': x['size'], 'voice': VOICE, 'pitch': PITCH}
    index = dict(sorted(index.items(), key=lambda kv: (kv[0].split('-')[0], int(kv[0].split('-')[1]))))
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=1)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
