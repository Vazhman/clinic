import bpy
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath=r"C:\Users\nfart\OneDrive\Desktop\clinic\public\models\organs.glb")
bpy.ops.wm.save_as_mainfile(filepath=r"C:\Users\nfart\OneDrive\Desktop\clinic\blender-work\organs_final.blend")
print("Saved")
