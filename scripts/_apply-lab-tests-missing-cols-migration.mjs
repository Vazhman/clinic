// Apply scripts/neon-migrate-2026-07-18-lab-tests-missing-cols.sql to Neon.
// Additive-only: lab_tests + _lab_tests_v were missing active/price/currency/
// pdf_attachment_id (and their version_ mirrors) because PAYLOAD_DISABLE_PUSH
// has been set, so these fields (added in code) never got pushed to the DB —
// this is what made /admin/collections/lab-tests render blank.
// Usage: DBURL="postgres://..." node scripts/_apply-lab-tests-missing-cols-migration.mjs
import pg from "pg";
import { readFileSync } from "node:fs";

const cs = process.env.DBURL;
if (!cs) { console.error("Set DBURL"); process.exit(1); }
const sql = readFileSync(new URL("./neon-migrate-2026-07-18-lab-tests-missing-cols.sql", import.meta.url), "utf8");

const ssl = /neon\.tech/.test(cs) ? { rejectUnauthorized: false } : false;
const client = new pg.Client({ connectionString: cs, ssl });
await client.connect();

const NEW_COLS = [
  ["lab_tests", "active"], ["lab_tests", "price"], ["lab_tests", "currency"], ["lab_tests", "pdf_attachment_id"],
  ["_lab_tests_v", "version_active"], ["_lab_tests_v", "version_price"], ["_lab_tests_v", "version_currency"], ["_lab_tests_v", "version_pdf_attachment_id"],
];

async function colExists(t, c) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`, [t, c]);
  return rows.length > 0;
}

try {
  const { rows } = await client.query(`SELECT count(*)::int c FROM "lab_tests"`);
  console.log("lab_tests rows before:", rows[0].c);

  console.log("Applying migration...");
  await client.query(sql);
  console.log("Applied.");

  let allOk = true;
  for (const [t, c] of NEW_COLS) {
    const ok = await colExists(t, c);
    if (!ok) allOk = false;
    console.log(`   ${ok ? "OK " : "!! "} ${t}.${c}`);
  }

  const { rows: after } = await client.query(`SELECT count(*)::int c FROM "lab_tests"`);
  console.log("lab_tests rows after:", after[0].c);

  process.exit(allOk ? 0 : 1);
} catch (e) {
  console.error("MIGRATION FAILED:", e.message);
  process.exit(2);
} finally {
  await client.end();
}
