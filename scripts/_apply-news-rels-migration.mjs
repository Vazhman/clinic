// Apply scripts/neon-migrate-2026-07-17-news-gallery-rels.sql to Neon, with a
// before/after row-count guard so we PROVE no data was lost. Additive-only.
// Usage: DBURL="postgres://..." node scripts/_apply-news-rels-migration.mjs
import pg from "pg";
import { readFileSync } from "node:fs";

const cs = process.env.DBURL;
if (!cs) { console.error("Set DBURL"); process.exit(1); }
const sql = readFileSync(new URL("./neon-migrate-2026-07-17-news-gallery-rels.sql", import.meta.url), "utf8");

const GUARD_TABLES = ["news", "news_locales", "news_texts", "_news_v", "media"];

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

  const newsRels = await tableExists("news_rels");
  const versionRels = await tableExists("_news_v_rels");
  console.log("\nnews_rels created:", newsRels);
  console.log("_news_v_rels created:", versionRels);

  const after = await counts();
  console.log("\nROW COUNTS AFTER: ", JSON.stringify(after));

  const changed = GUARD_TABLES.filter((t) => before[t] !== after[t]);
  console.log("\n=== RESULT ===");
  console.log("row-count changes:", changed.length ? changed.map((t) => `${t}: ${before[t]}->${after[t]}`).join(", ") : "NONE (no data lost)");
  process.exit(newsRels && versionRels && changed.length === 0 ? 0 : 1);
} catch (e) {
  console.error("\nMIGRATION FAILED (transaction rolled back):", e.message);
  process.exit(2);
} finally {
  await client.end();
}
