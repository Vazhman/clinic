-- Additive sync for the CMS-fixes deploy (2026-06-04, evening):
--   1. _news_v.version_pinned — drafts-version mirror of news.pinned (added
--      2026-05-31 to the main table only). Missing column made EVERY news
--      save 500 ("news admin shows nothing / can't edit news").
--      (Already applied ad-hoc via _fix-news-v-pinned.mjs; kept here so the
--      file is the complete record and re-runs are safe.)
--   2. contact_page_phones (+ _locales) — new "additional phones" array on
--      the ContactPage global. DDL mirrors home_page_faqs / footer_quick_links
--      conventions: array → _order/_parent_id/varchar id PK; localized label
--      in the _locales table; non-localized value/display in the main table.
-- Everything additive + idempotent. No drops, no data touched.

BEGIN;

ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_pinned" boolean;

--   3. HomePage hero fields are no longer `required` in code (required-ness
--      blocked every partial save of the global), so the NOT NULL constraints
--      their columns got at creation time must go too — otherwise a partial
--      hero write inserts NULLs for the untouched columns and 500s.
ALTER TABLE "home_page_locales" ALTER COLUMN "hero_headline" DROP NOT NULL;
ALTER TABLE "home_page_locales" ALTER COLUMN "hero_subheadline" DROP NOT NULL;
ALTER TABLE "home_page_locales" ALTER COLUMN "hero_book_button_text" DROP NOT NULL;
ALTER TABLE "home_page_locales" ALTER COLUMN "hero_consult_button_text" DROP NOT NULL;

--   4. Stale legacy columns that are gone from the Payload config but kept
--      NOT NULL on Neon — Payload's INSERTs omit them, so EVERY save of the
--      collection 500s:
--        reviews.author                    (author is localized now -> reviews_locales)
--        checkup_packages_locales.duration (field removed from CheckupPackages)
--      We keep the columns (additive philosophy) and only drop the constraint.
--      Guarded: the columns don't exist on local Docker at all.
DO $$ BEGIN
  ALTER TABLE "reviews" ALTER COLUMN "author" DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "checkup_packages_locales" ALTER COLUMN "duration" DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "contact_page_phones" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" character varying PRIMARY KEY NOT NULL,
  "value" character varying NOT NULL,
  "display" character varying
);

CREATE TABLE IF NOT EXISTS "contact_page_phones_locales" (
  "label" character varying,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" character varying NOT NULL
);

CREATE INDEX IF NOT EXISTS "contact_page_phones_order_idx" ON "contact_page_phones" ("_order");
CREATE INDEX IF NOT EXISTS "contact_page_phones_parent_id_idx" ON "contact_page_phones" ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "contact_page_phones_locales_locale_parent_id_unique"
  ON "contact_page_phones_locales" ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "contact_page_phones"
    ADD CONSTRAINT "contact_page_phones_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "contact_page"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "contact_page_phones_locales"
    ADD CONSTRAINT "contact_page_phones_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "contact_page_phones"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
