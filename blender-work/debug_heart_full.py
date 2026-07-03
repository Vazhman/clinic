"""List EVERY real mesh in upstream Heart collection (recursive)."""
import bpy

def walk(coll, depth=0):
    indent = "  " * depth
    # Direct mesh objects with real geometry
    for o in coll.objects:
        if o.type == "MESH" and o.data and len(o.data.vertices) >= 10:
            print(f"{indent}{len(o.data.vertices):6d}v  {o.name}  [coll: {coll.name}]")
    for c in coll.children:
        walk(c, depth + 1)


root = bpy.data.collections.get("Heart")
if root:
    walk(root)
else:
    print("Heart collection not found")

# Also include cardiac vessels collection
print("\n--- Cardiac vessels ---")
cv = bpy.data.collections.get("Cardiac vessels")
if cv:
    walk(cv)
