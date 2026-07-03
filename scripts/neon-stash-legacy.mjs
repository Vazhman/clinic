// Reversibly move orphan block-builder tables + their enums out of `public`
// into a `legacy_backup` schema. These are dead weight from before the Path B
// refactor (the 11-block page/news builder was removed; current content uses a
// Lexical `body`). They are unused by the current code but their presence makes
// drizzle `push` stop for interactive rename reconciliation.
//
// Moving (not dropping) keeps them fully recoverable:
//   ALTER TABLE legacy_backup.<t> SET SCHEMA public;   -- to undo
//
// Idempotent: skips anything already moved. Uses the DIRECT (non-pooled) Neon
// endpoint for DDL.
import pg from "pg";

const cs = process.env.NEON_DB;
if (!cs) { console.error("Set NEON_DB"); process.exit(1); }
const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
await client.connect();

const TABLE_RX = /^(news_blocks_|pages_blocks_|_news_v_blocks_|_pages_v_blocks_)/;

try {
  await client.query("CREATE SCHEMA IF NOT EXISTS legacy_backup");

  // Tables in public matching the orphan block patterns
  const { rows: tbls } = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' ORDER BY table_name`,
  );
  const toMove = tbls.map((r) => r.table_name).filter((n) => TABLE_RX.test(n));

  console.log(`Moving ${toMove.length} orphan block tables → legacy_backup`);
  for (const t of toMove) {
    await client.query(`ALTER TABLE public."${t}" SET SCHEMA legacy_backup`);
    console.log("  moved table", t);
  }

  // Enum types in public whose name contains _blocks_ (the block builder enums)
  const { rows: enums } = await client.query(
    `SELECT t.typname
       FROM pg_type t
       JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname='public' AND t.typtype='e' AND t.typname LIKE '%_blocks_%'
      ORDER BY t.typname`,
  );
  console.log(`Moving ${enums.length} orphan block enums → legacy_backup`);
  for (const e of enums) {
    await client.query(`ALTER TYPE public."${e.typname}" SET SCHEMA legacy_backup`);
    console.log("  moved enum", e.typname);
  }

  // Report what remains in public that still looks block-ish (should be none)
  const { rows: left } = await client.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_name LIKE '%_blocks_%'`,
  );
  console.log("\nRemaining block-ish tables in public:", left.map((r) => r.table_name).join(", ") || "(none)");
  console.log("DONE");
} finally {
  await client.end();
}
