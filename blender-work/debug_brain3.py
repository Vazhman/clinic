"""Find ALL mesh objects with non-trivial geometry that anatomically are part of the brain."""
import bpy

# Look for any MESH with >100 verts whose name OR collection mentions brain/cerebrum
brain_kw = ["brain", "cerebr", "cerebellum", "thalamus", "hypothalamus", "pons",
            "medulla", "midbrain", "tectum", "tegmentum", "hippocampus", "amygdala",
            "frontal lobe", "parietal lobe", "temporal lobe", "occipital lobe",
            "white matter", "gray matter", "grey matter", "corpus callosum"]

results = []
for o in bpy.data.objects:
    if o.type != "MESH":
        continue
    me = o.data
    if me is None or len(me.vertices) < 50:  # skip 2-vert label anchors
        continue
    name_lower = o.name.lower()
    coll_names = " ".join(c.name for c in o.users_collection).lower()
    if any(kw in name_lower or kw in coll_names for kw in brain_kw):
        results.append((o.name, len(me.vertices), len(me.polygons),
                        [c.name for c in o.users_collection][:3]))

results.sort(key=lambda r: -r[1])
print(f"Total real brain meshes found: {len(results)}")
for name, nv, np, colls in results[:60]:
    print(f"  {nv:6d}v {np:6d}p  {name}    [colls: {colls}]")
