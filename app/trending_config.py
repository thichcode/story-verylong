from typing import Any, Dict, List


TRENDING_GENRES: List[Dict[str, Any]] = [
    {
        "tag": "cosmic-opera",
        "label": "Cosmic Opera",
        "genre": "Sci-Fi",
        "description": "Velvet diplomacy stretched across orbital arcs, with alliances sung like an aria.",
        "prompt_modifier": "opera-ready allegiances between solar houses and renegade fleets",
        "signal": "orbital-court",
        "momentum": "rising",
        "heat": 94,
    },
    {
        "tag": "underground-verdure",
        "label": "Underground Verdure",
        "genre": "Fantasy",
        "description": "Secret gardens glow beneath neon ruins while druidic courts bargain with root spirits.",
        "prompt_modifier": "moonlit greenery, fungi-entwined bargains, and songs whispered through roots",
        "signal": "root-council",
        "momentum": "steady",
        "heat": 88,
    },
    {
        "tag": "neon-noir-chase",
        "label": "Neon Noir Chase",
        "genre": "Thriller",
        "description": "Rain-soaked skylines, augmented eyes, and high-speed skylines form a chase for the ages.",
        "prompt_modifier": "rain-washed rooftops, augmented-prey, and kinetic chases across light rails",
        "signal": "neon-pursuit",
        "momentum": "spiking",
        "heat": 91,
    },
    {
        "tag": "letters-of-longing",
        "label": "Letters of Longing",
        "genre": "Romance",
        "description": "Epistolary confessions travel through enchanted mailrooms and time-delayed transmissions.",
        "prompt_modifier": "postcards soaked in starlight, ink that pulses when remembered, and tethered reunions",
        "signal": "inked-heart",
        "momentum": "blooming",
        "heat": 86,
    },
]

TRENDING_GENRES_BY_TAG: Dict[str, Dict[str, Any]] = {entry["tag"]: entry for entry in TRENDING_GENRES}

__all__ = ["TRENDING_GENRES", "TRENDING_GENRES_BY_TAG"]
