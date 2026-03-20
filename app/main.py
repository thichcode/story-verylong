import json
import random
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE = Path(__file__).resolve().parent.parent
STORIES = BASE / "stories"
STATIC = BASE / "static"
STORIES.mkdir(exist_ok=True)

app = FastAPI(title="Story VeryLong")
app.mount("/static", StaticFiles(directory=STATIC), name="static")

GENRE_PROMPTS = {
    "Fantasy": "court intrigue, mystic travel, multi-continental war",
    "Sci-Fi": "quantum diplomacy, solar exploration, machine city",
    "Thriller": "heist planning, double agents, midnight chases",
    "Romance": "traveling poet, arranged marriage, secret reunion",
}


class StoryRequest(BaseModel):
    title: str = Field(..., min_length=3)
    genre: str = Field("Fantasy")
    tone: str = Field("epic")
    chapters: int = Field(5, ge=3, le=12)
    focus: Optional[str] = None


class StoryResponse(BaseModel):
    id: str
    title: str
    outline: List[str]
    chapters: List[str]
    summary: str
    cover: str
    created_at: str


def make_outline(title: str, genre: str, chapters: int) -> List[str]:
    base = GENRE_PROMPTS.get(genre, "web of intrigue")
    return [f"Chapter {i}: {title} — {base} scene {i}" for i in range(1, chapters + 1)]


def draft_chapter(outline_line: str, tone: str) -> str:
    verbs = {
        "epic": "commands, reveals, voyages",
        "mysterious": "whispers, shadows, slides",
        "fast": "races, dashes, erupts",
    }
    verb = verbs.get(tone, "whispers")
    return (
        f"{outline_line}. The scene {verb} with lyrical description, unresolved tension, and a high-stakes decision point."
    )


def persist_story(payload: dict) -> Path:
    slug = payload["id"]
    path = STORIES / f"{slug}.json"
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    return path


def summarize_story(chapters: List[str]) -> str:
    return " | ".join(chapters[:2]) + " ..."


@app.post("/api/story", response_model=StoryResponse)
def build_story(pr: StoryRequest):
    slug = f"story-{int(datetime.utcnow().timestamp())}"
    outline = make_outline(pr.title, pr.genre, pr.chapters)
    chapters = [draft_chapter(line, pr.tone) for line in outline]
    response = {
        "id": slug,
        "title": pr.title,
        "outline": outline,
        "chapters": chapters,
        "summary": summarize_story(chapters),
        "cover": f"A {pr.genre} odyssey in {pr.tone} tone",
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    persist_story(response)
    return response


@app.get("/stories")
def list_stories():
    return [p.stem for p in STORIES.glob("*.json")]


@app.get("/")
def root():
    return FileResponse(STATIC / "index.html")
