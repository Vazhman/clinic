"""Verify Thyroid gland geometry size and bounding-box location."""
import bpy

names = ["Thyroid gland", "Thyroid cartilage", "Inferior parathyroid gland.l",
         "Inferior parathyroid gland.r", "Superior parathyroid gland.l",
         "Superior parathyroid gland.r", "Left ventricle", "Right ventricle",
         "Left atrium", "Right atrium", "Pulmonary trunk"]

for n in names:
    o = bpy.data.objects.get(n)
    if o is None:
        print(f"MISS {n}")
        continue
    me = o.data
    nv = len(me.vertices) if me else 0
    np = len(me.polygons) if me else 0
    # World-space bbox
    bb = [o.matrix_world @ v.co for v in me.vertices] if me and me.vertices else []
    if bb:
        xs = [v.x for v in bb]; ys = [v.y for v in bb]; zs = [v.z for v in bb]
        size = (max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs))
        center = ((max(xs)+min(xs))/2, (max(ys)+min(ys))/2, (max(zs)+min(zs))/2)
        print(f"{n}: {nv}v {np}p  size=({size[0]:.2f}, {size[1]:.2f}, {size[2]:.2f})  center=({center[0]:.2f}, {center[1]:.2f}, {center[2]:.2f})")
    else:
        print(f"{n}: {nv}v {np}p  NO_BBOX")
