-- Follow-up to neon-migrate-2026-07-08-news-categories.sql: that migration
-- added the `news_categories` collection and wired `news.category_ref_id`,
-- but missed Payload's own internal polymorphic tables, which need one
-- `<collection>_id` column per registered collection. Confirmed live on Neon:
-- payload_locked_documents_rels was missing news_categories_id entirely,
-- which made getIsLocked() throw "column ...news_categories_id does not
-- exist" on EVERY single-document edit view (any collection, not just News)
-- -- list views were unaffected since they don't call getIsLocked(). This is
-- why the admin edit form appeared blank with zero client-side errors: the
-- failure is a server-side Postgres error during SSR, invisible in the
-- browser console.
--
-- Shape mirrors the existing reviews_id column on the same table (confirmed
-- live): plain nullable `<collection>_id integer`, FK ON DELETE CASCADE,
-- plain btree index. payload_preferences_rels does NOT get a matching column
-- -- confirmed live it only carries parent_id/users_id, no per-collection
-- columns for any sibling collection (doctors/services/news included), so
-- news_categories is consistent in being absent there too.
-- Additive + idempotent: safe to re-run on local Docker AND Neon.

BEGIN;

ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "news_categories_id" integer;

CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_news_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("news_categories_id");

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels"
    ADD CONSTRAINT "payload_locked_documents_rels_news_categories_fk"
    FOREIGN KEY ("news_categories_id") REFERENCES "news_categories"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
