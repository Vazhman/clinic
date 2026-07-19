-- Admin-manageable news categories ("Manageable news categories in admin").
-- Replaces the fixed 4-option `category` select on News with a real
-- collection editors can add/rename/remove from the CMS. The old `category`
-- column is untouched (kept as a hidden legacy field on News, same pattern as
-- Navigation.mainMenu / HomePage.heroDoctors) — nothing destructive.
--
-- Shape mirrors the existing top-level localized collection convention
-- (reviews / reviews_locales, confirmed live on Neon): serial PK + a
-- `<table>_locales` child table with its own serial PK, `_locale "_locales"
-- NOT NULL`, `_parent_id` FK CASCADE, and a UNIQUE(_locale, _parent_id) index.
-- `slug` follows the doctors/services/news convention: nullable column + its
-- own unique index.
--
-- news.category_ref_id / _news_v.version_category_ref_id follow the existing
-- single-relationship convention (cf. lab_tests.reviewed_by_id, confirmed
-- live): plain `<field>_id integer` column, FK ON DELETE SET NULL, plain
-- btree index.
--
-- All 97 existing News rows are backfilled from their legacy `category` text
-- value (health-tips/clinic-news/medical-info/announcements — confirmed via
-- live query to be the only 4 values present, zero NULLs, zero unknowns).
-- Additive + idempotent: safe to re-run on local Docker AND Neon.

BEGIN;

-- ── news_categories ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "news_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" character varying,
  "sort_order" numeric DEFAULT 0,
  "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
  "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "news_categories_locales" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" character varying NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "news_categories_slug_idx" ON "news_categories" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "news_categories_updated_at_idx" ON "news_categories" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "news_categories_created_at_idx" ON "news_categories" USING btree ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "news_categories_locales_locale_parent_id_unique" ON "news_categories_locales" USING btree ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "news_categories_locales"
    ADD CONSTRAINT "news_categories_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "news_categories"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed the 4 existing categories. IDs are fixed (1-4) so the backfill below
-- can reference them directly instead of a slug subquery per row.
INSERT INTO "news_categories" ("id", "slug", "sort_order") VALUES
  (1, 'health-tips', 0),
  (2, 'clinic-news', 1),
  (3, 'medical-info', 2),
  (4, 'announcements', 3)
ON CONFLICT ("id") DO NOTHING;

SELECT setval('news_categories_id_seq', (SELECT GREATEST(MAX(id), 1) FROM "news_categories"));

INSERT INTO "news_categories_locales" ("name", "_locale", "_parent_id") VALUES
  ('ჯანმრთელობის რჩევები', 'ge', 1),
  ('Health Tips', 'en', 1),
  ('Советы по здоровью', 'ru', 1),
  ('კლინიკის სიახლეები', 'ge', 2),
  ('Clinic News', 'en', 2),
  ('Новости клиники', 'ru', 2),
  ('სამედიცინო ინფორმაცია', 'ge', 3),
  ('Medical Info', 'en', 3),
  ('Медицинская информация', 'ru', 3),
  ('განცხადებები', 'ge', 4),
  ('Announcements', 'en', 4),
  ('Объявления', 'ru', 4)
ON CONFLICT ("_locale", "_parent_id") DO NOTHING;

-- ── news.category_ref_id / _news_v.version_category_ref_id ────────────────
ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "category_ref_id" integer;
ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_category_ref_id" integer;

CREATE INDEX IF NOT EXISTS "news_category_ref_idx" ON "news" USING btree ("category_ref_id");
CREATE INDEX IF NOT EXISTS "_news_v_version_category_ref_idx" ON "_news_v" USING btree ("version_category_ref_id");

DO $$ BEGIN
  ALTER TABLE "news"
    ADD CONSTRAINT "news_category_ref_id_news_categories_id_fk"
    FOREIGN KEY ("category_ref_id") REFERENCES "news_categories"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "_news_v"
    ADD CONSTRAINT "_news_v_version_category_ref_id_news_categories_id_fk"
    FOREIGN KEY ("version_category_ref_id") REFERENCES "news_categories"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill from the legacy text columns (idempotent — only touches unset rows).
UPDATE "news" SET "category_ref_id" = 1 WHERE "category" = 'health-tips' AND "category_ref_id" IS NULL;
UPDATE "news" SET "category_ref_id" = 2 WHERE "category" = 'clinic-news' AND "category_ref_id" IS NULL;
UPDATE "news" SET "category_ref_id" = 3 WHERE "category" = 'medical-info' AND "category_ref_id" IS NULL;
UPDATE "news" SET "category_ref_id" = 4 WHERE "category" = 'announcements' AND "category_ref_id" IS NULL;

UPDATE "_news_v" SET "version_category_ref_id" = 1 WHERE "version_category" = 'health-tips' AND "version_category_ref_id" IS NULL;
UPDATE "_news_v" SET "version_category_ref_id" = 2 WHERE "version_category" = 'clinic-news' AND "version_category_ref_id" IS NULL;
UPDATE "_news_v" SET "version_category_ref_id" = 3 WHERE "version_category" = 'medical-info' AND "version_category_ref_id" IS NULL;
UPDATE "_news_v" SET "version_category_ref_id" = 4 WHERE "version_category" = 'announcements' AND "version_category_ref_id" IS NULL;

COMMIT;
