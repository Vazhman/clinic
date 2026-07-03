// Read-only: compare news-related + version tables between Neon (NEON_DB)
// and local Docker (LOCAL_DB) to find why news PATCH 500s on prod.
import pg from "pg";

async function tables(cs, label, ssl) {
  const c = new pg.Client({ connectionString: cs, ssl });
  await c.connect();
  try {
    const { rows } = await c.query(
      `SELECT table_schema, table_name FROM information_schema.tables
       WHERE table_name LIKE '%news%' OR table_name LIKE '%\\_v%' ESCAPE '\\'
       ORDER BY table_schema, table_name`,
    );
    console.log(`\n=== ${label} ===`);
    for (const r of rows) console.log(`${r.table_schema}.${r.table_name}`);
    return rows.map((r) => `${r.table_schema}.${r.table_name}`);
  } finally {
    await c.end();
  }
}

const neon = await tables(process.env.NEON_DB, "NEON", { rejectUnauthorized: false });
const local = await tables(process.env.LOCAL_DB, "LOCAL DOCKER", false);

const localPublic = local.filter((t) => t.startsWith("public."));
const missing = localPublic.filter((t) => !neon.includes(t));
console.log("\n=== in local public but MISSING from Neon public ===");
console.log(missing.join("\n") || "(none)");
