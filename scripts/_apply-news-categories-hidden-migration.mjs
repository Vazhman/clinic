// Apply scripts/neon-migrate-2026-07-18-news-categories-hidden.sql to Neon.
// Additive-only: adds news_categories.hidden (boolean, default false).
// Usage: DBURL="postgres://..." node scripts/_apply-news-categories-hidden-migration.mjs
import pg from "pg";
import { readFileSync } from "node:fs";

const cs = process.env.DBURL;
if (!cs) { console.error("Set DBURL"); process.exit(1); }
const sql = readFileSync(new URL("./neon-migrate-2026-07-18-news-categories-hidden.sql", import.meta.url), "utf8");

const ssl = /neon\.tech/.test(cs) ? { rejectUnauthorized: false } : false;
const client = new pg.Client({ connectionString: cs, ssl });
await client.connect();

async function colExists(t, c) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`, [t, c]);
  return rows.length > 0;
}

try {
  const { rows } = await client.query(`SELECT count(*)::int c FROM "news_categories"`);
  console.log("news_categories rows before:", rows[0].c);

  console.log("Applying migration...");
  await client.query(sql);
  console.log("Applied.");

  const ok = await colExists("news_categories", "hidden");
  console.log(`news_categories.hidden present: ${ok}`);

  const { rows: after } = await client.query(`SELECT count(*)::int c FROM "news_categories"`);
  console.log("news_categories rows after:", after[0].c);

  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error("MIGRATION FAILED:", e.message);
  process.exit(2);
} finally {
  await client.end();
}
