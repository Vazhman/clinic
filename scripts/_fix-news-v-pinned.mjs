// Additive fix: _news_v.version_pinned (drafts version mirror of news.pinned,
// added 2026-05-31 to the main table only). Idempotent.
import pg from "pg";
const cs = process.env.NEON_DB;
if (!cs) { console.error("Set NEON_DB"); process.exit(1); }
const c = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
await c.connect();
try {
  await c.query(`ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_pinned" boolean`);
  const { rows } = await c.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name='_news_v' AND column_name='version_pinned'`);
  console.log("version_pinned present:", rows.length === 1);
} finally {
  await c.end();
}
