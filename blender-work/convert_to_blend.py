import bpy

# Clear default scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Import the GLB
bpy.ops.import_scene.gltf(filepath=r"C:\Users\nfart\OneDrive\Desktop\clinic\public\models\organs.glb")

# Save as .blend
bpy.ops.wm.save_as_mainfile(filepath=r"C:\Users\nfart\OneDrive\Desktop\clinic\blender-work\organs_edit.blend")
print("Saved organs_edit.blend")
