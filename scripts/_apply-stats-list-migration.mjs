// Apply scripts/neon-migrate-2026-06-05-stats-list.sql with row-count guard.
// Usage: DBURL="postgres://..." node scripts/_apply-stats-list-migration.mjs
import pg from "pg";
import { readFileSync } from "node:fs";

const cs = process.env.DBURL;
if (!cs) { console.error("Set DBURL"); process.exit(1); }
const sql = readFileSync(new URL("./neon-migrate-2026-06-05-stats-list.sql", import.meta.url), "utf8");

const GUARD = ["doctors","services","news","media","home_page","home_page_locales","home_page_faqs"];
const ssl = /neon\.tech/.test(cs) ? { rejectUnauthorized: false } : false;
const client = new pg.Client({ connectionString: cs, ssl });
await client.connect();

const counts = async () => {
  const out = {};
  for (const t of GUARD) {
    try { out[t] = (await client.query(`SELECT count(*)::int c FROM "${t}"`)).rows[0].c; }
    catch { out[t] = "(no table)"; }
  }
  return out;
};

try {
  const before = await counts();
  await client.query(sql);
  let ok = true;
  for (const t of ["home_page_stats_list", "home_page_stats_list_locales"]) {
    const { rows } = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`, [t]);
    if (rows.length !== 1) ok = false;
    console.log(`${rows.length === 1 ? "OK " : "!! "} ${t}`);
  }
  const after = await counts();
  const changed = GUARD.filter((t) => before[t] !== after[t]);
  console.log("row-count changes:", changed.length ? changed.join(", ") : "NONE (no data lost)");
  process.exit(ok && changed.length === 0 ? 0 : 1);
} catch (e) {
  console.error("FAILED (rolled back):", e.message);
  process.exit(2);
} finally {
  await client.end();
}
