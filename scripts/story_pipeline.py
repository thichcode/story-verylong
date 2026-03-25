#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.story_engine import (
    FeatureLevels,
    ProgressionProfile,
    ProtagonistProfile,
    StoryContinueRequest,
    StoryGenerator,
    StoryRequest,
    StoryWorld,
)


def _parse_list(value: Optional[str]) -> List[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(',') if item.strip()]


def _build_progression(args: argparse.Namespace) -> Dict[str, Any]:
    progression = {}
    if args.start_realm:
        progression['startRealm'] = args.start_realm
    if args.target_realm:
        progression['targetRealm'] = args.target_realm
    if args.pace:
        progression['pace'] = args.pace
    if args.substage:
        progression['substage'] = args.substage
    return progression


def _build_features(args: argparse.Namespace) -> Dict[str, Any]:
    features = {}
    if args.system_mode:
        features['systemMode'] = True
    if args.romance_level is not None:
        features['romanceLevel'] = args.romance_level
    if args.comedy_level is not None:
        features['comedyLevel'] = args.comedy_level
    if args.darkness_level is not None:
        features['darknessLevel'] = args.darkness_level
    return features


def _build_world(args: argparse.Namespace) -> Dict[str, Any]:
    world = {}
    if args.world_tier:
        world['tier'] = args.world_tier
    if args.world_setting:
        world['setting'] = args.world_setting
    if args.world_power_system:
        world['powerSystem'] = args.world_power_system
    return world


def _build_protagonist(args: argparse.Namespace) -> Dict[str, Any]:
    protagonist = {}
    if args.protagonist_name:
        protagonist['name'] = args.protagonist_name
    if args.protagonist_origin:
        protagonist['origin'] = args.protagonist_origin
    if args.protagonist_talent:
        protagonist['talent'] = args.protagonist_talent
    if args.protagonist_body:
        protagonist['bodyType'] = args.protagonist_body
    if args.protagonist_primary:
        protagonist['primaryPath'] = args.protagonist_primary
    if args.protagonist_secondary:
        protagonist['secondaryPath'] = args.protagonist_secondary
    if args.protagonist_luck:
        protagonist['luck'] = args.protagonist_luck
    return protagonist


def _load_json(path: Optional[str]) -> Dict[str, Any]:
    if not path:
        return {}
    json_path = Path(path)
    if not json_path.exists():
        raise FileNotFoundError(f"Request file not found: {path}")
    return json.loads(json_path.read_text())


def _build_story_request(args: argparse.Namespace) -> StoryRequest:
    if args.request_file:
        payload = _load_json(args.request_file)
        return StoryRequest(**payload)
    if not args.title:
        raise SystemExit('Missing --title for generate subcommand')
    request_payload: Dict[str, Any] = {
        'title': args.title,
        'tone': args.tone,
        'focus': args.focus,
        'chapters': args.chapters,
        'language': args.language,
    }
    genres = _parse_list(args.genres)
    if genres:
        request_payload['genres'] = genres
    subgenres = _parse_list(args.subgenres)
    if subgenres:
        request_payload['subGenres'] = subgenres
    tone_tags = _parse_list(args.tone_tags)
    if tone_tags:
        request_payload['toneTags'] = tone_tags
    power_styles = _parse_list(args.power_styles)
    if power_styles:
        request_payload['powerStyles'] = power_styles
    request_payload['world'] = {**StoryWorld().dict(), **_build_world(args)}
    proto = _build_protagonist(args)
    if proto:
        request_payload['protagonist'] = proto
    progression_data = _build_progression(args)
    if progression_data:
        request_payload['progression'] = {**ProgressionProfile().dict(), **progression_data}
    features = _build_features(args)
    if features:
        request_payload['features'] = {**FeatureLevels().dict(), **features}
    return StoryRequest(**request_payload)


def _build_continue_request(args: argparse.Namespace) -> StoryContinueRequest:
    if args.request_file:
        payload = _load_json(args.request_file)
        return StoryContinueRequest(**payload)
    request_payload: Dict[str, Any] = {
        'story_id': args.story_id,
        'chapters': args.chapters,
        'tone': args.tone,
        'focus': args.focus,
        'language': args.language,
    }
    genres = _parse_list(args.genres)
    if genres:
        request_payload['genres'] = genres
    subgenres = _parse_list(args.subgenres)
    if subgenres:
        request_payload['subGenres'] = subgenres
    tone_tags = _parse_list(args.tone_tags)
    if tone_tags:
        request_payload['toneTags'] = tone_tags
    power_styles = _parse_list(args.power_styles)
    if power_styles:
        request_payload['powerStyles'] = power_styles
    progression_data = _build_progression(args)
    if progression_data:
        request_payload['progression'] = progression_data
    features = _build_features(args)
    if features:
        request_payload['features'] = features
    return StoryContinueRequest(**{k: v for k, v in request_payload.items() if v is not None})


def main() -> None:
    parser = argparse.ArgumentParser(description='Local story generator harness')
    subparsers = parser.add_subparsers(dest='command', required=True)

    generate_parser = subparsers.add_parser('generate', help='Generate a brand new story')
    generate_parser.add_argument('--title', help='Story title', required=False)
    generate_parser.add_argument('--chapters', type=int, default=5)
    generate_parser.add_argument('--tone', default='epic')
    generate_parser.add_argument('--focus')
    generate_parser.add_argument('--language', default='Tiếng Việt', help='Language of the generated story')
    generate_parser.add_argument('--genres', help='Comma-separated genres')
    generate_parser.add_argument('--subgenres', help='Comma-separated sub-genres')
    generate_parser.add_argument('--tone-tags', help='Comma-separated tone tags')
    generate_parser.add_argument('--power-styles', help='Comma-separated power styles')
    generate_parser.add_argument('--request-file', help='JSON file with StoryRequest payload')
    generate_parser.add_argument('--pace', help='Progression pace (slow|medium|fast)')
    generate_parser.add_argument('--start-realm', help='Progression start realm')
    generate_parser.add_argument('--target-realm', help='Progression target realm')
    generate_parser.add_argument('--substage', help='Progression substage')
    generate_parser.add_argument('--system-mode', action='store_true')
    generate_parser.add_argument('--romance-level', type=int)
    generate_parser.add_argument('--comedy-level', type=int)
    generate_parser.add_argument('--darkness-level', type=int)
    generate_parser.add_argument('--world-tier', help='World tier description')
    generate_parser.add_argument('--world-setting', help='World setting description')
    generate_parser.add_argument('--world-power-system', help='Power system name')
    generate_parser.add_argument('--protagonist-name')
    generate_parser.add_argument('--protagonist-origin')
    generate_parser.add_argument('--protagonist-talent')
    generate_parser.add_argument('--protagonist-body')
    generate_parser.add_argument('--protagonist-primary')
    generate_parser.add_argument('--protagonist-secondary')
    generate_parser.add_argument('--protagonist-luck')

    continue_parser = subparsers.add_parser('continue', help='Append chapters to an existing story')
    continue_parser.add_argument('--story-id', required=True)
    continue_parser.add_argument('--chapters', type=int, default=1)
    continue_parser.add_argument('--tone', default='epic')
    continue_parser.add_argument('--focus')
    continue_parser.add_argument('--language', default='Tiếng Việt', help='Language for continuation chapters')
    continue_parser.add_argument('--genres', help='Comma-separated genres')
    continue_parser.add_argument('--subgenres', help='Comma-separated sub-genres')
    continue_parser.add_argument('--tone-tags', help='Comma-separated tone tags')
    continue_parser.add_argument('--power-styles', help='Comma-separated power styles')
    continue_parser.add_argument('--request-file', help='JSON file with StoryContinueRequest payload')
    continue_parser.add_argument('--pace', help='Progression pace (slow|medium|fast)')
    continue_parser.add_argument('--start-realm', help='Progression start realm')
    continue_parser.add_argument('--target-realm', help='Progression target realm')
    continue_parser.add_argument('--substage', help='Progression substage')
    continue_parser.add_argument('--system-mode', action='store_true')
    continue_parser.add_argument('--romance-level', type=int)
    continue_parser.add_argument('--comedy-level', type=int)
    continue_parser.add_argument('--darkness-level', type=int)

    args = parser.parse_args()
    generator = StoryGenerator()

    if args.command == 'generate':
        request = _build_story_request(args)
        story = generator.build_story(request)
        print(f"saved story {story['id']} ({len(story['chapters'])} chapters)")
    else:
        continue_req = _build_continue_request(args)
        story = generator.continue_story(continue_req.story_id, continue_req)
        if not story:
            print('story not found', file=sys.stderr)
            sys.exit(2)
        print(f"appended {len(story['chapters'])} chapters to {story['id']}")


if __name__ == '__main__':
    main()
