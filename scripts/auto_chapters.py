#!/usr/bin/env python3
import os
import random
import time
from pathlib import Path

import requests

BASE = Path(__file__).resolve().parent.parent
STORIES_DIR = BASE / 'stories'
TOKEN = os.environ.get('STORY_API_TOKEN', 'e2151792134cc58909c18bfbe53bba3f')
API_URL = os.environ.get('STORY_API_URL', 'http://127.0.0.1:8000/api/story/continue')
HEADERS = {'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'}

PROMPTS = [
    'Chương mới: tiến công bí cảnh mưa sao',
    'Chương mới: đối đầu tông môn khác',
    'Chương mới: phát hiện cơ duyên luyện đan',
]


def available_stories():
    return [p.stem for p in STORIES_DIR.glob('story-*.json')]


def main():
    for story_id in available_stories():
        payload = {
            'story_id': story_id,
            'chapters': 1,
            'tone': 'sảng văn',
            'focus': random.choice(['trận pháp', 'tiến cảnh', 'lôi phá']),
            'genres': ['xuyên không', 'tu tiên'],
            'subGenres': ['bí cảnh', 'tông môn'],
        }
        resp = requests.post(API_URL, headers=HEADERS, json=payload)
        if resp.ok:
            print('added chapter for', story_id)
        else:
            print('failed', story_id, resp.status_code, resp.text)
        time.sleep(0.2)


if __name__ == '__main__':
    main()
