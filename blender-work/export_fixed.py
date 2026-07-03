"""
Clean export with kidneys confirmed working.
"""
import bpy
import os

OUTPUT = r"C:\Users\nfart\OneDrive\Desktop\clinic\public\models\organs.glb"

KEEP = [
    "heart", "ventricle", "atrium", "aorta", "cardiac", "valve", "papillary", "semilunar",
    "coronary", "valvular",
    "lung", "pulmon", "bronch", "diaphragm",
    "stomach", "intestin", "colon", "duodenum", "jejunum", "ileum",
    "liver", "gallbladder", "pancreas", "spleen",
    "esophag", "cecum", "rectum", "appendix", "sigmoid",
    "omental", "mucosa of stomach",
    "kidney", "renal pelvis", "urinary bladder", "suprarenal gland",
    "thyroid gland", "parathyroid",
    "brain", "cerebr", "cerebellum", "hypothalam", "thalamus",
    "hippocampus", "brainstem", "medulla oblongata", "pons",
    "midbrain", "forebrain", "tectum", "tegmentum", "aqueduct",
    "eyeball", "sclera", "cornea", "iris", "lens", "retina",
    "chamber of eyeball", "pole of eyeball", "segment of eyeball",
    "axis of eyeball", "equator of eyeball", "meridians of eyeball",
    "trachea", "larynx", "epiglottis", "fibro-elastic membrane",
    "frontal bone", "parietal bone", "temporal bone", "occipital bone",
    "sphenoid bone", "ethmoid bone", "zygomatic bone", "maxilla",
    "mandible", "nasal bone", "cranium", "neurocranium", "calvaria",
    "viscerocranium",
    "vertebr", "intervertebr", "spinal cord", "pedicle of vertebr",
    "lamina of vertebr", "articular facet", "pars interarticularis",
    "paravertebral",
    "uterus", "ovary", "uterine tube", "pelvic diaphragm",
]

EXCLUDE = [
    "muscle", "nerve", "node", "lymph", "ligament", "fascia",
    "surface", "region", "border", "angle", "margin",
    "gyrus", "gyri", "sulcus", "sulci", "fossa", "groove",
    "testis", "teste", "scrotum", "penis", "epididym", "prostat",
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
    "foramen", "notch",
    "femur", "tibia", "fibula", "patella", "foot", "ankle",
    "humer", "radius", "ulna", "carpal", "metacarp", "finger",
    "shoulder", "deltoid", "bicep", "tricep", "brachial",
    "scapul", "clavicl", "acromi",
]

bpy.ops.object.select_all(action='DESELECT')

selected = 0
kidney_list = []
for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    name_lower = obj.name.lower()
    if not any(kw in name_lower for kw in KEEP):
        continue
    if any(kw in name_lower for kw in EXCLUDE):
        continue
    obj.select_set(True)
    selected += 1
    if "kidney" in name_lower or "bladder" in name_lower or "suprarenal" in name_lower or "renal" in name_lower:
        kidney_list.append(obj.name)

for k in kidney_list:
    print(f"  KIDNEY/URINARY: {k}")
print(f"Selected {selected} objects ({len(kidney_list)} kidney/urinary)")

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
