-- Adds a per-package contact phone number to checkup-packages.
-- Not localized: lives on the main table, not checkup_packages_locales.
-- Falls back to the site-wide contact number in CheckupPackageModal when empty.

ALTER TABLE "checkup_packages" ADD COLUMN IF NOT EXISTS "phone" varchar;
