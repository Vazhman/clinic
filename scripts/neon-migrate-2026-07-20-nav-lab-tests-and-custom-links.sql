-- Additive sync: Navigation gains a 9th fixed route (labTestsRoute) and a
-- free-form `customLinks` array (admin-added menu links, same on/off
-- principle as the fixed routes). Mirrors neon-migrate-2026-06-08-nav-dropdowns.sql
-- for lab_tests_route, and navigation_main_menu / navigation_main_menu_locales
-- for custom_links (with an added `enabled` boolean).
-- Additive + idempotent (safe to re-run on local Docker AND Neon prod).

BEGIN;

-- ── lab_tests_route (9th fixed route group) ─────────────────────────────
ALTER TABLE "navigation" ADD COLUMN IF NOT EXISTS "lab_tests_route_enabled" boolean DEFAULT true;
ALTER TABLE "navigation" ADD COLUMN IF NOT EXISTS "lab_tests_route_order" numeric DEFAULT 9;
ALTER TABLE "navigation" ADD COLUMN IF NOT EXISTS "lab_tests_route_has_dropdown" boolean DEFAULT false;

ALTER TABLE "navigation_locales" ADD COLUMN IF NOT EXISTS "lab_tests_route_label" character varying;

CREATE TABLE IF NOT EXISTS "navigation_lab_tests_route_sub_links" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" character varying PRIMARY KEY NOT NULL,
  "href" character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS "navigation_lab_tests_route_sub_links_locales" (
  "label" character varying NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" character varying NOT NULL
);

CREATE INDEX IF NOT EXISTS "navigation_lab_tests_route_sub_links_order_idx" ON "navigation_lab_tests_route_sub_links" ("_order");
CREATE INDEX IF NOT EXISTS "navigation_lab_tests_route_sub_links_parent_id_idx" ON "navigation_lab_tests_route_sub_links" ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "navigation_lab_tests_route_sub_links_locales_locale_parent_id_unique"
  ON "navigation_lab_tests_route_sub_links_locales" ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "navigation_lab_tests_route_sub_links"
    ADD CONSTRAINT "navigation_lab_tests_route_sub_links_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_lab_tests_route_sub_links_locales"
    ADD CONSTRAINT "navigation_lab_tests_route_sub_links_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation_lab_tests_route_sub_links"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── custom_links (free-form admin-added menu links) ─────────────────────
CREATE TABLE IF NOT EXISTS "navigation_custom_links" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" character varying PRIMARY KEY NOT NULL,
  "enabled" boolean DEFAULT true,
  "href" character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS "navigation_custom_links_locales" (
  "label" character varying NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" character varying NOT NULL
);

CREATE INDEX IF NOT EXISTS "navigation_custom_links_order_idx" ON "navigation_custom_links" ("_order");
CREATE INDEX IF NOT EXISTS "navigation_custom_links_parent_id_idx" ON "navigation_custom_links" ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "navigation_custom_links_locales_locale_parent_id_unique"
  ON "navigation_custom_links_locales" ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "navigation_custom_links"
    ADD CONSTRAINT "navigation_custom_links_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_custom_links_locales"
    ADD CONSTRAINT "navigation_custom_links_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation_custom_links"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
