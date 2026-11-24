#!/usr/bin/env python3
"""영어 76문항 → 귀여운 영어 여자아이 목소리 MP3 생성 (edge-tts, en-US-AnaNeural)

사용: python3 tools/make_eng_audio.py
결과: audio/eng/{코스키}-{번호}.mp3  (예: audio/eng/pic-1.mp3)
"""
import asyncio
import json
import os
import re
import sys

import edge_tts

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
DATA = os.path.join(ROOT, 'eng-data.js')
OUT = os.path.join(ROOT, 'audio', 'eng')
VOICE = 'en-US-AnaNeural'
FALLBACK = 'en-US-JennyNeural'
PARALLEL = 8


def unesc(s):
    return s.replace("\\'", "'").replace('\\\\', '\\')


def load_items():
    src = open(DATA, encoding='utf-8').read()
    courses = []
    cur = None
    for line in src.splitlines():
        m = re.match(r"\s*key:\s*'([a-z]+)',\s*$", line)
        if m:
            cur = {'key': m.group(1), 'items': []}
            courses.append(cur)
            continue
        m = re.match(r"\s*\{\s*id:\s*'([^']+)'", line)
        if not m or cur is None:
            continue
        item_id = m.group(1)
        say = re.search(r"say:\s*'((?:[^'\\]|\\.)*)'", line)
        en = re.search(r"\ben:\s*'((?:[^'\\]|\\.)*)'", line)
        text = unesc(say.group(1)) if say else (unesc(en.group(1)) if en else None)
        if text:
            cur['items'].append({'id': item_id, 'text': text})
    return [c for c in courses if c['items']]


async def synth(sem, voice, path, text, results, ident):
    async with sem:
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(text, voice)
                await comm.save(path)
                size = os.path.getsize(path)
                if size > 1024:
                    results.append({'id': ident, 'text': text, 'size': size, 'voice': voice, 'ok': True})
                    return
            except Exception as e:
                if attempt == 2:
                    results.append({'id': ident, 'text': text, 'size': 0, 'voice': voice, 'ok': False, 'error': str(e)})
                await asyncio.sleep(1.2 * (attempt + 1))


async def main():
    courses = load_items()
    total = sum(len(c['items']) for c in courses)
    print(f"코스 {len(courses)}개 / 문항 {total}개 → {OUT}")
    os.makedirs(OUT, exist_ok=True)
    sem = asyncio.Semaphore(PARALLEL)
    results = []
    tasks = []
    for c in courses:
        for i, item in enumerate(c['items']):
            ident = f"{c['key']}-{i + 1}"
            path = os.path.join(OUT, ident + '.mp3')
            tasks.append(asyncio.create_task(synth(sem, VOICE, path, item['text'], results, ident)))
    await asyncio.gather(*tasks)

    # AnaNeural 실패분은 JennyNeural로 한 번 더
    bad = [r for r in results if not r['ok']]
    if bad:
        print(f"AnaNeural 실패 {len(bad)}개 → JennyNeural로 재시도")
        retry = []
        for r in bad:
            await synth(sem, FALLBACK, os.path.join(OUT, r['id'] + '.mp3'), r['text'], retry, r['id'])
        retry_ids = {r['id'] for r in retry if r['ok']}
        results = [r for r in results if r['ok'] or r['id'] not in retry_ids] + retry

    results.sort(key=lambda x: (x['id'].split('-')[0], int(x['id'].split('-')[1])))
    bad = [x for x in results if not x['ok'] or x['size'] <= 3072]
    print(f"생성 {len(results)}개 · 3KB 초과 {len(results) - len(bad)}개 · 실패/작음 {len(bad)}개")
    for b in bad:
        print('  BAD', b)
    with open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump({x['id']: {'text': x['text'], 'size': x['size'], 'voice': x['voice']}
                   for x in results if x['ok']}, f, ensure_ascii=False, indent=1)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
