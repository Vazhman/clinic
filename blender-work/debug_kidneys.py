import bpy

found = 0
for obj in bpy.data.objects:
    n = obj.name.lower()
    if "kidney" in n:
        found += 1
        print(f"OBJ: {obj.name} | type={obj.type} | hide={obj.hide_viewport}")

print(f"Total with 'kidney': {found}")
print(f"Total objects: {len(bpy.data.objects)}")
