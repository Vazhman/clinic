// Apply scripts/neon-migrate-2026-06-04-cms-fixes.sql with a before/after
// row-count guard. Additive-only. Usage: DBURL="postgres://..." node scripts/_apply-cms-fixes-migration.mjs
import pg from "pg";
import { readFileSync } from "node:fs";

const cs = process.env.DBURL;
if (!cs) { console.error("Set DBURL"); process.exit(1); }
const sql = readFileSync(new URL("./neon-migrate-2026-06-04-cms-fixes.sql", import.meta.url), "utf8");

const GUARD_TABLES = ["doctors","services","checkup_packages","reviews","news","media","users","pages","contact_page","contact_page_locales","_news_v"];
const NEW_TABLES = ["contact_page_phones","contact_page_phones_locales"];

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

try {
  const before = await counts();
  console.log("ROW COUNTS BEFORE:", JSON.stringify(before));
  await client.query(sql);
  console.log("Applied.");

  let allOk = true;
  for (const t of NEW_TABLES) {
    const { rows } = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`, [t]);
    const ok = rows.length === 1;
    if (!ok) allOk = false;
    console.log(`  ${ok ? "OK " : "!! "} ${t}`);
  }
  const { rows: vp } = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name='_news_v' AND column_name='version_pinned'`);
  console.log(`  ${vp.length ? "OK " : "!! "} _news_v.version_pinned`);

  const after = await counts();
  const changed = GUARD_TABLES.filter((t) => before[t] !== after[t]);
  console.log("ROW COUNTS AFTER: ", JSON.stringify(after));
  console.log("row-count changes:", changed.length ? changed.join(", ") : "NONE (no data lost)");
  process.exit(allOk && vp.length === 1 && changed.length === 0 ? 0 : 1);
} catch (e) {
  console.error("MIGRATION FAILED (rolled back):", e.message);
  process.exit(2);
} finally {
  await client.end();
}
