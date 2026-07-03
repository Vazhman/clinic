#!/usr/bin/env node
/**
 * Audit helper (dev-only, throwaway): print every global's field values per
 * locale so we can see what is still ∅ NULL in the CMS (and would therefore
 * render from a code fallback, leaving the admin box blank).
 *
 * Usage: SITE=http://localhost:3001 node scripts/_audit-cms-empty.mjs
 */
const SITE = process.env.SITE || "http://localhost:3001";
const GLOBALS = [
  "home-page", "about-page", "contact-page", "booking-page",
  "footer", "navigation", "site-settings",
];
const LOCALES = ["ge", "en", "ru"];

function describe(v) {
  if (v == null) return "∅ NULL";
  if (Array.isArray(v)) return `[${v.length} rows]`;
  if (typeof v === "object") {
    const inner = Object.entries(v)
      .filter(([k]) => k !== "id")
      .map(([k, val]) => `${k}=${val == null ? "∅" : (Array.isArray(val) ? `[${val.length}]` : (typeof val === "object" ? "{…}" : JSON.stringify(val).slice(0, 40)))}`)
      .join(", ");
    return `{ ${inner} }`;
  }
  return JSON.stringify(v).slice(0, 70);
}

for (const slug of GLOBALS) {
  console.log(`\n###### ${slug} ######`);
  for (const locale of LOCALES) {
    const res = await fetch(`${SITE}/api/globals/${slug}?locale=${locale}&depth=0&fallback-locale=null`);
    const o = await res.json();
    const keys = Object.keys(o).filter((k) => !["id", "createdAt", "updatedAt", "globalType", "_status"].includes(k));
    console.log(`  --- ${locale} ---`);
    for (const k of keys) console.log(`    ${k}: ${describe(o[k])}`);
  }
}
