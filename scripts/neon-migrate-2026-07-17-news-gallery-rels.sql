-- Follow-up to neon-migrate-2026-07-17-news-tags-texts.sql: fixing the
-- missing `news_texts` table surfaced the next missing table in the same
-- query — "relation news_rels does not exist". News.gallery
-- (`type: 'upload', relationTo: 'media', hasMany: true`) is a hasMany
-- relationship/upload field, which Payload's Postgres adapter stores in a
-- polymorphic `<collection>_rels` join table (one row per array item, one
-- nullable `<relation>_id` column per possible target collection) rather
-- than an inline column. That table was never created — same push:true /
-- Neon schema-drift root cause as the _texts tables (see CLAUDE.md). Because
-- News has `versions: { drafts: true }`, the versions table needs the same
-- join table: `_news_v_rels`.
--
-- Shape/naming mirrors the existing lab_tests_rels / _lab_tests_v_rels
-- tables (confirmed live on Neon, same generator): serial PK, order/
-- parent_id/path columns, one nullable `media_id` column (News.gallery only
-- ever points at `media`), FK parent_id -> news(id) / _news_v(id) ON DELETE
-- CASCADE, FK media_id -> media(id) ON DELETE CASCADE, plus individual
-- btree indexes on order/parent_id/path/media_id (not composite — matches
-- lab_tests_rels's index shape, unlike the composite indexes on _texts
-- tables).
-- Additive + idempotent: safe to re-run on local Docker AND Neon. Adds two
-- new empty tables only — touches zero existing rows/columns.

BEGIN;

-- ── news_rels (News.gallery) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "news_rels" (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer,
  "parent_id" integer NOT NULL,
  "path" character varying NOT NULL,
  "media_id" integer
);

CREATE INDEX IF NOT EXISTS "news_rels_order_idx" ON "news_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "news_rels_parent_idx" ON "news_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "news_rels_path_idx" ON "news_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "news_rels_media_id_idx" ON "news_rels" USING btree ("media_id");

DO $$ BEGIN
  ALTER TABLE "news_rels"
    ADD CONSTRAINT "news_rels_parent_fk"
    FOREIGN KEY ("parent_id") REFERENCES "news"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "news_rels"
    ADD CONSTRAINT "news_rels_media_fk"
    FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── _news_v_rels (version snapshots of News.gallery) ────────────────────
CREATE TABLE IF NOT EXISTS "_news_v_rels" (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer,
  "parent_id" integer NOT NULL,
  "path" character varying NOT NULL,
  "media_id" integer
);

CREATE INDEX IF NOT EXISTS "_news_v_rels_order_idx" ON "_news_v_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "_news_v_rels_parent_idx" ON "_news_v_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "_news_v_rels_path_idx" ON "_news_v_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "_news_v_rels_media_id_idx" ON "_news_v_rels" USING btree ("media_id");

DO $$ BEGIN
  ALTER TABLE "_news_v_rels"
    ADD CONSTRAINT "_news_v_rels_parent_fk"
    FOREIGN KEY ("parent_id") REFERENCES "_news_v"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "_news_v_rels"
    ADD CONSTRAINT "_news_v_rels_media_fk"
    FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
