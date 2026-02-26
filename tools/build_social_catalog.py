#  UnityGame - Social Asset Catalog Builder
#
#  Reads the master catalog.json from UnityAssets project and
#  classifies each package by relevance to the social avatar app.
#  Outputs social_catalog.json for project reference.
#
#  Depends on: catalog.json (via config), tools/config.json
#  Used by:    CLI (standalone tool)

import json
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CONFIG_PATH = SCRIPT_DIR / "config.json"


def load_config():
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r") as f:
            return json.load(f)
    return {
        "catalog_path": str(Path.home() / "Git" / "UnityAssets" / "catalog.json"),
        "output_path": str(PROJECT_ROOT / "social_catalog.json"),
        "extracted_dir": str(Path.home() / "Git" / "UnityAssets" / "extracted"),
    }


# ---------------------------------------------------------------------------
# Category classification rules
# ---------------------------------------------------------------------------

CATEGORY_RULES = {
    "characters_avatars": {
        "category_patterns": [
            "Characters", "Humanoid", "Humans", "Toons", "Fantasy",
        ],
        "name_patterns": [
            "character", "avatar", "humanoid", "human", "mannequin",
            "unity-chan", "warrior", "wizard", "ninja", "skeleton",
            "barbarian", "goblin", "demon", "angel", "elf", "priest",
            "soldier", "hair", "face", "puppet", "werewolf", "zombie",
            "superhero", "fighter", "outlaw", "fallen", "rhino",
            "cute zoo", "monster rumble", "party monster",
            "ball hermit", "creature", "insect",
        ],
        "file_patterns": ["character", "avatar", "humanoid"],
    },
    "animations": {
        "category_patterns": ["Animation", "AnimationBipedal"],
        "name_patterns": [
            "anim", "motion", "emote", "idle", "walk", "run",
            "animset", "mecanim", "melee anim", "crafting anim",
            "swimming", "climbing", "agility", "dynamic archer",
        ],
        "file_patterns": ["anim", "controller"],
    },
    "environments": {
        "category_patterns": [
            "Environments", "Dungeons", "Fantasy", "Sci-Fi",
            "Urban", "Landscapes", "Industrial",
        ],
        "name_patterns": [
            "environment", "village", "dungeon", "temple", "station",
            "park", "meadow", "mountain", "dreamscape", "viking",
            "colony", "dugout", "hangar", "shuttle", "cyberpunk",
            "siege", "top-down dungeon",
        ],
        "file_patterns": ["environment", "scene", "level"],
    },
    "ui_gui": {
        "category_patterns": ["GUI", "GUI Skins", "Icons"],
        "name_patterns": [
            "gui", "ui sample", "icon", "menu", "hud",
        ],
        "file_patterns": ["gui", "canvas", "panel"],
    },
    "networking": {
        "category_patterns": ["ScriptingNetwork", "Network"],
        "name_patterns": [
            "network", "pun", "darkrift", "sync", "multiplayer",
            "photon", "smooth sync",
        ],
        "file_patterns": ["network", "photon", "darkrift"],
    },
    "ai_behavior": {
        "category_patterns": ["ScriptingAI", "AI"],
        "name_patterns": [
            "behavior", "ai ", "pathfind", "enemy vision",
            "dialogue", "deathmatch", "easy state",
        ],
        "file_patterns": ["behavior", "ai", "dialogue"],
    },
    "vfx_particles": {
        "category_patterns": ["Particle", "VFX"],
        "name_patterns": [
            "particle", "vfx", "effect", "magic arsenal",
            "magic effect", "spell", "realistic effect",
            "legacy particle",
        ],
        "file_patterns": ["particle", "vfx", "effect"],
    },
    "audio": {
        "category_patterns": ["Audio", "Sound"],
        "name_patterns": [
            "audio", "sound", "sfx", "music", "footstep",
        ],
        "file_patterns": ["audio", "sound", ".wav", ".ogg"],
    },
    "weapons_combat": {
        "category_patterns": ["Weapons", "Guns"],
        "name_patterns": [
            "weapon", "sword", "axe", "gun", "sniper", "rifle",
            "bulletpro", "stylized axe", "melee axe",
            "animated hands with weapons", "insane gun",
        ],
        "file_patterns": ["weapon", "gun", "sword"],
    },
    "vehicles": {
        "category_patterns": ["Vehicles"],
        "name_patterns": [
            "vehicle", "car", "tank", "ship", "cartoon vehicle",
            "universal vehicle",
        ],
        "file_patterns": ["vehicle", "car"],
    },
    "tools_systems": {
        "category_patterns": ["Editor", "Complete Projects", "Scripting"],
        "name_patterns": [
            "system", "controller", "inventory", "save system",
            "rewired", "filo", "gaia", "script wizard",
            "ultimate character", "easy character", "survival shooter",
        ],
        "file_patterns": ["system", "manager", "controller"],
    },
    "prototyping": {
        "category_patterns": ["Unity Essentials", "Sample"],
        "name_patterns": [
            "prototype", "starter", "sample", "asset unlock",
            "standard assets", "learn", "prototyping pack",
        ],
        "file_patterns": ["prototype", "sample"],
    },
    "terrain_nature": {
        "category_patterns": ["Vegetation", "Terrain", "Nature", "Skybox"],
        "name_patterns": [
            "terrain", "nature", "tree", "grass", "skybox",
            "sky ", "enviro", "nature starter",
        ],
        "file_patterns": ["terrain", "nature", "tree"],
    },
    "props": {
        "category_patterns": ["Props", "Interior"],
        "name_patterns": [
            "prop", "barrel", "food", "kitchen", "toy",
            "furniture", "barrels",
        ],
        "file_patterns": ["prop", "barrel", "furniture"],
    },
    "textures_materials": {
        "category_patterns": ["Textures", "Materials", "Ground", "Fonts"],
        "name_patterns": [
            "texture", "material", "ground", "floor", "concrete",
        ],
        "file_patterns": ["texture", "material"],
    },
}


# ---------------------------------------------------------------------------
# Social relevance scoring
# ---------------------------------------------------------------------------

SOCIAL_RELEVANCE = {
    "high": {
        "categories": ["characters_avatars", "ui_gui", "networking"],
        "name_keywords": [
            "avatar", "character", "humanoid", "chat", "gui", "ui",
            "network", "pun", "sync", "emote", "idle", "walk",
            "motion", "human basic", "dialogue", "hair", "face",
            "mannequin", "puppet face", "darkrift", "smooth sync",
            "gui pro",
        ],
    },
    "medium": {
        "categories": [
            "animations", "environments", "ai_behavior",
            "tools_systems", "prototyping", "props",
        ],
        "name_keywords": [
            "environment", "village", "park", "room", "interior",
            "behavior", "pathfind", "prototype", "save system",
            "rewired", "input", "easy character", "ultimate character",
            "anim", "motion", "crafting", "kitchen", "polygon city",
            "polygon prototype", "icon",
        ],
    },
    "low": {
        "categories": [
            "vfx_particles", "audio", "terrain_nature",
            "textures_materials",
        ],
        "name_keywords": [],
    },
    "none": {
        "categories": ["weapons_combat", "vehicles"],
        "name_keywords": [
            "bullet", "gun", "sniper", "weapon", "combat",
            "vehicle", "mech", "tank",
        ],
    },
}


# ---------------------------------------------------------------------------
# Use case tags
# ---------------------------------------------------------------------------

USE_CASE_TAGS = {
    "avatar_base": [
        "humanoid", "mannequin", "unity-chan", "jammo",
        "barbarian warrior", "battle wizard", "skeleton outlaw",
        "fallen angel", "medieval priest", "fighter corn",
        "superhero", "goblin", "werewolf", "zombie",
    ],
    "avatar_customization": [
        "hair", "face", "puppet face", "female hair",
    ],
    "emote_animations": [
        "emote", "dance", "wave", "sit", "idle",
        "human basic motion", "crafting mecanim", "crafting anim",
        "superhero anim",
    ],
    "locomotion_animations": [
        "walk", "run", "motion", "movement",
        "agility", "swimming", "climbing",
    ],
    "chat_system": [
        "dialogue", "chat", "pun", "photon",
    ],
    "social_room": [
        "village", "park", "interior", "kitchen",
        "dreamscape", "meadow", "cyberpunk", "colony",
        "polygon city", "viking village", "top-down dungeon",
    ],
    "room_decoration": [
        "prop", "barrel", "food", "toy", "furniture",
        "asset unlock kitchen", "barrels",
    ],
    "avatar_effects": [
        "particle", "magic effect", "spell", "vfx",
        "magic arsenal", "realistic effect",
    ],
    "ui_framework": [
        "gui pro", "ui sample", "icon pack", "polygon icon",
    ],
    "networking_core": [
        "darkrift", "pun 2", "smooth sync", "netcode",
        "pun multiplayer",
    ],
    "character_controller": [
        "ultimate character", "easy character",
        "opsive", "character movement", "character controller",
    ],
    "world_building": [
        "gaia", "dreamscape", "nature", "skybox", "enviro",
        "nature starter",
    ],
}


# ---------------------------------------------------------------------------
# Note templates by category
# ---------------------------------------------------------------------------

NOTE_TEMPLATES = {
    "characters_avatars": "Character model - potential avatar base or NPC",
    "animations": "Animation pack - avatar movement or emotes",
    "environments": "Environment - potential social room / hangout space",
    "ui_gui": "UI framework - chat interface or menu system",
    "networking": "Networking - multiplayer infrastructure",
    "ai_behavior": "AI/behavior system - NPC bots or pathfinding",
    "vfx_particles": "VFX - avatar effects or room ambiance",
    "audio": "Audio - ambient sounds or UI feedback",
    "weapons_combat": "Combat asset - not directly useful for social app",
    "vehicles": "Vehicle asset - not directly useful for social app",
    "tools_systems": "System/tool - potential infrastructure component",
    "prototyping": "Prototyping asset - useful for early development",
    "terrain_nature": "Nature/terrain - outdoor room theming",
    "props": "Props - room decoration items",
    "textures_materials": "Textures - environment materials",
    "other": "Uncategorized asset",
}


# ---------------------------------------------------------------------------
# Classification engine
# ---------------------------------------------------------------------------

def determine_category(package):
    """Match package to best social-app category using multi-signal scoring."""
    scores = {}
    name_lower = package.get("name", "").lower()
    category_dir = package.get("category_dir", "").lower()
    files_sample = [f.lower() for f in package.get("files", [])[:30]]
    files_text = " ".join(files_sample)

    for category, rules in CATEGORY_RULES.items():
        score = 0
        for pattern in rules.get("category_patterns", []):
            if pattern.lower() in category_dir:
                score += 10
        for pattern in rules.get("name_patterns", []):
            if pattern.lower() in name_lower:
                score += 5
        for pattern in rules.get("file_patterns", []):
            if pattern.lower() in files_text:
                score += 2
        scores[category] = score

    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "other"


def determine_relevance(package, category):
    """Rate package relevance to social avatar app: high/medium/low/none."""
    name_lower = package.get("name", "").lower()

    for tier in ["high", "none", "medium", "low"]:
        signals = SOCIAL_RELEVANCE[tier]
        if category in signals.get("categories", []):
            return tier
        for kw in signals.get("name_keywords", []):
            if kw in name_lower:
                return tier

    return "low"


def determine_tags(package):
    """Tag package with specific social-app use cases."""
    tags = []
    name_lower = package.get("name", "").lower()
    files_sample = " ".join(f.lower() for f in package.get("files", [])[:50])

    for tag, keywords in USE_CASE_TAGS.items():
        for kw in keywords:
            if kw in name_lower or kw in files_sample:
                tags.append(tag)
                break
    return tags


def generate_note(package, category, relevance):
    """Generate a brief note about how this package could be used."""
    base = NOTE_TEMPLATES.get(category, "Uncategorized")
    if relevance == "high":
        return f"{base} [RECOMMENDED]"
    return base


def classify_package(package):
    """Returns enriched package dict with social-app classification."""
    category = determine_category(package)
    relevance = determine_relevance(package, category)
    tags = determine_tags(package)
    note = generate_note(package, category, relevance)

    return {
        "name": package.get("name", "Unknown"),
        "publisher_dir": package.get("publisher_dir", ""),
        "category_dir": package.get("category_dir", ""),
        "size_mb": package.get("size_mb", 0),
        "total_files": package.get("total_files", 0),
        "has_scripts": package.get("has_scripts", False),
        "has_models": package.get("has_models", False),
        "has_animations": package.get("has_animations", False),
        "has_textures": package.get("has_textures", False),
        "social_category": category,
        "relevance": relevance,
        "use_case_tags": tags,
        "notes": note,
    }


# ---------------------------------------------------------------------------
# Summary and recommendations
# ---------------------------------------------------------------------------

def build_summary(packages):
    """Build summary statistics from classified packages."""
    by_category = {}
    by_relevance = {"high": 0, "medium": 0, "low": 0, "none": 0}
    recommended = []

    for pkg in packages:
        cat = pkg["social_category"]
        by_category[cat] = by_category.get(cat, 0) + 1
        by_relevance[pkg["relevance"]] += 1
        if pkg["relevance"] == "high":
            recommended.append(pkg["name"])

    return {
        "by_category": dict(sorted(by_category.items(), key=lambda x: -x[1])),
        "by_relevance": by_relevance,
        "recommended_for_social_app": sorted(recommended),
    }


def print_summary(catalog):
    """Print a human-readable summary to stdout."""
    summary = catalog["summary"]
    total = catalog["total_packages"]

    print(f"\n{'='*60}")
    print(f"  SOCIAL ASSET CATALOG SUMMARY")
    print(f"  {total} packages classified")
    print(f"{'='*60}\n")

    print("  By Relevance:")
    for tier, count in summary["by_relevance"].items():
        pct = count / total * 100 if total else 0
        bar = "#" * int(pct / 2)
        print(f"    {tier:>6}  {count:>3}  ({pct:4.1f}%)  {bar}")

    print(f"\n  By Category:")
    for cat, count in summary["by_category"].items():
        print(f"    {cat:<25} {count:>3}")

    print(f"\n  Recommended ({len(summary['recommended_for_social_app'])}):")
    for name in summary["recommended_for_social_app"]:
        print(f"    - {name}")
    print()


def print_recommendations(catalog):
    """Print recommendations grouped by social app system."""
    systems = {
        "Avatar System": ["avatar_base", "avatar_customization"],
        "Animations (Emotes + Locomotion)": ["emote_animations", "locomotion_animations"],
        "Networking": ["networking_core", "chat_system"],
        "UI": ["ui_framework"],
        "Environments (Social Rooms)": ["social_room", "world_building"],
        "Props & Decoration": ["room_decoration"],
        "Effects": ["avatar_effects"],
        "Character Controllers": ["character_controller"],
    }

    print(f"\n{'='*60}")
    print(f"  SOCIAL APP ASSET RECOMMENDATIONS")
    print(f"{'='*60}\n")

    for system_name, tags in systems.items():
        matches = []
        for pkg in catalog["packages"]:
            if any(t in pkg["use_case_tags"] for t in tags):
                matches.append(pkg)

        if not matches:
            continue

        print(f"  {system_name}:")
        matches.sort(key=lambda p: {"high": 0, "medium": 1, "low": 2, "none": 3}[p["relevance"]])
        for pkg in matches:
            rel = pkg["relevance"].upper()
            tag_str = ", ".join(pkg["use_case_tags"])
            print(f"    {rel:<6}  {pkg['name']}")
            print(f"           tags: {tag_str}")
        print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    config = load_config()
    command = sys.argv[1] if len(sys.argv) > 1 else "build"

    if command in ("summary", "recommend"):
        output_path = Path(config["output_path"])
        if not output_path.exists():
            print(f"Error: {output_path} not found. Run 'build' first.")
            sys.exit(1)
        with open(output_path, "r", encoding="utf-8") as f:
            catalog = json.load(f)
        if command == "summary":
            print_summary(catalog)
        else:
            print_recommendations(catalog)
        return

    # Build
    catalog_path = Path(config["catalog_path"])
    if not catalog_path.exists():
        print(f"Error: Source catalog not found at {catalog_path}")
        print("Update tools/config.json with the correct catalog_path.")
        sys.exit(1)

    print(f"Reading source catalog: {catalog_path}")
    with open(catalog_path, "r", encoding="utf-8") as f:
        source = json.load(f)

    packages = source.get("packages", [])
    print(f"Classifying {len(packages)} packages...")

    classified = [classify_package(pkg) for pkg in packages]

    social_catalog = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "source_catalog": str(catalog_path),
        "total_packages": len(classified),
        "packages": classified,
        "summary": build_summary(classified),
    }

    output_path = Path(config["output_path"])
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(social_catalog, f, indent=2, ensure_ascii=False)

    print(f"Wrote {output_path}")
    print_summary(social_catalog)


if __name__ == "__main__":
    main()
