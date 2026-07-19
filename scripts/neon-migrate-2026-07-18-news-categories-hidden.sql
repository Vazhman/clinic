BEGIN;

ALTER TABLE "news_categories"
  ADD COLUMN IF NOT EXISTS "hidden" boolean DEFAULT false;

COMMIT;
