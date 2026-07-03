-- HomePage: per-section, per-language visibility toggles.
--
-- Vazha's `sectionVisibility` group (src/globals/HomePage.ts) adds 10
-- `localized: true` checkbox fields. Because they are localized, Payload's
-- postgres adapter stores them as columns on `home_page_locales` (one row per
-- locale), NOT on the `home_page` base table. Column names below were captured
-- verbatim from a local Docker `push:true` run so they match exactly.
--
-- Additive/idempotent. Default true so every section stays visible on all three
-- locales after the field first ships (matches the field defaultValue). This
-- also supersedes the now-hidden `home_page.show_doctor_card` column, which is
-- left untouched (push:true keeps it; nothing reads it anymore).
--
-- home_page is NOT a drafts global, so there is no `_home_page_v` mirror to patch.
ALTER TABLE "home_page_locales" ADD COLUMN IF NOT EXISTS "section_visibility_hero"              boolean DEFAULT true;
ALTER TABLE "home_page_locales" ADD COLUMN IF NOT EXISTS "section_visibility_symptom_navigator" boolean DEFAULT true;
ALTER TABLE "home_page_locales" ADD COLUMN IF NOT EXISTS "section_visibility_stats"             boolean DEFAULT true;
ALTER TABLE "home_page_locales" ADD COLUMN IF NOT EXISTS "section_visibility_services_grid"     boolean DEFAULT true;
ALTER TABLE "home_page_locales" ADD COLUMN IF NOT EXISTS "section_visibility_doctors_preview"   boolean DEFAULT true;
ALTER TABLE "home_page_locales" ADD COLUMN IF NOT EXISTS "section_visibility_checkup_cards"     boolean DEFAULT true;
ALTER TABLE "home_page_locales" ADD COLUMN IF NOT EXISTS "section_visibility_news"              boolean DEFAULT true;
ALTER TABLE "home_page_locales" ADD COLUMN IF NOT EXISTS "section_visibility_reviews"           boolean DEFAULT true;
ALTER TABLE "home_page_locales" ADD COLUMN IF NOT EXISTS "section_visibility_faq"               boolean DEFAULT true;
ALTER TABLE "home_page_locales" ADD COLUMN IF NOT EXISTS "section_visibility_contact_map"       boolean DEFAULT true;
