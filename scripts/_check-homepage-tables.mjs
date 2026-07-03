// Read-only: check Neon for home_page* tables and footer/pages columns
// to verify which schema pieces are missing vs. current Payload config.
import pg from "pg";

const cs = process.env.NEON_DB;
if (!cs) { console.error("Set NEON_DB"); process.exit(1); }
const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`,
  );
  const names = rows.map((r) => r.table_name);
  console.log("=== home_page* tables in Neon ===");
  console.log(names.filter((n) => n.startsWith("home_page")).join("\n") || "(none)");
  console.log("\n=== pages* tables ===");
  console.log(names.filter((n) => n.startsWith("pages")).join("\n") || "(none)");
  console.log("\n=== footer* tables ===");
  console.log(names.filter((n) => n.startsWith("footer")).join("\n") || "(none)");

  // Try the exact query shape Payload would need for the global incl. faqs
  const need = ["home_page_faqs", "home_page_faqs_locales"];
  for (const t of need) {
    console.log(`\n${t}: ${names.includes(t) ? "EXISTS" : "MISSING"}`);
  }
} finally {
  await client.end();
}
