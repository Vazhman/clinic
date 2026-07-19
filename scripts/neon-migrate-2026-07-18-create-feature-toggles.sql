-- FeatureToggles (src/globals/FeatureToggles.ts) has existed in code for a
-- while (labTests/blog/doctors/services/booking/faq/testimonials/
-- googleReviewsSync/promotions/contactForm), but push:true never ran
-- non-interactively against Neon, so this table was never created at all.
-- Every read (src/lib/payload-data.ts:_getFeatureToggles) silently
-- try/catches to null -> isFeatureEnabled() treats null as "enabled", so
-- toggles have been permanently stuck ON and unsaveable (saving the global
-- from the admin UI 500s: relation "feature_toggles" does not exist).
-- Safe/idempotent: only creates the table if missing, all columns default
-- true to match the field defaults in code (existing behavior preserved).
BEGIN;

CREATE TABLE IF NOT EXISTS "feature_toggles" (
  "id" serial PRIMARY KEY NOT NULL,
  "lab_tests" boolean DEFAULT true,
  "blog" boolean DEFAULT true,
  "doctors" boolean DEFAULT true,
  "services" boolean DEFAULT true,
  "booking" boolean DEFAULT true,
  "faq" boolean DEFAULT true,
  "testimonials" boolean DEFAULT true,
  "google_reviews_sync" boolean DEFAULT true,
  "promotions" boolean DEFAULT true,
  "contact_form" boolean DEFAULT true,
  "updated_at" timestamp(3) with time zone DEFAULT now(),
  "created_at" timestamp(3) with time zone DEFAULT now()
);

COMMIT;
