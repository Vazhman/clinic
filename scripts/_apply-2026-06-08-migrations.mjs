// Apply the three 2026-06-08 Neon migrations in order, with a row-count guard
// (additive only — proves no data is lost) and a post-check that the new
// objects exist. All three files are idempotent (IF NOT EXISTS / guarded FKs),
// so this is safe to run more than once.
//
// Usage (from a shell that has the Neon URL):
//   DBURL="$NEON_DB" node scripts/_apply-2026-06-08-migrations.mjs
//   # or, if NEON_DB is exported in your shell, just:
//   node scripts/_apply-2026-06-08-migrations.mjs
import pg from "pg";
import { readFileSync } from "node:fs";

const cs = process.env.DBURL || process.env.NEON_DB;
if (!cs) {
  console.error("Set DBURL or NEON_DB to the Neon connection string.");
  process.exit(1);
}

const FILES = [
  "neon-migrate-2026-06-08-nav-dropdowns.sql",
  "neon-migrate-2026-06-08-relax-required-globals.sql",
  "neon-migrate-2026-06-08-landing-globals.sql",
];

// Tables we count before/after to prove additive-only (no row loss).
const GUARD = ["doctors", "services", "news", "reviews", "media", "users", "pages", "lab_tests", "checkup_packages"];

// Objects each migration should create — verified after.
const EXPECT_TABLES = ["navigation_home_route_sub_links", "services_page", "services_page_locales", "doctors_page", "doctors_page_locales"];
const EXPECT_COLS = [["navigation", "home_route_has_dropdown"], ["about_page_stats_locales", "description"]];

const ssl = /neon\.tech|aws|supabase|render/.test(cs) ? { rejectUnauthorized: false } : false;
const client = new pg.Client({ connectionString: cs, ssl });
await client.connect();
console.log("Connected to:", new URL(cs).hostname);

const counts = async () => {
  const out = {};
  for (const t of GUARD) {
    try { out[t] = (await client.query(`SELECT count(*)::int c FROM "${t}"`)).rows[0].c; }
    catch { out[t] = "(no table)"; }
  }
  return out;
};
const tableExists = async (t) => (await client.query("SELECT 1 FROM information_schema.tables WHERE table_name=$1", [t])).rows.length > 0;
const colExists = async (t, c) => (await client.query("SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2", [t, c])).rows.length > 0;

try {
  const before = await counts();
  console.log("ROW COUNTS BEFORE:", JSON.stringify(before));

  for (const f of FILES) {
    const sql = readFileSync(new URL(`./${f}`, import.meta.url), "utf8");
    process.stdout.write(`\nApplying ${f} ... `);
    await client.query(sql);
    console.log("OK");
  }

  console.log("\nVerifying new objects:");
  let ok = true;
  for (const t of EXPECT_TABLES) { const e = await tableExists(t); if (!e) ok = false; console.log(`  ${e ? "OK " : "!! "} table ${t}`); }
  for (const [t, c] of EXPECT_COLS) { const e = await colExists(t, c); if (!e) ok = false; console.log(`  ${e ? "OK " : "!! "} column ${t}.${c}`); }

  const after = await counts();
  console.log("\nROW COUNTS AFTER: ", JSON.stringify(after));
  const changed = GUARD.filter((t) => before[t] !== after[t]);

  console.log("\n=== RESULT ===");
  console.log("all new objects present:", ok);
  console.log("row-count changes:", changed.length ? changed.map((t) => `${t}: ${before[t]}->${after[t]}`).join(", ") : "NONE (no data lost)");
  process.exit(ok && changed.length === 0 ? 0 : 1);
} catch (e) {
  console.error("\nMIGRATION FAILED:", e.message);
  process.exit(2);
} finally {
  await client.end();
}
