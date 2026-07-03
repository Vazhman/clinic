"""Audit what's in the Heart collection + verify thyroid gland geometry."""
import bpy

def report_collection(coll_name):
    coll = bpy.data.collections.get(coll_name)
    if coll is None:
        print(f"NO_COLLECTION: {coll_name}")
        return
    print(f"\n=== Collection '{coll_name}' — {len(coll.objects)} direct objects, {len(coll.children)} sub-collections ===")
    for obj in coll.objects:
        if obj.type != "MESH":
            print(f"  {obj.name}  ({obj.type})")
            continue
        n_v = len(obj.data.vertices) if obj.data else 0
        n_p = len(obj.data.polygons) if obj.data else 0
        print(f"  {n_v:6d}v {n_p:6d}p  {obj.name}")
    for c in coll.children:
        report_collection(c.name)


def find_by_name(prefix):
    print(f"\n=== Objects whose name starts with '{prefix}' ===")
    for o in bpy.data.objects:
        if o.name.lower().startswith(prefix.lower()):
            if o.type == "MESH":
                n_v = len(o.data.vertices) if o.data else 0
                print(f"  {n_v:6d}v  {o.name}  parent={o.parent.name if o.parent else None}")
            else:
                print(f"  ({o.type})  {o.name}")


report_collection("Heart")
find_by_name("Thyroid")
find_by_name("Parathyroid")

# Also check Pericardium / Myocardium etc.
print("\n=== Pericardium / Myocardium / Epicardium / Endocardium ===")
for o in bpy.data.objects:
    if o.type != "MESH": continue
    n = o.name.lower()
    if any(k in n for k in ["pericard", "myocard", "epicard", "endocard"]):
        n_v = len(o.data.vertices) if o.data else 0
        if n_v >= 10:
            print(f"  {n_v:6d}v  {o.name}")
