# Creature Models

3D creature models are **not included** in this repository (they are commercial assets). The app will still run without them — you'll see colored capsule placeholders instead of 3D animals.

To get the full experience, you need to provide your own glTF models.

## Expected Structure

Each creature needs a folder matching its ID with a `model.glb` inside:

```
creatures/
├── otter/model.glb
├── red-panda/model.glb
├── sloth/model.glb
├── chipmunk/model.glb
├── possum/model.glb
└── pangolin/model.glb
```

The creature IDs are defined in `Packages/shared/src/constants/creatures.ts`.

## Model Requirements

### Format
- **glTF Binary (`.glb`)** with embedded textures
- Must include a rigged skeleton (skinned mesh)

### Required Animation Clips
Each model must contain these named animation clips:

| Clip | Used for |
|------|----------|
| `idle` | Standing still |
| `walk` | Moving to a target |
| `run` | (Optional) Fast movement |
| `eat` | Eating animation |
| `rest` | Sitting at a sit spot |

Clip names must match exactly (case-sensitive). Extra clips are ignored. Blender export duplicates (e.g. `idle.001`) are automatically filtered out.

### Skeleton Bones
The accessory system attaches objects to bones by **case-insensitive substring match**. For skins with accessories to work, your skeleton should include bones whose names contain:

| Pattern | Used for |
|---------|----------|
| `Head` | Hats, crowns, flower crowns |
| `Neck` | Scarves |
| `Spine` | Capes, backpacks, shields |

Standard humanoid/animal rigs typically work. The bone search is fuzzy — e.g., a bone named `Otter_Head_Jnt` matches the `Head` pattern.

## Converting from FBX

If you have FBX source files, the included Blender conversion script can batch-convert them:

```bash
# Requires Blender 4.x on PATH
python tools/convert_creatures.py
```

See `tools/convert_creatures.py` for configuration (input/output paths, creature mappings).

## Compatible Asset Packs

This project was designed around low-poly stylized animal models with ~5 animation clips each. Some places to find compatible models:

- [Sketchfab](https://sketchfab.com/) — filter by "Downloadable", CC license, "Animals" category
- [itch.io](https://itch.io/game-assets/tag-3d/tag-animals) — indie 3D animal asset packs
- [Kenney](https://kenney.nl/) — free CC0 game assets (limited animal selection)
- Unity Asset Store / Blender Market — commercial packs (convert FBX to glTF via Blender)
