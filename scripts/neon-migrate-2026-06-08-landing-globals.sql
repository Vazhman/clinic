-- ───────────────────────────────────────────────────────────────────────────
-- Additive migration: make the /services and /doctors landing-page heroes and
-- the About fact descriptions CMS-editable (previously next-intl only).
--
-- Adds two new globals (services_page, doctors_page) + a localized `description`
-- column on the About facts array. Idempotent; safe to run more than once.
--
-- Apply to BOTH local Docker AND Neon prod (Payload `push` is a no-op on Neon
-- serverless — see CLAUDE.md "Deploying & CMS schema changes"). Local was
-- already synced by `push`; this file is what you run against Neon.
--
-- None of these are drafts-enabled globals, so there are NO `_v` version
-- mirrors to add (the version-mirror rule only applies to drafts collections).
-- ───────────────────────────────────────────────────────────────────────────

-- ── services-page global ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "services_page" (
  "id" serial PRIMARY KEY NOT NULL,
  "updated_at" timestamp(3) with time zone,
  "created_at" timestamp(3) with time zone
);

CREATE TABLE IF NOT EXISTS "services_page_locales" (
  "title" varchar,
  "subtitle" varchar,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" integer NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "services_page_locales"
    ADD CONSTRAINT "services_page_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."services_page"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "services_page_locales_locale_parent_id_unique"
  ON "services_page_locales" USING btree ("_locale","_parent_id");

-- ── doctors-page global ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "doctors_page" (
  "id" serial PRIMARY KEY NOT NULL,
  "updated_at" timestamp(3) with time zone,
  "created_at" timestamp(3) with time zone
);

CREATE TABLE IF NOT EXISTS "doctors_page_locales" (
  "title" varchar,
  "subtitle" varchar,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" integer NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "doctors_page_locales"
    ADD CONSTRAINT "doctors_page_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."doctors_page"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "doctors_page_locales_locale_parent_id_unique"
  ON "doctors_page_locales" USING btree ("_locale","_parent_id");

-- ── About facts: localized `description` column ──────────────────────────────
ALTER TABLE "about_page_stats_locales"
  ADD COLUMN IF NOT EXISTS "description" varchar;
