// Upload the curated doctor photos (public/images/doctors/, mapped in
// src/lib/data.ts by doctor name) into CMS Media and link each to the matching
// doctor record. Matches CMS doctors by their Georgian name. Only sets a photo
// on doctors that don't already have a CMS-uploaded one (never overwrites).
//
// Usage: SITE=https://clinic-one-blush.vercel.app node scripts/_upload-doctor-images.mjs [--dry]
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SITE = process.env.SITE || "http://localhost:3001";
const EMAIL = process.env.ADMIN_EMAIL || "admin@admin.ge";
const PASSWORD = process.env.ADMIN_PASSWORD || "111111";
const DRY = process.argv.includes("--dry");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ── parse data.ts for {slug, name, photo} doctor entries ────────────────────
const dataSrc = readFileSync(path.join(ROOT, "src/lib/data.ts"), "utf8");
const re = /slug:\s*"([^"]+)",[\s\S]{0,500}?name:\s*"([^"]+)",[\s\S]{0,500}?photo:\s*"(\/images\/doctors\/[^"]+)"/g;
const entries = [];
let m;
while ((m = re.exec(dataSrc)) !== null) {
  entries.push({ slug: m[1], name: m[2], photo: m[3] });
}
console.log(`${DRY ? "[DRY] " : ""}parsed ${entries.length} doctor photo mappings from data.ts\n`);

// ── auth ────────────────────────────────────────────────────────────────────
let token = "";
async function api(p, opts = {}) {
  const res = await fetch(`${SITE}/api${p}`, {
    ...opts,
    headers: { ...(token ? { Authorization: `JWT ${token}` } : {}), ...(opts.headers || {}) },
  });
  let body = null;
  try { body = await res.json(); } catch {}
  return { status: res.status, body };
}
{
  const r = await api("/users/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  token = r.body?.token;
  if (!token) { console.error("LOGIN FAILED", r.status); process.exit(2); }
}

const ctype = (f) => (/\.png$/i.test(f) ? "image/png" : /\.jpe?g$/i.test(f) ? "image/jpeg" : /\.webp$/i.test(f) ? "image/webp" : "application/octet-stream");

let linked = 0, noFile = 0, noDoctor = 0, hadPhoto = 0, failed = 0;
for (const e of entries) {
  const filePath = path.join(ROOT, "public", e.photo);
  if (!existsSync(filePath)) { console.log(`SKIP  ${e.name} — image file missing (${e.photo})`); noFile++; continue; }

  // find CMS doctor by Georgian name
  const found = await api(`/doctors?where[name][equals]=${encodeURIComponent(e.name)}&locale=ge&depth=0&limit=1`);
  const doc = found.body?.docs?.[0];
  if (!doc) { console.log(`SKIP  ${e.name} — no CMS doctor with this name`); noDoctor++; continue; }
  if (doc.photo) { console.log(`SKIP  ${e.name} — already has a CMS photo`); hadPhoto++; continue; }

  if (DRY) { console.log(`WOULD LINK  ${e.name} <- ${path.basename(e.photo)}`); linked++; continue; }

  // upload the file to Media
  const buf = readFileSync(filePath);
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type: ctype(e.photo) }), path.basename(e.photo));
  fd.append("_payload", JSON.stringify({ alt: e.name }));
  const up = await fetch(`${SITE}/api/media?locale=ge`, { method: "POST", headers: { Authorization: `JWT ${token}` }, body: fd });
  const upBody = await up.json().catch(() => null);
  const mediaId = upBody?.doc?.id;
  if (!mediaId) { console.log(`FAIL  ${e.name} — media upload ${up.status}`); failed++; continue; }

  // link to the doctor
  const patch = await api(`/doctors/${doc.id}?locale=ge`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photo: mediaId }) });
  if (patch.status === 200) { console.log(`LINK  ${e.name} <- ${path.basename(e.photo)} (media ${mediaId})`); linked++; }
  else { console.log(`FAIL  ${e.name} — doctor patch ${patch.status}`); failed++; }
}

console.log(`\n=== ${DRY ? "DRY — " : ""}${linked} linked, ${hadPhoto} already had photo, ${noFile} missing file, ${noDoctor} no CMS doctor, ${failed} failed ===`);
