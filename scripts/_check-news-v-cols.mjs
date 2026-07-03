// Read-only: compare the columns Payload's failing query needs against what
// _news_v / _news_v_locales actually have on Neon AND local Docker.
import pg from "pg";

const NEED_V = ["id","parent_id","version_featured_image_id","version_puck_data","version_slug","version_category","version_published_date","version_status","version_pinned","version_show_on_homepage","version_homepage_order","version_seo_og_image_id","version_seo_no_index","version_updated_at","version_created_at","version__status","created_at","updated_at","snapshot","published_locale","latest"];
const NEED_L = ["version_title","version_body","version_excerpt","version_author","version_seo_meta_title","version_seo_meta_description","_locale","_parent_id","id"];

async function check(cs, label, ssl) {
  const c = new pg.Client({ connectionString: cs, ssl });
  await c.connect();
  try {
    for (const [table, need] of [["_news_v", NEED_V], ["_news_v_locales", NEED_L]]) {
      const { rows } = await c.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`, [table]);
      const have = new Set(rows.map((r) => r.column_name));
      const missing = need.filter((n) => !have.has(n));
      const extra = [...have].filter((h) => !need.includes(h));
      console.log(`${label} ${table}: missing=[${missing.join(", ") || "none"}] extra=[${extra.join(", ") || "none"}]`);
    }
  } finally {
    await c.end();
  }
}

await check(process.env.NEON_DB, "NEON ", { rejectUnauthorized: false });
await check(process.env.LOCAL_DB, "LOCAL", false);
