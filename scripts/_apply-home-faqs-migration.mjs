// Apply scripts/neon-migrate-2026-06-04-home-faqs.sql, with a before/after
// row-count guard so we PROVE no data was lost. Additive-only (CREATE TABLE
// IF NOT EXISTS + guarded FKs). Works against Neon or local Docker.
// Usage: DBURL="postgres://..." node scripts/_apply-home-faqs-migration.mjs
import pg from "pg";
import { readFileSync } from "node:fs";

const cs = process.env.DBURL;
if (!cs) { console.error("Set DBURL"); process.exit(1); }
const sql = readFileSync(new URL("./neon-migrate-2026-06-04-home-faqs.sql", import.meta.url), "utf8");

const GUARD_TABLES = ["doctors","services","checkup_packages","reviews","news","media","users","pages","home_page","home_page_hero_slides","home_page_locales"];
const NEW_TABLES = ["home_page_faqs","home_page_faqs_locales"];

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
async function tableExists(t) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`, [t]);
  return rows.length > 0;
}

try {
  const before = await counts();
  console.log("ROW COUNTS BEFORE:", JSON.stringify(before));

  console.log("\nApplying migration (single transaction)...");
  await client.query(sql); // file wraps its own BEGIN/COMMIT
  console.log("Applied.");

  console.log("\nVerifying new tables present:");
  let allOk = true;
  for (const t of NEW_TABLES) {
    const ok = await tableExists(t);
    if (!ok) allOk = false;
    console.log(`   ${ok ? "OK " : "!! "} ${t}`);
  }

  const after = await counts();
  console.log("\nROW COUNTS AFTER: ", JSON.stringify(after));

  const changed = GUARD_TABLES.filter((t) => before[t] !== after[t]);
  console.log("\n=== RESULT ===");
  console.log("new tables all present:", allOk);
  console.log("row-count changes:", changed.length ? changed.map((t) => `${t}: ${before[t]}->${after[t]}`).join(", ") : "NONE (no data lost)");
  process.exit(allOk && changed.length === 0 ? 0 : 1);
} catch (e) {
  console.error("\nMIGRATION FAILED (transaction rolled back):", e.message);
  process.exit(2);
} finally {
  await client.end();
}
