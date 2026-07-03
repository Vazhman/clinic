-- Additive sync: Navigation dropdown sub-menus.
-- Each of the 8 fixed route groups (homeRoute, aboutRoute, …) gains:
--   * a boolean column   navigation.<group>_has_dropdown        (group field, flattened)
--   * an array table      navigation_<group>_sub_links           (href + ordering)
--   * a locales table     navigation_<group>_sub_links_locales   (localized label)
-- Group prefixes match the existing flattened columns (home_route_enabled, …).
-- Mirrors the array-table conventions of navigation_main_menu / home_page_stats_list.
-- Additive + idempotent (safe to re-run on local Docker AND Neon prod).

BEGIN;

-- ── home_route ──────────────────────────────────────────────────────────
ALTER TABLE "navigation" ADD COLUMN IF NOT EXISTS "home_route_has_dropdown" boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS "navigation_home_route_sub_links" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" character varying PRIMARY KEY NOT NULL,
  "href" character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS "navigation_home_route_sub_links_locales" (
  "label" character varying NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" character varying NOT NULL
);

CREATE INDEX IF NOT EXISTS "navigation_home_route_sub_links_order_idx" ON "navigation_home_route_sub_links" ("_order");
CREATE INDEX IF NOT EXISTS "navigation_home_route_sub_links_parent_id_idx" ON "navigation_home_route_sub_links" ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "navigation_home_route_sub_links_locales_locale_parent_id_unique"
  ON "navigation_home_route_sub_links_locales" ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "navigation_home_route_sub_links"
    ADD CONSTRAINT "navigation_home_route_sub_links_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_home_route_sub_links_locales"
    ADD CONSTRAINT "navigation_home_route_sub_links_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation_home_route_sub_links"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── about_route ──────────────────────────────────────────────────────────
ALTER TABLE "navigation" ADD COLUMN IF NOT EXISTS "about_route_has_dropdown" boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS "navigation_about_route_sub_links" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" character varying PRIMARY KEY NOT NULL,
  "href" character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS "navigation_about_route_sub_links_locales" (
  "label" character varying NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" character varying NOT NULL
);

CREATE INDEX IF NOT EXISTS "navigation_about_route_sub_links_order_idx" ON "navigation_about_route_sub_links" ("_order");
CREATE INDEX IF NOT EXISTS "navigation_about_route_sub_links_parent_id_idx" ON "navigation_about_route_sub_links" ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "navigation_about_route_sub_links_locales_locale_parent_id_unique"
  ON "navigation_about_route_sub_links_locales" ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "navigation_about_route_sub_links"
    ADD CONSTRAINT "navigation_about_route_sub_links_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_about_route_sub_links_locales"
    ADD CONSTRAINT "navigation_about_route_sub_links_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation_about_route_sub_links"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── services_route ──────────────────────────────────────────────────────────
ALTER TABLE "navigation" ADD COLUMN IF NOT EXISTS "services_route_has_dropdown" boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS "navigation_services_route_sub_links" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" character varying PRIMARY KEY NOT NULL,
  "href" character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS "navigation_services_route_sub_links_locales" (
  "label" character varying NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" character varying NOT NULL
);

CREATE INDEX IF NOT EXISTS "navigation_services_route_sub_links_order_idx" ON "navigation_services_route_sub_links" ("_order");
CREATE INDEX IF NOT EXISTS "navigation_services_route_sub_links_parent_id_idx" ON "navigation_services_route_sub_links" ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "navigation_services_route_sub_links_locales_locale_parent_id_unique"
  ON "navigation_services_route_sub_links_locales" ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "navigation_services_route_sub_links"
    ADD CONSTRAINT "navigation_services_route_sub_links_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_services_route_sub_links_locales"
    ADD CONSTRAINT "navigation_services_route_sub_links_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation_services_route_sub_links"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── doctors_route ──────────────────────────────────────────────────────────
ALTER TABLE "navigation" ADD COLUMN IF NOT EXISTS "doctors_route_has_dropdown" boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS "navigation_doctors_route_sub_links" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" character varying PRIMARY KEY NOT NULL,
  "href" character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS "navigation_doctors_route_sub_links_locales" (
  "label" character varying NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" character varying NOT NULL
);

CREATE INDEX IF NOT EXISTS "navigation_doctors_route_sub_links_order_idx" ON "navigation_doctors_route_sub_links" ("_order");
CREATE INDEX IF NOT EXISTS "navigation_doctors_route_sub_links_parent_id_idx" ON "navigation_doctors_route_sub_links" ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "navigation_doctors_route_sub_links_locales_locale_parent_id_unique"
  ON "navigation_doctors_route_sub_links_locales" ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "navigation_doctors_route_sub_links"
    ADD CONSTRAINT "navigation_doctors_route_sub_links_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_doctors_route_sub_links_locales"
    ADD CONSTRAINT "navigation_doctors_route_sub_links_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation_doctors_route_sub_links"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── checkups_route ──────────────────────────────────────────────────────────
ALTER TABLE "navigation" ADD COLUMN IF NOT EXISTS "checkups_route_has_dropdown" boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS "navigation_checkups_route_sub_links" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" character varying PRIMARY KEY NOT NULL,
  "href" character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS "navigation_checkups_route_sub_links_locales" (
  "label" character varying NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" character varying NOT NULL
);

CREATE INDEX IF NOT EXISTS "navigation_checkups_route_sub_links_order_idx" ON "navigation_checkups_route_sub_links" ("_order");
CREATE INDEX IF NOT EXISTS "navigation_checkups_route_sub_links_parent_id_idx" ON "navigation_checkups_route_sub_links" ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "navigation_checkups_route_sub_links_locales_locale_parent_id_unique"
  ON "navigation_checkups_route_sub_links_locales" ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "navigation_checkups_route_sub_links"
    ADD CONSTRAINT "navigation_checkups_route_sub_links_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_checkups_route_sub_links_locales"
    ADD CONSTRAINT "navigation_checkups_route_sub_links_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation_checkups_route_sub_links"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── health_library_route ──────────────────────────────────────────────────────────
ALTER TABLE "navigation" ADD COLUMN IF NOT EXISTS "health_library_route_has_dropdown" boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS "navigation_health_library_route_sub_links" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" character varying PRIMARY KEY NOT NULL,
  "href" character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS "navigation_health_library_route_sub_links_locales" (
  "label" character varying NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" character varying NOT NULL
);

CREATE INDEX IF NOT EXISTS "navigation_health_library_route_sub_links_order_idx" ON "navigation_health_library_route_sub_links" ("_order");
CREATE INDEX IF NOT EXISTS "navigation_health_library_route_sub_links_parent_id_idx" ON "navigation_health_library_route_sub_links" ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "navigation_health_library_route_sub_links_locales_locale_parent_id_unique"
  ON "navigation_health_library_route_sub_links_locales" ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "navigation_health_library_route_sub_links"
    ADD CONSTRAINT "navigation_health_library_route_sub_links_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_health_library_route_sub_links_locales"
    ADD CONSTRAINT "navigation_health_library_route_sub_links_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation_health_library_route_sub_links"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── blog_route ──────────────────────────────────────────────────────────
ALTER TABLE "navigation" ADD COLUMN IF NOT EXISTS "blog_route_has_dropdown" boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS "navigation_blog_route_sub_links" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" character varying PRIMARY KEY NOT NULL,
  "href" character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS "navigation_blog_route_sub_links_locales" (
  "label" character varying NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" character varying NOT NULL
);

CREATE INDEX IF NOT EXISTS "navigation_blog_route_sub_links_order_idx" ON "navigation_blog_route_sub_links" ("_order");
CREATE INDEX IF NOT EXISTS "navigation_blog_route_sub_links_parent_id_idx" ON "navigation_blog_route_sub_links" ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "navigation_blog_route_sub_links_locales_locale_parent_id_unique"
  ON "navigation_blog_route_sub_links_locales" ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "navigation_blog_route_sub_links"
    ADD CONSTRAINT "navigation_blog_route_sub_links_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_blog_route_sub_links_locales"
    ADD CONSTRAINT "navigation_blog_route_sub_links_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation_blog_route_sub_links"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── contact_route ──────────────────────────────────────────────────────────
ALTER TABLE "navigation" ADD COLUMN IF NOT EXISTS "contact_route_has_dropdown" boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS "navigation_contact_route_sub_links" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" character varying PRIMARY KEY NOT NULL,
  "href" character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS "navigation_contact_route_sub_links_locales" (
  "label" character varying NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" character varying NOT NULL
);

CREATE INDEX IF NOT EXISTS "navigation_contact_route_sub_links_order_idx" ON "navigation_contact_route_sub_links" ("_order");
CREATE INDEX IF NOT EXISTS "navigation_contact_route_sub_links_parent_id_idx" ON "navigation_contact_route_sub_links" ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "navigation_contact_route_sub_links_locales_locale_parent_id_unique"
  ON "navigation_contact_route_sub_links_locales" ("_locale", "_parent_id");

DO $$ BEGIN
  ALTER TABLE "navigation_contact_route_sub_links"
    ADD CONSTRAINT "navigation_contact_route_sub_links_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_contact_route_sub_links_locales"
    ADD CONSTRAINT "navigation_contact_route_sub_links_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "navigation_contact_route_sub_links"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
