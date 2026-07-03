"""
Open the current model and delete everything that's NOT a core organ/structure.
Keep ONLY: brain, eyes, ENT, thyroid, heart, lungs, stomach/GI, kidneys, spine, skull, reproductive (no testicles).
Remove: skin, muscles, fascia, regions, cavities, surfaces, borders, angles, processes, nodes, ligaments, fat, nerves, veins, arteries (except aorta/cardiac).
"""
import bpy

# What we KEEP - core organ structures only
KEEP = [
    # Heart (the organ itself)
    "heart", "ventricle", "atrium", "aorta", "cardiac",
    "valve", "papillary", "semilunar", "coronary",
    # Lungs
    "lung", "bronch", "diaphragm",
    # GI organs
    "stomach", "intestin", "colon", "duoden", "jejun", "ileum",
    "liver", "gallbladder", "pancrea", "spleen",
    "esophag", "cecum", "rectum", "appendix", "sigmoid",
    # Kidneys
    "kidney", "ureter", "bladder", "adrenal", "suprarenal",
    # Thyroid
    "thyroid gland", "parathyroid",
    # Brain
    "brain", "cerebr", "cerebellum", "hypothalam", "thalamus",
    "hippocampus", "brainstem", "pons",
    # Eyes
    "eyeball", "sclera", "cornea", "iris", "lens", "retina",
    # ENT core
    "trachea", "larynx", "epiglott", "cochlea",
    # Skull bones
    "frontal bone", "parietal bone", "temporal bone", "occipital bone",
    "sphenoid bone", "ethmoid bone", "zygomatic bone", "maxilla",
    "mandible", "nasal bone", "cranium", "calvaria",
    # Spine
    "vertebr",
    # Female reproductive
    "uterus", "ovary",
]

# What we definitely DELETE
DELETE = [
    # Skin, surfaces, regions, borders
    "surface", "region", "border", "angle", "margin", "process",
    "notch", "fossa", "groove", "crest", "spine of",
    "tuberosity", "tubercle", "eminence", "line of",
    "impression", "incisure", "extremity",
    # Muscles, fascia
    "muscle", "muscul", "fascia", "tendon", "ligament",
    "orbicularis", "zygomaticus",
    # Nodes, lymph
    "node", "lymph",
    # Nerves (not organs)
    "nerve", "plexus", "gangli",
    # Blood vessels (except heart ones)
    "vein", "artery", "venous", "arterial",
    # Skin, fat
    "skin", "subcutaneous", "adipos", "fat",
    # Regions and cavities
    "cavity", "space", "periton", "oment", "mesenter",
    "infra-orbital", "supra-orbital",
    # Joints
    "joint", "suture", "synchondr",
    # Dental
    "dental", "teeth", "tooth",
    # Male genitals
    "testis", "teste", "scrotum", "penis", "epididym",
    "prostat", "seminal", "spermatic", "vas deferens",
    # Other debris
    "capsule", "hilum", "pelvis", "basin",
    "segments of", "lobe of", "part of",
    "internal surface", "external surface",
    "anterior surface", "posterior surface",
    "medial surface", "lateral surface",
    "superior surface", "inferior surface",
    "anterior border", "posterior border",
    "cells of ethmoid",
    "gyri", "gyrus", "sulci", "sulcus",
    "septum", "sinus of", "yoke", "lingula",
    "vaginal process",
    "squamous part", "petrous part", "tympanic part",
    "basilar part", "lateral part",
    "base of mandible", "body of mandible", "oblique line",
    "styloid",
    "mastoid",
    "jugular",
    "foramen",
    "orbital",
]

deleted = 0
kept = 0

for obj in list(bpy.data.objects):
    if obj.type != 'MESH':
        continue

    name_lower = obj.name.lower()

    # Check if it matches a KEEP keyword
    is_keep = any(kw in name_lower for kw in KEEP)

    # Check if it matches a DELETE keyword
    is_delete = any(kw in name_lower for kw in DELETE)

    # If it matches DELETE and not a core KEEP, remove it
    if is_delete and not is_keep:
        obj.select_set(True)
        deleted += 1
    elif not is_keep:
        # Doesn't match anything we want - delete
        obj.select_set(True)
        deleted += 1
    else:
        kept += 1

print(f"Keeping {kept} objects, deleting {deleted}")

# Delete selected
bpy.ops.object.delete()

# Purge orphans
bpy.ops.outliner.orphans_purge(do_recursive=True)

# Save
bpy.ops.wm.save_as_mainfile(filepath=r"C:\Users\nfart\OneDrive\Desktop\clinic\blender-work\organs_clean.blend")

# Also export GLB
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=r"C:\Users\nfart\OneDrive\Desktop\clinic\public\models\organs.glb",
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)

import os
size_mb = os.path.getsize(r"C:\Users\nfart\OneDrive\Desktop\clinic\public\models\organs.glb") / (1024 * 1024)
print(f"DONE - Kept: {kept}, Size: {size_mb:.1f} MB")
