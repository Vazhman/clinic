"""Diagnose why Brain.j / Cerebrum.j didn't make it into the export."""
import bpy

targets = ["Brain.j", "Brain", "Cerebrum.j", "Cerebrum", "Cerebellum.j", "Cerebellum",
           "Brainstem.j", "Frontal lobe.j", "Frontal lobe", "Larynx.j", "Pharynx.j",
           "Cerebral hemisphere.j"]

for t in targets:
    obj = bpy.data.objects.get(t)
    if obj is None:
        print(f"NOT_FOUND: {t}")
        continue
    children = [c.name + f"({c.type})" for c in obj.children]
    print(f"FOUND: {t}  type={obj.type}  parent={obj.parent.name if obj.parent else None}  children={len(obj.children)}")
    if children:
        print("  children sample: " + ", ".join(children[:6]))

# Show any object whose name starts with 'Brain' or 'Cerebrum'
print("\n--- All Brain* objects ---")
for o in bpy.data.objects:
    if o.name.startswith("Brain") or o.name.startswith("Cerebrum") or o.name.startswith("Cerebellum"):
        print(f"  {o.name}  type={o.type}")
