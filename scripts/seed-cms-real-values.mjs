#!/usr/bin/env node
/**
 * Migrate the REAL production values that were living as hardcoded code
 * literals / next-intl fallbacks INTO the CMS, so the database becomes the
 * single source of truth and the component-level `cms || fallback` code can be
 * removed safely. This OVERWRITES the stray test data currently in the contact
 * / navigation globals (e.g. phone "555112233", email vazhach1991@gmail.com,
 * aboutRoute label "QAMPZTBFCN") with the clinic's real values.
 *
 * Read-modify-write per locale so unrelated fields (enabled/order/subLinks,
 * the phones[] array, etc.) are never clobbered.
 *
 * Source of the real values:
 *   - contact text  -> src/messages/{ge,en,ru}.json  (Contact namespace)
 *   - phone/email/coords/whatsapp -> the FALLBACK_* constants in
 *     ContactMap.tsx / Footer.tsx / WhatsAppButton.tsx
 *
 * Usage: SITE=http://localhost:3001 node scripts/seed-cms-real-values.mjs [--dry]
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

// Real non-localized production values (from the code constants).
const REAL = {
  phoneTel: "+995422227171",
  phoneDisplay: "+995 (0422) 227171",
  email: "info@khozrevanidze.ge",
  lat: 41.6400246,
  lng: 41.6333351,
  whatsapp: "995422227171",
  ctaHref: "/booking",
};

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

// ── auth ────────────────────────────────────────────────────────────────────
{
  const { status, body } = await api("/users/login", { method: "POST", body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  if (status !== 200 || !body?.token) { console.error("LOGIN FAILED", status, body); process.exit(2); }
  token = body.token;
  console.log(`${DRY ? "[DRY] " : ""}migrating real values into CMS on ${SITE}\n`);
}

// Read-modify-write a global, per locale. mutate(doc, locale) edits the doc
// object in place; we POST the whole thing back so nothing else is dropped.
async function patchGlobal(slug, mutate, locales = LOCALES) {
  for (const locale of locales) {
    const before = await api(`/globals/${slug}?locale=${locale}&depth=0&fallback-locale=null`);
    if (before.status !== 200) { console.error(`FAIL GET ${slug} (${locale}) ${before.status}`); continue; }
    const doc = before.body;
    const changes = mutate(doc, locale);
    if (!changes || changes.length === 0) { console.log(`  ${slug} (${locale}): nothing to change`); continue; }
    console.log(`${DRY ? "WOULD WRITE" : "WRITE"} ${slug} (${locale}): ${changes.join(", ")}`);
    if (!DRY) {
      // strip server-managed keys before writing back
      const { id, createdAt, updatedAt, globalType, _status, ...payload } = doc;
      const res = await api(`/globals/${slug}?locale=${locale}&depth=0`, { method: "POST", body: JSON.stringify(payload) });
      if (res.status !== 200) console.error(`  !! PATCH ${slug} (${locale}) ${res.status}: ${JSON.stringify(res.body?.errors).slice(0, 200)}`);
    }
  }
}

// ── contact-page: real address / phone / email / hours / coords ─────────────
await patchGlobal("contact-page", (doc, loc) => {
  const C = MSG[loc].Contact;
  const ch = [];
  doc.title = C.title; ch.push("title");
  doc.address = { ...(doc.address || {}), label: C.address, value: C.addressValue, mapLatitude: REAL.lat, mapLongitude: REAL.lng }; ch.push("address(+coords)");
  doc.phone = { ...(doc.phone || {}), label: C.phone, value: REAL.phoneTel, display: REAL.phoneDisplay }; ch.push("phone");
  doc.email = { ...(doc.email || {}), label: C.email, value: REAL.email }; ch.push("email");
  doc.workingHours = { ...(doc.workingHours || {}), label: C.workingHours, weekdays: C.weekdays, weekends: C.weekends }; ch.push("workingHours");
  return ch;
});

// ── navigation: real aboutRoute label + cta href ────────────────────────────
await patchGlobal("navigation", (doc, loc) => {
  const N = MSG[loc].Navigation;
  const ch = [];
  if (doc.aboutRoute) { doc.aboutRoute = { ...doc.aboutRoute, label: N.about }; ch.push(`aboutRoute.label="${N.about}"`); }
  doc.ctaButton = { ...(doc.ctaButton || {}), href: REAL.ctaHref }; ch.push(`ctaButton.href=${REAL.ctaHref}`);
  return ch;
});

// ── footer: whatsapp number (non-localized — write once on ge) ──────────────
await patchGlobal("footer", (doc) => {
  doc.whatsappNumber = REAL.whatsapp;
  return [`whatsappNumber=${REAL.whatsapp}`];
}, ["ge"]);

console.log(`\n=== ${DRY ? "DRY RUN — " : ""}done ===`);
