"""
Re-export with ALL body regions that match the left panel:
head/brain, eyes, ENT, thyroid, heart, lungs, stomach/GI, spine, kidneys, reproductive
"""
import bpy
import os

OUTPUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models", "organs.glb"))
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

KEEP_PARTIAL = [
    # Heart & cardiovascular
    "heart", "ventricl", "atrium", "aort", "cardiac", "valve", "papillary", "semilunar",
    # Lungs & respiratory
    "lung", "pulmon", "bronch", "diaphragm", "pleura",
    # GI / abdominal
    "stomach", "intestin", "colon", "duoden", "jejun", "ileum",
    "liver", "hepat", "gallbladder", "pancrea", "spleen",
    "esophag", "cecum", "rectum", "appendix",
    # Kidneys & urinary
    "kidney", "renal", "ureter", "bladder", "adrenal", "suprarenal",
    # Thyroid & endocrine
    "thyroid", "parathyroid",
    # Brain & head
    "brain", "cerebr", "cerebellum", "hypothalam", "hypophys", "thalamus",
    "hippocampus", "amygdal", "brainstem", "medulla oblongata", "pons",
    "frontal lobe", "parietal lobe", "temporal lobe", "occipital lobe",
    # Eyes
    "eyeball", "eye", "optic nerve", "orbit", "retina", "lacrimal", "sclera",
    "cornea", "lens", "iris", "pupil",
    # ENT
    "trachea", "laryn", "pharyn", "tonsil", "epiglott",
    "arytenoid", "cricoid", "nasal", "turbinate", "sinus",
    "auditory", "ossicl", "tympan", "cochlea", "vestibul",
    "parotid", "submandibular",
    # Spine
    "vertebr", "intervertebr", "spinal cord", "disc",
    # Reproductive
    "uterus", "ovary", "testis", "prostat", "vas deferens",
    "fallopian", "endometri",
]

bpy.ops.object.select_all(action='DESELECT')

organ_names = []
for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    name_lower = obj.name.lower()
    if any(kw in name_lower for kw in KEEP_PARTIAL):
        obj.select_set(True)
        organ_names.append(obj.name)

print(f"Selected {len(organ_names)} objects")

# Print categories found
categories = {
    "Brain/Head": ["brain", "cerebr", "cerebellum", "hypothalam", "thalamus", "hippocampus", "brainstem", "pons", "lobe"],
    "Eyes": ["eye", "optic", "orbit", "retina", "sclera", "cornea", "lens", "iris"],
    "ENT": ["trachea", "laryn", "pharyn", "tonsil", "nasal", "turbinate", "sinus", "cochlea", "auditory", "tympan", "ossicl"],
    "Thyroid": ["thyroid", "parathyroid"],
    "Heart": ["heart", "ventricl", "atrium", "aort", "cardiac", "valve"],
    "Lungs": ["lung", "pulmon", "bronch", "diaphragm"],
    "GI/Stomach": ["stomach", "intestin", "colon", "liver", "hepat", "gallbladder", "pancrea", "spleen", "esophag"],
    "Kidneys": ["kidney", "renal", "ureter", "bladder", "adrenal"],
    "Spine": ["vertebr", "spinal cord", "disc", "intervertebr"],
    "Reproductive": ["uterus", "ovary", "testis", "prostat"],
}

for cat, keywords in categories.items():
    matches = [n for n in organ_names if any(kw in n.lower() for kw in keywords)]
    print(f"  {cat}: {len(matches)} meshes")

if len(organ_names) == 0:
    print("No organs found!")
    import sys
    sys.exit(1)

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
