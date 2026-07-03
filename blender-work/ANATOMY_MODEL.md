# Human Anatomy 3D Model — Working Notes

Status notes for the 3D anatomy viewer used on the Health Library page. The
underlying Blender assets, processing scripts, and known issues with the
currently-shipped GLB are tracked here so future work can pick up where things
stopped.

> Last refreshed: 2026-05-21. The previous version of this doc described local
> files that no longer exist on disk and a clean pipeline that has since
> diverged from what's actually shipping. Sections below reflect the real
> current state.

## Where it's used in the app

- **Page**: `/[locale]/health-library` (`src/app/(frontend)/[locale]/health-library/page.tsx`)
- **React wrapper**: `src/components/health-library/AnatomyExplorer.tsx`
  — lazy-loads the viewer, owns the 10 region buttons + organ panel.
- **3D viewer**: `src/components/health-library/AnatomyViewer3D.tsx`
  — Three.js / R3F, loads the GLB, handles highlighting, hover, click.
- **Shipped asset**: `public/models/organs.glb` — 4.3 MB, re-exported 2026-05-21
  by `export_v2.py` from the freshly downloaded `Z-Anatomy/Startup.blend`,
  Draco-compressed (level 6). This is what the browser actually loads.
- **Backup of pre-v2 GLB**: `blender-work/organs_v1_backup_20260521.glb`
  (2.7 MB, the file shipped from 2026-04-24 to 2026-05-21).

The 9 user-facing regions (`bodyRegions` in `AnatomyExplorer.tsx` after 2026-05-21):
`head` (brain), `eyes`, `ent` (ear/nose/throat), `thyroid`, `heart`, `lungs`,
`stomach` (GI), `spine`, `kidneys` (urinary).

> **Reproductive region was removed on 2026-05-21.** Upstream Z-Anatomy is a
> male-only model; female reproductive anatomy is on their roadmap but not yet
> built. Since the clinic page advertised conditions like endometriosis /
> fibroids / pregnancy planning (clearly female-focused), shipping male
> reproductive as a placeholder would have been misleading. If a female model
> becomes available — or we source one separately under a compatible licence —
> add the region back to `bodyRegions` and re-export.

Region → mesh-name matcher (`meshMatchesRegion`) and per-organ base colours
(`ORGAN_BASE_COLORS`) live at the top of `AnatomyViewer3D.tsx`. Any rename in
the GLB silently breaks highlighting.

## Source of the model

**Z-Anatomy** — a CC BY-SA 4.0 libre 3D anatomical atlas.

- Upstream org: https://github.com/Z-Anatomy
- Master template (Blender): https://github.com/Z-Anatomy/Models-of-human-anatomy
  (formerly `Z-Anatomy/The-blend`)
- Original mesh source: **BodyParts3D** (CC BY-SA 2.1 Japan)
  — https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Definitions/labels: based on Wikipedia (CC BY-SA 3.0)
- Authors: Kousaku Okubo (BodyParts3D), Gauthier Kervyn (design/3D/anatomy),
  Marcin Zielinski (Blender add-on), Lluis Vinent (Unity)

**License obligation.** Any derivative we ship must remain CC BY-SA 4.0 and
attribute Z-Anatomy + BodyParts3D. Attribution is **not** yet wired into the
Health Library UI — add a credits line when polishing this page.

## What is actually on disk

Re-downloaded from upstream on **2026-05-21** into `blender-work/`. SHA-256
hashes recorded for reproducibility.

### `blender-work/The-blend/` — upstream snapshot (newly restored)

| File | Size | SHA-256 (truncated) | Notes |
|------|------|--------------------|-------|
| `Z-Anatomy.zip` | 86.7 MB | `e029688545…` | Blender Application Template. Contains the master `Startup.blend` (see below), `Anatomy-shortcuts.py`, themes, `__init__.py`, splash. |
| `Z-Biomechanics.7z` | 21.6 MB | `0a74b2fa3c…` | Skeletal/muscular biomechanics layer. **Not extracted** — no `7z` CLI on this machine; unpack with 7-Zip / WinRAR / `py7zr` when needed. |
| `Readme.md` | 4 KB | — | Upstream README (install instructions, attribution). |
| `License.txt` | 3 KB | — | CC BY-SA 4.0 full text. |
| `TA2.csv` | 1.5 MB | — | Anatomical lexicon: 4-digit TA2 IDs + multilingual names. Useful for switching the matcher from keyword-on-name to ID-on-userData. |
| `Anatomy-shortcuts.py` | 291 KB | — | Z-Anatomy's in-Blender navigation/shortcut macros. Reference only. |
| `TO_DO_List.txt` | 3 KB | — | Upstream roadmap. |

### `blender-work/Z-Anatomy/` — extracted Blender template

| File | Size | Notes |
|------|------|-------|
| `Startup.blend` | **306.8 MB** | The master scene. Contains every mesh in the Z-Anatomy atlas — this is what we trim down to produce `organs.glb`. |
| `Anatomy-shortcuts.py` | 291 KB | (copy of the one above) |
| `__init__.py` | 60 KB | Application Template init for Blender. |
| `Anatomy_Bright.xml`, `Anatomy_Dark.xml` | 47 KB each | Blender themes. |
| `splash.png` | 690 KB | — |

### `blender-work/glb_inventory.txt`

Generated 2026-05-21. Sorted list of every node name inside the current
`public/models/organs.glb` (180 nodes / 160 meshes). Use this to verify what's
present without opening Blender.

### Python scripts (run via `blender --background --python <script>`)

**Canonical (current) export pipeline:**

- **`export_v2.py`** — the one to use. Selects a curated set of meshes from
  `Startup.blend` using a keyword + collection filter, drops `.j` label-anchor
  meshes by vertex count (≥ 10), reparents kept meshes to scene root so the
  glTF exporter doesn't silently drop them, and exports a Draco-compressed
  GLB to `public/models/organs.glb`. Writes a selection log to
  `blender-work/export_v2.log` listing what was kept vs skipped.
- **`inventory_startup.py`** — full inventory of the upstream `Startup.blend`
  (writes `startup_inventory.txt` + `startup_collections.txt`).
- **`debug_brain.py`, `debug_brain2.py`, `debug_brain3.py`** — diagnostic
  helpers used while figuring out Z-Anatomy's naming scheme; kept for
  reference.

**Historical / legacy scripts** (written against intermediate `.blend`
snapshots that no longer exist on disk — reference only):

`convert_to_blend*.py`, `to_blend.py`, `extract_organs.py`, `cleanup.py`,
`export_*.py` (10 variants from before v2), `add_skull_export.py`,
`add_kidneys.py`, `list_kidneys.py`, `debug_kidneys.py`, `kidney_meshes.txt`,
`debug2.py`, `blend_to_glb.py`.

## Region coverage in the shipped GLB (v2, 2026-05-21)

469 mesh nodes total. Cross-checked `blender-work/glb_inventory.txt` against
the 9 page regions:

| Region | Status | Detail |
|--------|--------|--------|
| **head / brain** | 🟢 Surface present | `White matter of telencephalon.{l,r}` (the hemisphere outer surface — 67k vertices each) plus all major gyri/sulci, full cerebellum (biventral / quadrangular / semilunar lobules, vermis, flocculus, culmen, declive, tonsil of cerebellum), brainstem (pons, midbrain, medulla oblongata), deep nuclei (hippocampus, thalamus, hypothalamus, globus pallidus, caudate, lentiform), ventricles, corpus callosum, fornix, choroid plexus, optic tract. ~164 brain meshes total. |
| **eyes** | 🟢 Good | Cornea, sclera, iris, lens, retina, eyeball chambers/segments/axes — all per L/R. No `retinaculum` contamination (excluded at export). |
| **ent** | 🟢 Now strong | Trachea, larynx + all laryngeal cartilages (cricoid, arytenoid, thyroid cartilage), epiglottis, full pharynx (naso/oro/laryngo), cochlea L/R + cochlear nerve, **all three middle-ear ossicles** (stapes, incus, malleus per L/R), tongue, nasal bone. Paranasal sinuses still absent — upstream has them only as bone cavities, not separate surface meshes. |
| **thyroid** | 🟢 Good | `Thyroid gland` (84 verts) + `Superior/Inferior parathyroid gland.{l,r}` (9 verts each — basically point markers in upstream). Matcher distinguishes "thyroid gland" (endocrine, this region) from "thyroid cartilage" (ENT). The cartilage sits right next to the gland and is ~25× larger, which previously overpowered the gland visually — the viewer now hides the thyroid cartilage when the thyroid region is the active selection (`HIDE_WHEN_REGION_ACTIVE` in `AnatomyViewer3D.tsx`). |
| **heart** | 🟡 Best available | 4 chambers (atria + ventricles) + pulmonary trunk. **The internal valve leaflets and papillary muscles are deliberately dropped at export** (see `EXCLUDE_SUBSTRINGS` in `export_v2.py`) because upstream has no outer heart wall mesh — leaving the internal structures in made the heart read as scattered fragments. The chambers naturally overlap to form a unified heart shape. Aorta surface absent from upstream (it's only a `.j` label anchor). If a closed outer cardiac wall is ever needed, source it elsewhere. |
| **lungs** | 🟢 Good | Five lung lobes + extensive diaphragm meshes. |
| **stomach (GI)** | 🟢 Good | Stomach, full colon, duodenum, liver (all 8 Couinaud segments), pancreas, spleen, gallbladder, appendix, mesentery. |
| **kidneys** | 🟢 Good | Kidneys, renal pelvis, suprarenal glands, urinary bladder. |
| **spine** | 🟢 Excellent | Every vertebra C3 → S, every intervertebral disc, spinal cord horns, paravertebral lines. |

### What's known about Z-Anatomy mesh naming (learned 2026-05-21)

- The hemisphere surface is `White matter of telencephalon.{l,r}` — **not**
  `Brain` or `Cerebrum`. Cerebrum is a parent collection, not a single mesh.
- `.j` suffix = a 2-vertex empty mesh that anchors a floating text label
  (the sibling `.g` is a FONT object). They contain no geometry. The old
  matcher code expected `brain.j`/`cerebrum.j` to be the brain surface; in
  fact they're invisible placeholders. The export step now drops anything
  with fewer than 10 vertices, which strips all label anchors.
- Most real meshes have a FONT parent (the on-screen label). Selecting them
  via Blender's GLTF exporter requires either clearing the parent or
  re-parenting to scene root, which `export_v2.py` does for any mesh whose
  parent is type ≠ MESH/EMPTY.
- Cardiac vs cerebral "ventricle": Blender uses `Left ventricle` / `Right
  ventricle` for the heart and `Third ventricle` / `Fourth ventricle` /
  `Lateral ventricle.{l,r}` for the brain. The viewer matcher splits them
  by side-specific phrase rather than the bare word.

## How to re-export

The pipeline is now one command. Tested with **Blender 5.1.1** on Windows.
(The Z-Anatomy `Startup.blend` was saved in Blender 3.x; Blender 4.x and 5.x
open the meshes fine but Z-Anatomy's in-Blender shortcut add-on does not run
on the newer versions — irrelevant for headless export.)

```powershell
# Add Blender to PATH if it isn't already (one-time):
$env:Path += ";C:\Program Files\Blender Foundation\Blender 5.1"

# Re-export from the master to the shipped GLB:
blender --background blender-work/Z-Anatomy/Startup.blend `
        --python blender-work/export_v2.py

# Regenerate the inventory:
node -e "
const fs = require('fs');
const buf = fs.readFileSync('public/models/organs.glb');
const jsonLen = buf.readUInt32LE(12);
const j = JSON.parse(buf.slice(20, 20+jsonLen).toString('utf8'));
const names = (j.nodes||[]).map(n => n.name).filter(Boolean).sort();
fs.writeFileSync('blender-work/glb_inventory.txt', names.join('\n'));
console.log('nodes=' + names.length);
"
```

When you edit `export_v2.py` to change the inclusion list:

1. Adjust `KEEP_SUBSTRINGS` (name keywords), `KEEP_COLLECTIONS`
   (Z-Anatomy collection names) or `EXCLUDE_SUBSTRINGS` (false-positive
   trap, e.g. `retinaculum` colliding with `retina`).
2. Re-run the two commands above.
3. **Update the matcher** in
   `src/components/health-library/AnatomyViewer3D.tsx` (`meshMatchesRegion`,
   `ORGAN_BASE_COLORS`) and the click-to-region map at
   `src/components/health-library/AnatomyExplorer.tsx:283`
   to handle any new mesh names you've pulled in.
4. **Smoke-test** on `/ge/health-library`: click each of the 9 region
   chips → the right organs highlight pink and the rest dim. Then click
   an organ in the 3D view → it sets the right region in the side panel.
5. **License credit** — CC BY-SA 4.0 requires visible attribution. Not yet
   wired in the UI; add a "Anatomy model: Z-Anatomy (CC BY-SA 4.0) /
   BodyParts3D" line somewhere on the Health Library page when polishing.

### Stretch goal: TA2-ID based matcher

The upstream `TA2.csv` lexicon maps every anatomical structure to a 4-digit
Terminologia Anatomica 2 ID. If `export_v2.py` stamps the TA2 ID into each
mesh's `extras` field and the viewer reads it via `mesh.userData.gltfExtras`,
the matcher becomes a small dictionary keyed by ID — robust to renames /
translations and easier to extend. Upstream's `TO_DO_List.txt` explicitly
recommends this. Worth doing the next time the matcher needs touching.

## Quick GLB inventory

To regenerate `glb_inventory.txt` after any re-export:

```bash
node -e "
const fs = require('fs');
const buf = fs.readFileSync('public/models/organs.glb');
const jsonLen = buf.readUInt32LE(12);
const j = JSON.parse(buf.slice(20, 20+jsonLen).toString('utf8'));
const names = (j.nodes||[]).map(n => n.name).filter(Boolean).sort();
fs.writeFileSync('blender-work/glb_inventory.txt', names.join('\n'));
console.log('nodes=' + names.length);
"
```
