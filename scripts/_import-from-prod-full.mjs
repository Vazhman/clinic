// One-off: mirror PRODUCTION CMS content (clinic-one-blush.vercel.app) into
// the LOCAL dev DB — services, checkup-packages, reviews, news, doctors
// (editorial fields), media, and all globals. Doctors are never created here
// (access.create is false) — run /api/import-doctra first to sync the roster
// from Doctra, then this script patches editorial fields from prod.
//
// Usage: node scripts/_import-from-prod-full.mjs
import { setTimeout as sleep } from "node:timers/promises";

const PROD = process.env.PROD || "https://clinic-one-blush.vercel.app";
const LOCAL = process.env.LOCAL || "http://localhost:3002";
if (!/localhost|127\.0\.0\.1/.test(LOCAL)) { console.error("Refusing: LOCAL is not localhost"); process.exit(1); }

const EMAIL = process.env.ADMIN_EMAIL || "vazhach1991@gmail.com";
const PASSWORD = process.env.ADMIN_PASSWORD || "111111";

async function login() {
  const r = await fetch(`${LOCAL}/api/users/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const b = await r.json();
  if (!b?.token) throw new Error(`local login failed: ${r.status} ${JSON.stringify(b)}`);
  return b.token;
}

const token = await login();
const H = { "Content-Type": "application/json", Authorization: `JWT ${token}` };

// ── media import (dedup by prod media id) ──────────────────────────────────
const mediaCache = new Map();
async function importMedia(prodId) {
  if (mediaCache.has(prodId)) return mediaCache.get(prodId);
  const prodDoc = await fetch(`${PROD}/api/media/${prodId}`).then((r) => (r.ok ? r.json() : null));
  if (!prodDoc?.url) { mediaCache.set(prodId, null); return null; }
  const fileRes = await fetch(`${PROD}${prodDoc.url}`);
  if (!fileRes.ok) { console.warn(`  media ${prodId}: file fetch ${fileRes.status}`); mediaCache.set(prodId, null); return null; }
  const buf = Buffer.from(await fileRes.arrayBuffer());
  const filename = decodeURIComponent(prodDoc.filename || prodDoc.url.split("/").pop());
  const ct = fileRes.headers.get("content-type") || "application/octet-stream";
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type: ct }), filename);
  const humanized = filename.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
  const altGe = prodDoc.alt?.ge || prodDoc.alt?.en || prodDoc.alt?.ru || humanized;
  fd.append("_payload", JSON.stringify({ alt: altGe }));
  const up = await fetch(`${LOCAL}/api/media`, { method: "POST", headers: { Authorization: `JWT ${token}` }, body: fd });
  const doc = await up.json().catch(() => null);
  const localId = doc?.doc?.id ?? null;
  if (!localId) console.warn(`  media ${prodId} (${filename}): upload failed`, up.status, JSON.stringify(doc).slice(0, 200));
  mediaCache.set(prodId, localId);
  return localId;
}

// Generic deep walker: replaces any Payload media relation (bare id under a
// known upload-field key, or a populated {id,url,filename} object) with the
// matching local media id. Handles Lexical upload nodes too (relationTo
// "media" + value).
const UPLOAD_KEYS = new Set(["image", "photo", "featuredImage", "ogImage"]);
async function relink(node, keyHint) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) node[i] = await relink(node[i], keyHint);
    return node;
  }
  if (node && typeof node === "object") {
    if (node.relationTo === "media" && "value" in node) {
      const id = typeof node.value === "object" ? node.value?.id : node.value;
      if (id != null) node.value = await importMedia(id);
      return node;
    }
    if ("url" in node && "filename" in node && "id" in node) {
      return await importMedia(node.id);
    }
    for (const k of Object.keys(node)) {
      if (UPLOAD_KEYS.has(k) && node[k] != null) {
        const v = node[k];
        const id = typeof v === "object" ? v?.id : v;
        node[k] = id != null ? await importMedia(id) : null;
      } else {
        node[k] = await relink(node[k], k);
      }
    }
    return node;
  }
  return node;
}

function stripMeta(doc) {
  const { id, createdAt, updatedAt, _status, ...rest } = doc;
  return rest;
}

async function fetchAll(path) {
  const res = await fetch(`${PROD}/api${path}`).then((r) => r.json());
  return res;
}

// ── simple collections: wipe + recreate ────────────────────────────────────
async function importSimpleCollection(slug) {
  const res = await fetchAll(`/${slug}?locale=all&limit=1000&depth=1`);
  console.log(`\n=== ${slug}: ${res.totalDocs ?? res.docs?.length ?? 0} prod docs ===`);
  const del = await fetch(`${LOCAL}/api/${slug}?where[id][exists]=true&limit=1000`, { method: "DELETE", headers: H });
  console.log(`  cleared local ${slug}: HTTP ${del.status}`);
  let ok = 0, fail = 0;
  for (const doc of res.docs || []) {
    const data = await relink(stripMeta(doc));
    const create = await fetch(`${LOCAL}/api/${slug}?locale=all`, { method: "POST", headers: H, body: JSON.stringify(data) });
    if (create.ok) ok++;
    else { fail++; console.warn(`  FAIL ${slug} prod#${doc.id}:`, create.status, (await create.text()).slice(0, 300)); }
  }
  console.log(`  ${slug}: imported ${ok}, failed ${fail}`);
}

// ── doctors: editorial-field patch onto existing (Doctra-synced) rows ──────
async function importDoctors() {
  const res = await fetchAll(`/doctors?locale=all&limit=1000&depth=1`);
  console.log(`\n=== doctors: ${res.totalDocs} prod docs ===`);
  const localList = await fetch(`${LOCAL}/api/doctors?limit=1000&depth=0&locale=ge`, { headers: H }).then((r) => r.json());
  const byDoctraId = new Map(localList.docs.filter((d) => d.doctraId).map((d) => [d.doctraId, d.id]));
  const byName = new Map(localList.docs.map((d) => [(d.name || "").trim(), d.id]));
  let patched = 0, noMatch = 0, fail = 0;
  for (const doc of res.docs || []) {
    const localId = byDoctraId.get(doc.doctraId) ?? byName.get((doc.name?.ge || "").trim());
    if (!localId) { noMatch++; continue; }
    const data = await relink({
      specialty: doc.specialty,
      phone: doc.phone,
      email: doc.email,
      biography: doc.biography,
      qualifications: doc.qualifications,
      specializations: doc.specializations,
      experienceYears: doc.experienceYears,
      languagesSpoken: doc.languagesSpoken,
      isDepartmentHead: doc.isDepartmentHead,
      showOnDoctorsPage: doc.showOnDoctorsPage,
      bookingEnabled: doc.bookingEnabled,
      photo: doc.photo,
      seo: doc.seo,
    });
    const patch = await fetch(`${LOCAL}/api/doctors/${localId}?locale=all`, { method: "PATCH", headers: H, body: JSON.stringify(data) });
    if (patch.ok) patched++;
    else { fail++; console.warn(`  FAIL doctor doctraId=${doc.doctraId}:`, patch.status, (await patch.text()).slice(0, 300)); }
  }
  console.log(`  doctors: patched ${patched}, no local match ${noMatch}, failed ${fail}`);
}

// ── globals: 1:1 mirror ─────────────────────────────────────────────────────
// A locale=all read shapes each localized leaf as {ge:.., en:.., ru:..}.
// When posting to a single-locale endpoint we must unwrap those bundles to
// the scalar for that locale — otherwise the raw {ge,en,ru} object gets sent
// as the field value itself.
const LOCALE_KEYS = new Set(["ge", "en", "ru"]);
function extractLocale(node, locale) {
  if (Array.isArray(node)) return node.map((v) => extractLocale(v, locale));
  if (node && typeof node === "object") {
    const keys = Object.keys(node);
    if (keys.length > 0 && keys.every((k) => LOCALE_KEYS.has(k))) {
      const v = node[locale] ?? node.ge ?? node.en ?? node.ru ?? null;
      return typeof v === "object" ? extractLocale(v, locale) : v;
    }
    const out = {};
    for (const k of keys) out[k] = extractLocale(node[k], locale);
    return out;
  }
  return node;
}

async function importGlobal(slug) {
  const res = await fetch(`${PROD}/api/globals/${slug}?locale=all&depth=1`).then((r) => r.json());
  const { globalType, createdAt, updatedAt, id, ...data } = res;
  await relink(data);
  for (const locale of ["ge", "en", "ru"]) {
    const localeData = extractLocale(data, locale);
    const up = await fetch(`${LOCAL}/api/globals/${slug}?locale=${locale}`, { method: "POST", headers: H, body: JSON.stringify(localeData) });
    console.log(`global ${slug} [${locale}]: HTTP ${up.status}${up.ok ? "" : " " + (await up.text()).slice(0, 300)}`);
  }
}

const ONLY_GLOBAL = process.argv.find((a) => a.startsWith("--only-global="))?.split("=")[1];

if (!ONLY_GLOBAL) {
  for (const c of ["services", "checkup-packages", "reviews", "news"]) {
    await importSimpleCollection(c);
    await sleep(200);
  }
  await importDoctors();
  for (const g of ["site-settings", "home-page", "about-page", "navigation", "footer", "contact-page", "booking-page", "doctors-page", "services-page"]) {
    await importGlobal(g);
  }
} else {
  await importGlobal(ONLY_GLOBAL);
}

console.log("\nDone.");
