// Read-only: column defaults + NOT NULL for home_page_locales on NEON_DB,
// plus matching sequences. A locales table whose id lost its serial default
// (partial hand-sync) makes every localized INSERT fail.
import pg from "pg";
const c = new pg.Client({ connectionString: process.env.NEON_DB, ssl: { rejectUnauthorized: false } });
await c.connect();
const { rows } = await c.query(`
  SELECT table_name, column_name, column_default, is_nullable
  FROM information_schema.columns
  WHERE table_name IN ('home_page_locales','home_page','contact_page_locales')
  ORDER BY table_name, ordinal_position`);
for (const r of rows) console.log(`${r.table_name}.${r.column_name}  default=${r.column_default}  nullable=${r.is_nullable}`);
const { rows: seqs } = await c.query(`SELECT sequencename FROM pg_sequences WHERE sequencename LIKE '%home_page%' OR sequencename LIKE '%contact_page%'`);
console.log("sequences:", seqs.map((s) => s.sequencename).join(", ") || "(none)");
await c.end();
