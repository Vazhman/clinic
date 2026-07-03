import bpy

KEEP = ["kidney", "renal pelvis", "urinary bladder", "suprarenal gland"]
EXCLUDE = [
    "muscle", "nerve", "node", "lymph", "ligament", "fascia",
    "surface", "region", "border", "angle", "margin", "process",
    "skin", "subcutaneous", "joint", "suture",
    "artery", "vein", "arterial", "venous",
    "capsule", "hilum",
    "impression", "incisure",
    "foramen", "notch",
]

for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    name_lower = obj.name.lower()
    if not any(kw in name_lower for kw in KEEP):
        continue

    excluded_by = None
    for ex in EXCLUDE:
        if ex in name_lower:
            excluded_by = ex
            break

    if excluded_by:
        print(f"EXCLUDED: {obj.name} (by '{excluded_by}')")
    else:
        print(f"KEPT: {obj.name}")
