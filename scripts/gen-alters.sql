-- Emit idempotent ADD COLUMN statements for every column in the local schema.
-- Run against LOCAL; the output is applied to Neon. Existing columns are skipped
-- (IF NOT EXISTS); only genuinely-missing columns get added. All nullable, so it
-- never fails on tables that already have rows.
SELECT 'ALTER TABLE "' || c.relname || '" ADD COLUMN IF NOT EXISTS "' || a.attname || '" ' || format_type(a.atttypid, a.atttypmod) || ';'
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND a.attnum > 0
  AND NOT a.attisdropped
  AND c.relkind = 'r'
ORDER BY c.relname, a.attnum;
