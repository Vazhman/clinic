-- Additive Neon sync for commit a1c86ea "feat(seo): ... FAQ".
-- The HomePage global gained a localized `faqs` array. Payload push:true is a
-- no-op on Vercel serverless prod (and the local interactive push is blocked by
-- an unrelated stale-column prompt), so the two array tables must be created by
-- hand. Without them EVERY `findGlobal('home-page')` 500s: the admin global
-- view shows "not found" and the public homepage silently falls back to seed
-- content (hero/stats/featured-doctors edits never appear).
--
-- DDL mirrors the drizzle-generated shape of the existing array tables
-- (home_page_hero_slides / footer_quick_links + *_locales):
--   array table     -> _order int NOT NULL, _parent_id -> home_page.id CASCADE,
--                      id varchar PK
--   locales table   -> serial id PK, _locale "_locales" NOT NULL,
--                      _parent_id varchar -> array.id CASCADE,
--                      UNIQUE(_locale,_parent_id);
--                      required localized text/textarea -> varchar NOT NULL
--                      (cf. footer_quick_links_locales.label)
-- Everything is additive + idempotent (IF NOT EXISTS / guarded FK adds): no
-- drops, no data touched, safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS "home_page_faqs" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" character varying PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "home_page_faqs_locales" (
  "question" character varying NOT NULL,
  "answer" character varying NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" character varying NOT NULL
);

CREATE INDEX IF NOT EXISTS "home_page_faqs_order_idx" ON "home_page_faqs" ("_order");
CREATE INDEX IF NOT EXISTS "home_page_faqs_parent_id_idx" ON "home_page_faqs" ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "home_page_faqs_locales_locale_parent_id_unique"
  ON "home_page_faqs_locales" ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "home_page_faqs"
    ADD CONSTRAINT "home_page_faqs_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "home_page"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "home_page_faqs_locales"
    ADD CONSTRAINT "home_page_faqs_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "home_page_faqs"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
