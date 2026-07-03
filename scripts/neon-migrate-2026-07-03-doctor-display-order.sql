-- Doctors: manual display order for the public /doctors page, set via a
-- drag-and-drop reorder panel in the admin (beforeListTable button on the
-- Doctors list).
--
-- Additive/idempotent. Default 0 — all existing doctors sort alphabetically
-- by name (secondary sort key in getDoctors()) until an admin drags them
-- into a custom order.
-- doctors is NOT a drafts/versions collection, so no `_doctors_v` mirror is needed.
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "display_order" integer DEFAULT 0;
