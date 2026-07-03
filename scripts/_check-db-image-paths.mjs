// Read-only: scan ALL public-schema text/varchar/jsonb columns in Neon for
// '/images/' references, and report the distinct filenames found. Tells us
// which public/images files the CMS content actually depends on.
import pg from "pg";

const cs = process.env.NEON_DB;
if (!cs) { console.error("Set NEON_DB"); process.exit(1); }
const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  const { rows: cols } = await client.query(`
    SELECT table_name, column_name, data_type FROM information_schema.columns
    WHERE table_schema='public' AND data_type IN ('character varying','text','jsonb')
  `);
  const found = new Map(); // filename -> [table.col]
  for (const c of cols) {
    try {
      const { rows } = await client.query(
        `SELECT DISTINCT "${c.column_name}"::text AS v FROM "${c.table_name}"
         WHERE "${c.column_name}"::text LIKE '%/images/%' LIMIT 50`,
      );
      for (const r of rows) {
        for (const m of r.v.matchAll(/\/images\/[^"'\s)\\]+/g)) {
          const key = decodeURIComponent(m[0]);
          if (!found.has(key)) found.set(key, []);
          const loc = `${c.table_name}.${c.column_name}`;
          if (!found.get(key).includes(loc)) found.get(key).push(loc);
        }
      }
    } catch { /* skip unscannable */ }
  }
  console.log(`distinct /images/ paths referenced in DB: ${found.size}`);
  for (const [k, v] of [...found.entries()].sort()) console.log(`${k}  <- ${v.join(", ")}`);
} finally {
  await client.end();
}
