-- Two additive fields for the AI assistant re-enable + extend work (2026-07-20):
--
-- 1. feature_toggles.ai_assistant — CMS kill-switch for the floating chat
--    widget + /ai-assistant full page. Defaults to FALSE, same as
--    health_library (opposite of every other toggle in this table), so the
--    assistant stays hidden until an admin explicitly turns it on.
--
-- 2. site_settings_locales.ai_knowledge_base — localized textarea holding
--    admin-supplied extra context injected into the AI system prompt.
--    Same column type as the existing localized textarea
--    (default_meta_description → character varying).
--
-- Neither global uses versions/drafts, so no `_v` mirror tables apply.
-- Additive + idempotent (safe re-run on local Docker AND Neon prod).
BEGIN;

ALTER TABLE "feature_toggles" ADD COLUMN IF NOT EXISTS "ai_assistant" boolean DEFAULT false;
ALTER TABLE "site_settings_locales" ADD COLUMN IF NOT EXISTS "ai_knowledge_base" character varying;

COMMIT;
