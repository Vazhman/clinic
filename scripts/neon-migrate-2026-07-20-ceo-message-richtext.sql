-- AboutPage.ts's ceo.message field was changed from `textarea` to `richText`
-- in code, but the Neon column was never migrated (push:true is a no-op on
-- prod), so it stayed varchar, holding a plain string instead of Lexical
-- JSON. Existing values have already been rewritten (via
-- scripts/_fix-about-ceo-message-lexical.mjs) into valid JSON text
-- representing Lexical paragraph nodes, so the cast below is safe.
-- Additive/idempotent: safe to re-run.
BEGIN;

ALTER TABLE "about_page_locales"
  ALTER COLUMN "ceo_message" TYPE jsonb USING "ceo_message"::jsonb;

COMMIT;
