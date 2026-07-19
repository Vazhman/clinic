-- News list/blog page returned zero articles on the frontend and the "public
-- news query" (payload-data.ts _getAllNews/_getFeaturedNews/_getNewsBySlug)
-- was throwing "relation news_texts does not exist" (swallowed by a bare
-- try/catch, so it silently rendered the empty state instead of an error).
--
-- Root cause: News.tags (`type: 'text', hasMany: true, localized: true`) is
-- the only hasMany-text field in the project. Payload's Postgres adapter
-- stores hasMany-text field values in a dedicated `<collection>_texts` child
-- table (one row per array item), separate from the main table's columns.
-- That table was never created — schema drift from `push: true` never having
-- synced this field to Neon (see CLAUDE.md: push is a no-op on Vercel prod
-- and the local interactive push is unreliable). Because News has
-- `versions: { drafts: true }`, the versions table needs the same child
-- table: `_news_v_texts`.
--
-- Shape/naming mirrors Payload's own generator (confirmed against
-- @payloadcms/drizzle's schema/build.js: hasManyTextField branch) —
-- serial PK, order/parent_id/path/text columns, locale column (since the
-- field is localized), FK parent_id -> news(id) / _news_v(id) ON DELETE
-- CASCADE, plus the (order, parent_id) and (locale, parent_id) indexes it
-- always creates for a localized hasMany-text field.
-- Additive + idempotent: safe to re-run on local Docker AND Neon. Adds two
-- new empty tables only — touches zero existing rows/columns.

BEGIN;

-- ── news_texts (News.tags) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "news_texts" (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer NOT NULL,
  "parent_id" integer NOT NULL,
  "path" character varying NOT NULL,
  "text" character varying,
  "locale" "_locales" NOT NULL
);

CREATE INDEX IF NOT EXISTS "news_texts_order_parent" ON "news_texts" USING btree ("order", "parent_id");
CREATE INDEX IF NOT EXISTS "news_texts_locale_parent" ON "news_texts" USING btree ("locale", "parent_id");

DO $$ BEGIN
  ALTER TABLE "news_texts"
    ADD CONSTRAINT "news_texts_parent_fk"
    FOREIGN KEY ("parent_id") REFERENCES "news"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── _news_v_texts (version snapshots of News.tags) ─────────────────────
CREATE TABLE IF NOT EXISTS "_news_v_texts" (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer NOT NULL,
  "parent_id" integer NOT NULL,
  "path" character varying NOT NULL,
  "text" character varying,
  "locale" "_locales" NOT NULL
);

CREATE INDEX IF NOT EXISTS "_news_v_texts_order_parent" ON "_news_v_texts" USING btree ("order", "parent_id");
CREATE INDEX IF NOT EXISTS "_news_v_texts_locale_parent" ON "_news_v_texts" USING btree ("locale", "parent_id");

DO $$ BEGIN
  ALTER TABLE "_news_v_texts"
    ADD CONSTRAINT "_news_v_texts_parent_fk"
    FOREIGN KEY ("parent_id") REFERENCES "_news_v"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
