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

cPanel here provides only MySQL/MariaDB, which Payload can't use. Run the app on
cPanel's Node runtime and point it at a **managed Postgres** instead:

1. Create a free/managed Postgres (Neon, Supabase, or Railway). Copy its
   connection string (must allow SSL; append `?sslmode=require` if needed).
2. In cPanel → *Setup Node.js App* → Environment variables, set:
   - `DATABASE_URL=postgresql://USER:PASS@HOST/DB?sslmode=require`
   - (do **not** set `DATABASE_TYPE`)
   - `PAYLOAD_SECRET=<32-byte hex>` — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Build and start (`next build` then `next start`). First boot pushes the
   schema into the managed Postgres.

This keeps you on Payload's officially supported adapter while the DB lives off
the cPanel box.

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
