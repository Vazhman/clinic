-- Services: manual display order for the public services list, set via a
-- drag-and-drop reorder panel in the admin (beforeListTable button on the
-- Services list) — mirrors the Doctors displayOrder feature.
--
-- Additive/idempotent. Default 0 — coexists with the existing pinned /
-- pinned_order fields: pinned services still float to the top (ordered by
-- pinned_order), everything else sorts by display_order then name.
-- services is NOT a drafts/versions collection, so no `_services_v` mirror is needed.
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "display_order" integer DEFAULT 0;

-- Services: single "featured" toggle — the service marked here renders as
-- the large purple/blackberry card on /services. Exclusivity (only one
-- featured at a time) is enforced in a beforeChange hook in Services.ts,
-- not at the DB level.
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "featured" boolean DEFAULT false;

-- SiteSettings: TOP.GE / tracking script moved here from Footer, with a new
-- on/off toggle. The old "footer.top_ge_script" column is kept (field now
-- admin.hidden:true in Footer.ts) so no data migration is needed there.
-- site_settings is a global (single row), not a drafts/versions collection.
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "top_ge_enabled" boolean DEFAULT false;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "top_ge_script" character varying;
