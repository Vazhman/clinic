#!/usr/bin/env node
/**
 * Seed the newly-added CMS fields with their real values so the /services and
 * /doctors landing heroes + the About fact descriptions read from the CMS
 * (they were i18n-only with no field before):
 *   - services-page.{title,subtitle}   (localized)
 *   - doctors-page.{title,subtitle}     (localized)
 *   - about-page.stats[].description    (localized; matched to the 3 existing
 *     rows 2015 / 40 / 1st by index → founded/beds/coblation descriptions)
 *
 * Usage: SITE=http://localhost:3001 node scripts/seed-cms-landing-pages.mjs [--dry]
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

{
  const { status, body } = await api("/users/login", { method: "POST", body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  if (status !== 200 || !body?.token) { console.error("LOGIN FAILED", status, body); process.exit(2); }
  token = body.token;
  console.log(`${DRY ? "[DRY] " : ""}seeding landing-page CMS fields on ${SITE}\n`);
}

// ── services-page / doctors-page title+subtitle (localized scalars) ─────────
for (const [slug, ns] of [["services-page", "Services"], ["doctors-page", "Doctors"]]) {
  for (const locale of LOCALES) {
    const title = MSG[locale][ns].title;
    const subtitle = MSG[locale][ns].subtitle;
    console.log(`${DRY ? "WOULD SET" : "SET"} ${slug} (${locale}): title="${title}", subtitle="${subtitle}"`);
    if (!DRY) {
      const r = await api(`/globals/${slug}?locale=${locale}&depth=0`, { method: "POST", body: JSON.stringify({ title, subtitle }) });
      if (r.status !== 200) console.error(`  !! ${slug} (${locale}) ${r.status}: ${JSON.stringify(r.body?.errors).slice(0, 160)}`);
    }
  }
}

// ── about-page.stats[].description (localized array, IDs preserved) ─────────
// The 3 existing rows are 2015 / 40 / 1st → founded / beds / coblation.
{
  const DESC_KEYS = ["foundedDescription", "bedsDescription", "coblationDescription"];
  // read current rows (ge) to get IDs + order
  const ge = await api(`/globals/about-page?locale=ge&depth=0&fallback-locale=null`);
  const rows = ge.body?.stats ?? [];
  if (rows.length === 0) {
    console.log("about-page.stats: no rows — run seed-cms-demo-content.mjs first; skipped");
  } else {
    for (const locale of LOCALES) {
      const cur = await api(`/globals/about-page?locale=${locale}&depth=0&fallback-locale=null`);
      const curRows = cur.body?.stats ?? [];
      const newRows = curRows.map((row, i) => ({
        ...row,
        description: MSG[locale].About[DESC_KEYS[i]] ?? row.description ?? "",
      }));
      console.log(`${DRY ? "WOULD SET" : "SET"} about-page.stats descriptions (${locale}): ${newRows.map((r) => r.description).join(" | ")}`);
      if (!DRY) {
        const r = await api(`/globals/about-page?locale=${locale}&depth=0`, { method: "POST", body: JSON.stringify({ stats: newRows }) });
        if (r.status !== 200) console.error(`  !! about-page stats (${locale}) ${r.status}: ${JSON.stringify(r.body?.errors).slice(0, 160)}`);
      }
    }
  }
}

console.log(`\n=== ${DRY ? "DRY RUN — " : ""}done ===`);
