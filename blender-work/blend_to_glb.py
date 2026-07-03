import bpy
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=r"C:\Users\nfart\OneDrive\Desktop\clinic\public\models\organs.glb",
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)
import os
size = os.path.getsize(r"C:\Users\nfart\OneDrive\Desktop\clinic\public\models\organs.glb") / (1024*1024)
print(f"EXPORTED: {size:.1f} MB")
