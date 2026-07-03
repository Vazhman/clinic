"""
Blender script to extract internal organs from Z-Anatomy and export as lightweight GLB.
Run with: blender --background Z-Anatomy/Startup.blend --python extract_organs.py
"""

import bpy
import sys
import os

# First, let's see what's in this file
print("\n=== LISTING ALL COLLECTIONS ===")
for col in bpy.data.collections:
    obj_count = len(col.objects)
    if obj_count > 0:
        print(f"  Collection: '{col.name}' ({obj_count} objects)")

print("\n=== LISTING ALL OBJECTS (first 200) ===")
count = 0
organ_keywords = [
    'heart', 'lung', 'liver', 'stomach', 'kidney', 'intestin', 'spleen',
    'pancrea', 'brain', 'thyroid', 'esophag', 'trachea', 'diaphragm',
    'colon', 'gallbladder', 'bladder', 'uterus', 'aorta', 'vein', 'artery',
    'bronch', 'pleura', 'periton',
    # Latin
    'cor', 'pulmo', 'hepar', 'ventricul', 'ren', 'lien',
    # Common anatomy terms
    'organ', 'viscera', 'thorax', 'abdomen',
    'cardiac', 'hepat', 'renal', 'gastric', 'pulmon',
]

found_organs = []
for obj in bpy.data.objects:
    name_lower = obj.name.lower()
    is_organ = any(kw in name_lower for kw in organ_keywords)
    if is_organ:
        found_organs.append(obj.name)
    count += 1
    if count <= 200:
        marker = " <<< ORGAN" if is_organ else ""
        if obj.type == 'MESH':
            verts = len(obj.data.vertices) if obj.data else 0
            print(f"  [{obj.type}] '{obj.name}' - {verts} verts{marker}")

print(f"\n=== TOTAL OBJECTS: {count} ===")
print(f"\n=== FOUND {len(found_organs)} POTENTIAL ORGAN OBJECTS ===")
for name in found_organs[:50]:
    print(f"  - {name}")

print("\n=== DONE - Review output to plan extraction ===")
