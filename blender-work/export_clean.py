"""
Clean export: No arms, no legs, no shoulders, no lymph nodes.
Add pelvic/groin anatomy. Keep head+skull, torso organs, spine.
"""
import bpy
import os

OUTPUT = r"C:\Users\nfart\OneDrive\Desktop\clinic\public\models\organs.glb"

# EXCLUDE: limbs, nodes, small debris
EXCLUDE = [
    # Legs & feet
    "femur", "tibia", "fibula", "patella", "foot", "ankle", "calcaneus",
    "metatarsal", "phalanx", "phalanges", "toe", "plantar", "dorsal pedis",
    "thigh", " leg", "calf", "knee", "meniscus", "cruciate",
    "saphenous", "popliteal", "peroneal", "tibial",
    "gluteal", "hamstring", "quadricep", "gastrocnemius", "soleus",
    "achilles", "tarsal", "cuboid", "navicular", "cuneiform",
    # Arms & shoulders
    "humer", "radius", "ulna", "carpal", "metacarp", "finger",
    "shoulder", "deltoid", "bicep", "tricep", "brachial", "forearm",
    "wrist", "hand", "palm", "antebrachial", "acromi", "clavicl",
    "scapul", "axillar", "cubital", "olecranon",
    # Lymph nodes (the spheres)
    "node", "lymph", "nod",
    # Other exclusions
    "inguinal", "obturator",
    "iliac artery", "iliac vein",
    "popliteal", "peroneal",
    # Muscles of limbs
    "compartment of arm", "compartment of forearm", "compartment of leg",
    "compartment of thigh",
    "region of arm", "region of elbow", "region of forearm",
    "region of thigh", "region of leg",
    "brachial region", "antebrachial region", "carpal region",
]

# KEEP: everything we want
KEEP = [
    # Heart & cardiovascular
    "heart", "ventricl", "atrium", "aort", "cardiac", "valve", "papillary", "semilunar",
    "coronary", "vena cava", "pulmonary trunk", "pulmonary vein",
    # Lungs & respiratory
    "lung", "pulmon", "bronch", "diaphragm", "pleura", "alveol",
    # GI / abdominal
    "stomach", "intestin", "colon", "duoden", "jejun", "ileum",
    "liver", "hepat", "gallbladder", "pancrea", "spleen",
    "esophag", "cecum", "rectum", "appendix", "sigmoid",
    "abdomin", "periton", "oment", "mesenter",
    # Kidneys & urinary
    "kidney", "renal", "ureter", "bladder", "adrenal", "suprarenal", "urethra",
    # Thyroid & endocrine
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
    "vertebr", "intervertebr", "spinal cord", "sacr", "coccyx",
    # Pelvis & groin
    "pelvi", "ilium", "ischium", "pubis", "hip bone", "acetabul",
    "pelvic", "perine",
    # Reproductive
    "uterus", "ovary", "testis", "prostat", "vas deferens",
    "fallopian", "endometri", "scrotum", "penis", "epididym",
    "seminal", "vagina", "vulva", "cervix",
    # Ribs & sternum (chest cage)
    "rib", "sternum", "costal", "xiphoid", "manubrium",
]

bpy.ops.object.select_all(action='DESELECT')

selected = []
skipped_nodes = 0
skipped_limbs = 0

for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    name_lower = obj.name.lower()

    # Must match a KEEP keyword
    if not any(kw in name_lower for kw in KEEP):
        continue

    # Must NOT match an EXCLUDE keyword
    excluded = False
    for ex in EXCLUDE:
        if ex in name_lower:
            if "node" in ex or "lymph" in ex or "nod" in ex:
                skipped_nodes += 1
            else:
                skipped_limbs += 1
            excluded = True
            break

    if excluded:
        continue

    obj.select_set(True)
    selected.append(obj.name)

print(f"Selected {len(selected)} objects")
print(f"Skipped {skipped_nodes} lymph nodes")
print(f"Skipped {skipped_limbs} limb/shoulder parts")

# Count categories
cats = {
    "Skull": ["skull", "cranium", "frontal bone", "parietal bone", "temporal bone", "occipital bone", "sphenoid", "ethmoid", "zygomatic", "maxilla", "mandible", "calvaria", "neurocranium"],
    "Ribs/Chest": ["rib", "sternum", "costal", "xiphoid", "manubrium"],
    "Pelvis": ["pelvi", "ilium", "ischium", "pubis", "hip bone", "acetabul", "sacr", "coccyx"],
    "Reproductive": ["uterus", "ovary", "testis", "prostat", "scrotum", "penis", "epididym", "seminal", "vagina", "cervix"],
    "Spine": ["vertebr", "intervertebr", "spinal cord"],
    "Eyes": ["eyeball", "sclera", "cornea", "lens", "iris", "retina", "optic nerve"],
}
for cat, kws in cats.items():
    count = len([n for n in selected if any(kw in n.lower() for kw in kws)])
    print(f"  {cat}: {count}")

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
