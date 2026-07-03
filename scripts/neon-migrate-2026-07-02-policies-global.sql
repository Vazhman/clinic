-- Policies global (Terms & Conditions + Privacy Policy).
--
-- New `policies` global (src/globals/Policies.ts) with two localized richText
-- fields (terms, privacy). Payload stores a global as a base table + a _locales
-- table; richText is jsonb; localized rows key on the shared `public._locales`
-- enum (ge/en/ru). DDL mirrors the sibling `contact_page` / `contact_page_locales`
-- tables exactly (same pkey/fk/unique-index conventions).
--
-- Idempotent (CREATE ... IF NOT EXISTS). No drafts on this global → no _v mirror.
-- Local interactive `push` was unreliable here (it tried to rename the leftover
-- users_sessions table into policies), so this is applied by hand to Docker + Neon.

CREATE TABLE IF NOT EXISTS public.policies (
  id serial CONSTRAINT policies_pkey PRIMARY KEY,
  updated_at timestamp(3) with time zone,
  created_at timestamp(3) with time zone
);

CREATE TABLE IF NOT EXISTS public.policies_locales (
  terms jsonb,
  privacy jsonb,
  id serial CONSTRAINT policies_locales_pkey PRIMARY KEY,
  _locale public._locales NOT NULL,
  _parent_id integer NOT NULL,
  CONSTRAINT policies_locales_parent_id_fk FOREIGN KEY (_parent_id)
    REFERENCES public.policies(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS policies_locales_locale_parent_id_unique
  ON public.policies_locales USING btree (_locale, _parent_id);
