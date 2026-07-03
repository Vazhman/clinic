// Read-only: for every public-schema table that exists in BOTH local Docker
// and Neon, list columns present locally but missing on Neon (the additive
// sync direction). This catches drift like version tables (_news_v) missing
// version_* mirrors of columns added by hand to the main table.
import pg from "pg";

async function cols(cs, ssl) {
  const c = new pg.Client({ connectionString: cs, ssl });
  await c.connect();
  try {
    const { rows } = await c.query(`
      SELECT table_name, column_name, data_type, udt_name
      FROM information_schema.columns WHERE table_schema='public'
      ORDER BY table_name, ordinal_position`);
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.table_name)) map.set(r.table_name, new Map());
      map.get(r.table_name).set(r.column_name, r);
    }
    return map;
  } finally {
    await c.end();
  }
}

const local = await cols(process.env.LOCAL_DB, false);
const neon = await cols(process.env.NEON_DB, { rejectUnauthorized: false });

let any = false;
for (const [table, lcols] of local) {
  const ncols = neon.get(table);
  if (!ncols) { console.log(`TABLE MISSING ON NEON: ${table} (${lcols.size} cols)`); any = true; continue; }
  for (const [col, meta] of lcols) {
    if (!ncols.has(col)) {
      console.log(`MISSING COLUMN: ${table}.${col}  (${meta.data_type}${meta.data_type === "USER-DEFINED" ? ":" + meta.udt_name : ""})`);
      any = true;
    }
  }
}
if (!any) console.log("No public-schema tables/columns missing on Neon.");
