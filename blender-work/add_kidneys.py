"""
Open the current clean organs blend, import kidneys/bladder from Z-Anatomy, re-export.
"""
import bpy
import os

# First list what kidney-related objects exist in Z-Anatomy
# We need to append them from the Z-Anatomy source file

Z_ANATOMY = r"C:\Users\nfart\OneDrive\Desktop\clinic\blender-work\Z-Anatomy\Startup.blend"
CURRENT = r"C:\Users\nfart\OneDrive\Desktop\clinic\blender-work\organs_final.blend"
OUTPUT = r"C:\Users\nfart\OneDrive\Desktop\clinic\public\models\organs.glb"

# Get kidney/bladder object names from Z-Anatomy
# We'll open Z-Anatomy, find kidneys, note their names

# Actually simpler: just re-export from Z-Anatomy with kidneys added

# First let's see what's currently in our clean model
current_names = set()
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        current_names.add(obj.name)
print(f"Current model has {len(current_names)} objects")

# Now append kidney objects from Z-Anatomy
kidney_keywords = ["kidney", "renal", "ureter", "bladder", "suprarenal", "adrenal"]

# We need to use bpy.ops.wm.append to bring objects from Z-Anatomy
# First, list objects in Z-Anatomy that match
import subprocess

# Alternative: open Z-Anatomy, select kidneys, copy to clipboard...
# Actually the simplest approach: just add to the export script

print("Will re-export from Z-Anatomy source with kidneys included")
