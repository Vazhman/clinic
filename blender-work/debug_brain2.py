"""Check Brain.j geometry + modifiers + visibility flags."""
import bpy

for name in ["Brain.j", "Cerebrum.j", "Cerebellum.j", "Brainstem.j",
             "Larynx.j", "Pharynx.j", "Frontal lobe.j"]:
    o = bpy.data.objects.get(name)
    if o is None:
        print(f"NOT_FOUND {name}")
        continue
    me = o.data
    n_verts = len(me.vertices) if me else 0
    n_polys = len(me.polygons) if me else 0
    mods = [m.type for m in o.modifiers]
    p = o.parent
    p_info = f"{p.name}({p.type})" if p else None
    print(f"{name}: verts={n_verts} polys={n_polys} modifiers={mods} parent={p_info} "
          f"hide_select={o.hide_select} hide_viewport={o.hide_viewport} "
          f"hide_render={o.hide_render} visible_get={o.visible_get()}")

# Look at the parent FONT object to see what it is
print("\n--- Brain.g parent details ---")
g = bpy.data.objects.get("Brain.g")
if g:
    print(f"  type={g.type} hide_select={g.hide_select} hide_viewport={g.hide_viewport}")
    print(f"  parent={g.parent.name if g.parent else None}")
    print(f"  children of Brain.g: {[c.name for c in g.children][:10]}")

# Try a different lookup — what about Brain.s, Brain.b — Z-Anatomy has multiple suffixes?
print("\n--- All objects starting with 'Brain' ---")
for o in bpy.data.objects:
    if o.name.startswith("Brain"):
        print(f"  {o.name}  type={o.type}")
