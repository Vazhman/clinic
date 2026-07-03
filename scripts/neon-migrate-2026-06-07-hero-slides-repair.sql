-- Comprehensive, idempotent REPAIR of the home-page hero-carousel tables on Neon.
--
-- Symptom (prod): saving an empty hero-slide array returns 200, but adding ANY
-- slide returns HTTP 500 "Something went wrong." — i.e. the read path works but
-- INSERT fails. That is classic schema drift: Payload push:true is a no-op on
-- Vercel serverless, so the hero_slides tables on Neon fell behind the config.
--
-- This script makes Neon's two hero_slides tables match the known-good LOCAL
-- Docker schema EXACTLY. It is additive and idempotent — every statement is
-- guarded (IF NOT EXISTS / catalog check / nullability relax), so it cannot drop
-- data and can be re-run safely. Verified locally by dropping both tables and
-- self-healing from this file (see scripts/_verify-hero-slides-migration.mjs).
--
-- Covers every INSERT-only failure mode observed/possible:
--   * missing button_href / headline / subheadline / button_label columns
--   * legacy `type` column NOT NULL without a default (INSERT omits it)
--   * locales.id missing its sequence default (INSERT can't generate a PK)
--   * missing child table / enum type / FKs entirely

BEGIN;

-- ── enum type for the legacy `type` column ─────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_home_page_hero_slides_type') THEN
    CREATE TYPE "enum_home_page_hero_slides_type" AS ENUM ('image', 'news', 'doctor', 'service');
  END IF;
END $$;

-- ── parent table: home_page_hero_slides ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "home_page_hero_slides" (
  "id"          varchar PRIMARY KEY NOT NULL,
  "_order"      integer NOT NULL,
  "_parent_id"  integer NOT NULL,
  "image_id"    integer,
  "type"        "enum_home_page_hero_slides_type" DEFAULT 'image',
  "news_item_id" integer,
  "doctor_id"   integer,
  "service_id"  integer,
  "button_href" varchar
);

-- columns (in case the table already existed but drifted)
ALTER TABLE "home_page_hero_slides" ADD COLUMN IF NOT EXISTS "image_id"     integer;
ALTER TABLE "home_page_hero_slides" ADD COLUMN IF NOT EXISTS "type"         "enum_home_page_hero_slides_type" DEFAULT 'image';
ALTER TABLE "home_page_hero_slides" ADD COLUMN IF NOT EXISTS "news_item_id" integer;
ALTER TABLE "home_page_hero_slides" ADD COLUMN IF NOT EXISTS "doctor_id"    integer;
ALTER TABLE "home_page_hero_slides" ADD COLUMN IF NOT EXISTS "service_id"   integer;
ALTER TABLE "home_page_hero_slides" ADD COLUMN IF NOT EXISTS "button_href"  varchar;

-- `type` is optional/hidden in the current config; INSERTs omit it. Guarantee a
-- default and relax NOT NULL so an omitted value cannot fail the INSERT.
ALTER TABLE "home_page_hero_slides" ALTER COLUMN "type" SET DEFAULT 'image';
ALTER TABLE "home_page_hero_slides" ALTER COLUMN "type" DROP NOT NULL;

-- ── locales child table: home_page_hero_slides_locales ─────────────────────
CREATE SEQUENCE IF NOT EXISTS "home_page_hero_slides_locales_id_seq";

CREATE TABLE IF NOT EXISTS "home_page_hero_slides_locales" (
  "id"           integer PRIMARY KEY NOT NULL DEFAULT nextval('home_page_hero_slides_locales_id_seq'),
  "_locale"      "_locales" NOT NULL,
  "_parent_id"   varchar NOT NULL,
  "label"        varchar,
  "headline"     varchar,
  "subheadline"  varchar,
  "button_label" varchar
);

ALTER TABLE "home_page_hero_slides_locales" ADD COLUMN IF NOT EXISTS "label"        varchar;
ALTER TABLE "home_page_hero_slides_locales" ADD COLUMN IF NOT EXISTS "headline"     varchar;
ALTER TABLE "home_page_hero_slides_locales" ADD COLUMN IF NOT EXISTS "subheadline"  varchar;
ALTER TABLE "home_page_hero_slides_locales" ADD COLUMN IF NOT EXISTS "button_label" varchar;

-- Guarantee the PK can auto-generate (INSERT relies on the sequence default).
ALTER SEQUENCE "home_page_hero_slides_locales_id_seq" OWNED BY "home_page_hero_slides_locales"."id";
ALTER TABLE "home_page_hero_slides_locales"
  ALTER COLUMN "id" SET DEFAULT nextval('home_page_hero_slides_locales_id_seq');

-- ── indexes ────────────────────────────────────────────────────────────────
CREATE INDEX        IF NOT EXISTS "home_page_hero_slides_order_idx"     ON "home_page_hero_slides" ("_order");
CREATE INDEX        IF NOT EXISTS "home_page_hero_slides_parent_id_idx" ON "home_page_hero_slides" ("_parent_id");
CREATE INDEX        IF NOT EXISTS "home_page_hero_slides_image_idx"     ON "home_page_hero_slides" ("image_id");
CREATE INDEX        IF NOT EXISTS "home_page_hero_slides_news_item_idx" ON "home_page_hero_slides" ("news_item_id");
CREATE INDEX        IF NOT EXISTS "home_page_hero_slides_doctor_idx"    ON "home_page_hero_slides" ("doctor_id");
CREATE INDEX        IF NOT EXISTS "home_page_hero_slides_service_idx"   ON "home_page_hero_slides" ("service_id");
CREATE UNIQUE INDEX IF NOT EXISTS "home_page_hero_slides_locales_locale_parent_id_unique"
  ON "home_page_hero_slides_locales" ("_locale", "_parent_id");

-- ── foreign keys (added only if absent) ────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_page_hero_slides_parent_id_fk') THEN
    ALTER TABLE "home_page_hero_slides" ADD CONSTRAINT "home_page_hero_slides_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "home_page"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_page_hero_slides_image_id_media_id_fk') THEN
    ALTER TABLE "home_page_hero_slides" ADD CONSTRAINT "home_page_hero_slides_image_id_media_id_fk"
      FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_page_hero_slides_news_item_id_news_id_fk') THEN
    ALTER TABLE "home_page_hero_slides" ADD CONSTRAINT "home_page_hero_slides_news_item_id_news_id_fk"
      FOREIGN KEY ("news_item_id") REFERENCES "news"("id") ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_page_hero_slides_doctor_id_doctors_id_fk') THEN
    ALTER TABLE "home_page_hero_slides" ADD CONSTRAINT "home_page_hero_slides_doctor_id_doctors_id_fk"
      FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_page_hero_slides_service_id_services_id_fk') THEN
    ALTER TABLE "home_page_hero_slides" ADD CONSTRAINT "home_page_hero_slides_service_id_services_id_fk"
      FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_page_hero_slides_locales_parent_id_fk') THEN
    ALTER TABLE "home_page_hero_slides_locales" ADD CONSTRAINT "home_page_hero_slides_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "home_page_hero_slides"("id") ON DELETE CASCADE;
  END IF;
END $$;

COMMIT;
