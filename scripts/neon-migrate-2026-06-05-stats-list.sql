-- Additive sync: HomePage.statsList — fully editable stats rows
-- (value + suffix + localized label). Mirrors the array-table conventions
-- of home_page_faqs / contact_page_phones. Additive + idempotent.

BEGIN;

CREATE TABLE IF NOT EXISTS "home_page_stats_list" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" character varying PRIMARY KEY NOT NULL,
  "value" numeric NOT NULL,
  "suffix" character varying
);

CREATE TABLE IF NOT EXISTS "home_page_stats_list_locales" (
  "label" character varying NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" character varying NOT NULL
);

CREATE INDEX IF NOT EXISTS "home_page_stats_list_order_idx" ON "home_page_stats_list" ("_order");
CREATE INDEX IF NOT EXISTS "home_page_stats_list_parent_id_idx" ON "home_page_stats_list" ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "home_page_stats_list_locales_locale_parent_id_unique"
  ON "home_page_stats_list_locales" ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "home_page_stats_list"
    ADD CONSTRAINT "home_page_stats_list_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "home_page"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "home_page_stats_list_locales"
    ADD CONSTRAINT "home_page_stats_list_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "home_page_stats_list"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
