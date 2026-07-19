-- Follow-up to the news_texts / news_rels fixes: with both join tables in
-- place, the public news query failed one column further in — "column
-- news.featured does not exist". News.featured (`type: 'checkbox'`, the
-- "featured article" flag, distinct from `pinned`/`showOnHomepage`) was
-- never synced to Neon at all: same push:true schema-drift root cause as
-- the join tables. Shape mirrors the sibling `pinned` boolean column
-- (confirmed live: nullable, default false). `_news_v` needs the matching
-- `version_featured` column for the same reason `version_pinned` exists.
-- Additive + idempotent: safe to re-run on local Docker AND Neon. New
-- columns default to false for all 97 existing rows — matches the field's
-- own `defaultValue: false` — touches no other data.

BEGIN;

ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "featured" boolean DEFAULT false;
ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_featured" boolean DEFAULT false;

COMMIT;
