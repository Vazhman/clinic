#!/usr/bin/env node
/**
 * Seed the CMS ARRAY fields that render a hardcoded fallback when empty — the
 * dangerous "add one item, lose the rest" case (footer social links, footer
 * quick links, about-page facts). After this, an editor sees the full current
 * list in the CMS and can add/remove items without silently wiping the defaults.
 *
 * Complements seed-cms-fallbacks.mjs (which handles scalar fields).
 *
 * - socialLinks (non-localized): MERGE — guarantees the canonical platforms are
 *   present without dropping anything the editor already added.
 * - quickLinks / about.stats (localized label): SEED ONLY IF EMPTY, with the
 *   per-locale label written against the same row IDs across ge/en/ru.
 *
 * Usage: SITE=http://localhost:3001 node scripts/seed-cms-arrays.mjs [--dry]
 */
import geMsg from "../src/messages/ge.json" with { type: "json" };
import enMsg from "../src/messages/en.json" with { type: "json" };
import ruMsg from "../src/messages/ru.json" with { type: "json" };

const SITE = process.env.SITE || "http://localhost:3001";
const EMAIL = process.env.ADMIN_EMAIL || "admin@admin.ge";
const PASSWORD = process.env.ADMIN_PASSWORD || "111111";
const DRY = process.argv.includes("--dry");
const MSG = { ge: geMsg, en: enMsg, ru: ruMsg };
const LOCALES = ["ge", "en", "ru"];

let token = "";
async function api(path, opts = {}) {
  const res = await fetch(`${SITE}/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `JWT ${token}` } : {}), ...(opts.headers || {}) },
  });
  let body = null;
  try { body = await res.json(); } catch { /* */ }
  return { status: res.status, body };
}
const get = (o, p) => p.split(".").reduce((x, k) => (x == null ? x : x[k]), o);

// ── auth ────────────────────────────────────────────────────────────────────
{
  const { status, body } = await api("/users/login", { method: "POST", body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  if (status !== 200 || !body?.token) { console.error("LOGIN FAILED", status, body); process.exit(2); }
  token = body.token;
  console.log(`${DRY ? "[DRY] " : ""}seeding CMS array fallbacks on ${SITE}\n`);
}

// ── 1. footer.socialLinks (non-localized) — MERGE canonical, keep extras ─────
const CANONICAL_SOCIALS = [
  { platform: "facebook", url: "https://facebook.com/khozrevanidze.ge/" },
  { platform: "instagram", url: "https://instagram.com/khozrevanidzes_clinic/" },
];
{
  const before = await api(`/globals/footer?depth=0`);
  const existing = (before.body?.socialLinks ?? []).filter((s) => s?.platform);
  const byPlatform = new Map(existing.map((s) => [s.platform, s]));
  // canonical order first (preserving the editor's URL if they set one), then
  // any extra platforms the editor added that aren't canonical.
  const merged = [
    ...CANONICAL_SOCIALS.map((c) => byPlatform.get(c.platform) ?? c),
    ...existing.filter((e) => !CANONICAL_SOCIALS.some((c) => c.platform === e.platform)),
  ];
  const changed = merged.length !== existing.length || merged.some((m, i) => existing[i]?.platform !== m.platform || existing[i]?.url !== m.url);
  if (!changed) {
    console.log(`footer.socialLinks: already complete (${existing.length} links) — skipped`);
  } else {
    console.log(`${DRY ? "WOULD SET" : "SET"} footer.socialLinks -> [${merged.map((m) => m.platform).join(", ")}] (was [${existing.map((e) => e.platform).join(", ") || "empty"}])`);
    if (!DRY) {
      const strip = merged.map(({ platform, url }) => ({ platform, url }));
      const r = await api(`/globals/footer?depth=0`, { method: "POST", body: JSON.stringify({ socialLinks: strip }) });
      if (r.status !== 200) console.error(`  !! PATCH failed ${r.status}: ${JSON.stringify(r.body?.errors).slice(0, 200)}`);
    }
  }
}

// ── localized-array helper: seed only if empty, IDs matched across locales ───
// rowsByLocale: { ge:[...], en:[...], ru:[...] } — same length/order. Each row's
// non-localized fields (href/value) must be identical across locales; only the
// localized field (label) differs.
async function seedLocalizedArray(slug, field, rowsByLocale, summarize) {
  const before = await api(`/globals/${slug}?locale=ge&depth=0&fallback-locale=null`);
  const existing = get(before.body, field) ?? [];
  if (existing.length > 0) { console.log(`${slug}.${field}: already has ${existing.length} rows — skipped`); return; }
  console.log(`${DRY ? "WOULD SEED" : "SEED"} ${slug}.${field} -> ${rowsByLocale.ge.length} rows (${summarize})`);
  if (DRY) return;
  // 1) create rows in ge (generates IDs)
  let r = await api(`/globals/${slug}?locale=ge&depth=0`, { method: "POST", body: JSON.stringify({ [field]: rowsByLocale.ge }) });
  if (r.status !== 200) { console.error(`  !! ge PATCH failed ${r.status}: ${JSON.stringify(r.body?.errors).slice(0, 250)}`); return; }
  // 2) read the generated IDs
  const afterGe = await api(`/globals/${slug}?locale=ge&depth=0`);
  const ids = (get(afterGe.body, field) ?? []).map((row) => row.id);
  // 3) write en/ru labels against the SAME row IDs (so Payload updates, not recreates)
  for (const loc of ["en", "ru"]) {
    const rows = rowsByLocale[loc].map((row, i) => ({ ...row, id: ids[i] }));
    const rr = await api(`/globals/${slug}?locale=${loc}&depth=0`, { method: "POST", body: JSON.stringify({ [field]: rows }) });
    if (rr.status !== 200) console.error(`  !! ${loc} PATCH failed ${rr.status}: ${JSON.stringify(rr.body?.errors).slice(0, 200)}`);
  }
}

// ── 2. footer.quickLinks (label localized, href shared) ──────────────────────
const QUICK = [
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "doctors", href: "/doctors" },
  { key: "checkups", href: "/checkups" },
  { key: "labTests", href: "/lab-tests" },
  { key: "blog", href: "/blog" },
  { key: "gallery", href: "/gallery" },
];
{
  const rowsByLocale = Object.fromEntries(
    LOCALES.map((loc) => [loc, QUICK.map((q) => ({ label: MSG[loc].Navigation[q.key], href: q.href }))]),
  );
  await seedLocalizedArray("footer", "quickLinks", rowsByLocale, QUICK.map((q) => q.key).join(", "));
}

// ── 3. about-page.stats (the three hardcoded facts: 2015 / 40 / 1st) ─────────
const FACTS = [
  { value: "2015", key: "founded" },
  { value: "40", key: "beds" },
  { value: "1st", key: "coblation" },
];
{
  const rowsByLocale = Object.fromEntries(
    LOCALES.map((loc) => [loc, FACTS.map((f) => ({ value: f.value, label: MSG[loc].About[f.key] }))]),
  );
  await seedLocalizedArray("about-page", "stats", rowsByLocale, FACTS.map((f) => f.value).join(" / "));
}

console.log(`\n=== ${DRY ? "DRY RUN — " : ""}done ===`);
