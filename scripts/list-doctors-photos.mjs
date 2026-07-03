// One-off: list doctors split by whether they have a real photo.
// "Real" = photo_id IS NOT NULL AND filename does not match the placeholder
// avatar (id=2 in this seed — `default-avatar` / `placeholder`).
import { readFileSync } from "node:fs";
import { Client } from "pg";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      let v = l.slice(idx + 1);
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return [l.slice(0, idx), v];
    }),
);

const url = process.env.DATABASE_URL || env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const c = new Client({ connectionString: url });
await c.connect();

// Detect the placeholder media row(s). Anything containing "placeholder" /
// "avatar" / "default" in the filename is treated as not-a-real-photo.
const ph = await c.query(`
  SELECT id, filename FROM media
  WHERE filename ILIKE '%placeholder%'
     OR filename ILIKE '%default%avatar%'
     OR filename ILIKE 'doctor-placeholder%'
  ORDER BY id
`);
const placeholderIds = new Set(ph.rows.map((r) => r.id));

const rows = (await c.query(`
  SELECT d.id, dl.name, dl.specialty, d.photo_id, m.filename
  FROM doctors d
  LEFT JOIN doctors_locales dl ON dl._parent_id = d.id AND dl._locale = 'ge'
  LEFT JOIN media m ON m.id = d.photo_id
  WHERE COALESCE(d.inactive, false) = false
  ORDER BY dl.name
`)).rows;

const withPhoto = [];
const withoutPhoto = [];
for (const r of rows) {
  const real = r.photo_id != null && !placeholderIds.has(r.photo_id);
  (real ? withPhoto : withoutPhoto).push(r);
}

console.log(`# placeholder media ids: ${[...placeholderIds].join(", ") || "(none detected)"}`);
console.log(`# placeholder filenames: ${ph.rows.map((r) => r.filename).join(", ") || "(none)"}`);
console.log(`# active doctors total: ${rows.length}`);
console.log(`# with real photo:      ${withPhoto.length}`);
console.log(`# WITHOUT real photo:   ${withoutPhoto.length}`);
console.log();
console.log("## WITH photo");
for (const r of withPhoto) console.log(`  ${r.name.padEnd(28)} | ${r.specialty || "-"} | ${r.filename}`);
console.log();
console.log("## WITHOUT photo");
for (const r of withoutPhoto) console.log(`  ${r.name.padEnd(28)} | ${r.specialty || "-"}`);

await c.end();
