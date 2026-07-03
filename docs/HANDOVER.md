# Khozrevanidze Clinic Site — Handover

Everything you need to demo this to the customer and deploy it for them.

## At a glance

| | |
|---|---|
| **Live demo** | https://clinic-one-blush.vercel.app |
| **Admin panel** | https://clinic-one-blush.vercel.app/admin |
| **Repo** | `git@github-personal:Fartenadze89/clinic.git` (`main`) |
| **Stack** | Next.js 16 (App Router) + Payload CMS 3 + Postgres / SQLite |
| **Demo DB** | Neon Postgres (Vercel-linked) |
| **Demo file storage** | Vercel Blob |
| **Production target** | cPanel + SQLite (per earlier decision) |
| **Languages** | Georgian (default), English, Russian — full coverage |
| **Doctors** | 146 (synced from Doctra) |
| **Services** | 64 (synced from Doctra; home shows 8 featured + "View all" CTA) |
| **Smoke test** | `node scripts/smoke-test.mjs` — hits every route + booking APIs |

## Demo credentials

```
URL:      https://clinic-one-blush.vercel.app/admin
Email:    admin@admin.ge
Password: 111111
```

**Change these before handing off to the clinic.** See [Hardening](#hardening) below.

## The three docs

| Doc | For | Language |
|---|---|---|
| [`docs/demo-walkthrough.md`](demo-walkthrough.md) | You (showing customer the demo) | English |
| [`docs/admin-guide-ge.md`](admin-guide-ge.md) | Clinic admin staff (daily use of Payload) | Georgian |
| [`docs/cpanel-deploy.md`](cpanel-deploy.md) | Whoever deploys to the clinic's cPanel | English |
| [`docs/booking-architecture.html`](booking-architecture.html) | Reference for the booking flow / Doctra integration | English (Georgian variant in `-ge.html`) |

## What's done

### Customer-facing
- 3 fully translated locales (GE / EN / RU), 299 next-intl keys × 3, plus
  all 146 doctors / 56 services / reviews / checkups translated
- Polished homepage with hero carousel (CMS-configurable), services grid,
  doctors preview, reviews, checkup packages, contact map
- Doctors page with searchable specialty dropdown (replaces 50+ pill grid)
- Doctor profile pages with photo, bio, qualifications, languages, related
  doctors
- Booking flow: 5-step wizard with live Doctra calendar/slots, demo
  kill-switch active (`BOOKING_SUBMIT_DISABLED=true` on Vercel)
- Locked to light mode to avoid dark-mode rendering issues in custom
  admin components

### Admin panel
- Doctra sync button on dashboard (one click pulls new doctors from Doctra)
- "Needs attention" tiles (no-photo / placeholder-specialty / hidden)
- Doctors collection: chip filters, tabbed edit form (Identity / Profile / SEO),
  view-live link, soft-delete via `inactive` checkbox
- Reviews `published` curation toggle (admin chooses what shows on the site)
- Login page polished with branded gradient + clinic name

### Infrastructure
- Postgres (Neon) for Vercel demo, SQLite adapter wired for cPanel handover
- Vercel Blob for media uploads (conditional — falls back to local disk
  on cPanel)
- `payload.config.ts` swaps DB adapter via `DATABASE_TYPE` env var
- 4 scripts in `scripts/`:
  - `fill-doctors-demo.py` — placeholder bios + photo for empty doctors
  - `apply-translations.py` — applies all 12 translation JSON files
  - `apply-legacy-translations.py` — historical, used during cleanup
  - `upload-doctor-photos.py` — batch photo upload from a folder
  - `cleanup-non-doctra-doctors.py` — removes legacy/manual rows, keeps only Doctra

### Content
- 146 Doctra-imported doctors with names, specialties (with department-name
  fallback), phone, email, qualifications-from-degree
- 47 of 146 doctors have real photos from the clinic's WeTransfer batch
  (the other 99 use a stock placeholder until clinic sends more photos)
- Generic Georgian biography template applied to all doctors (one paragraph,
  name + specialty substituted) — admin replaces with real bios over time

## What's still placeholder (admin work)

| Item | Count | Notes |
|---|---|---|
| Doctor photos | 99 of 146 missing | Send `translations/doctors-needing-photos.md` to the clinic |
| Doctor biographies | All 146 are templated | Admin replaces with real bios per doctor |
| Specializations / qualifications array content | All templated | Admin replaces |
| Globals (HomePage, AboutPage, ContactPage, Footer) | 0 rows | Site currently renders from `next-intl` messages — admin can add CMS content later |
| News / Blog posts | 0 rows | Empty collection ready for content |
| Custom pages | 0 rows | Block-based page builder ready |
| Google Reviews integration | **Wired (Places API path)** | Admin Dashboard → "Google შეფასებების სინქი" pulls 5 most-relevant reviews. Requires `GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_ID` env vars. See [Google Reviews setup](#google-reviews-setup) below. For the full 50+ review history, upgrade to Business Profile API + clinic-owner OAuth — separate work. |

## Google Reviews setup

One-time setup so the Dashboard "Google შეფასებების სინქი" button works:

1. **Google Cloud Console** → create or pick a project.
2. **APIs & Services → Library** → enable **"Places API (New)"**.
3. **APIs & Services → Credentials → Create API Key**.
   - **API restriction:** restrict the key to "Places API (New)" only.
   - **Application restriction:** set to **None**. Do NOT use HTTP-referrer
     restriction — the sync runs server-side from a Next.js route
     (`/api/sync-google-reviews`, `force-dynamic`), so there is no browser
     `Referer` header to match and Google would reject every call. Vercel
     serverless has no static IP either, so IP restriction won't work. The
     route's `payload.auth` login gate is what prevents abuse.
4. Find the clinic's **Place ID**. The old standalone finder URL is dead;
   use the embedded finder at
   https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
   (type the name/address, click the result, copy the `ChIJ...` string).
   For **Khozrevanidze clinic (Batumi, 81 Giorgi Brtskinvale St)** the Place ID
   is **`ChIJBTM8uhGGZ0ARfv9RC5SEHcI`** (verified 2026-06-17).
   - Shortcut, since the key already works: POST the clinic name to
     `https://places.googleapis.com/v1/places:searchText` with header
     `X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress`
     and read back `places[0].id`.
5. Set on Vercel:
   ```
   vercel env add GOOGLE_PLACES_API_KEY production
   vercel env add GOOGLE_PLACE_ID production
   ```
6. Redeploy (Vercel picks up new env at next deploy).
7. Admin → Dashboard → press "სინქი ახლა" on the "Google შეფასებების სინქი" card.

The Places API caps at 5 most-relevant reviews per request and does not let
us paginate. For the full review history, the clinic owner needs to grant
OAuth access to a Google Cloud OAuth client with `business.manage` scope —
that path uses the Business Profile API and is a separate piece of work
(~4 hours including the OAuth dance).

### Cost

Places API "Place Details (Advanced)" SKU bills per request. The dashboard
button is manual, so cost stays trivial unless someone calls the
`/api/sync-google-reviews` route programmatically.

## Hardening before clinic handover

Things to change **before** giving the clinic access:

1. **Admin password** — `111111` is unacceptable for real use
   - In Payload admin → Users → admin@admin.ge → set strong password
   - Or create a fresh admin user with the clinic's email
2. **`PAYLOAD_SECRET`** in Vercel env — regenerate (32-byte hex)
3. **Disable demo kill-switch** when going to real production
   - `vercel env rm BOOKING_SUBMIT_DISABLED production` → real bookings hit Doctra
4. **`push: true`** in `payload.config.ts:40` should become `push: false` for
   real production, with proper migrations. Demo uses `push: true` for speed.
5. **Admin email/access** — clinic admin staff should have their own
   accounts, not the shared `admin@admin.ge`

### 2FA / TOTP

TOTP-based two-factor auth is **already wired in** via the `payload-totp`
plugin (see `src/payload.config.ts`). Configuration:

- `collection: 'users'` — applies to all admin users
- `forceSetup: true` — every admin must scan a QR with an authenticator app
  (Google Authenticator / Authy / 1Password / Microsoft Authenticator) on
  their first login; subsequent logins prompt for a 6-digit code
- `issuer: 'Khozrevanidze Clinic'` — shown in the authenticator app

To disable temporarily (e.g. during seeding scripts), set
`TOTP_DISABLED=true` in the environment. Do **not** ship to production with
this set.

Recovery: if a clinic admin loses their authenticator device, another
admin can reset the user's TOTP via the admin panel (Users collection →
clear the `totp` field). For the very last admin, run a one-time DB
update: `UPDATE users SET totp_secret = NULL, totp_uri = NULL WHERE
email = '...'`.

## cPanel deployment summary

Full runbook in [`docs/cpanel-deploy.md`](cpanel-deploy.md). High level:

1. cPanel must have Node.js 20+ ("Setup Node.js App" feature)
2. Upload code (everything except `node_modules`, `.env`, `.vercel`,
   `.next`)
3. `npm ci --omit=dev` on the server
4. Configure Node.js App: startup `node_modules/.bin/next`, mode
   production
5. Env vars: `DATABASE_TYPE=sqlite`, `DATABASE_URL=file:./database.sqlite`,
   fresh `PAYLOAD_SECRET`, Doctra credentials, `NODE_ENV=production`
6. Start app → Payload creates `database.sqlite` + schema on first boot
7. Bootstrap admin via `POST /api/users/first-register`
8. Trigger Doctra import via the dashboard sync button
9. Point `khozrevanidze.ge` DNS to the cPanel server
10. cPanel AutoSSL handles HTTPS

## Known gotchas

- **`push: true` doesn't run in Vercel serverless production.** If you
  add a new schema field while staying on Vercel, the column won't be
  created automatically. Use `psql` on Neon to `ALTER TABLE ADD COLUMN`,
  or generate Payload migrations.
- **Payload's `id` field on localized arrays must be preserved when
  patching across locales** — without it, the entire array gets
  replaced and other locales lose their text. The scripts in `scripts/`
  handle this correctly; if you write new ones, follow the same pattern.
- **Photo uploads must be <4.5MB raw** because of Vercel's function body
  limit. The upload scripts auto-resize to 1600px max edge at JPEG 85%.
- **MD/PhD belong in `qualifications`, not the `name`** — earlier
  doctors had `"MD, PHD"` glued to their name field; fixed in commit
  `864803f`.

## Repo structure quick reference

```
src/
├── app/
│   ├── (frontend)/[locale]/      → public site (GE/EN/RU)
│   ├── (payload)/admin/          → Payload admin shell
│   └── api/
│       ├── booking/              → timeslots, services, all-doctors, submit
│       └── import-doctra/        → Doctra sync endpoint
├── collections/                  → Payload collections (Doctors, Services, etc.)
├── globals/                      → Payload globals (HomePage, SiteSettings, etc.)
├── components/
│   ├── admin/                    → custom admin UI (sync card, dashboard, etc.)
│   ├── booking/                  → booking wizard
│   ├── doctors/                  → doctor list + profile
│   └── home/                     → homepage sections (hero, services, etc.)
├── lib/
│   ├── doctra-api.ts             → Doctra REST client
│   ├── payload-data.ts           → server-side data fetchers (getDoctors, etc.)
│   └── data.ts                   → fallback static data (mostly unused now)
└── messages/{ge,en,ru}.json      → next-intl translations

docs/
├── HANDOVER.md                   → this file
├── demo-walkthrough.md           → 10-min customer demo script
├── admin-guide-ge.md             → Georgian admin guide for clinic staff
├── cpanel-deploy.md              → cPanel deployment runbook
├── booking-architecture.html     → booking flow / Doctra reference (EN)
└── booking-architecture-ge.html  → same, in Georgian

scripts/                          → operational scripts (translations, photos, cleanup)
translations/                     → JSON files used by apply scripts
```

## Contacts and credentials

- Doctra API: `http://31.146.167.162:9090/doctra/hs/portal_exchange/v1`
- Doctra user/pass: in Vercel env vars (`DOCTRA_USER`, `DOCTRA_PASSWORD`)
- Vercel project: `clinic` (linked under `.vercel/project.json`)
- Neon Postgres: configured via Vercel marketplace integration
- Vercel Blob store: `clinic-media` (auto-linked to project)

## Final checklist before pressing "ship to customer"

- [ ] Run through `docs/demo-walkthrough.md` once on the live site
- [ ] Have `docs/admin-guide-ge.md` printed or accessible during handover
- [ ] Send the clinic the photos-needed list (`translations/doctors-needing-photos.md` + `.csv`)
- [ ] Plan the password rotation + access provisioning for clinic staff
- [ ] Confirm cPanel host meets requirements before scheduling deploy date
