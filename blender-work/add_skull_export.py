"""
1. List what the user kept in their edited file
2. Re-export from Z-Anatomy with those objects PLUS skull bones
"""
import bpy
import os

OUTPUT = r"C:\Users\nfart\OneDrive\Desktop\clinic\public\models\organs.glb"

# First, let's see what the user's edited file has
# Open the edited blend to get the object names
# Actually, we'll work from Z-Anatomy source and include skull

# Keywords for organs (same as before, minus whatever user removed)
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
    # Thyroid & endocrine
    "thyroid", "parathyroid",
    # Brain & head
    "brain", "cerebr", "cerebellum", "hypothalam", "hypophys", "thalamus",
    "hippocampus", "amygdal", "brainstem", "medulla oblongata", "pons",
    "frontal lobe", "parietal lobe", "temporal lobe", "occipital lobe",
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
    # Reproductive
    "uterus", "ovary", "testis", "prostat",
    # SKULL - NEW: add proper skull bones for a clean head look
    "skull", "cranium", "frontal bone", "parietal bone", "temporal bone",
    "occipital bone", "sphenoid", "ethmoid", "zygomatic", "maxilla",
    "mandible", "nasal bone", "calvaria", "neurocranium", "viscerocranium",
    "orbit", "foramen",
]

# Exclude lower body + small debris
EXCLUDE = [
    "femur", "tibia", "fibula", "patella", "foot", "ankle", "calcaneus",
    "metatarsal", "phalanx", "phalanges", "toe", "plantar",
    "thigh", "leg", "calf", "knee", "meniscus", "cruciate",
    "saphenous", "popliteal", "peroneal",
    "gluteal", "hamstring", "quadricep", "gastrocnemius", "soleus",
    "achilles", "tarsal", "cuboid", "navicular", "cuneiform",
    "iliac", "inguinal", "obturator",
]

bpy.ops.object.select_all(action='DESELECT')

selected_names = []
for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    name_lower = obj.name.lower()
    if not any(kw in name_lower for kw in KEEP):
        continue
    if any(kw in name_lower for kw in EXCLUDE):
        continue
    obj.select_set(True)
    selected_names.append(obj.name)

# Count by category
skull_count = len([n for n in selected_names if any(kw in n.lower() for kw in ["skull", "cranium", "frontal bone", "parietal bone", "temporal bone", "occipital bone", "sphenoid", "ethmoid", "zygomatic", "maxilla", "mandible", "nasal bone", "calvaria", "neurocranium", "viscerocranium", "orbit", "foramen"])])
eye_count = len([n for n in selected_names if any(kw in n.lower() for kw in ["eyeball", "sclera", "cornea", "lens", "iris", "retina", "optic nerve"])])

print(f"Selected {len(selected_names)} objects")
print(f"  Skull bones: {skull_count}")
print(f"  Eye parts: {eye_count}")

# Print skull objects
for n in sorted(selected_names):
    if any(kw in n.lower() for kw in ["skull", "cranium", "frontal bone", "parietal bone", "temporal bone", "occipital bone", "sphenoid", "ethmoid", "zygomatic", "maxilla", "mandible", "nasal bone", "calvaria", "neurocranium", "orbit"]):
        print(f"  SKULL: {n}")

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
