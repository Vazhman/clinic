// READ-ONLY full-column probe for the tables touched by commit 4ef147d (+ checkups).
// Usage: DBURL="postgres://..." node scripts/_neon-probe.mjs
import pg from "pg";
const cs = process.env.DBURL;
if (!cs) { console.error("Set DBURL"); process.exit(1); }
const ssl = /neon\.tech/.test(cs) ? { rejectUnauthorized: false } : false;
const client = new pg.Client({ connectionString: cs, ssl });
await client.connect();

const TABLES = [
  "services",
  "news",
  "about_page", "about_page_locales",
  "home_page", "home_page_hero_slides", "home_page_hero_slides_locales",
  "checkup_packages_included_services", "checkup_packages_included_services_locales",
];

async function cols(t) {
  const { rows } = await client.query(
    `SELECT column_name, data_type, is_nullable FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [t]);
  return rows;
}
try {
  for (const t of TABLES) {
    const c = await cols(t);
    if (!c.length) { console.log(`\n### ${t}: MISSING`); continue; }
    console.log(`\n### ${t}`);
    for (const r of c) console.log(`   ${r.column_name}  ${r.data_type}  ${r.is_nullable === "YES" ? "NULL" : "NOT NULL"}`);
  }
  console.log("\n=== ROW COUNTS (data-safety baseline) ===");
  for (const t of ["doctors","services","checkup_packages","checkup_packages_included_services","reviews","news","media","users","pages"]) {
    try { const { rows } = await client.query(`SELECT count(*)::int AS c FROM "${t}"`); console.log(`${t}: ${rows[0].c}`); }
    catch { console.log(`${t}: (no table)`); }
  }
} finally { await client.end(); }
