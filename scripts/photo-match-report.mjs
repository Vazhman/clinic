// Match WeTransfer batch filenames against the 146 active Doctra doctors.
// Mirrors the matching logic in scripts/upload-doctor-photos.py so the output
// reflects what would actually attach when the upload runs.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      let v = l.slice(i + 1);
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      return [l.slice(0, i), v];
    }),
);

const IMG_DIR = "C:\\Users\\nika.fartenadze.LCIBATUMI\\Downloads\\wetransfer_jpg_2026-05-12_0953";
const SKIP = new Set([
  "ლადო ბაზიაშვილი.jpg",
  "სტომატოლოგია.jpeg",
  "კობა ქამაშიძე2.jpg",
  "მერაბ ნაკაშიძე1.jpg",
]);
const NICK = { "ზურა": "ზურაბ", "ლადო": "ვლადიმერ" };

const stripParen = (s) => s.replace(/\s*\([^)]*\)/g, "");
const norm = (s) => stripParen(s).toLowerCase().replace(/\s+/g, " ").trim();
const expand = (s) => s.split(" ").map((p) => NICK[p] || p).join(" ");
const extract = (fn) => {
  let b = fn.replace(/\.[^.]+$/, "");
  b = b.replace(/\s*\d+$/, "");
  b = b.split("-")[0];
  return b.trim();
};

const c = new Client({ connectionString: env.DATABASE_URL });
await c.connect();
const docs = (await c.query(`
  SELECT d.id, dl.name, dl.specialty
  FROM doctors d
  JOIN doctors_locales dl ON dl._parent_id = d.id AND dl._locale = 'ge'
  WHERE COALESCE(d.inactive, false) = false
  ORDER BY dl.name
`)).rows;
await c.end();

const files = readdirSync(IMG_DIR).filter((f) => !f.startsWith("."));

const match = (fn) => {
  const raw = extract(fn);
  const a = norm(raw);
  const b = norm(expand(raw));
  for (const d of docs) {
    const dn = norm(d.name);
    if (dn === a || dn.replace(/ /g, "") === a.replace(/ /g, "")) return d;
    if (dn === b) return d;
  }
  return null;
};

const matched = new Map();   // doctor.id -> { doc, file }
const unmatched = [];
const skipped = [];
for (const f of files) {
  if (SKIP.has(f)) { skipped.push(f); continue; }
  const d = match(f);
  if (d) matched.set(d.id, { doc: d, file: f });
  else unmatched.push(f);
}

const haveIds = new Set(matched.keys());
const without = docs.filter((d) => !haveIds.has(d.id));

console.log(`Active doctors:          ${docs.length}`);
console.log(`WeTransfer files:        ${files.length}`);
console.log(`Will attach (matched):   ${matched.size}`);
console.log(`Skipped (intentional):   ${skipped.length}  → ${skipped.join(", ")}`);
console.log(`Unmatched files:         ${unmatched.length}`);
console.log(`Doctors still without:   ${without.length}`);
console.log();

console.log("=== HAVE PHOTO (in WeTransfer batch, ready to upload) ===");
for (const { doc, file } of matched.values()) {
  console.log(`  ${doc.name.padEnd(28)} | ${doc.specialty}  ← ${file}`);
}
console.log();

console.log("=== UNMATCHED FILES (have a photo but no matching active doctor) ===");
for (const f of unmatched) console.log(`  ${f}`);
console.log();

console.log("=== NO PHOTO (still need a photo) ===");
for (const d of without) console.log(`  ${d.name.padEnd(28)} | ${d.specialty}`);
