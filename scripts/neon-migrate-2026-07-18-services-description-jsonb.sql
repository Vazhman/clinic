-- Services.description was changed from `text` to `richText` in code, but
-- the Neon column was never migrated (push:true is a no-op on prod) so it
-- stayed varchar, holding plain strings instead of Lexical JSON. This is
-- what crashed the admin Lexical editor. Existing values have already been
-- rewritten (via scripts/_fix-services-description-lexical.mjs) into valid
-- JSON text representing a minimal Lexical paragraph node, so the cast
-- below is safe. Additive/idempotent: safe to re-run.
BEGIN;

ALTER TABLE "services_locales"
  ALTER COLUMN "description" TYPE jsonb USING "description"::jsonb;

COMMIT;
