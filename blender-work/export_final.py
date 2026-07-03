"""
Clean export from Z-Anatomy source. Only core organ meshes.
No skin, no muscles, no surfaces, no regions, no nodes, no limbs, no genitals.
"""
import bpy
import os

OUTPUT = r"C:\Users\nfart\OneDrive\Desktop\clinic\public\models\organs.glb"

# Only select meshes whose names START with or ARE these organ names
ORGAN_NAMES = [
    # Heart
    "Heart", "Right ventricle", "Left ventricle", "Right atrium", "Left atrium",
    "Aorta", "Ascending aorta", "Aortic arch", "Descending aorta",
    # Lungs
    "Right lung", "Left lung", "Diaphragm",
    # GI
    "Stomach", "Liver", "Gallbladder", "Pancreas", "Spleen",
    "Esophagus", "Duodenum", "Jejunum", "Ileum",
    "Ascending colon", "Transverse colon", "Descending colon", "Sigmoid colon",
    "Cecum", "Rectum", "Vermiform appendix",
    "Small intestine", "Large intestine",
    # Kidneys
    "Right kidney", "Left kidney", "Right ureter", "Left ureter",
    "Urinary bladder", "Right suprarenal gland", "Left suprarenal gland",
    # Thyroid
    "Thyroid gland", "Right parathyroid", "Left parathyroid",
    # Brain
    "Brain", "Cerebrum", "Cerebellum", "Brainstem",
    # Eyes
    "Eyeball", "Right eyeball", "Left eyeball",
    # ENT
    "Trachea", "Larynx", "Epiglottis",
    # Skull bones
    "Frontal bone", "Parietal bone", "Temporal bone", "Occipital bone",
    "Sphenoid bone", "Ethmoid bone", "Zygomatic bone", "Maxilla", "Mandible",
    "Nasal bone", "Cranium", "Neurocranium",
    # Spine
    "Vertebr",
    # Female reproductive
    "Uterus", "Right ovary", "Left ovary", "Uterine tube",
]

# Also match by collection
KEEP_COLLECTIONS = [
    "8: Visceral systems",
]

bpy.ops.object.select_all(action='DESELECT')

# Method 1: match object names
selected = set()
for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    name = obj.name
    name_lower = name.lower()

    # Skip anything with these words
    skip_words = ["muscle", "nerve", "node", "lymph", "ligament", "fascia",
                  "surface", "region", "border", "angle", "margin", "process",
                  "gyrus", "gyri", "sulcus", "sulci", "fossa", "groove",
                  "testis", "teste", "scrotum", "penis", "prostat", "epididym",
                  "skin", "subcutaneous", "joint", "suture",
                  "artery", "vein", "arterial", "venous",
                  "dental", "teeth", "tooth",
                  "capsule", "hilum",
                  "orbital part", "orbital region", "orbital gyri", "orbital sulci",
                  "orbital surface", "orbital plate", "orbital veins",
                  "zygomaticus", "orbicularis",
                  "sinus of frontal", "sinus of sphenoid",
                  "septum of sphenoid",
                  "impression", "incisure",
                  "cells of ethmoid",
                  "squamous part", "petrous part", "tympanic part", "basilar part",
                  "styloid", "mastoid", "jugular", "vaginal process",
                  "foramen", "notch",]

    if any(sw in name_lower for sw in skip_words):
        continue

    # Check if name matches any organ
    for organ in ORGAN_NAMES:
        if organ.lower() in name_lower or name_lower.startswith(organ.lower()):
            selected.add(obj.name)
            obj.select_set(True)
            break

print(f"Selected {len(selected)} clean organ objects")

# List what we got
for n in sorted(selected):
    print(f"  + {n}")

bpy.ops.export_scene.gltf(
    filepath=OUTPUT,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)

size_mb = os.path.getsize(OUTPUT) / (1024 * 1024)
print(f"DONE - SIZE: {size_mb:.1f} MB")
