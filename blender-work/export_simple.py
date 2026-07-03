"""
Simpler approach: hide everything except organs, export only visible.
"""
import bpy
import os

OUTPUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models", "organs.glb"))
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

KEEP_PARTIAL = [
    "heart", "lung", "liver", "stomach", "kidney", "intestin",
    "spleen", "pancrea", "esophag", "trachea", "diaphragm",
    "colon", "gallbladder", "bladder", "thyroid", "bronch",
    "aorta", "duodenum", "rectum", "adrenal",
]

# Step 1: Deselect all, then select only organ meshes
bpy.ops.object.select_all(action='DESELECT')

organ_names = []
for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    name_lower = obj.name.lower()
    if any(kw in name_lower for kw in KEEP_PARTIAL):
        obj.select_set(True)
        organ_names.append(obj.name)

print(f"Selected {len(organ_names)} organ objects")

if len(organ_names) == 0:
    print("No organs found, aborting")
    import sys
    sys.exit(1)

# Step 2: Export only selected objects with Draco compression
bpy.ops.export_scene.gltf(
    filepath=OUTPUT,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)

size_mb = os.path.getsize(OUTPUT) / (1024 * 1024)
print(f"DONE: {OUTPUT}")
print(f"SIZE: {size_mb:.1f} MB")
print(f"OBJECTS: {len(organ_names)}")
