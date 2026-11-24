#!/usr/bin/env python3
"""받아쓰기 110문장 → 또렷한 여자 목소리 MP3 생성 (edge-tts, ko-KR-SunHiNeural, pitch=+6Hz)

사용: python3 tools/make_dict_audio.py
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
    rounds = load_rounds()
    total = sum(len(r['texts']) for r in rounds)
    print(f'문장 {total}개 / 회차 {len(rounds)}개 → {OUT}')
    os.makedirs(OUT, exist_ok=True)
    sem = asyncio.Semaphore(PARALLEL)
    results = []
    tasks = []
    for r in rounds:
        for i, text in enumerate(r['texts']):
            tasks.append(asyncio.create_task(synth(sem, r['key'], i + 1, text, results)))
    await asyncio.gather(*tasks)
    results.sort(key=lambda x: (x['id'].split('-')[0], int(x['id'].split('-')[1])))
    bad = [x for x in results if not x['ok'] or x['size'] <= 3072]
    print(f'생성 {len(results)}개 · 3KB 초과 {len(results) - len(bad)}개 · 실패/작음 {len(bad)}개')
    for b in bad:
        print('  BAD', b)
    with open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump({x['id']: {'text': x['text'], 'size': x['size'], 'voice': VOICE, 'pitch': PITCH}
                   for x in results if x['ok']}, f, ensure_ascii=False, indent=1)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
