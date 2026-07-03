import bpy

outfile = r"C:\Users\nfart\OneDrive\Desktop\clinic\blender-work\kidney_meshes.txt"
with open(outfile, "w", encoding="utf-8") as f:
    count = 0
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        n = obj.name.lower()
        if "kidney" in n or "renal" in n or "ureter" in n or "bladder" in n or "suprarenal" in n or "adrenal" in n:
            f.write(obj.name + "\n")
            count += 1
    f.write(f"\nTotal: {count}\n")

    # Also search collections
    f.write("\n--- COLLECTIONS WITH KIDNEY ---\n")
    for col in bpy.data.collections:
        if "kidney" in col.name.lower() or "renal" in col.name.lower() or "urinar" in col.name.lower():
            f.write(f"Collection: {col.name} ({len(col.objects)} objects)\n")
