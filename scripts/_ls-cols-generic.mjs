// Read-only: defaults + NOT NULL for the given tables on DBURL.
// Usage: DBURL=... node scripts/_ls-cols-generic.mjs table1 table2 ...
import pg from "pg";
const cs = process.env.DBURL;
const ssl = /neon\.tech/.test(cs) ? { rejectUnauthorized: false } : false;
const c = new pg.Client({ connectionString: cs, ssl });
await c.connect();
for (const t of process.argv.slice(2)) {
  const { rows } = await c.query(
    "SELECT column_name, column_default, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position", [t]);
  console.log(`--- ${t} ---`);
  for (const r of rows) console.log(`  ${r.column_name}  default=${r.column_default ?? "-"}  nullable=${r.is_nullable}`);
}
await c.end();
