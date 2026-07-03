"""
Re-export without lower extremity parts. Keep torso, head, and internal organs only.
"""
import bpy
import os

OUTPUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models", "organs.glb"))

# Keywords to EXCLUDE (legs, feet, lower limb structures)
EXCLUDE = [
    "femur", "tibia", "fibula", "patella", "foot", "ankle", "calcaneus",
    "metatarsal", "phalanx", "phalanges", "toe", "plantar", "dorsal pedis",
    "thigh", "leg", "calf", "knee", "meniscus", "cruciate",
    "saphenous", "popliteal", "peroneal", "tibial artery", "tibial nerve",
    "gluteal", "hamstring", "quadricep", "gastrocnemius", "soleus",
    "achilles", "tarsal", "cuboid", "navicular", "cuneiform",
    "iliac", "inguinal", "obturator",
]

# Keywords to KEEP
KEEP = [
    "heart", "ventricl", "atrium", "aort", "cardiac", "valve", "papillary", "semilunar",
    "lung", "pulmon", "bronch", "diaphragm", "pleura",
    "stomach", "intestin", "colon", "duoden", "jejun", "ileum",
    "liver", "hepat", "gallbladder", "pancrea", "spleen",
    "esophag", "cecum", "rectum", "appendix",
    "kidney", "renal", "ureter", "bladder", "adrenal", "suprarenal",
    "thyroid", "parathyroid",
    "brain", "cerebr", "cerebellum", "hypothalam", "hypophys", "thalamus",
    "hippocampus", "amygdal", "brainstem", "medulla oblongata", "pons",
    "frontal lobe", "parietal lobe", "temporal lobe", "occipital lobe",
    "eyeball", "eye", "optic nerve", "orbit", "retina", "lacrimal", "sclera",
    "cornea", "lens", "iris",
    "trachea", "laryn", "pharyn", "tonsil", "epiglott",
    "arytenoid", "cricoid", "nasal", "turbinate", "sinus",
    "auditory", "ossicl", "tympan", "cochlea", "vestibul",
    "parotid", "submandibular",
    "vertebr", "intervertebr", "spinal cord", "disc",
    "uterus", "ovary", "testis", "prostat", "vas deferens",
    "fallopian", "endometri",
]

bpy.ops.object.select_all(action='DESELECT')

selected = 0
for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    name_lower = obj.name.lower()

    # Must match a KEEP keyword
    if not any(kw in name_lower for kw in KEEP):
        continue

    # Must NOT match an EXCLUDE keyword
    if any(kw in name_lower for kw in EXCLUDE):
        continue

    obj.select_set(True)
    selected += 1

print(f"Selected {selected} objects (excluded legs/feet)")

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
