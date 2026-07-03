// Read-only Neon introspection. Reports the current schema so we can plan a
// safe, additive sync without running interactive drizzle push.
import pg from "pg";

const cs = process.env.NEON_DB;
if (!cs) { console.error("Set NEON_DB"); process.exit(1); }
const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
await client.connect();

async function cols(table) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`,
    [table],
  );
  return rows.map((r) => r.column_name);
}

try {
  const { rows: tables } = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`,
  );
  const names = tables.map((t) => t.table_name);
  console.log("TOTAL TABLES:", names.length);

  const blockArtifacts = names.filter((n) => /_blocks_|_v_blocks_|_v_version|_v$/.test(n));
  console.log("\n=== legacy block-builder / version artifacts (" + blockArtifacts.length + ") ===");
  console.log(blockArtifacts.join("\n") || "(none)");

  console.log("\n=== lab_tests present? ===");
  console.log(names.filter((n) => n.startsWith("lab_tests")).join(", ") || "MISSING");

  console.log("\n=== news tables ===");
  console.log(names.filter((n) => n.startsWith("news")).join(", "));

  for (const t of ["news", "news_locales", "checkup_packages", "doctors"]) {
    if (names.includes(t)) {
      console.log(`\n--- columns of ${t} ---`);
      console.log((await cols(t)).join(", "));
    } else {
      console.log(`\n--- ${t}: TABLE MISSING ---`);
    }
  }

  console.log("\n=== row counts ===");
  for (const t of ["doctors", "services", "checkup_packages", "reviews", "news", "media"]) {
    if (names.includes(t)) {
      const { rows } = await client.query(`SELECT count(*)::int AS c FROM "${t}"`);
      console.log(`${t}: ${rows[0].c}`);
    }
  }

  console.log("\n=== doctors: doctraId / inactive populated? ===");
  if (names.includes("doctors")) {
    const dcols = await cols("doctors");
    console.log("has doctra_id col:", dcols.includes("doctra_id"), "| has doctra_branch_id:", dcols.includes("doctra_branch_id"), "| has inactive:", dcols.includes("inactive"));
    if (dcols.includes("doctra_id")) {
      const { rows } = await client.query(`SELECT count(*)::int AS withId FROM doctors WHERE doctra_id IS NOT NULL`);
      console.log("doctors with doctra_id:", rows[0].withid);
    }
  }
} finally {
  await client.end();
}
