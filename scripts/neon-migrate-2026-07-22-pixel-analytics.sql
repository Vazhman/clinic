-- SiteSettings: Pixel (Meta/Facebook) and Analytics (GA4/GTM) embed codes,
-- each with its own on/off toggle — mirrors the existing top_ge_enabled /
-- top_ge_script pattern. Rendered in [locale]/layout.tsx via RawEmbedScript.
-- site_settings is a global (single row), not a drafts/versions collection.
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "pixel_enabled" boolean DEFAULT false;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "pixel_code" character varying;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "analytics_enabled" boolean DEFAULT false;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "analytics_code" character varying;
