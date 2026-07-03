# Khozrevanidze Clinic — Handover & Operations Guide

Production site for **khozrevanidze.ge** — Next.js 16 + Payload CMS 3 + Postgres,
trilingual (ge / en / ru). This document is the operational reference for the
client/editorial team and for whoever deploys the app.

---

## 1. Where content lives — the golden rule

**Everything visible on the site comes from one of two places:**

1. **The CMS (Payload admin)** — all editorial content: page headings, hero
   slides, FAQs, stats, contact details, footer, navigation labels, doctors,
   services, news, reviews, checkup packages, lab tests, legal pages.
2. **The Doctra API → synced into the CMS** — doctors and services are imported
   from the clinic's Doctra system, *into* the CMS, and then become normal,
   editable CMS records.

There are **no editorial values hardcoded in the code** anymore. If an editor
needs to change visible text, it is in the admin. (The only strings that remain
in code are pure interface labels — buttons like "Read more", aria-labels — which
are standard app translations, not content.)

### Editing content
Admin panel: **`/admin`** (e.g. `https://khozrevanidze.ge/admin`).
- **Globals → გვერდები** (Pages group): Home, About, Contact, Services, Doctors,
  Booking page heroes; Navigation; Footer.
- **Collections**: Doctors, Services, Checkup Packages, Reviews, News, Lab Tests.
- Every field is editable in all three languages — use the locale switcher
  (top-right of the admin) to edit ge / en / ru. If a language is left blank, the
  site automatically shows the Georgian value (Payload locale fallback).

---

## 2. Doctra API → CMS sync

- **What syncs:** Departments → **Services**; Doctors → **Doctors** (with
  `doctraId` / `doctraBranchId`, specialty, phone, email, qualifications).
- **How to run it:** Admin dashboard → **"Doctra სინქრონიზაცია" → "სინქრონიზაცია
  ახლა"** (button). It calls `POST /api/import-doctra` (admin-auth required).
- **Idempotent & safe:** keyed on `doctraId`/`doctraBranchId`. Re-running never
  overwrites editor changes (name/specialty/bio/photo) — it only creates new
  doctors and gap-fills empty phone/email. Run it whenever Doctra has new staff.
- **Note:** Doctra does **not** send photos. **Doctor & service photos must be
  uploaded in the CMS** (Media). Until a photo is uploaded, a placeholder shows.

---

## 3. Deploying to production

The Vercel project has **no Git integration** — deploy with `vercel deploy --prod`
(or the cPanel/SQLite path). Payload `push` is a **no-op on serverless prod**, so
the database schema does **not** auto-update — you apply SQL migrations by hand.

### Required environment variables (production)
| Var | Required | Purpose |
|-----|----------|---------|
| `DATABASE_URL` | ✅ | Postgres (Neon) connection string |
| `PAYLOAD_SECRET` | ✅ | CMS auth secret — **app now refuses to boot in prod if unset** |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical site URL (SEO, sitemap, OG) |
| `BLOB_READ_WRITE_TOKEN` | ✅ (Vercel) | Media uploads (Vercel Blob) |
| `DOCTRA_API_URL` / `DOCTRA_USER` / `DOCTRA_PASSWORD` | ✅ | Doctra import + patient room |
| `GOOGLE_PLACES_API_KEY` / `GOOGLE_PLACE_ID` | optional | Google reviews sync |
| `GOOGLE_TTS_API_KEY` | optional | Georgian text-to-speech |
| `GEMINI_API_KEY` | optional | AI chat (currently disabled) |

### Deploy steps
1. **Apply ALL pending DB migrations to Neon** (additive SQL, idempotent — apply in
   order; each is safe to re-run). **⚠ Skipping `nav-dropdowns` will make every page
   return 500 on Neon** (the site-wide Header reads the `navigation` global, which
   selects the new `*_has_dropdown` columns) — i.e. it blanks the whole site.
   ```bash
   # against the Neon connection string:
   psql "$NEON_DATABASE_URL" -f scripts/neon-migrate-2026-06-08-nav-dropdowns.sql
   psql "$NEON_DATABASE_URL" -f scripts/neon-migrate-2026-06-08-relax-required-globals.sql
   psql "$NEON_DATABASE_URL" -f scripts/neon-migrate-2026-06-08-landing-globals.sql
   ```
   - `nav-dropdowns` — navigation dropdown columns + sub-link tables (**required, or site 500s**).
   - `relax-required-globals` — drops NOT NULL on about/contact/booking title fields.
   - `landing-globals` — services-page / doctors-page globals + About fact `description`.

   Then confirm no drafts-table drift: `NEON_DB=$NEON_DATABASE_URL LOCAL_DB=<local> node scripts/_check-version-mirrors.mjs` (expect "all present").
2. **Seed the CMS on prod** (only needed once, or after schema changes — the site
   now reads straight from the CMS with no code fallback, so prod **must** be
   seeded or pages render blank). Point `SITE` at the prod URL and authenticate:
   ```bash
   SITE=https://khozrevanidze.ge ADMIN_EMAIL=... ADMIN_PASSWORD=... \
     node scripts/seed-cms-fallbacks.mjs &&
     node scripts/seed-cms-arrays.mjs &&
     node scripts/seed-cms-demo-content.mjs &&
     node scripts/seed-cms-real-values.mjs &&
     node scripts/seed-cms-landing-pages.mjs
   ```
   (These only fill empty fields, except `seed-cms-real-values` which writes the
   real clinic contact details. Safe to re-run.)
3. **Deploy:** `vercel deploy --prod`.
4. **Verify:** `SITE=https://khozrevanidze.ge npm run verify:cms` — runs the CMS
   round-trip integrity test + headless admin check. The round-trip test must be
   green.

---

## 4. Pre-handover status (this release)

**Done & verified:**
- ✅ Production build passes (`npm run build`).
- ✅ All editorial content reads from the CMS; real clinic contact details
  (phone, email, address, hours, map coords, socials) migrated into the CMS.
- ✅ New `ServicesPage` / `DoctorsPage` globals + About fact descriptions —
  landing headings now editable.
- ✅ Booking wizard disabled site-wide (clinic books by phone) — `/booking` and
  doctor pages show a "Call us" CTA wired to the CMS phone number.
- ✅ Security: `seed-legal` & `sync-google-reviews` API routes now require admin
  auth; `Users` list no longer public; `PAYLOAD_SECRET` fails fast in prod.
- ✅ Branded, localized **404 / error / global-error** pages.
- ✅ SEO: dynamic sitemap (all collections × 3 locales), robots, hreflang,
  JSON-LD (clinic/physician/service/FAQ/breadcrumb), per-page metadata.
- ✅ CMS round-trip integrity test green.

**Content cleanup the client must do in the admin (test data left over):**
- **Delete or translate 2 test records** that currently show on live en/ru pages:
  doctor "ვაჟა ჩიტაიშვილი" (`vazha-chitaishvili`, id 203) and service "სატესტო
  სერვიცი" (`test1`, id 65).
- **About page** (`Globals → ჩვენ შესახებ`) currently holds placeholder/test text in
  all languages (description "სსდსდსδ", CEO "ტესტერი"…) — replace with real About copy
  in ge / en / ru.
- Any CMS field left blank in en/ru falls back to Georgian — fill en/ru where you
  want real translations (the system is fully translation-ready; this is content entry).
- Upload doctor/service photos in the Media library (Doctra doesn't send photos).

**Known follow-ups (not blockers, prioritized):**
1. **Doctor/service photos** — upload in the CMS Media library. Until then, some
   legacy doctors/services fall back to bundled images in code.
2. **JSON-LD structured data** (`src/lib/structured-data.ts`) still embeds the
   clinic's contact/address/hours as constants. They're correct, but won't
   auto-update if an editor changes contact info — wire to the ContactPage global
   when convenient.
3. **Homepage SEO meta** (title/description) is per-locale code, not a CMS field.
4. **ISR/caching** — only the homepage sets `revalidate`. Consider adding
   `export const revalidate = N` to list/detail pages for performance.
5. **If AI chat or patient-room login are re-enabled**, add rate limiting first.
6. `admin-ui-test.mjs` has a couple of stale headless assertions (the `Pages`
   collection is intentionally hidden; long-form selector timing) — review when
   touching that test. The data-integrity round-trip test is the authoritative one.

---

## 5. Seed & migration scripts reference

| Script | Purpose |
|--------|---------|
| `scripts/seed-cms-fallbacks.mjs` | Fill scalar translation-fallback fields (globals) |
| `scripts/seed-cms-arrays.mjs` | Footer socials + first-pass arrays |
| `scripts/seed-cms-demo-content.mjs` | Footer quick-links, About facts, home stats/hero-slides/FAQs |
| `scripts/seed-cms-real-values.mjs` | Real contact/nav/footer values (phone, email, hours, coords, whatsapp) |
| `scripts/seed-cms-landing-pages.mjs` | Services/Doctors landing hero + About fact descriptions |
| `scripts/_audit-cms-empty.mjs` | Dev helper: dump every global field per locale to find blanks |
| `scripts/neon-migrate-*.sql` | Additive schema migrations for Neon prod |

All seed scripts default to `SITE=http://localhost:3001`, admin `admin@admin.ge`.

---

## 6. Bulk-importing data (e.g. a list of lab tests)

Lab tests are 100% CMS-driven. For a large client-provided dataset (e.g. a CSV of
300 tests), use the official **`@payloadcms/plugin-import-export`** (native CSV
with `title_ge` / `title_en` / `title_ru` columns for all locales at once), or a
Local-API upsert script modeled on `src/app/api/import-doctra/route.ts`.
Remember lab tests have drafts — set `_status: 'published'` and tick the
`published` checkbox, or imported rows stay hidden from the public site.
