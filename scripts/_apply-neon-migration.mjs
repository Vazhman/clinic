// Apply scripts/neon-migrate-2026-05-31-meeting-changes.sql to Neon, with a
// before/after row-count guard so we PROVE no data was lost. Additive-only.
// Usage: DBURL="postgres://..." node scripts/_apply-neon-migration.mjs
import pg from "pg";
import { readFileSync } from "node:fs";

const cs = process.env.DBURL;
if (!cs) { console.error("Set DBURL"); process.exit(1); }
const sql = readFileSync(new URL("./neon-migrate-2026-05-31-meeting-changes.sql", import.meta.url), "utf8");

const GUARD_TABLES = ["doctors","services","checkup_packages","checkup_packages_included_services","reviews","news","media","users","pages"];
const NEW_COLS = [
  ["services","pinned"],["services","pinned_order"],["news","pinned"],
  ["about_page","ceo_photo_id"],["about_page_locales","ceo_name"],["about_page_locales","ceo_role"],["about_page_locales","ceo_message"],
  ["home_page","stats_satisfied_patients"],["home_page","featured_doctor_count"],["home_page","randomize_featured_doctors"],
  ["home_page_hero_slides","button_href"],
  ["home_page_hero_slides_locales","headline"],["home_page_hero_slides_locales","subheadline"],["home_page_hero_slides_locales","button_label"],
];

const ssl = /neon\.tech/.test(cs) ? { rejectUnauthorized: false } : false;
const client = new pg.Client({ connectionString: cs, ssl });
await client.connect();

async function counts() {
  const out = {};
  for (const t of GUARD_TABLES) {
    try { const { rows } = await client.query(`SELECT count(*)::int c FROM "${t}"`); out[t] = rows[0].c; }
    catch { out[t] = "(no table)"; }
  }
  return out;
}
async function colExists(t, c) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`, [t, c]);
  return rows.length > 0;
}

try {
  const before = await counts();
  console.log("ROW COUNTS BEFORE:", JSON.stringify(before));

  console.log("\nApplying migration (single transaction)...");
  await client.query(sql);          // file wraps its own BEGIN/COMMIT
  console.log("Applied.");

  console.log("\nVerifying new columns present:");
  let allOk = true;
  for (const [t, c] of NEW_COLS) {
    const ok = await colExists(t, c);
    if (!ok) allOk = false;
    console.log(`   ${ok ? "OK " : "!! "} ${t}.${c}`);
  }

  const after = await counts();
  console.log("\nROW COUNTS AFTER: ", JSON.stringify(after));

  const changed = GUARD_TABLES.filter((t) => before[t] !== after[t]);
  console.log("\n=== RESULT ===");
  console.log("new columns all present:", allOk);
  console.log("row-count changes:", changed.length ? changed.map((t) => `${t}: ${before[t]}->${after[t]}`).join(", ") : "NONE (no data lost)");
  process.exit(allOk && changed.length === 0 ? 0 : 1);
} catch (e) {
  console.error("\nMIGRATION FAILED (transaction rolled back):", e.message);
  process.exit(2);
} finally {
  await client.end();
}
