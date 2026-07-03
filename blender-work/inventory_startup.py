"""Inventory the upstream Z-Anatomy Startup.blend.

Run with:
    blender --background blender-work/Z-Anatomy/Startup.blend \
            --python blender-work/inventory_startup.py

Writes:
    blender-work/startup_inventory.txt   - every mesh object name (sorted)
    blender-work/startup_collections.txt - collection tree with object counts
"""
import bpy
import os
from collections import Counter

OUT_DIR = os.path.join(os.path.dirname(__file__))


def walk_collections(coll, depth=0, lines=None):
    if lines is None:
        lines = []
    n_obj = len(coll.objects)
    n_mesh = sum(1 for o in coll.objects if o.type == "MESH")
    lines.append(f"{'  ' * depth}{coll.name}  ({n_mesh} meshes / {n_obj} objects)")
    for child in coll.children:
        walk_collections(child, depth + 1, lines)
    return lines


def main():
    all_meshes = sorted(o.name for o in bpy.data.objects if o.type == "MESH")
    with open(os.path.join(OUT_DIR, "startup_inventory.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(all_meshes))

    coll_lines = walk_collections(bpy.context.scene.collection)
    with open(os.path.join(OUT_DIR, "startup_collections.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(coll_lines))

    print(f"TOTAL_MESHES={len(all_meshes)}")
    print(f"TOTAL_OBJECTS={len(bpy.data.objects)}")
    print(f"TOTAL_COLLECTIONS={len(bpy.data.collections)}")

    keywords = {
        "BRAIN_SURFACE": ["cerebrum", "cerebr", "cortex", "brain", "cerebellum"],
        "REPRODUCTIVE": ["uterus", "ovary", "testis", "fallop", "prostat", "vagina", "epididym", "scrotum", "penis"],
        "LARYNX_COCHLEA_ENT": ["larynx", "cochlea", "pharyn", "cricoid", "arytenoid", "sinus", "tongue", "ossicl", "stapes", "incus", "malleus", "parotid", "submandibular"],
        "VESSELS": ["aorta", "vena cava", "vena_cava", "pulmonary artery", "pulmonary vein", "coronary"],
        "SKELETON": ["skull", "rib", "femur", "tibia", "fibula", "humerus", "radius", "ulna", "pelvis", "scapula", "clavicle"],
    }
    print("--- Keyword presence in upstream ---")
    lower = [m.lower() for m in all_meshes]
    for label, kws in keywords.items():
        hits = sum(1 for m in lower if any(k in m for k in kws))
        examples = [m for m in all_meshes if any(k in m.lower() for k in kws)][:5]
        print(f"{label}: {hits} hits  e.g. {examples}")


main()
