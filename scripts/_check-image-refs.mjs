// Read-only: check whether the large public/images files are referenced
// anywhere in CMS content (lexical bodies store absolute /images/ URLs only
// if an editor pasted one). Usage: NEON_DB=... node scripts/_check-image-refs.mjs
import pg from "pg";

const cs = process.env.NEON_DB;
if (!cs) { console.error("Set NEON_DB"); process.exit(1); }
const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
await client.connect();

const patterns = ["brand_page", "klinia-0006", "mix mix", "axali celi", "ChatGPT Image"];

try {
  // Search every text/jsonb column that could embed a URL: lexical bodies in
  // pages/news + all *_locales varchar columns would be exhaustive; in practice
  // editor-pasted image URLs only land in rich-text bodies.
  const sources = [
    { table: "pages_locales", col: "body" },
    { table: "news_locales", col: "body" },
    { table: "news", col: "puck_data" },
  ];
  for (const p of patterns) {
    let total = 0;
    for (const s of sources) {
      try {
        const { rows } = await client.query(
          `SELECT count(*)::int c FROM "${s.table}" WHERE "${s.col}"::text ILIKE $1`,
          [`%${p}%`],
        );
        total += rows[0].c;
      } catch { /* column may not exist */ }
    }
    console.log(`${p} -> ${total} CMS refs`);
  }
} finally {
  await client.end();
}
