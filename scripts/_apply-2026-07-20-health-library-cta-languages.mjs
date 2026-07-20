// Apply scripts/neon-migrate-2026-07-20-health-library-toggle-cta-enabled-languages.sql
// Usage: DBURL="postgres://..." node scripts/_apply-2026-07-20-health-library-cta-languages.mjs
import pg from "pg";
import { readFileSync } from "node:fs";

const cs = process.env.DBURL;
if (!cs) { console.error("Set DBURL"); process.exit(1); }
const sql = readFileSync(new URL("./neon-migrate-2026-07-20-health-library-toggle-cta-enabled-languages.sql", import.meta.url), "utf8");

const NEW_COLS = [
  ["feature_toggles", "health_library"],
  ["navigation", "cta_button_enabled"],
  ["doctors_page", "show_languages"],
];

const ssl = /neon\.tech/.test(cs) ? { rejectUnauthorized: false } : false;
const client = new pg.Client({ connectionString: cs, ssl });
await client.connect();

async function colExists(t, c) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`, [t, c]);
  return rows.length > 0;
}

try {
  console.log("Applying migration (single transaction)...");
  await client.query(sql);
  console.log("Applied.");

  console.log("\nVerifying new columns present:");
  let allOk = true;
  for (const [t, c] of NEW_COLS) {
    const ok = await colExists(t, c);
    if (!ok) allOk = false;
    console.log(`   ${ok ? "OK " : "!! "} ${t}.${c}`);
  }
  process.exit(allOk ? 0 : 1);
} catch (e) {
  console.error("\nMIGRATION FAILED (transaction rolled back):", e.message);
  process.exit(2);
} finally {
  await client.end();
}
