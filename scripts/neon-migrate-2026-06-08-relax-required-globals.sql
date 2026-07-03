-- Drop NOT NULL on editorial global fields that are no longer `required`.
--
-- These fields (page titles, about description, contact address + working hours)
-- all have a translation fallback on the public page, so requiring them only
-- blocked editors from saving the WHOLE global until each was filled in all 3
-- languages (the documented footgun — see HomePage.ts hero comment). The Payload
-- config no longer marks them required; this migration relaxes the matching DB
-- columns so an empty save writes cleanly instead of hitting a NOT NULL 500.
--
-- MUST be applied to Neon BEFORE (or with) deploying the code change. Applying
-- it early is harmless: while the code still says `required`, Payload keeps
-- validating, so nothing can actually write null until the deploy lands.
--
-- Additive + idempotent: DROP NOT NULL on an already-nullable column is a no-op.
-- (`push:true` is a no-op on Vercel serverless prod, so Neon needs this by hand.)

BEGIN;

ALTER TABLE "about_page_locales"   ALTER COLUMN "title"                  DROP NOT NULL;
ALTER TABLE "about_page_locales"   ALTER COLUMN "description"            DROP NOT NULL;
ALTER TABLE "contact_page_locales" ALTER COLUMN "title"                  DROP NOT NULL;
ALTER TABLE "contact_page_locales" ALTER COLUMN "address_value"          DROP NOT NULL;
ALTER TABLE "contact_page_locales" ALTER COLUMN "working_hours_weekdays" DROP NOT NULL;
ALTER TABLE "contact_page_locales" ALTER COLUMN "working_hours_weekends" DROP NOT NULL;
ALTER TABLE "booking_page_locales" ALTER COLUMN "title"                  DROP NOT NULL;

COMMIT;
