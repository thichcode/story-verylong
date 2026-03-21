import json
import logging
import os
import random
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE = Path(__file__).resolve().parent.parent
STORIES = BASE / "stories"
STATIC = BASE / "static"
STORIES.mkdir(exist_ok=True)

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

GENRE_PROMPTS = {
    "Fantasy": "court intrigue, mystic travel, multi-continental war",
    "Sci-Fi": "quantum diplomacy, solar exploration, machine city",
    "Thriller": "heist planning, double agents, midnight chases",
    "Romance": "traveling poet, arranged marriage, secret reunion",
}

TRENDING_GENRES = [
    {
        "genre": "Fantasy",
        "headline": "Aurora courts and drifting citadels",
        "description": "Arcane democracy, skyships, and noble houses striking secret pacts.",
        "palette": "linear-gradient(145deg, rgba(124,77,255,0.92), rgba(16,185,129,0.88))",
        "momentum": 94,
        "mood_board": [
            "Lucent sigils",
            "Velvet storms",
            "Regal whisper-lines",
            "Constellation rites",
        ],
    },
    {
        "genre": "Sci-Fi",
        "headline": "Neon protocol and orbital rebellions",
        "description": "AI councils, solar scavengers, and civil pronouncements from a drifting colony.",
        "palette": "linear-gradient(145deg, rgba(14,165,233,0.95), rgba(251,191,36,0.9))",
        "momentum": 88,
        "mood_board": [
            "Chromed alleys",
            "Pulse-lit broadcasts",
            "Hologram vows",
            "Coded meteor rain",
        ],
    },
    {
        "genre": "Thriller",
        "headline": "Rain-soaked files and midnight architect",
        "description": "Surveillance officers, vault heists, and breathless bargains in shadow-drenched cities.",
        "palette": "linear-gradient(145deg, rgba(248,113,113,0.95), rgba(217,119,6,0.92))",
        "momentum": 82,
        "mood_board": [
            "Static fog",
            "Sapphire scanners",
            "Crisp whispers",
            "Steel heartbeat",
        ],
    },
    {
        "genre": "Romance",
        "headline": "Rain-burnished rooftops and secret letters",
        "description": "Star-crossed couriers, rewound time loops, and memories traced in ink.",
        "palette": "linear-gradient(145deg, rgba(236,72,153,0.9), rgba(250,204,21,0.88))",
        "momentum": 79,
        "mood_board": [
            "Velvet promises",
            "Amber rainfall",
            "Letter-bound pauses",
            "Lace pulse",
        ],
    },
]


class StoryRequest(BaseModel):
    title: str = Field(..., min_length=3)
    genre: str = Field("Fantasy")
    tone: str = Field("epic")
    chapters: int = Field(5, ge=3, le=12)
    focus: Optional[str] = None
    language: str = Field("English")


class ChapterDetail(BaseModel):
    title: str
    sections: List[str]
    cliffhanger: str


class NextPathHint(BaseModel):
    id: str
    title: str
    description: str
    focus: str


class StoryResponse(BaseModel):
    id: str
    title: str
    genre: str
    tone: str
    focus: Optional[str] = None
    outline: List[str]
    chapters: List[ChapterDetail]
    summary: str
    cover: str
    next_paths: List[NextPathHint]
    created_at: str
    language: str


class StoryContinueRequest(BaseModel):
    story_id: str
    chapters: int = Field(1, ge=1, le=6)
    tone: Optional[str] = None
    focus: Optional[str] = None
    language: Optional[str] = None


class TrendingGenre(BaseModel):
    genre: str
    headline: str
    description: str
    palette: str
    momentum: int
    mood_board: List[str]


TONE_VIBES = {
    "epic": {
        "opening": "Golden standards ripple as ancient drums answer each breath, promising continents of change.",
        "escalation": "Legions of feeling march in rhyme, carrying prophecies and promises through the halls.",
        "cliff": "The horizon cracks open with a tide of lightning, daring anyone to name the next command.",
    },
    "mysterious": {
        "opening": "Moonlit corridors exhale breathy secrets that cling to every shoulder.",
        "escalation": "Shadows braid with whispers, dragging the cast toward a veiled ledger they almost can read.",
        "cliff": "A sudden hush swallows footsteps, leaving one single lantern flicker to count the betrayals to come.",
    },
    "fast": {
        "opening": "Neon streaks and racing pulses turn each glance into a sprinting frame.",
        "escalation": "Sirens mash with breathless commands, making leaps between tense arguments and impulsive breaks.",
        "cliff": "The tempo shatters, the next beat still unwritten, and every throat tightens for the drop.",
    },
}

DEFAULT_TONE_VIBE = {
    "opening": "A restless wind sketches outlines across the stage, pulsing with unnamed intent.",
    "escalation": "Tension coils with slow heat, daring the players to stretch further than comfort allows.",
    "cliff": "The air crystalizes, freezing a single question in the throat that will not be answered yet.",
}

NEXT_PATH_TEMPLATES = [
    (
        "Shadow the dissenting envoy",
        "Disguises and furtive notes will reveal the pact that could tilt the court.",
        "dissenting envoy",
    ),
    (
        "Scale the drifting citadel",
        "Skyships glow with signal fires, urging the crew to witness its council of ghosts.",
        "drifting citadel",
    ),
    (
        "Uncover the hypernet leak",
        "Binary rain and forged transmissions point to a traitor near the core.",
        "hypernet leak",
    ),
    (
        "Lean into the tempest romance",
        "Heartbeats sync with thunder, pulling two rivals toward a shared secret.",
        "tempest romance",
    ),
    (
        "Barter for the midnight ledger",
        "Cryptic ledgers whisper of betrayals yet unwritten beneath neon skylines.",
        "midnight ledger",
    ),
]


def make_outline(title: str, genre: str, chapters: int) -> List[str]:
    base = GENRE_PROMPTS.get(genre, "web of intrigue")
    return [f"Chapter {i}: {title} — {base} scene {i}" for i in range(1, chapters + 1)]


def _tone_vibe(tone: str) -> dict:
    return TONE_VIBES.get(tone, DEFAULT_TONE_VIBE)


def _focus_phrase(focus: Optional[str]) -> str:
    if focus:
        return focus.strip()
    return "a restless current of ambition"


def craft_chapter(index: int, outline_line: str, tone: str, focus: Optional[str]) -> dict:
    vibe = _tone_vibe(tone)
    focus_text = _focus_phrase(focus)
    focus_sentence = f"Focus threads the narrative through {focus_text}."
    opening = (
        f"Setup: {outline_line}. {vibe['opening']} {focus_sentence} "
        "Cameras drift across gestures, letting the viewer absorb key stakes."
    )
    escalation = (
        f"Escalation: {vibe['escalation']} {focus_sentence} "
        "Allies and rivals move like choreography, each beat stretching the drama longer."
    )
    cliffhanger = (
        f"Cliffhanger: {vibe['cliff']} {focus_sentence} "
        "No answer yet arrives, and every door within the scene remains locked."
    )
    title = f"Chapter {index}"
    return {
        "title": title,
        "sections": [opening, escalation],
        "cliffhanger": cliffhanger,
    }


def generate_next_paths(story_id: str, last_cliffhanger: str, tone: str, focus: Optional[str], count: int = 3) -> List[dict]:
    pool = NEXT_PATH_TEMPLATES.copy()
    selected = random.sample(pool, k=min(count, len(pool)))
    anchor = focus or tone
    cliff_note = f" The lingering echo: {last_cliffhanger}" if last_cliffhanger else ""
    hints = []
    for idx, (title, description, focus_snippet) in enumerate(selected, start=1):
        hints.append(
            {
                "id": f"{story_id}-path-{idx}",
                "title": title,
                "description": f"{description}{cliff_note}",
                "focus": f"{anchor} · {focus_snippet}",
            }
        )
    return hints


def persist_story(payload: dict) -> Path:
    slug = payload["id"]
    path = STORIES / f"{slug}.json"
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    return path


def normalize_story_data(story: dict) -> dict:
    normalized = False
    raw_chapters = story.get("chapters", [])
    chapters: List[dict] = []
    for idx, chapter in enumerate(raw_chapters, start=1):
        if isinstance(chapter, dict) and "sections" in chapter and "cliffhanger" in chapter:
            chapters.append(chapter)
        else:
            text = chapter if isinstance(chapter, str) else str(chapter)
            simple = {
                "title": f"Chapter {idx}",
                "sections": [text],
                "cliffhanger": text,
            }
            chapters.append(simple)
            normalized = True
    story["chapters"] = chapters
    if "genre" not in story:
        story["genre"] = story.get("genre", "Fantasy")
        normalized = True
    if "tone" not in story:
        story["tone"] = story.get("tone", "epic")
        normalized = True
    if "focus" not in story:
        story["focus"] = story.get("focus")
    if not story.get("next_paths") and chapters:
        cliff = chapters[-1].get("cliffhanger", "")
        story["next_paths"] = generate_next_paths(
            story["id"],
            cliff,
            story.get("tone", "epic"),
            story.get("focus"),
        )
        normalized = True
    if normalized:
        persist_story(story)
    return story


def load_story(slug: str) -> Optional[dict]:
    file = STORIES / f"{slug}.json"
    if not file.exists():
        return None
    story = json.loads(file.read_text())
    return normalize_story_data(story)


def summarize_story(chapters: List[dict]) -> str:
    snippets: List[str] = []
    for chapter in chapters[:2]:
        section = chapter.get("sections", [])
        if section:
            snippets.append(section[0])
        else:
            snippets.append(chapter.get("cliffhanger", ""))
    return " | ".join(snippets) if snippets else ""


def authorize(request: Request):
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
    slug = f"story-{int(datetime.utcnow().timestamp())}"
    outline = make_outline(pr.title, pr.genre, pr.chapters)
    chapter_structures = [
        craft_chapter(idx, line, pr.tone, pr.focus)
        for idx, line in enumerate(outline, start=1)
    ]
    next_paths = generate_next_paths(
        slug,
        chapter_structures[-1]["cliffhanger"],
        pr.tone,
        pr.focus,
    )
    response = {
        "language": pr.language,
        "id": slug,
        "title": pr.title,
        "genre": pr.genre,
        "tone": pr.tone,
        "focus": pr.focus,
        "outline": outline,
        "chapters": chapter_structures,
        "summary": summarize_story(chapter_structures),
        "cover": f"A {pr.genre} odyssey in {pr.tone} tone",
        "next_paths": next_paths,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    persist_story(response)
    return response


@app.post('/api/story/continue', dependencies=[Depends(authorize)], response_model=StoryResponse)
def continue_story(req: StoryContinueRequest):
    story = load_story(req.story_id)
    if not story:
        raise HTTPException(status_code=404, detail='story not found')
    tone = req.tone or story.get('tone', 'epic')
    focus = req.focus or story.get('focus')
    language = req.language or story.get('language', 'English')
    story['tone'] = tone
    story['focus'] = focus
    story['language'] = language
    new_outlines = []
    start = len(story['outline']) + 1
    for i in range(start, start + req.chapters):
        new_outlines.append(f"Chapter {i}: {story['title']} — continuation beat {i}")
    new_chapters = [
        craft_chapter(i, line, tone, focus)
        for i, line in enumerate(new_outlines, start=start)
    ]
    story['outline'].extend(new_outlines)
    story['chapters'].extend(new_chapters)
    story['summary'] = summarize_story(story['chapters'])
    story['next_paths'] = generate_next_paths(
        story['id'],
        story['chapters'][-1]['cliffhanger'],
        tone,
        focus,
    )
    story['created_at'] = datetime.utcnow().isoformat() + 'Z'
    persist_story(story)
    return story


@app.get("/stories")
def list_stories():
    return [p.stem for p in STORIES.glob("*.json")]


@app.get("/api/trending", response_model=List[TrendingGenre])
def get_trending():
    return TRENDING_GENRES


@app.get("/")
def root():
    return FileResponse(STATIC / "index.html")
