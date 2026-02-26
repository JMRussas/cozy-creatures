"""Batch-convert Cute Zoo 4 FBX creature models to optimized glTF via Blender.

Imports each creature's model FBX, applies matching animation clips from
separate animation FBX files, normalizes scale, and exports as .glb with
embedded textures.

Usage:
    blender --background --python tools/convert_creatures.py

Depends on: Blender 4.4+ Python API (bpy)
Used by:    Asset pipeline (Stage 4A)
"""

import os
import sys

# Blender's Python doesn't have the project on sys.path by default
import bpy  # type: ignore

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Base paths (relative to where assets were extracted)
EXTRACTED_ROOT = os.path.expanduser(
    "~/Git/UnityAssets/extracted/Cute Zoo 4/Suriyun"
)
MODEL_DIR = os.path.join(EXTRACTED_ROOT, "Cute Zoo 4", "FBX")
TEXTURE_DIR = os.path.join(EXTRACTED_ROOT, "Cute Zoo 4", "Texture")
ANIM_DIR = os.path.join(EXTRACTED_ROOT, "Animations_Cute_Animals")

OUTPUT_ROOT = os.path.expanduser(
    "~/Git/UnityGame/apps/client/public/assets/creatures"
)

# Creature definitions: fbx_name -> (output_id, animation_source)
# animation_source is either the creature's own folder name or "TypeA"/"TypeB"
CREATURES = {
    "Otter": ("otter", "Otter"),
    "Sloth": ("sloth", "Sloth"),
    "Possum": ("possum", "Possum"),
    "Pangolin": ("pangolin", "Pangolin"),
    "Redpanda": ("red-panda", "TypeA"),
    "Chipmunk": ("chipmunk", "TypeB"),
}

# Animation clips to extract (canonical name -> keyword to match in filename)
ANIMATION_MAP = {
    "idle": "Idle",
    "walk": "Walk",
    "run": "Run",
    "eat": "Eat",
    "rest": "Rest",
}

# Also include these but not in BASE_ANIMATIONS (for future use)
EXTRA_ANIMATIONS = {
    "jump": "Jump",
}

# Target height in Blender units (roughly matches the current ~1 unit creature)
TARGET_HEIGHT = 1.0

# Maximum triangle count per creature
MAX_TRIS = 2000


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def clear_scene():
    """Remove all objects from the scene."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    # Clear orphan data
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.armatures:
        if block.users == 0:
            bpy.data.armatures.remove(block)
    for block in bpy.data.actions:
        if block.users == 0:
            bpy.data.actions.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)
    for block in bpy.data.images:
        if block.users == 0:
            bpy.data.images.remove(block)


def find_animation_files(anim_source, creature_fbx_name):
    """Find animation FBX files for a creature.

    anim_source is either:
    - A creature-specific folder name (e.g. "Otter")
    - "TypeA" or "TypeB" for shared generic animations
    """
    anim_folder = os.path.join(ANIM_DIR, anim_source)
    if not os.path.isdir(anim_folder):
        print(f"  WARNING: Animation folder not found: {anim_folder}")
        return {}

    result = {}
    all_anims = {**ANIMATION_MAP, **EXTRA_ANIMATIONS}
    fbx_files = [f for f in os.listdir(anim_folder) if f.lower().endswith(".fbx")]

    for canonical_name, keyword in all_anims.items():
        # Build keyword list — "walk" also matches "move" (Otter uses "Move")
        keywords = [keyword.lower()]
        if canonical_name == "walk":
            keywords.append("move")

        for fname in fbx_files:
            if any(kw in fname.lower() for kw in keywords):
                result[canonical_name] = os.path.join(anim_folder, fname)
                break

    return result


def find_texture(creature_fbx_name):
    """Find the texture PNG for a creature."""
    # Try T_<Name>_A.png first
    tex_name = f"T_{creature_fbx_name}_A.png"
    tex_path = os.path.join(TEXTURE_DIR, tex_name)
    if os.path.isfile(tex_path):
        return tex_path
    # Also try lowercase
    for f in os.listdir(TEXTURE_DIR):
        if f.lower() == tex_name.lower():
            return os.path.join(TEXTURE_DIR, f)
    return None


def get_armature():
    """Find the armature object in the scene."""
    for obj in bpy.data.objects:
        if obj.type == "ARMATURE":
            return obj
    return None


def get_meshes():
    """Find all mesh objects in the scene."""
    return [obj for obj in bpy.data.objects if obj.type == "MESH"]


def normalize_scale(armature):
    """Scale the creature so its bounding box height is approximately TARGET_HEIGHT."""
    from mathutils import Vector

    bpy.context.view_layer.update()

    # Calculate height from all mesh objects
    all_min_z = float("inf")
    all_max_z = float("-inf")
    for obj in bpy.data.objects:
        if obj.type == "MESH":
            for corner in obj.bound_box:
                world_corner = obj.matrix_world @ Vector(corner)
                all_min_z = min(all_min_z, world_corner.z)
                all_max_z = max(all_max_z, world_corner.z)

    if all_max_z <= all_min_z:
        print("  WARNING: Could not calculate bounding box height")
        return

    current_height = all_max_z - all_min_z
    if current_height < 0.001:
        return

    scale_factor = TARGET_HEIGHT / current_height
    armature.scale *= scale_factor
    bpy.context.view_layer.update()

    # Apply scale
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    print(f"  Scaled from {current_height:.3f} to {TARGET_HEIGHT:.3f} "
          f"(factor: {scale_factor:.4f})")


def import_and_collect_action(fbx_path, canonical_name):
    """Import an animation FBX and return the action, or None."""
    # Remember existing actions
    existing_actions = set(bpy.data.actions)

    try:
        bpy.ops.import_scene.fbx(filepath=fbx_path, use_anim=True)
    except Exception as e:
        print(f"  WARNING: Failed to import {fbx_path}: {e}")
        return None

    # Find the new action
    new_actions = set(bpy.data.actions) - existing_actions
    if not new_actions:
        return None

    # Take the first new action and rename it
    action = new_actions.pop()
    action.name = canonical_name

    # Remove the imported objects (we only want the action)
    for obj in bpy.context.selected_objects:
        bpy.data.objects.remove(obj, do_unlink=True)

    return action


def assign_texture(creature_fbx_name):
    """Find and assign the creature's texture to its materials."""
    tex_path = find_texture(creature_fbx_name)
    if not tex_path:
        print(f"  WARNING: No texture found for {creature_fbx_name}")
        return

    # Load the image
    img = bpy.data.images.load(tex_path)
    print(f"  Loaded texture: {os.path.basename(tex_path)}")

    # Assign to all mesh materials
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        for slot in obj.material_slots:
            mat = slot.material
            if not mat:
                continue
            mat.use_nodes = True
            nodes = mat.node_tree.nodes
            links = mat.node_tree.links

            # Find or create the principled BSDF
            principled = None
            for node in nodes:
                if node.type == "BSDF_PRINCIPLED":
                    principled = node
                    break
            if not principled:
                continue

            # Find or create a texture node
            tex_node = nodes.new("ShaderNodeTexImage")
            tex_node.image = img

            # Connect to base color
            links.new(tex_node.outputs["Color"], principled.inputs["Base Color"])


def count_triangles():
    """Count total triangles across all mesh objects."""
    total = 0
    for obj in bpy.data.objects:
        if obj.type == "MESH":
            # Triangulate temporarily to count
            import bmesh
            bm = bmesh.new()
            bm.from_mesh(obj.data)
            bmesh.ops.triangulate(bm, faces=bm.faces[:])
            total += len(bm.faces)
            bm.free()
    return total


# ---------------------------------------------------------------------------
# Main conversion loop
# ---------------------------------------------------------------------------

def convert_creature(fbx_name, creature_id, anim_source):
    """Convert one creature from FBX to GLB."""
    print(f"\n{'='*60}")
    print(f"Converting: {fbx_name} -> {creature_id}")
    print(f"{'='*60}")

    model_path = os.path.join(MODEL_DIR, f"{fbx_name}.fbx")
    if not os.path.isfile(model_path):
        print(f"  ERROR: Model not found: {model_path}")
        return False

    # Start fresh
    clear_scene()

    # Import the model
    print(f"  Importing model: {fbx_name}.fbx")
    bpy.ops.import_scene.fbx(filepath=model_path, use_anim=False)

    armature = get_armature()
    if not armature:
        print("  ERROR: No armature found after import")
        return False

    # Clean up: remove cameras, lights, empties
    for obj in list(bpy.data.objects):
        if obj.type in {"CAMERA", "LIGHT", "EMPTY"}:
            bpy.data.objects.remove(obj, do_unlink=True)

    # Assign texture
    assign_texture(fbx_name)

    # Find and import animations
    anim_files = find_animation_files(anim_source, fbx_name)
    print(f"  Found {len(anim_files)} animation clips")

    actions = {}
    for canonical_name, anim_path in anim_files.items():
        print(f"  Importing animation: {canonical_name} <- {os.path.basename(anim_path)}")
        action = import_and_collect_action(anim_path, canonical_name)
        if action:
            actions[canonical_name] = action

    # Assign actions to the armature via NLA tracks
    if actions and armature.animation_data is None:
        armature.animation_data_create()

    for name, action in actions.items():
        track = armature.animation_data.nla_tracks.new()
        track.name = name
        strip = track.strips.new(name, int(action.frame_range[0]), action)
        strip.name = name

    # Set the idle action as the active one
    if "idle" in actions:
        armature.animation_data.action = actions["idle"]

    # Normalize scale
    normalize_scale(armature)

    # Check triangle count
    tri_count = count_triangles()
    print(f"  Triangle count: {tri_count}")
    if tri_count > MAX_TRIS:
        print(f"  WARNING: {tri_count} tris exceeds {MAX_TRIS} limit")
        # Could add decimation here if needed

    # Create output directory
    out_dir = os.path.join(OUTPUT_ROOT, creature_id)
    os.makedirs(out_dir, exist_ok=True)

    # Export as GLB
    out_path = os.path.join(out_dir, "model.glb")
    print(f"  Exporting: {out_path}")

    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        export_animations=True,
        export_apply=True,
        export_image_format="AUTO",
        export_materials="EXPORT",
    )

    file_size = os.path.getsize(out_path)
    print(f"  Output size: {file_size / 1024:.1f} KB")
    print(f"  Done: {creature_id}")
    return True


def main():
    print("=" * 60)
    print("Cute Zoo 4 -> Cozy Creatures GLB Converter")
    print("=" * 60)
    print(f"Model dir: {MODEL_DIR}")
    print(f"Anim dir: {ANIM_DIR}")
    print(f"Output dir: {OUTPUT_ROOT}")

    os.makedirs(OUTPUT_ROOT, exist_ok=True)

    success = 0
    failed = 0

    for fbx_name, (creature_id, anim_source) in CREATURES.items():
        try:
            if convert_creature(fbx_name, creature_id, anim_source):
                success += 1
            else:
                failed += 1
        except Exception as e:
            print(f"  EXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            failed += 1

    print(f"\n{'='*60}")
    print(f"Conversion complete: {success} succeeded, {failed} failed")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
