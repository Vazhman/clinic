# Demo content seeding (news + lab tests)

Populates the **News** and **Lab Tests** collections with ready-made,
trilingual (ge / en / ru) demo content so the Vercel deployment looks complete:

- **15 news articles** adapted from the live khozrevanidze.ge news archive
  (`allnews.php`), across all four categories. Each pulls its **real image**
  from khozrevanidze.ge at seed time (with a branded placeholder fallback). Six
  are flagged for the homepage.
- **15 lab tests** — the common tests Georgian clinics offer (CBC, glucose,
  HbA1c, lipid profile, liver panel, TSH, vitamin D, B12, urinalysis, CRP,
  ferritin, coagulation, HPV PCR, H. pylori, PSA) — each written Mayo-Clinic
  style (overview / why it's done / preparation / what to expect /
  interpretation) and cross-linked to related tests.

Source content lives in `src/lib/demo-seed/`; the seeder is the
`POST /api/seed-demo` route.

> This is **complementary** to `POST /api/seed`, which seeds services, doctors,
> checkup packages and reviews. Run that one too if the target DB doesn't have
> them yet (see step 4).

---

## Why it's run from a local dev server (not a button on the live site)

On Vercel `NODE_ENV=production`, and in that mode Payload's schema auto-sync
(`push`) is **disabled** — which is why new tables are normally added to Neon by
hand (`scripts/create-*-table.mjs`). The `lab_tests` tables don't exist on Neon
yet.

Running the seeder from a **local dev server pointed at the production
database** sidesteps that: `next dev` runs with `NODE_ENV=development`, so on
boot Payload's own `push` creates the missing `lab_tests` tables on Neon (no
hand-written DDL), and then the route inserts the content. Images upload to the
same Vercel Blob store, so they appear on the live site immediately.

Any method of writing to the demo DB needs its connection string at least once —
there's no way to modify it without that. This is the least error-prone way.

---

## Steps

### 1. Install dependencies (once, after pulling)

```bash
npm install
```

The chat-assistant commit added packages (`ai`, `@ai-sdk/*`, `@puckeditor/core`,
…). Without this, every frontend page 500s with "Module not found".

### 2. Point your local env at the Vercel/Neon database

Easiest — pull the deployment's env vars (this overwrites `.env.local`, so back
it up first):

```bash
cp .env.local .env.local.bak        # keep your local settings
vercel link                          # once, if not linked
vercel env pull .env.local           # writes DATABASE_URL + BLOB_READ_WRITE_TOKEN
```

Or manually copy **`DATABASE_URL`** and **`BLOB_READ_WRITE_TOKEN`** from the
Vercel dashboard (Project → Settings → Environment Variables) into `.env.local`.

> `DATABASE_URL` → the seed writes to the demo DB.
> `BLOB_READ_WRITE_TOKEN` → news images upload to the same Blob store the live
> site reads from. Without it, images save to local disk and won't show on
> Vercel.

### 3. Start the dev server and run the seed

```bash
npm run dev          # boots against Neon; push creates the lab_tests tables
```

In a second terminal:

```bash
npm run seed:demo    # POSTs to http://localhost:3000/api/seed-demo
```

Expected response:

```json
{ "message": "Demo seed complete.",
  "news": { "created": 15, "skipped": 0 },
  "labTests": { "created": 15, "skipped": 0 },
  "placeholderImages": 0 }
```

It's **idempotent** — existing slugs are skipped, so re-running is safe.

### 4. (Optional) seed the base content too

If services / doctors / checkups / reviews aren't on the DB yet, with the dev
server still pointed at Neon:

```bash
npm run seed         # POSTs to /api/seed
```

### 5. Verify on the live site

- Lab tests: `https://<your-site>/ge/lab-tests` (→ `/ge/analizebi`)
- News: `https://<your-site>/ge/blog` (→ `/ge/siaxleebi`)
- Switch the language to `en` / `ru` to confirm translations.

### 6. Restore your local env

```bash
mv .env.local.bak .env.local         # back to your local Postgres
```

---

## Enabling the AI chat (you do this)

The floating chat widget calls Gemini. Add **`GEMINI_API_KEY`** in Vercel
(Project → Settings → Environment Variables) and redeploy. Get a free key at
<https://aistudio.google.com/apikey>. Until then the chat button renders but
sending a message returns an error — nothing else on the site is affected.

---

## Notes

- **Auth on the deployed route.** Hitting `POST /api/seed-demo` on the live
  (production) URL requires a matching `SEED_TOKEN` env var, passed as the
  `x-seed-token` header or `?token=`. Locally (`next dev`) it's open for
  convenience. You normally won't need the production route — seeding is done
  from the local dev server per the steps above.
- **Schema push is additive.** Pointing local dev at Neon syncs schema on boot;
  for this branch that's only the new `lab_tests` tables (and `news.puck_data`),
  all additive — no data loss.
- **Re-deploys.** `vercel.json` disables auto-deploy on `main`; deploy manually
  from the Vercel dashboard or CLI when ready.

---

## Patient Room — temporary demo redirect

For the demo, the header's **"Patient Room"** link points at our restyled login
page served statically from the app (`public/patient-room.html`) instead of the
clinic's live portal. This is a **visual preview only** — the page's login posts
to `api.php` / `lab.php`, which live on the clinic's PHP host, so a real login
won't complete on the Vercel domain.

- The link is controlled by `getPatientRoomUrl()` in `src/i18n/config.ts`.
- **To restore the real portal**, swap the return value back to
  `https://www.khozrevanidze.ge/myroom/?lang=${locale}` (the original line is
  kept commented right above it).
- The same page, for the clinic's IT to drop into the real `/myroom/`, is the
  hand-off package in `deliverables/myroom/` (`index.html` + `INSTALL.md`).
  `public/patient-room.html` is a copy of that file — keep them in sync if you
  edit one.
