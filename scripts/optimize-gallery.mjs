// Recompress public/images/gallery in place. The /[locale]/gallery page serves
// these files RAW via plain <img> (no next/image pipeline), so the source files
// ARE the wire bytes — a 12.5MB original means a 12.5MB download for visitors.
// Resize to a sane web ceiling and re-encode with mozjpeg; keep filenames
// identical (HeroSection + JSON-LD reference some by exact name).
// Idempotent: skips files already at/below the ceiling that don't shrink ≥10%.
import sharp from "sharp";
import { readdirSync, statSync, renameSync, unlinkSync } from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "public", "images", "gallery");
const MAX_WIDTH = 1920;
const QUALITY = 80;

let before = 0;
let after = 0;
for (const f of readdirSync(DIR)) {
  if (!/\.jpe?g$/i.test(f)) continue;
  const file = path.join(DIR, f);
  const orig = statSync(file).size;
  const tmp = file + ".tmp";
  await sharp(file)
    .rotate() // bake EXIF orientation before stripping metadata
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(tmp);
  const next = statSync(tmp).size;
  if (next < orig * 0.9) {
    renameSync(tmp, file);
    console.log(`${f}: ${(orig / 1048576).toFixed(2)}MB -> ${(next / 1048576).toFixed(2)}MB`);
    before += orig;
    after += next;
  } else {
    unlinkSync(tmp);
    before += orig;
    after += orig;
  }
}
console.log(`\nTOTAL: ${(before / 1048576).toFixed(1)}MB -> ${(after / 1048576).toFixed(1)}MB`);
