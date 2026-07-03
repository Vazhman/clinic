// Read-only: for every versioned collection (X with a _X_v table), every
// column on X must exist as version_<col> on _X_v (same for X_locales ->
// _X_v_locales). Reports any missing mirrors on the given DB.
import pg from "pg";

const SKIP = new Set(["id", "created_at", "updated_at"]); // version tables track their own

async function run(cs, label, ssl) {
  const c = new pg.Client({ connectionString: cs, ssl });
  await c.connect();
  try {
    const { rows } = await c.query(`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema='public' ORDER BY table_name, ordinal_position`);
    const cols = new Map();
    for (const r of rows) {
      if (!cols.has(r.table_name)) cols.set(r.table_name, []);
      cols.get(r.table_name).push(r.column_name);
    }
    console.log(`\n=== ${label} ===`);
    let any = false;
    for (const [table, list] of cols) {
      if (table.startsWith("_")) continue;
      const vTable = `_${table}_v`;
      const vLocTable = `_${table}_v_locales`;
      if (cols.has(vTable)) {
        const vHave = new Set(cols.get(vTable));
        for (const col of list) {
          if (SKIP.has(col)) continue;
          if (!vHave.has(`version_${col}`)) { console.log(`${vTable} MISSING version_${col}`); any = true; }
        }
      }
      const locTable = `${table}_locales`;
      if (cols.has(locTable) && cols.has(vLocTable)) {
        const vHave = new Set(cols.get(vLocTable));
        for (const col of cols.get(locTable)) {
          if (SKIP.has(col) || col.startsWith("_")) continue;
          if (!vHave.has(`version_${col}`)) { console.log(`${vLocTable} MISSING version_${col}`); any = true; }
        }
      }
    }
    if (!any) console.log("(all version mirrors present)");
  } finally {
    await c.end();
  }
}

await run(process.env.NEON_DB, "NEON", { rejectUnauthorized: false });
await run(process.env.LOCAL_DB, "LOCAL DOCKER", false);
