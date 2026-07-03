// Read-only: list home_page / home_page_locales columns (NEON_DB).
import pg from "pg";
const c = new pg.Client({ connectionString: process.env.NEON_DB, ssl: { rejectUnauthorized: false } });
await c.connect();
for (const t of ["home_page", "home_page_locales"]) {
  const { rows } = await c.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position", [t]);
  console.log(`${t}:`, rows.map((r) => r.column_name).join(", "));
}
await c.end();
