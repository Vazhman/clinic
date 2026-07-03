# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (Turbopack) at localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint (flat config, no args needed)
npm run seed         # Seed DB (dev server must be running): POSTs to /api/seed
```

No test framework is configured. There are no unit or integration tests.

## Architecture

**Khozrevanidze Clinic** — multilingual medical clinic website (khozrevanidze.ge) built with **Next.js 16**, **Payload CMS 3**, and **Postgres**.

### Stack at a glance

| Layer | Tech |
|-------|------|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| CMS | Payload CMS 3.83 (Lexical editor) |
| Database | Postgres via `@payloadcms/db-postgres` (configured in `src/payload.config.ts`) |
| Styling | Tailwind CSS 4, Framer Motion, Three.js / R3F |
| i18n | next-intl 4 — locales: `ge` (default), `en`, `ru` |
| Forms | React Hook Form + Zod 4 |
| Images | Sharp (thumbnail 400x300, card 768x512, hero 1400w) |

### Route structure

The App Router uses two **route groups**:

- `src/app/(frontend)/[locale]/` — public site. Every page is under a mandatory locale prefix (`/ge/`, `/en/`, `/ru/`). Pages: home, about, services, doctors, blog, booking, checkups, contact, health-library, and CMS-managed dynamic pages (`pages/[slug]`).
- `src/app/(payload)/admin/` — Payload CMS admin panel and API.
- `src/app/api/` — custom API routes: `booking/{operators,timeslots,submit}` (SOAP/PHP proxy), `seed` (dev-only DB seed), `tts` (Google Translate / Google Cloud TTS proxy — Georgian requires `GOOGLE_TTS_API_KEY`).

### Content model (Payload CMS)

**Collections:** Media, Users, Services, Doctors, CheckupPackages, Reviews, News, Pages.
**Globals:** SiteSettings, HomePage, AboutPage, Navigation, Footer, ContactPage, BookingPage.

All collections and globals are localized (ge/en/ru).

- **Pages** (`src/collections/Pages.ts`) is a single Lexical `body` field. The previous 11-block builder (Hero/CTA/FAQ/Gallery/Stats/etc.) was removed in the Path B refactor (commit `b4d6bde`) — inline images, callouts, and galleries are inserted via the Lexical slash menu, sharing the project-wide editor config from `payload.config.ts`. `/pages/[slug]` renders via the shared `LexicalContent` component. The old `layout` JSON column is kept as a hidden field so `push:true` doesn't drop existing data; `src/blocks/` and the per-block renderers in `src/components/pages/` are gone.
- **Navigation** (`src/globals/Navigation.ts`) is no longer a free-form array. It exposes seven fixed route groups — home / about / services / doctors / checkups / blog / contact — each with `enabled` / `label` / `order`, plus a CTA button. New menu links are added by toggling `showInNav` (+ optional `navOrder`, `navLabel`) on a Page; `getNavigation` in `src/lib/payload-data.ts` merges the route groups (with next-intl fallback for empty labels) and auto-included Pages into the legacy `mainMenu` shape that `Header.tsx` already consumes. The old free-form `mainMenu` array is kept hidden for push safety.
- **Stats** (patients / doctors / operations / experience) live on `HomePage` now. `getStats()` reads HomePage first, then falls back to the hidden `SiteSettings.stats` group for unmigrated rows.

Payload auto-generates types to `src/payload-types.ts`.

### i18n

- Config: `src/i18n/config.ts` (locales array), `src/i18n/routing.ts` (always-prefix strategy).
- Middleware: `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`) — intercepts all non-API/admin requests for locale routing. Matcher excludes `/api`, `/admin`, `/_next`, `/_vercel`, `/media`, and static files.
- Translation files: `src/messages/{ge,en,ru}.json`.
- Payload admin UI has a custom Georgian translation in `src/i18n/payload-ka.ts`.

### Booking system

A **5-step wizard** (`src/components/booking/BookingWizard.tsx`) proxied through Next.js API routes to a legacy SOAP/PHP backend:

```
Browser → /api/booking/{operators,timeslots,submit} → khozrevanidze.ge/wp-content/.../booking/*.php → HIS (SOAP)
```

The service catalogue with SOAP UUIDs lives in `src/lib/booking-data.ts`. API responses are HTML — parsed with regex in the route handlers.

### Data access patterns

- **CMS data:** `src/lib/payload-data.ts` — server-side helpers (`getServices`, `getDoctors`, `getCheckupPackages`, etc.) that call `getPayload()` directly. Many include fallback logic that merges CMS data with legacy seed data from `src/lib/data.ts` for fields not yet populated.
- **SEO:** `src/lib/structured-data.ts` generates JSON-LD. Dynamic sitemap in `src/app/sitemap.ts`. Per-collection SEO fields defined in `src/fields/seo.ts`.
- **Dynamic pages:** `src/lib/payload-pages.ts` handles CMS-managed page generation.

### 3D anatomy model

The Health Library page renders an interactive 3D anatomy viewer (`src/components/health-library/AnatomyViewer3D.tsx`) that loads `public/models/organs.glb`. The model is derived from **Z-Anatomy** (CC BY-SA 4.0) / **BodyParts3D**. Source `.blend` files and the Python export pipeline live in `blender-work/` — see **`blender-work/ANATOMY_MODEL.md`** for what we have, the source/attribution, the export chain, and the re-export checklist. Read that file before modifying the model or the viewer's region matcher.

### Path aliases

- `@/*` → `./src/*`
- `@payload-config` → `./src/payload.config.ts`

### Design tokens (Tailwind)

Primary palette: **blackberry** (`#682149`), **pink** (`#DD64A6`), **grey** (`#3D3D3D`), **cream** (`#FAFAF8`). Font: FiraGO (WOFF2 in `public/fonts/`). Custom animations in `src/app/globals.css` (fade-up, float, pulse-glow, shimmer).

### Environment variables

| Var | Default | Purpose |
|-----|---------|---------|
| `PAYLOAD_SECRET` | `'default-secret-change-me'` | CMS auth secret |
| `DATABASE_URL` | — | Postgres connection string (passed to `postgresAdapter` pool) |
| `GOOGLE_TTS_API_KEY` | — | Optional; enables Google Cloud TTS fallback for Georgian in `/api/tts` |
| `NODE_ENV` | — | Seeding disabled when `production`; Payload `push: true` (auto-sync schema) disabled when `production` |

### Deploying & CMS schema changes (READ BEFORE adding/changing Payload fields)

The Vercel project has **no Git integration** — deploy with `vercel deploy --prod`.
Payload `push: true` is a **no-op on Vercel serverless prod** (and the local
interactive push is unreliable), so the Neon production schema does NOT update
itself. Every breakage to date came from this.

- **Code-only change** (components, pages, styles, text): deploy freely; the CMS
  and its data are unaffected.
- **Payload field/collection change**: write an additive SQL migration
  (`scripts/neon-migrate-*.sql` has the conventions) and apply it to BOTH local
  Docker and Neon before/with the deploy. Three drift classes to cover:
  1. new field → new column/table (mirror drizzle conventions of sibling tables);
  2. field on a `versions: { drafts }` collection → ALSO add `version_<col>` to
     `_<collection>_v` (check: `scripts/_check-version-mirrors.mjs`);
  3. field no longer `required` → `DROP NOT NULL` on its column.
- **After every deploy**: `npm run verify:cms` — runs
  `scripts/cms-roundtrip-test.mjs` (authenticated sentinel write → public page →
  restore, all globals + key collections) and `scripts/admin-ui-test.mjs`
  (headless Chromium against `/admin`). Both must be green.

### Key conventions

- `next.config.ts` wraps config with both `withPayload()` and `withNextIntl()`.
- CMS admin components live in `src/components/admin/` and are referenced by string path (not import) in `payload.config.ts`.
- Collections use `push: true` for schema sync (no migration files).
- Commit messages follow `feat:` / `fix:` / `chore:` / `refactor:` prefixes.
