"""
Go back to the previous good version: organs + skull + eyes.
No arms, no legs, no nodes, no testicles/scrotum/penis.
"""
import bpy
import os

OUTPUT = r"C:\Users\nfart\OneDrive\Desktop\clinic\public\models\organs.glb"

KEEP = [
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
    # Thyroid
    "thyroid", "parathyroid",
    # Brain & head
    "brain", "cerebr", "cerebellum", "hypothalam", "hypophys", "thalamus",
    "hippocampus", "amygdal", "brainstem", "medulla oblongata", "pons",
    "frontal lobe", "parietal lobe", "temporal lobe", "occipital lobe",
    # Skull
    "skull", "cranium", "frontal bone", "parietal bone", "temporal bone",
    "occipital bone", "sphenoid", "ethmoid", "zygomatic", "maxilla",
    "mandible", "nasal bone", "calvaria", "neurocranium", "viscerocranium",
    "orbit", "foramen",
    # Eyes
    "eyeball", "optic nerve", "sclera", "cornea", "lens", "iris",
    "retina", "lacrimal",
    # ENT
    "trachea", "laryn", "pharyn", "tonsil", "epiglott",
    "arytenoid", "cricoid", "nasal", "turbinate", "sinus",
    "auditory", "ossicl", "tympan", "cochlea", "vestibul",
    "parotid", "submandibular",
    # Spine
    "vertebr", "intervertebr", "spinal cord",
    # Female reproductive (no male genitals)
    "uterus", "ovary", "fallopian", "endometri", "cervix",
]

EXCLUDE = [
    # Legs
    "femur", "tibia", "fibula", "patella", "foot", "ankle", "calcaneus",
    "metatarsal", "phalanx", "phalanges", "toe", "plantar",
    "thigh", "knee", "meniscus", "cruciate",
    "saphenous", "popliteal", "peroneal", "tibial",
    "gluteal", "hamstring", "quadricep", "gastrocnemius", "soleus",
    "achilles", "tarsal", "cuboid", "navicular", "cuneiform",
    # Arms & shoulders
    "humer", "radius", "ulna", "carpal", "metacarp", "finger",
    "shoulder", "deltoid", "bicep", "tricep", "brachial", "forearm",
    "wrist", "hand", "palm", "antebrachial", "acromi", "clavicl",
    "scapul", "axillar", "cubital", "olecranon",
    # Nodes
    "node", "lymph",
    # Male genitals
    "testis", "teste", "scrotum", "penis", "epididym", "seminal", "prostat",
    "vas deferens", "spermatic",
    # Other
    "inguinal", "obturator", "iliac",
    "compartment of arm", "compartment of forearm", "compartment of leg",
    "compartment of thigh",
]

bpy.ops.object.select_all(action='DESELECT')

selected = 0
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

print(f"Selected {selected} objects")

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
