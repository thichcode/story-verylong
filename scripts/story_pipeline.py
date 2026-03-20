#!/usr/bin/env python3
import json
from pathlib import Path
from pathlib import Path
import random

from app.main import build_story, StoryRequest

stories_path = Path(__file__).resolve().parent.parent / "stories"
stories_path.mkdir(exist_ok=True)

brief = StoryRequest(
    title="Field of Timelines",
    genre="Sci-Fi",
    tone="epic",
    chapters=7,
)
story = build_story(brief)
path = stories_path / f"{story['id']}.json"
path.write_text(json.dumps(story, indent=2, ensure_ascii=False))
print(f"Generated story saved to {path}")
