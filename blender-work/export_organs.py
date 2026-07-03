"""
Extract visceral organs from Z-Anatomy and export as lightweight GLB.
Run: blender --background Z-Anatomy/Startup.blend --python export_organs.py
"""
import bpy
import os

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "..", "public", "models", "organs.glb")
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

# Collections to keep (organs + heart)
KEEP_COLLECTIONS = {
    "8: Visceral systems",  # All internal organs
    "Heart",
    "Arteries of heart",
    "Cardiac veins",
    "Bronchi",
    "Trachea",
}

# Also match by partial name
KEEP_PARTIAL = [
    "heart", "lung", "liver", "stomach", "kidney", "intestin",
    "spleen", "pancrea", "esophag", "trachea", "diaphragm",
    "colon", "gallbladder", "bladder", "thyroid", "bronch",
    "aorta", "pulmonary", "duodenum", "jejunum", "ileum",
    "cecum", "rectum", "appendix", "adrenal", "ureter",
]

print("\n=== Step 1: Identifying organ objects ===")

# Find all objects that belong to organ-related collections or match organ names
organ_objects = set()

for col in bpy.data.collections:
    col_lower = col.name.lower()
    # Check if collection matches
    if col.name in KEEP_COLLECTIONS or any(kw in col_lower for kw in KEEP_PARTIAL):
        for obj in col.all_objects:
            if obj.type == 'MESH':
                organ_objects.add(obj.name)

# Also check object names directly
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        name_lower = obj.name.lower()
        if any(kw in name_lower for kw in KEEP_PARTIAL):
            organ_objects.add(obj.name)

print(f"  Found {len(organ_objects)} organ mesh objects")

if len(organ_objects) == 0:
    print("ERROR: No organ objects found!")
    # List some objects for debugging
    for obj in list(bpy.data.objects)[:30]:
        print(f"  - {obj.name} ({obj.type})")
    import sys
    sys.exit(1)

# Print what we found
for name in sorted(organ_objects)[:30]:
    print(f"  + {name}")
if len(organ_objects) > 30:
    print(f"  ... and {len(organ_objects) - 30} more")

print("\n=== Step 2: Selecting only organ objects ===")

# Deselect everything
bpy.ops.object.select_all(action='DESELECT')

# Select organ objects
for obj_name in organ_objects:
    obj = bpy.data.objects.get(obj_name)
    if obj:
        obj.select_set(True)
        obj.hide_viewport = False
        obj.hide_render = False

# Set one as active
for obj_name in organ_objects:
    obj = bpy.data.objects.get(obj_name)
    if obj:
        bpy.context.view_layer.objects.active = obj
        break

print(f"  Selected {len([o for o in bpy.context.selected_objects])} objects")

print("\n=== Step 3: Joining meshes by region ===")

# Instead of joining everything, let's just decimate individual objects
# to keep them separate (allows clicking individual organs later)

print("\n=== Step 4: Decimating for web ===")

decimated = 0
for obj_name in list(organ_objects):
    obj = bpy.data.objects.get(obj_name)
    if obj and obj.type == 'MESH' and obj.data:
        vert_count = len(obj.data.vertices)
        if vert_count > 500:
            # Add decimate modifier
            bpy.context.view_layer.objects.active = obj
            mod = obj.modifiers.new(name="Decimate", type='DECIMATE')
            # More aggressive decimation for high-poly objects
            if vert_count > 10000:
                mod.ratio = 0.05
            elif vert_count > 5000:
                mod.ratio = 0.1
            elif vert_count > 1000:
                mod.ratio = 0.2
            else:
                mod.ratio = 0.3
            # Apply modifier
            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            try:
                bpy.ops.object.modifier_apply(modifier="Decimate")
                decimated += 1
            except:
                # Remove modifier if can't apply
                obj.modifiers.remove(mod)

print(f"  Decimated {decimated} objects")

print("\n=== Step 5: Deleting non-organ objects ===")

# Delete everything that's NOT an organ
bpy.ops.object.select_all(action='DESELECT')
deleted = 0
for obj in list(bpy.data.objects):
    if obj.name not in organ_objects:
        obj.select_set(True)
        deleted += 1

if deleted > 0:
    bpy.ops.object.delete()
print(f"  Deleted {deleted} non-organ objects")

# Clean up unused data
bpy.ops.outliner.orphans_purge(do_recursive=True)

print("\n=== Step 6: Exporting GLB ===")

# Select all remaining objects
bpy.ops.object.select_all(action='SELECT')

remaining = len([o for o in bpy.data.objects if o.type == 'MESH'])
print(f"  Exporting {remaining} mesh objects to {OUTPUT_PATH}")

bpy.ops.export_scene.gltf(
    filepath=OUTPUT_PATH,
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)

# Check file size
size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
print(f"\n=== DONE! ===")
print(f"  Output: {OUTPUT_PATH}")
print(f"  Size: {size_mb:.1f} MB")
