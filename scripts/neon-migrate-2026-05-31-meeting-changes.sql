-- Additive Neon sync for commit 4ef147d "feat(home): client meeting changes".
-- Payload push:true is a no-op on Vercel serverless prod, so the columns the new
-- code reads/writes must be added to Neon by hand. EVERY statement is additive,
-- nullable, and idempotent (ADD COLUMN IF NOT EXISTS) — it cannot drop data and
-- can be re-run safely. No new tables, no constraints, no drops.
--
-- Column names/types derived from Neon's existing conventions:
--   Payload number  -> numeric   (cf. stats_*, homepage_order)
--   Payload checkbox-> boolean   (cf. show_on_homepage, show_doctor_card)
--   Payload text/ta -> varchar   (cf. title, subtitle, label)
--   Payload upload  -> integer   (FK id col, cf. hero_image_id, image_id)
--
-- NOTE: featuredDoctors (hasMany) needs NO schema change — it stores into the
-- existing home_page_rels(path,doctors_id) table, same as heroDoctors.
-- NOTE: checkups needs NO change — Neon already has the localized `service`
-- column (the local-only data-loss prompt was a stale-local-DB artifact).

BEGIN;

-- #10 Services pinning
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "pinned" boolean;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "pinned_order" numeric;

-- #11 News/blog pinning
ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "pinned" boolean;

-- #9 About-page CEO message + photo
ALTER TABLE "about_page"          ADD COLUMN IF NOT EXISTS "ceo_photo_id" integer;
ALTER TABLE "about_page_locales"  ADD COLUMN IF NOT EXISTS "ceo_name"     varchar;
ALTER TABLE "about_page_locales"  ADD COLUMN IF NOT EXISTS "ceo_role"     varchar;
ALTER TABLE "about_page_locales"  ADD COLUMN IF NOT EXISTS "ceo_message"  varchar;

-- #2 satisfied-patients stat  +  #5 featured-doctor count / randomize
ALTER TABLE "home_page" ADD COLUMN IF NOT EXISTS "stats_satisfied_patients"   numeric;
ALTER TABLE "home_page" ADD COLUMN IF NOT EXISTS "featured_doctor_count"      numeric;
ALTER TABLE "home_page" ADD COLUMN IF NOT EXISTS "randomize_featured_doctors" boolean;

-- #1 Per-slide hero carousel fields
ALTER TABLE "home_page_hero_slides"          ADD COLUMN IF NOT EXISTS "button_href"  varchar;
ALTER TABLE "home_page_hero_slides_locales"  ADD COLUMN IF NOT EXISTS "headline"     varchar;
ALTER TABLE "home_page_hero_slides_locales"  ADD COLUMN IF NOT EXISTS "subheadline"  varchar;
ALTER TABLE "home_page_hero_slides_locales"  ADD COLUMN IF NOT EXISTS "button_label" varchar;

COMMIT;
