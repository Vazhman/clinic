#!/usr/bin/env node
/**
 * Seed every CMS field that currently renders via a TRANSLATION FALLBACK with
 * its actual on-page value, in all three locales — so an editor opening any
 * field sees the live text instead of a blank box.
 *
 * - Only fills fields that are EMPTY in the CMS (real data is never touched).
 * - Idempotent: re-running fills nothing new.
 * - PERSISTS the values (this is a seed, not a test — no restore).
 * - The value written is exactly what the frontend would have shown: the
 *   matching key from src/messages/{locale}.json (the same fallback the
 *   components use), or a literal where the component hardcodes one.
 *
 * Usage:
 *   SITE=http://localhost:3000 node scripts/seed-cms-fallbacks.mjs          # apply
 *   SITE=http://localhost:3000 node scripts/seed-cms-fallbacks.mjs --dry    # preview
 */
import geMsg from "../src/messages/ge.json" with { type: "json" };
import enMsg from "../src/messages/en.json" with { type: "json" };
import ruMsg from "../src/messages/ru.json" with { type: "json" };

const SITE = process.env.SITE || "http://localhost:3000";
const EMAIL = process.env.ADMIN_EMAIL || "admin@admin.ge";
const PASSWORD = process.env.ADMIN_PASSWORD || "111111";
const DRY = process.argv.includes("--dry");

const MSG = { ge: geMsg, en: enMsg, ru: ruMsg };
const LOCALES = ["ge", "en", "ru"];

// value resolvers ------------------------------------------------------------
// t(ns,key)       -> messages[locale][ns][key]
// lit(value)      -> the same literal in every locale (e.g. rating "4.9")
// copyright()     -> the component's exact composed copyright fallback
const t = (ns, key) => (locale) => MSG[locale]?.[ns]?.[key] ?? "";
const lit = (value) => () => value;

// field map: every global field that renders through a translation fallback,
// mapped to the value the frontend would have shown. Mirrors the `?.trim() ||
// t(...)` lines in the components (see HeroSection, SymptomNavigator, Footer,
// ContactMap, Header, getNavigation, about/booking/contact pages).
const SEED = [
  // ── navigation: route labels + CTA (getNavigation + Header.tsx) ──────────
  { slug: "navigation", path: "homeRoute.label",     val: t("Navigation", "home") },
  { slug: "navigation", path: "aboutRoute.label",    val: t("Navigation", "about") },
  { slug: "navigation", path: "servicesRoute.label", val: t("Navigation", "services") },
  { slug: "navigation", path: "doctorsRoute.label",  val: t("Navigation", "doctors") },
  { slug: "navigation", path: "checkupsRoute.label", val: t("Navigation", "checkups") },
  { slug: "navigation", path: "blogRoute.label",     val: t("Navigation", "blog") },
  { slug: "navigation", path: "contactRoute.label",  val: t("Navigation", "contact") },
  { slug: "navigation", path: "ctaButton.label",     val: t("Navigation", "booking") },

  // ── home-page: hero + trust strip + symptom navigator ────────────────────
  { slug: "home-page", path: "hero.headline",        val: t("Hero", "headline") },
  { slug: "home-page", path: "hero.subheadline",     val: t("Hero", "subheadline") },
  { slug: "home-page", path: "hero.bookButtonText",  val: t("Hero", "bookVisit") },
  { slug: "home-page", path: "hero.badgeText",       val: t("Hero", "activeSince") },
  { slug: "home-page", path: "trustStrip.rating",       val: lit("4.9") },
  { slug: "home-page", path: "trustStrip.doctorCount",  val: t("Hero", "doctorsCount") },
  { slug: "home-page", path: "trustStrip.patientCount", val: t("Hero", "patientsCount") },
  { slug: "home-page", path: "symptomNavigator.title",       val: t("SymptomNavigator", "title") },
  { slug: "home-page", path: "symptomNavigator.subtitle",    val: t("SymptomNavigator", "subtitle") },
  { slug: "home-page", path: "symptomNavigator.placeholder", val: t("SymptomNavigator", "placeholder") },

  // ── footer ───────────────────────────────────────────────────────────────
  { slug: "footer", path: "description", val: t("Footer", "description") },
  // NB: `copyright` is intentionally NOT seeded. Its default embeds the current
  // year, so seeding would freeze it. Instead the Footer.copyright field shows
  // the default as a greyed admin placeholder (see src/globals/Footer.ts) — the
  // editor sees what renders without the value being pinned to one year.

  // ── contact-page: page title + card labels/hours (ContactMap) ────────────
  { slug: "contact-page", path: "title",                  val: t("Contact", "title") },
  { slug: "contact-page", path: "address.label",          val: t("Contact", "address") },
  { slug: "contact-page", path: "phone.label",            val: t("Contact", "phone") },
  { slug: "contact-page", path: "email.label",            val: t("Contact", "email") },
  { slug: "contact-page", path: "workingHours.label",     val: t("Contact", "workingHours") },
  { slug: "contact-page", path: "workingHours.weekdays",  val: t("Contact", "weekdays") },
  { slug: "contact-page", path: "workingHours.weekends",  val: t("Contact", "weekends") },

  // ── about-page hero ───────────────────────────────────────────────────────
  { slug: "about-page", path: "title",    val: t("About", "title") },
  { slug: "about-page", path: "subtitle", val: t("About", "subtitle") },

  // ── booking-page: title + step labels + form labels (BookingWizard) ──────
  { slug: "booking-page", path: "title",    val: t("Booking", "title") },
  { slug: "booking-page", path: "subtitle", val: t("Booking", "subtitle") },
  { slug: "booking-page", path: "steps.selectService", val: t("Booking", "stepServiceDoctor") },
  { slug: "booking-page", path: "steps.selectDate",    val: t("Booking", "stepDateTime") },
  { slug: "booking-page", path: "steps.yourInfo",      val: t("Booking", "stepInfo") },
  { slug: "booking-page", path: "steps.confirm",       val: t("Booking", "stepConfirm") },
  { slug: "booking-page", path: "form.fullName",       val: t("Booking", "fullName") },
  { slug: "booking-page", path: "form.phoneNumber",    val: t("Booking", "phoneNumber") },
  { slug: "booking-page", path: "form.confirmButton",  val: t("Booking", "confirm") },
  { slug: "booking-page", path: "form.successMessage", val: t("Booking", "successMessage") },
];

// ── helpers ─────────────────────────────────────────────────────────────────
let token = "";
async function api(path, opts = {}) {
  const res = await fetch(`${SITE}/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `JWT ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, body };
}
const get = (obj, dotted) => dotted.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
const setDeep = (dotted, value) => {
  const keys = dotted.split(".");
  const root = {};
  let cur = root;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] = {};
  cur[keys[keys.length - 1]] = value;
  return root;
};

// ── auth ──────────────────────────────────────────────────────────────────
{
  const { status, body } = await api("/users/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (status !== 200 || !body?.token) { console.error("LOGIN FAILED", status, body); process.exit(2); }
  token = body.token;
  console.log(`${DRY ? "[DRY RUN] " : ""}seeding fallbacks on ${SITE} as ${EMAIL}\n`);
}

// ── seed ────────────────────────────────────────────────────────────────────
let filled = 0, skipped = 0, failed = 0;
// Group by (slug, locale) so we read each global once per locale, build a
// single merged patch, and write once — fewer round-trips, atomic per locale.
for (const locale of LOCALES) {
  const bySlug = new Map();
  for (const e of SEED) {
    if (!bySlug.has(e.slug)) bySlug.set(e.slug, []);
    bySlug.get(e.slug).push(e);
  }
  for (const [slug, entries] of bySlug) {
    // fallback-locale=null: read the TRUE per-locale value. Without it, an empty
    // en/ru field returns the ge value (Payload's default locale fallback), which
    // would fool the emptiness check into skipping a genuinely-blank en/ru input.
    const before = await api(`/globals/${slug}?locale=${locale}&depth=0&fallback-locale=null`);
    if (before.status !== 200) { console.log(`FAIL  ${slug} (${locale}) GET ${before.status}`); failed += entries.length; continue; }

    let patch = {};
    const toFill = [];
    for (const e of entries) {
      const current = get(before.body, e.path);
      const value = e.val(locale);
      if (typeof current === "string" && current.trim() !== "") { skipped++; continue; }
      if (!value || !value.trim()) { skipped++; continue; } // no source value — leave blank
      // deep-merge this field into the patch object
      const piece = setDeep(e.path, value);
      patch = mergeDeep(patch, piece);
      toFill.push({ path: e.path, value });
    }

    if (!toFill.length) continue;
    for (const f of toFill) console.log(`${DRY ? "WOULD FILL" : "FILL"}  ${slug}.${f.path} (${locale}) = ${JSON.stringify(f.value).slice(0, 48)}`);

    if (!DRY) {
      const res = await api(`/globals/${slug}?locale=${locale}&depth=0`, { method: "POST", body: JSON.stringify(patch) });
      if (res.status !== 200) { console.log(`  !! PATCH FAILED ${slug} (${locale}) ${res.status}: ${JSON.stringify(res.body?.errors).slice(0, 160)}`); failed += toFill.length; continue; }
      // verify each landed (fallback off, so we confirm the real per-locale write)
      const after = await api(`/globals/${slug}?locale=${locale}&depth=0&fallback-locale=null`);
      for (const f of toFill) {
        if (get(after.body, f.path) === f.value) filled++;
        else { console.log(`  !! NOT STORED ${slug}.${f.path} (${locale})`); failed++; }
      }
    } else {
      filled += toFill.length;
    }
  }
}

function mergeDeep(a, b) {
  for (const k of Object.keys(b)) {
    if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) a[k] = mergeDeep(a[k] ?? {}, b[k]);
    else a[k] = b[k];
  }
  return a;
}

console.log(`\n=== ${DRY ? "DRY RUN — " : ""}${filled} filled, ${skipped} already had a value, ${failed} failed ===`);
process.exit(failed ? 1 : 0);
