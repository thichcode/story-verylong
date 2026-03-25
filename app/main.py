import json
import logging
import os
from pathlib import Path
from typing import List

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.story_engine import (
    CULTIVATION_SYSTEM,
    STORIES,
    StoryContinueRequest,
    StoryGenerator,
    StoryRequest,
    StoryResponse,
    TrendingGenre,
    TRENDING_GENRES,
    normalize_story_data,
)

BASE = Path(__file__).resolve().parent.parent
STATIC = BASE / "static"
STATIC.mkdir(exist_ok=True)

AUTH_LOG_DIR = Path('/var/log/story-superlong')
AUTH_LOG_DIR.mkdir(parents=True, exist_ok=True)
AUTH_LOG_FILE = AUTH_LOG_DIR / 'auth.log'
AUTH_LOG_FILE.touch(exist_ok=True)
auth_logger = logging.getLogger('story-superlong-auth')
if not auth_logger.handlers:
    handler = logging.FileHandler(AUTH_LOG_FILE)
    handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    auth_logger.addHandler(handler)
auth_logger.setLevel(logging.WARNING)

AUTH_TOKEN = os.environ.get('STORY_API_TOKEN', 'omni-token')

app = FastAPI(title="Story VeryLong")
app.mount("/static", StaticFiles(directory=STATIC), name="static")

generator = StoryGenerator()


def authorize(request: Request) -> None:
    client_ip = request.client.host if request.client else 'unknown'
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        auth_logger.warning('Unauthorized Story API access from %s (missing Bearer)', client_ip)
        raise HTTPException(status_code=401, detail='Missing bearer token')
    token = auth_header.split(' ', 1)[1] if ' ' in auth_header else ''
    if token != AUTH_TOKEN:
        auth_logger.warning('Unauthorized Story API access from %s (invalid token)', client_ip)
        raise HTTPException(status_code=403, detail='Invalid token')


@app.post("/api/story", dependencies=[Depends(authorize)], response_model=StoryResponse)
def build_story(pr: StoryRequest):
    return generator.build_story(pr)


@app.post('/api/story/continue', dependencies=[Depends(authorize)], response_model=StoryResponse)
def continue_story(req: StoryContinueRequest):
    story = generator.continue_story(req.story_id, req)
    if not story:
        raise HTTPException(status_code=404, detail='story not found')
    return story


@app.get("/stories")
def list_stories():
    return generator.list_story_ids()


@app.get("/api/story/list")
def story_list():
    results = []
    for path in STORIES.glob("*.json"):
        story = normalize_story_data(json.loads(path.read_text()))
        results.append({
            "id": story["id"],
            "title": story["title"],
            "summary": story.get("summary", ""),
            "language": story.get("language", "English"),
            "chapters": story.get("chapters", []),
            "tags": story.get("tags", []),
            "genres": story.get("genres", []),
            "subGenres": story.get("subGenres", []),
            "tone": story.get("tone", "epic"),
            "toneTags": story.get("toneTags", []),
            "powerStyles": story.get("powerStyles", []),
            "metadata": story.get("metadata", {}),
            "pacing": story.get("pacing", story.get("metadata", {}).get("progression", {}).get("pace", "medium")),
            "updated_at": story.get("updated_at", story.get("created_at")),
        })
    return results


@app.get("/api/trending", response_model=List[TrendingGenre])
def get_trending():
    return TRENDING_GENRES


@app.get("/api/system/cultivation")
def cultivation_system():
    return CULTIVATION_SYSTEM


@app.get("/")
def root():
    return FileResponse(STATIC / "index.html")
