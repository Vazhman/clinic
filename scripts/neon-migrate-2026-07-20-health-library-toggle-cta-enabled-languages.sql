-- Three independent additive fields added 2026-07-20:
--
-- 1. feature_toggles.health_library — new CMS kill-switch for /health-library
--    (page has hard-`notFound()`-gated since 2026-05-30; this makes it
--    admin-toggleable again). Defaults to FALSE, unlike every sibling toggle
--    in this table (which default true/"on") — deliberately preserves the
--    page's current disabled state until the admin explicitly turns it on.
--
-- 2. navigation.cta_button_enabled — show/hide checkbox for the header CTA
--    button (Navigation global). Defaults true (button stays visible,
--    matching current live behavior) until the admin turns it off.
--
-- 3. doctors_page.show_languages — show/hide checkbox for the "languages
--    spoken" info on doctor profile + /doctors list. Defaults true.
--
-- None of these globals use versions/drafts, so no `_v` mirror tables apply.
-- Additive + idempotent (safe re-run on local Docker AND Neon prod).
BEGIN;

ALTER TABLE "feature_toggles" ADD COLUMN IF NOT EXISTS "health_library" boolean DEFAULT false;
ALTER TABLE "navigation" ADD COLUMN IF NOT EXISTS "cta_button_enabled" boolean DEFAULT true;
ALTER TABLE "doctors_page" ADD COLUMN IF NOT EXISTS "show_languages" boolean DEFAULT true;

COMMIT;
