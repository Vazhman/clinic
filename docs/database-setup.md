# Database setup — Postgres primary, SQLite fallback

This project runs on **PostgreSQL** as the primary database, with **SQLite** as a
zero-infrastructure fallback. The adapter is chosen at runtime from environment
variables — there is **no code change** to switch. See the `db:` block in
`src/payload.config.ts`.

Payload supports only Postgres, SQLite, and MongoDB. It has **no MySQL/MariaDB
adapter**, so on hosts that only offer MySQL/MariaDB (e.g. some cPanel plans) the
Postgres connection must point at an external managed Postgres (see below) — the
MySQL/MariaDB service on the host is simply not used.

## How the switch works

| Goal | Env vars |
|------|----------|
| **Postgres** (default) | `DATABASE_URL=postgres://…`  (leave `DATABASE_TYPE` unset) |
| **SQLite** (fallback)  | `DATABASE_TYPE=sqlite` + `DATABASE_URL=file:./database.sqlite` |

Logic (`payload.config.ts`): `DATABASE_TYPE === 'sqlite'` → SQLite adapter;
anything else (including unset) → Postgres adapter. So Postgres is the default
and SQLite is an explicit opt-in.

Both adapters run with `push: true` in this phase, so schema changes sync on
boot. Additive changes are safe; review any rename/remove before deploying.

## 1. Local development (Postgres via Docker)

```bash
npm run db:up          # start the postgres:17 container (docker-compose.yml)
# .env.local already points DATABASE_URL at localhost:5432 and leaves
# DATABASE_TYPE unset → Postgres.
npm run dev            # first boot pushes the schema into Postgres
```

Verify the schema was created:

```bash
docker exec -it clinic-postgres psql -U clinic -d clinic -c "\dt" | head
```

You should see Payload's tables (doctors, services, media, pages, …).

Stop / reset:

```bash
npm run db:down        # stop
npm run db:reset       # wipe volume + restart (drops all local data)
```

## 2. Production on cPanel (proservice.ge)

proservice provides the Postgres database. Run the app on cPanel's Node runtime
and point it at that Postgres.

### Required environment variables

| Var | Value | Why |
|-----|-------|-----|
| `DATABASE_URL` | `postgresql://USER:PASS@HOST:5432/DB` | provider-supplied |
| `DATABASE_SSL` | `true` | managed Postgres needs TLS but usually has a cert that fails strict verification; this enables TLS without cert-verify (see `payload.config.ts` pool block). If the provider is plain TCP with no TLS, leave unset. |
| `DATABASE_POOL_MAX` | `4` (or `5`) | caps connections **per Node process**. Shared Postgres often allows only ~20-25 total, and Passenger may spawn several app processes — keep the product under the cap. Also cap Passenger app instances to 1-2. |
| `PAYLOAD_DISABLE_PUSH` | `true` | **critical** — see migrations below |
| `PAYLOAD_SECRET` | 32-byte hex | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | `production` | gates the seed routes' 403 and the secret fail-fast |
| `DATABASE_TYPE` | *(unset)* | unset → Postgres |

### ⚠️ Schema: use migrations, NOT push (data-loss risk)

`push` (auto-sync schema on boot) is **disabled by Payload whenever
`NODE_ENV=production`** — so on the cPanel box it does nothing, and a fresh DB
would boot with **zero tables**. You must use migrations:

```bash
# 1. LOCALLY, with DATABASE_URL pointing at a dev DB, snapshot the schema:
npm run migrate:create          # writes SQL into src/migrations/ (commit these)

# 2. On the server, as a deploy step BEFORE `next start`:
npm run migrate                 # applies pending migrations to the prod DB
```

Set `PAYLOAD_DISABLE_PUSH=true` everywhere except a throwaway local dev DB. Never
run `npm run dev` (which can push) against the production database — an additive
change is survivable, but a rename/remove will **drop columns/tables**.

Also note: several page getters in `payload-data.ts` silently fall back to
hardcoded demo content on a DB error. So a missing-migration "no such column"
won't show an error — the live site just quietly reverts to stale demo data.
That makes running migrations before start a hard requirement, not a nicety.

This keeps you on Payload's officially supported adapter while the DB is the one
proservice provides.

## 3. Fallback to SQLite (no external DB)

If you'd rather not run/point at Postgres, flip to SQLite — a single file on the
cPanel persistent disk, no DB server:

1. Set env:
   - `DATABASE_TYPE=sqlite`
   - `DATABASE_URL=file:./database.sqlite`
2. Ensure the app's working directory is writable and on a persistent path so
   the `.sqlite` file survives redeploys.
3. Build and start. First boot creates the file and pushes the schema.

SQLite is a good fit for this read-heavy site; writes (admin edits) serialize,
which is fine at this scale. The two engines are interchangeable via env, so you
can start on SQLite and move to managed Postgres later (or vice-versa) — export
via Payload and re-import; the schema is generated the same way for both.

## Which to use

- **Primary:** Postgres (managed) — richest feature set, matches the Vercel deploy.
- **Instant fallback:** SQLite — set two env vars, no infrastructure.
- **MySQL/MariaDB:** not supported by Payload; do not attempt to use the cPanel
  MySQL service for this app.
