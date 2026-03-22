import json
import logging
import os
import random
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

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

CULTIVATION_CONFIG_PATH = BASE / 'cultivation_standard_v1.json'


def _load_cultivation_system() -> Dict[str, Any]:
    if CULTIVATION_CONFIG_PATH.exists():
        try:
            return json.loads(CULTIVATION_CONFIG_PATH.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


CULTIVATION_SYSTEM = _load_cultivation_system()
REALM_SEQUENCE = [realm.get('name') for realm in CULTIVATION_SYSTEM.get('realms', []) if realm.get('name')]


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

PACE_PROFILES = {
    "slow": {
        "intro": "The camera lingers on ritual and breath, letting every crackle of chi stew for a beat.",
        "escalation": "Scenes melt into each other like ink, giving the scholar-time to taste the politics.",
        "cliff": "The cliff hangs with a patient heartbeat as consequences bloom without a rush.",
    },
    "medium": {
        "intro": "Momentum builds with steady strikes, touching on trade, training, and whispers of power.",
        "escalation": "A layered escalation now blends character, conflict, and cosmic stakes into a single burn.",
        "cliff": "The cliff edges toward a revelation that promises both danger and reward.",
    },
    "fast": {
        "intro": "Frames smash past each other with bright beats, forcing the reader to keep dancing.",
        "escalation": "The escalation drags enemies into rapid repositioning and snap rituals.",
        "cliff": "One pulse later, the cliff explodes—there is no time to catch your breath.",
    },
}


class StoryWorld(BaseModel):
    tier: str = Field("phàm vực")
    setting: str = Field("tiên hiệp cổ đại")
    powerSystem: str = Field("cultivation_standard_v1")


class ProtagonistProfile(BaseModel):
    name: Optional[str] = None
    origin: Optional[str] = None
    talent: Optional[str] = None
    bodyType: Optional[str] = None
    primaryPath: Optional[str] = None
    secondaryPath: Optional[str] = None
    luck: Optional[str] = None


class ProgressionProfile(BaseModel):
    startRealm: str = Field("Luyện Thể")
    targetRealm: str = Field("Nguyên Anh")
    pace: str = Field("medium")
    substage: Optional[str] = None


class FeatureLevels(BaseModel):
    systemMode: bool = False
    romanceLevel: int = Field(0, ge=0, le=5)
    comedyLevel: int = Field(0, ge=0, le=5)
    darknessLevel: int = Field(0, ge=0, le=5)


class StoryMetadata(BaseModel):
    world: StoryWorld
    protagonist: Optional[ProtagonistProfile] = None
    progression: ProgressionProfile
    features: FeatureLevels
    continuity: Dict[str, Any] = Field(default_factory=dict)
    system: Dict[str, Any] = Field(default_factory=dict)


class TagMatrix(BaseModel):
    genres: List[str]
    subGenres: List[str]
    toneTags: List[str] = Field(default_factory=list)
    powerStyles: List[str] = Field(default_factory=list)


class StoryRequest(BaseModel):
    title: str = Field(..., min_length=3)
    genres: List[str] = Field(default_factory=lambda: ["Fantasy"])
    subGenres: List[str] = Field(default_factory=list)
    tone: str = Field("epic")
    toneTags: List[str] = Field(default_factory=list)
    powerStyles: List[str] = Field(default_factory=list)
    focus: Optional[str] = None
    chapters: int = Field(5, ge=3, le=12)
    language: str = Field("English")
    world: StoryWorld = Field(default_factory=StoryWorld)
    protagonist: Optional[ProtagonistProfile] = None
    progression: ProgressionProfile = Field(default_factory=ProgressionProfile)
    features: FeatureLevels = Field(default_factory=FeatureLevels)


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
    genres: List[str]
    subGenres: List[str]
    tone: str
    toneTags: List[str]
    powerStyles: List[str]
    focus: Optional[str] = None
    outline: List[str]
    chapters: List[ChapterDetail]
    summary: str
    cover: str
    next_paths: List[NextPathHint]
    created_at: str
    updated_at: str
    language: str
    tags: List[str] = Field(default_factory=list)
    metadata: StoryMetadata
    tag_matrix: TagMatrix
    prompt: str
    pacing: str


class StoryContinueRequest(BaseModel):
    story_id: str
    chapters: int = Field(1, ge=1, le=6)
    tone: Optional[str] = None
    focus: Optional[str] = None
    language: Optional[str] = None
    genres: Optional[List[str]] = None
    subGenres: Optional[List[str]] = None
    toneTags: Optional[List[str]] = None
    powerStyles: Optional[List[str]] = None
    progression: Optional[ProgressionProfile] = None
    features: Optional[FeatureLevels] = None


class TrendingGenre(BaseModel):
    genre: str
    headline: str
    description: str
    palette: str
    momentum: int
    mood_board: List[str]


app = FastAPI(title="Story VeryLong")
app.mount("/static", StaticFiles(directory=STATIC), name="static")


def _tone_vibe(tone: str) -> Dict[str, str]:
    return TONE_VIBES.get(tone, DEFAULT_TONE_VIBE)


def _pace_profile(pace: str) -> Dict[str, str]:
    return PACE_PROFILES.get(pace, PACE_PROFILES['medium'])


def _build_tag_matrix(request: StoryRequest) -> TagMatrix:
    tone_tags = [request.tone, *request.toneTags]
    power_styles = request.powerStyles or []
    return TagMatrix(
        genres=request.genres,
        subGenres=request.subGenres,
        toneTags=list(dict.fromkeys(tone_tags)),
        powerStyles=list(dict.fromkeys(power_styles)),
    )


def _build_tag_list(matrix: TagMatrix) -> List[str]:
    combined = [*matrix.genres, *matrix.subGenres, *matrix.toneTags, *matrix.powerStyles]
    return list(dict.fromkeys([tag for tag in combined if tag]))


def _progression_hint(progression: ProgressionProfile, chapter_index: int) -> str:
    star = progression.startRealm
    target = progression.targetRealm
    stage = progression.substage or "sơ kỳ"
    return f"Progressing from {star} ({stage}) toward {target} at a {progression.pace} pace. Chapter {chapter_index} deepens that climb."


def build_story_prompt(request: StoryRequest, matrix: TagMatrix) -> str:
    tags_line = ", ".join(matrix.genres + matrix.subGenres)
    tone_line = request.tone
    focus_line = request.focus or "a restless current of ambition"
    pacing = request.progression.pace
    features = request.features
    system_code = CULTIVATION_SYSTEM.get('systemCode', 'cultivation_standard_v1')
    return (
        f"You are writing a cultivation saga with tags [{tags_line}] and tone {tone_line}. "
        f"The focus is on {focus_line}. Use the {system_code} ruleset and keep progression from "
        f"{request.progression.startRealm} to {request.progression.targetRealm} at a {pacing} pace. "
        f"Honor system={features.systemMode}, romance={features.romanceLevel}, comedy={features.comedyLevel}, darkness={features.darknessLevel}. "
        "Each chapter must show power growth, political friction, or secret mileage while ending on a hook."
    )


def make_outline(request: StoryRequest) -> List[str]:
    base_prompt = ", ".join(request.genres) or "multi-genre arc"
    progression = request.progression
    extra = f" ({progression.startRealm}→{progression.targetRealm}, {progression.pace} pace)"
    chapters = max(3, min(request.chapters, 12))
    return [
        f"Chapter {i}: {request.title} — {base_prompt}{extra} scene {i}"
        for i in range(1, chapters + 1)
    ]


def craft_chapter(index: int, outline_line: str, tone: str, focus: Optional[str], progression: ProgressionProfile, features: FeatureLevels, matrix: TagMatrix) -> dict:
    vibe = _tone_vibe(tone)
    pace = _pace_profile(progression.pace)
    focus_text = focus.strip() if focus else "a restless current of ambition"
    focus_sentence = f"Focus threads the narrative through {focus_text}."
    power_styles = matrix.powerStyles
    system_note = "" if not features.systemMode else "System mode is scoring quests."  
    hero_sentence = f"Power styles: {', '.join(power_styles)}." if power_styles else ""
    opening = (
        f"Setup: {outline_line}. {vibe['opening']} {pace['intro']} {focus_sentence} {system_note}"
    )
    escalation = (
        f"Escalation: {vibe['escalation']} {pace['escalation']} {hero_sentence} {focus_sentence}"
    )
    cliffhanger = (
        f"Cliffhanger: {vibe['cliff']} {pace['cliff']} {focus_sentence}"
    )
    title = f"Chapter {index}"
    return {
        "title": title,
        "sections": [opening, escalation],
        "cliffhanger": cliffhanger,
    }


def generate_next_paths(story_id: str, last_cliffhanger: str, tone: str, focus: Optional[str], progression: ProgressionProfile, count: int = 3) -> List[dict]:
    pool = NEXT_PATH_TEMPLATES.copy()
    selected = random.sample(pool, k=min(count, len(pool)))
    anchor = focus or tone or progression.startRealm
    cliff_note = f" The lingering echo: {last_cliffhanger}" if last_cliffhanger else ""
    hints = []
    for idx, (title, description, focus_snippet) in enumerate(selected, start=1):
        description_text = f"{description} — {progression.startRealm} to {progression.targetRealm}."
        hints.append(
            {
                "id": f"{story_id}-path-{idx}",
                "title": title,
                "description": f"{description_text}{cliff_note}",
                "focus": f"{anchor} · {focus_snippet}",
            }
        )
    return hints


def persist_story(payload: Dict[str, Any]) -> Path:
    slug = payload["id"]
    path = STORIES / f"{slug}.json"
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    return path


def normalize_story_data(story: Dict[str, Any]) -> Dict[str, Any]:
    normalized = False
    chapters = story.get("chapters", [])
    normalized_chapters = []
    for idx, chapter in enumerate(chapters, start=1):
        if isinstance(chapter, dict) and "sections" in chapter and "cliffhanger" in chapter:
            normalized_chapters.append(chapter)
        else:
            text = chapter if isinstance(chapter, str) else str(chapter)
            simple = {
                "title": f"Chapter {idx}",
                "sections": [text],
                "cliffhanger": text,
            }
            normalized_chapters.append(simple)
            normalized = True
    story["chapters"] = normalized_chapters
    if "metadata" not in story:
        story["metadata"] = {
            "world": StoryWorld().dict(),
            "protagonist": None,
            "progression": ProgressionProfile().dict(),
            "features": FeatureLevels().dict(),
            "continuity": {},
            "system": {
                "code": CULTIVATION_SYSTEM.get('systemCode'),
                "version": CULTIVATION_SYSTEM.get('version'),
                "tags": CULTIVATION_SYSTEM.get('tags', {}),
            },
        }
        normalized = True
    if "tags" not in story:
        story["tags"] = []
        normalized = True
    if "tag_matrix" not in story:
        story["tag_matrix"] = {"genres": [], "subGenres": [], "toneTags": [], "powerStyles": []}
        normalized = True
    if "updated_at" not in story:
        story["updated_at"] = story.get("created_at", datetime.utcnow().isoformat() + "Z")
        normalized = True
    if normalized:
        persist_story(story)
    return story


def load_story(slug: str) -> Optional[Dict[str, Any]]:
    file = STORIES / f"{slug}.json"
    if not file.exists():
        return None
    story = json.loads(file.read_text())
    return normalize_story_data(story)


def summarize_story(chapters: List[Dict[str, Any]]) -> str:
    snippets: List[str] = []
    for chapter in chapters[:2]:
        section = chapter.get("sections", [])
        if section:
            snippets.append(section[0])
        else:
            snippets.append(chapter.get("cliffhanger", ""))
    return " | ".join(snippets) if snippets else ""


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


def _advance_progression(progression: ProgressionProfile, chapters_written: int) -> ProgressionProfile:
    thresholds = {
        "fast": 3,
        "medium": 5,
        "slow": 8,
    }
    select_threshold = thresholds.get(progression.pace, 5)
    if not REALM_SEQUENCE:
        progression.substage = progression.substage or "sơ kỳ"
        return progression
    if chapters_written >= select_threshold and progression.startRealm in REALM_SEQUENCE:
        current_idx = REALM_SEQUENCE.index(progression.startRealm)
        next_idx = min(current_idx + 1, len(REALM_SEQUENCE) - 1)
        progression.startRealm = REALM_SEQUENCE[next_idx]
    progression.substage = progression.substage or "sơ kỳ"
    return progression


def _build_metadata(request: StoryRequest, chapter_count: int) -> StoryMetadata:
    matrix = _build_tag_matrix(request)
    metadata = StoryMetadata(
        world=request.world,
        protagonist=request.protagonist,
        progression=_advance_progression(request.progression, chapter_count),
        features=request.features,
        continuity={
            "focus": request.focus,
            "chapter_hint": _progression_hint(request.progression, chapter_count),
        },
        system={
            "code": CULTIVATION_SYSTEM.get('systemCode'),
            "version": CULTIVATION_SYSTEM.get('version'),
            "tags": CULTIVATION_SYSTEM.get('tags', {}),
        },
    )
    return metadata


@app.post("/api/story", dependencies=[Depends(authorize)], response_model=StoryResponse)
def build_story(pr: StoryRequest):
    slug = f"story-{int(datetime.utcnow().timestamp())}"
    outline = make_outline(pr)
    matrix = _build_tag_matrix(pr)
    tag_list = _build_tag_list(matrix)
    chapters = [
        craft_chapter(idx, line, pr.tone, pr.focus, pr.progression, pr.features, matrix)
        for idx, line in enumerate(outline, start=1)
    ]
    metadata = _build_metadata(pr, len(chapters))
    next_paths = generate_next_paths(
        slug,
        chapters[-1]["cliffhanger"],
        pr.tone,
        pr.focus,
        pr.progression,
    )
    response = {
        "language": pr.language,
        "id": slug,
        "title": pr.title,
        "genres": pr.genres,
        "subGenres": pr.subGenres,
        "tone": pr.tone,
        "toneTags": pr.toneTags,
        "powerStyles": pr.powerStyles,
        "focus": pr.focus,
        "outline": outline,
        "chapters": chapters,
        "summary": summarize_story(chapters),
        "cover": f"A {tag_list[0] if tag_list else pr.genres[0]} odyssey in {pr.tone} tone",
        "next_paths": next_paths,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "updated_at": datetime.utcnow().isoformat() + "Z",
        "tags": tag_list,
        "metadata": metadata.dict(),
        "tag_matrix": matrix.dict(),
        "prompt": build_story_prompt(pr, matrix),
        "pacing": pr.progression.pace,
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
    genres = req.genres or story.get('genres', ['Fantasy'])
    sub_genres = req.subGenres or story.get('subGenres', [])
    tone_tags = req.toneTags or story.get('toneTags', [])
    power_styles = req.powerStyles or story.get('powerStyles', [])
    existing_metadata = story.get('metadata', {})
    existing_progression = ProgressionProfile(**existing_metadata.get('progression', {})) if existing_metadata else ProgressionProfile()
    if req.progression:
        existing_progression = req.progression
    features = req.features or FeatureLevels(**existing_metadata.get('features', {}))
    existing_progression = _advance_progression(existing_progression, len(story.get('chapters', [])))
    story['tone'] = tone
    story['focus'] = focus
    story['language'] = language
    story['genres'] = genres
    story['subGenres'] = sub_genres
    story['toneTags'] = tone_tags
    story['powerStyles'] = power_styles
    matrix = TagMatrix(genres=genres, subGenres=sub_genres, toneTags=tone_tags or [tone], powerStyles=power_styles)
    story['tag_matrix'] = matrix.dict()
    story['tags'] = _build_tag_list(matrix)
    story['metadata'] = StoryMetadata(
        world=StoryWorld(**existing_metadata.get('world', {})),
        protagonist=ProtagonistProfile(**existing_metadata.get('protagonist', {})) if existing_metadata.get('protagonist') else None,
        progression=existing_progression,
        features=features,
        continuity={
            "focus": focus,
            "chapter_hint": _progression_hint(existing_progression, len(story.get('chapters', [])) + req.chapters),
        },
        system={
            "code": CULTIVATION_SYSTEM.get('systemCode'),
            "version": CULTIVATION_SYSTEM.get('version'),
            "tags": CULTIVATION_SYSTEM.get('tags', {}),
        },
    ).dict()
    start = len(story['outline']) + 1
    new_outlines = []
    for i in range(start, start + req.chapters):
        new_outlines.append(f"Chapter {i}: {story['title']} — continuation beat {i}")
    new_chapters = [
        craft_chapter(i, line, tone, focus, existing_progression, features, TagMatrix(**story['tag_matrix']))
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
        existing_progression,
    )
    story['created_at'] = story.get('created_at', datetime.utcnow().isoformat() + 'Z')
    story['updated_at'] = datetime.utcnow().isoformat() + 'Z'
    story['prompt'] = build_story_prompt(
        StoryRequest(
            title=story['title'],
            genres=genres,
            subGenres=sub_genres,
            tone=tone,
            toneTags=tone_tags or [tone],
            powerStyles=power_styles,
            focus=focus,
            chapters=len(story['chapters']),
            world=StoryWorld(**story['metadata']['world']) if story['metadata'].get('world') else StoryWorld(),
            protagonist=ProtagonistProfile(**story['metadata']['protagonist']) if story['metadata'].get('protagonist') else None,
            progression=existing_progression,
            features=features,
            language=language,
        ),
        TagMatrix(**story['tag_matrix']),
    )
    story['pacing'] = existing_progression.pace
    persist_story(story)
    return story


@app.get("/stories")
def list_stories():
    return [p.stem for p in STORIES.glob("*.json")]


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
