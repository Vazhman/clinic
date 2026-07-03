# cPanel Deployment Runbook

This runbook walks through deploying the Khozrevanidze clinic site from
the Vercel demo to the clinic's cPanel hosting with SQLite as the
database. The Vercel demo is unaffected — it stays on Postgres + Vercel
Blob, and serves `clinic-one-blush.vercel.app` until you point the
clinic's domain elsewhere.

## Prerequisites the cPanel host must provide

- **Node.js 20+** ("Setup Node.js App" feature in cPanel)
- **At least 512 MB RAM** allocated to the Node.js app (for `next build`
  and `next start`)
- **Persistent filesystem** (cPanel always has this — only an issue on
  serverless hosts)
- **SSL/HTTPS** via cPanel's AutoSSL or a paid cert
- **Access to set environment variables** for the Node.js app
- **Git or SCP/FTP** access to push the code

MySQL is NOT used. Payload doesn't support MySQL.

## Step 1 — Prepare the code

In the repo:

```bash
# Make sure you're on main with the latest deploy
git status   # should be clean
git pull
```

The code is already DB-adapter-switchable. `payload.config.ts` reads
`DATABASE_TYPE`. When set to `sqlite`, it uses the SQLite adapter; any
other value (or unset) keeps Postgres.

## Step 2 — Build locally OR on the server

Building on cPanel's Node.js feature is possible but slow. Easier to
build locally and upload `.next/` + everything else.

Local build (against SQLite, just to verify the path works):

```bash
DATABASE_TYPE=sqlite \
  DATABASE_URL='file:./database.sqlite' \
  PAYLOAD_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  DOCTRA_API_URL='http://31.146.167.162:9090/doctra/hs/portal_exchange/v1' \
  DOCTRA_USER='khozrevanidze' \
  DOCTRA_PASSWORD='#z8Q)v3h]d(hTt#p' \
  npm run build
```

This produces `.next/`.

## Step 3 — Upload to cPanel

Easiest path: zip everything except `node_modules/`, upload via cPanel
File Manager, unzip. Then run `npm ci --omit=dev` on the server to
install production deps (faster than bundling node_modules in the zip).

Files to ship:

- `.next/` (the build)
- `public/`
- `src/`
- `package.json`, `package-lock.json`
- `next.config.ts`, `tsconfig.json`
- `messages/` (next-intl JSON)

Files to NOT ship:

- `.env`, `.env.local` — set env vars via cPanel UI instead
- `.vercel/` — Vercel-specific
- `node_modules/` — install fresh on the server
- `translations/` — only the JSON files matter, only if you want the
  re-applicable translation pipeline (optional)
- `docker-compose.yml` — local dev only

## Step 4 — Configure the Node.js App in cPanel

In cPanel → **Setup Node.js App** → Create Application:

| Field | Value |
|---|---|
| Node.js version | 20 or higher (24 LTS is the current default for Next.js) |
| Application mode | Production |
| Application root | `/home/<user>/clinic` (or wherever you uploaded) |
| Application URL | `khozrevanidze.ge` |
| Application startup file | `node_modules/.bin/next` |
| Passenger log file | (auto) |

Click "Setup". cPanel creates an Application URL and a virtual env path.

## Step 5 — Environment variables

In the same cPanel page, add these env vars:

```
NODE_ENV=production
DATABASE_TYPE=sqlite
DATABASE_URL=file:/home/<user>/clinic/database.sqlite
PAYLOAD_SECRET=<random 32-byte hex — generate on your machine>
DOCTRA_API_URL=http://31.146.167.162:9090/doctra/hs/portal_exchange/v1
DOCTRA_USER=khozrevanidze
DOCTRA_PASSWORD="#z8Q)v3h]d(hTt#p"
# Leave BOOKING_SUBMIT_DISABLED unset → real bookings hit Doctra in prod.
# DO NOT set BLOB_READ_WRITE_TOKEN — Vercel Blob is unavailable. Without
# the token, the Blob plugin disables itself and uploads go to local disk.
```

## Step 6 — First-time startup

In the cPanel Node.js Application page, click **Start Application**.

Watch the Passenger log for errors. First boot:

1. Payload reads `DATABASE_TYPE=sqlite`, opens `database.sqlite` (creates
   the file if it doesn't exist).
2. With `push: true`, Payload syncs the schema — creates all tables.
3. Next.js starts serving on the Passenger port.

## Step 7 — Bootstrap the admin + data

Hit `https://khozrevanidze.ge/api/users/first-register` once to create
the admin user, then log in at `/admin` and trigger the Doctra import:

```bash
# 1. Create the first admin
curl -X POST https://khozrevanidze.ge/api/users/first-register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@khozrevanidze.ge","password":"<real-strong-password>","role":"admin","name":"Admin"}'

# Save the JWT from the response.

# 2. Run Doctra import (fetches 56 services + 146 doctors)
curl -X POST https://khozrevanidze.ge/api/import-doctra \
  -H "Authorization: JWT <JWT-FROM-STEP-1>"
```

After step 2, the booking page works.

## Step 8 — Media uploads

When admin uploads a doctor photo via Payload admin UI, the file goes to
`public/media/` (Payload's default `staticDir`). Backed up by cPanel's
file backups. Served via `/media/<filename>`.

## Step 9 — DNS

In your DNS provider, point `khozrevanidze.ge` A record at the cPanel
server's IP. cPanel's AutoSSL should provision a Let's Encrypt cert
within 24 hours.

## Backup strategy

cPanel has built-in scheduled backups. Configure to back up:

- `database.sqlite` (the entire DB in one file)
- `public/media/` (all uploaded images)
- The app code if you want a full restore

Backup frequency: daily for the DB, weekly for media + code.

## Going from Vercel demo data → real clinic data

The Vercel demo has 200 placeholder doctors with the stock photo. On
cPanel, you start fresh from the Doctra import. Real photos and bios are
admin's job through the Payload UI.

If you want to keep some of the demo content as a head start:

1. Export from Neon Postgres (`pg_dump`).
2. Convert to SQLite (e.g., via `pgloader` or a Python script).
3. Import on cPanel.

Probably not worth the complexity — easier to start clean.

## Reverting / disaster recovery

If a deploy bricks the site:

1. cPanel → Setup Node.js App → **Stop Application**
2. Restore previous code from cPanel backup
3. Restore previous `database.sqlite` from backup
4. **Start Application**

Total recovery time: minutes if you have current backups.

## Known gaps you'll hit eventually

- **`push: true` is unsafe in real prod.** It currently auto-syncs schema
  on every boot. For real prod, switch to migration files
  (`npx payload migrate:create` + `npx payload migrate`) and disable
  push. The migration files would live in `src/migrations/`.
- **SQLite has limited concurrency.** ~50 concurrent writes/sec ceiling.
  Clinic-scale traffic won't hit this, but bulk import operations can
  briefly lock the DB.
- **No real-time replication.** SQLite is single-file, no replica. If
  the file gets corrupted (rare but possible), restore from backup.
