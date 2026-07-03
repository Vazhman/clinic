"""Re-export the Z-Anatomy Startup.blend down to an organs-only GLB (v2).

v2 vs v1 (the current public/models/organs.glb):
- Adds Brain.j, Cerebrum.j, Cerebellum.j, Brainstem.j and the four lobes.
- Adds Larynx.j, Pharynx.j, cochlea, the three ear ossicles, tongue, and
  the laryngeal cartilages.
- Adds aorta and pulmonary veins.
- Drops the reproductive system (upstream is male-only; clinic UI dropped
  the region).
- Drops lymph nodes (e.g. '(Anterior tibial node)' clutter).

Run with:
    blender --background blender-work/Z-Anatomy/Startup.blend \
            --python blender-work/export_v2.py

Writes:
    public/models/organs.glb   - the new shipped asset
    blender-work/export_v2.log - selection diagnostics
"""
import bpy
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT_GLB = os.path.join(REPO, "public", "models", "organs.glb")
LOG = os.path.join(HERE, "export_v2.log")


# Substring patterns (case-insensitive). Any object whose lowercased name
# contains at least one of these is kept, unless excluded below.
KEEP_SUBSTRINGS = [
    # Heart & cardiovascular. Chambers + outflow only — internal valve
    # leaflets and papillary muscles are skipped (see EXCLUDE_SUBSTRINGS) so
    # the heart reads as a unified shape rather than disconnected fragments.
    "heart", "atrium", "left ventricle", "right ventricle", "aorta",
    "cardiac", "pulmonary trunk", "pulmonary vein", "coronary",
    # Lungs & respiratory
    "lung", "diaphragm", "bronch", "pleura", "alveol",
    # GI tract
    "stomach", "intestin", "colon", "duodenum", "jejunum", "ileum",
    "liver", "hepat", "gallbladder", "pancrea", "spleen", "esophag",
    "oesophag", "cecum", "rectum", "appendix", "sigmoid",
    "meso-appendix", "mesocolon", "omental", "mucosa of stomach",
    # Kidneys & urinary
    "kidney", "renal pelvis", "suprarenal", "urinary bladder", "ureter",
    # Brain (surfaces + deep structures)
    "brain", "cerebrum", "cerebellum", "cerebr", "frontal lobe",
    "parietal lobe", "temporal lobe", "occipital lobe", "hippocampus",
    "thalamus", "hypothalamus", "pons", "medulla", "midbrain",
    "tectum", "tegmentum", "aqueduct of midbrain", "falx cerebri",
    "basal forebrain", "lateral ventricle", "third ventricle",
    "fourth ventricle",
    # Eyes
    "eyeball", "sclera", "cornea", "iris", "lens", "retina", "choroid",
    "optic", "lacrimal",
    # ENT
    "trachea", "larynx", "laryngo", "epiglottis", "pharynx", "pharyng",
    "cochlea", "cricoid cartilage", "thyroid cartilage", "arytenoid cartilage",
    "incus", "malleus", "stapes", "tongue", "nasal bone", "nasal cartilage",
    "nasal septum", "tympanic", "auditory tube", "eustachian", "auricle",
    "paranasal", "maxillary sinus", "frontal sinus", "ethmoid sinus",
    "sphenoid sinus", "parotid gland", "submandibular gland",
    "vocal fold", "vocal cord",
    # Thyroid (gland — distinguished from 'thyroid cartilage' which is also ENT)
    "thyroid gland", "parathyroid",
    # Spine
    "vertebra", "intervertebral", "spinal cord", "sacrum", "coccyx",
    "paravertebral",
]


# Substrings that disqualify an object even if it matched above. Used to
# strip lymph nodes, parentheses-wrapped variants, and miscellaneous noise.
EXCLUDE_SUBSTRINGS = [
    "lymph node", "node)", "(node", "lymphatic",
    # 'retinaculum' is a limb tendon sheath — substring-collides with 'retina'.
    "retinaculum",
    # Internal cardiac structures. Z-Anatomy has no outer heart wall mesh,
    # so the chambers + valve leaflets + papillary muscles would render as
    # disconnected fragments. We keep the chambers (atria + ventricles) and
    # the pulmonary trunk; the leaflets and papillary muscles are dropped so
    # the heart reads as a single cohesive blob.
    "leaflet", "papillary muscle",
    # Reproductive (we are dropping this region)
    "uterus", "ovary", "fallop", "vagin", "cervix", "endometr",
    "myometr", "vulva", "labium", "clitor", "hymen",
    "testis", "testicl", "scrotum", "epididym", "prostat",
    "corpus cavernosum", "corpus spongiosum", "penis", "glans",
    "spermatic", "vas deferens",
]


# Z-Anatomy collections to pull in wholesale (per the collection tree in
# blender-work/startup_collections.txt). Substring match against any of the
# mesh's user collections.
KEEP_COLLECTIONS = [
    "Brain", "Cerebrum", "Cerebellum", "Brainstem", "Neo-cortex",
    "Central nervous system",
    "Frontal lobe", "Parietal lobe", "Temporal lobe", "Occipital lobe",
    "Right cerebal hemisphere", "Left cerebal hemisphere",  # sic, upstream spelling
    "Larynx", "Pharynx", "Cochlea",
]

# Collections to actively exclude (overrides KEEP_COLLECTIONS membership).
# Stops us pulling in the whole skull when "Head" or "7: Nervous system…" is
# a parent collection of brain meshes — we filter at the most specific level.
EXCLUDE_COLLECTIONS = [
    "Skull", "Cranium", "Lymph", "Nodes",
]


def keep(obj) -> bool:
    n = obj.name.lower()
    me = obj.data
    if me is None or len(me.vertices) < 10:
        # Drops Z-Anatomy's '.j' 2-vertex label-anchor meshes. (Real
        # anatomical meshes also often have a FONT parent — that's the
        # on-screen label — so we can't filter by parent type.)
        return False
    if any(x in n for x in EXCLUDE_SUBSTRINGS):
        return False

    # Keyword match takes priority over collection exclusion: this lets us
    # pull ear ossicles + nasal bone + sinuses out of Skull/Cranium without
    # importing the whole skeleton.
    if any(k in n for k in KEEP_SUBSTRINGS):
        return True

    coll_names = [c.name for c in obj.users_collection]
    if any(any(ex in c for ex in EXCLUDE_COLLECTIONS) for c in coll_names):
        return False
    if any(c in KEEP_COLLECTIONS for c in coll_names):
        return True
    return False


def _safe(callable_, *args, **kw):
    try:
        return callable_(*args, **kw)
    except Exception:
        return None


def _link_to_active_view_layer(obj):
    # If the object isn't in the active view layer, hide_set / select_set
    # raise RuntimeError. Link it into the scene's master collection so
    # operators can address it. Z-Anatomy's template keeps a lot of meshes
    # parked in collections that aren't on the default view layer.
    if obj.name not in bpy.context.view_layer.objects:
        try:
            bpy.context.scene.collection.objects.link(obj)
        except RuntimeError:
            pass


def main():
    # 1. Move every object into the active view layer's master collection so
    #    selection / export sees them. This is the lever that gets us past
    #    the 'cannot be hidden because it is not in View Layer' error.
    for obj in bpy.data.objects:
        _link_to_active_view_layer(obj)

    # 2. Unhide collections so meshes inside them are addressable.
    for coll in bpy.data.collections:
        coll.hide_viewport = False
        coll.hide_render = False

    # 3. Deselect everything, then select-by-keyword.
    _safe(bpy.ops.object.select_all, action="DESELECT")

    kept = []
    skipped = []
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            _safe(obj.select_set, False)
            continue
        if keep(obj):
            _safe(obj.select_set, True)
            obj.hide_viewport = False
            obj.hide_render = False
            kept.append(obj.name)
        else:
            _safe(obj.select_set, False)
            skipped.append(obj.name)

    print(f"KEPT={len(kept)} SKIPPED={len(skipped)}")

    with open(LOG, "w", encoding="utf-8") as f:
        f.write(f"# export_v2 selection log\nkept={len(kept)} skipped={len(skipped)}\n\n")
        f.write("## KEPT (sorted)\n")
        f.write("\n".join(sorted(kept)))
        f.write("\n\n## SKIPPED (first 200, sorted)\n")
        f.write("\n".join(sorted(skipped)[:200]))

    os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)

    # Activate any kept object so the operator has an active object.
    if kept:
        active = bpy.data.objects[kept[0]]
        if active.name in bpy.context.view_layer.objects:
            bpy.context.view_layer.objects.active = active

    # 4. Z-Anatomy parents every '.j' (joined) mesh under a '.g' FONT object
    #    (the on-screen anatomical label). Blender's glTF exporter quietly
    #    drops MESH children of FONT parents when use_selection=True, so the
    #    brain/larynx/etc. surface meshes never reach the GLB. Clearing the
    #    parent (keep_transform) reroutes them to scene root and unblocks
    #    the export. We do this in-memory; the original .blend on disk is
    #    untouched.
    cleared = 0
    for obj in bpy.data.objects:
        if obj.type != "MESH" or not obj.select_get():
            continue
        p = obj.parent
        if p is not None and p.type != "MESH" and p.type != "EMPTY":
            try:
                world = obj.matrix_world.copy()
                obj.parent = None
                obj.matrix_world = world
                cleared += 1
            except Exception as e:
                print(f"WARN: could not clear parent of {obj.name}: {e}")
    print(f"PARENT_CLEARED={cleared}")

    # Export. Apply modifiers, no Draco (predictable load on web; size budget
    # comes from the selection, not compression).
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_animations=False,
        export_skins=False,
        export_morph=False,
        export_lights=False,
        export_cameras=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
    )

    size = os.path.getsize(OUT_GLB)
    print(f"WROTE {OUT_GLB}  size={size} bytes  ({size / 1024 / 1024:.2f} MB)")


main()
