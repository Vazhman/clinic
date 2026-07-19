BEGIN;

ALTER TABLE "lab_tests"
  ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "price" numeric,
  ADD COLUMN IF NOT EXISTS "currency" varchar DEFAULT 'GEL',
  ADD COLUMN IF NOT EXISTS "pdf_attachment_id" integer REFERENCES "media"("id") ON DELETE SET NULL;

ALTER TABLE "_lab_tests_v"
  ADD COLUMN IF NOT EXISTS "version_active" boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "version_price" numeric,
  ADD COLUMN IF NOT EXISTS "version_currency" varchar DEFAULT 'GEL',
  ADD COLUMN IF NOT EXISTS "version_pdf_attachment_id" integer REFERENCES "media"("id") ON DELETE SET NULL;

COMMIT;
