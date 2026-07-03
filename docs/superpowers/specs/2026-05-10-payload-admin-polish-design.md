# Payload admin polish — design

**Status:** approved (brainstorming pass)
**Date:** 2026-05-10
**Scope:** Polished demo-ready admin overhaul

## Goals

After running the Doctra import we have ~146 doctors with no photos and ~73 with placeholder specialties. The current Payload admin makes those gaps invisible and gives non-technical clinic staff no way to refresh data from Doctra. This work makes the admin demo-ready by fixing the daily-use rough edges.

Concretely:

1. Admin can re-sync Doctra → Payload by clicking a button (no curl/JWT).
2. Admin can see at a glance which doctors are missing data and jump straight to fix them.
3. Admin can edit a doctor's profile without scrolling through 17 unrelated fields.
4. Admin can verify changes by clicking through to the live site from any doctor row.
5. Admin can curate which reviews appear on the public site.
6. The dashboard and login page look brand-aligned, not lorem-ipsum.

## Non-goals (deliberately deferred)

- **Pulling Google reviews automatically.** Needs Google Business Profile API + clinic-owner OAuth. Separate iteration once we have access. Curation toggle ships now so the table is ready when reviews arrive.
- **Bulk actions on doctors** (bulk-inactivate, bulk-publish reviews). Out of scope for this round.
- **Production schema migrations** (replacing `push: true`). Tracked separately as the "cPanel migration" workstream.
- **Doctor photo uploads from Doctra `picture` URL.** Per earlier decision, photos are admin-curated only.

## High-level architecture

Seven discrete pieces, all changes scoped to:

```
src/
├── app/api/import-doctra/route.ts      [touched — also writes lastDoctraSync]
├── collections/
│   ├── Doctors.ts                       [restructured into tabs]
│   └── Reviews.ts                       [+ published field]
├── components/admin/
│   ├── Dashboard.tsx                    [redesigned]
│   ├── DoctraSyncCard.tsx               [NEW]
│   ├── NeedsAttentionCard.tsx           [NEW]
│   ├── DoctorListFilters.tsx            [NEW — chip filters]
│   ├── DoctorRowActions.tsx             [NEW — "view live" link column]
│   ├── BeforeLogin.tsx                  [polished]
│   └── icons/                           [NEW — inline SVG components]
├── globals/SiteSettings.ts             [+ lastDoctraSync field]
└── lib/payload-data.ts                  [getReviews filters published=true]
```

No new dependencies. All custom admin components remain inline-styled (Payload admin doesn't load Tailwind), but with shared color/spacing constants pulled into a small `src/components/admin/tokens.ts` module so the blackberry/pink palette stays consistent.

---

## 1. Sync from Doctra (the showstopper)

### Component: `DoctraSyncCard.tsx`

Mounted at the top of `Dashboard.tsx` — first thing admin sees on login.

**State machine:**

```
idle ──[click]──→ running ──[201]──→ success ──[5s]──→ idle
                          ──[4xx/5xx]──→ error ──[manual close]──→ idle
                          ──[fetch reject]──→ network-error ──→ idle
```

**Visual states:**

| State | Render |
|---|---|
| `idle` | Pink button "Doctra-დან სინქრონიზაცია" + meta line "ბოლო სინქრონი: 2 საათის წინ" |
| `running` | Spinner + "მიმდინარეობს..." + step label that updates as the endpoint progresses |
| `success` | Green card "✓ N ახალი ექიმი, M ახალი სერვისი დაემატა" + small "View errors (k)" disclosure if `errors.length > 0` |
| `error` | Red card with the error string + "Try again" button |

The step label updates are best-effort. The endpoint currently doesn't stream progress, so we show indeterminate steps based on time elapsed:
- 0–2s: "ვითხოვ Doctra-ს განყოფილებებს..."
- 2–8s: "ვიღებ ექიმებს..."
- 8s+: "ვწერ Payload-ში..."

If we later want real progress, the endpoint can be converted to SSE — out of scope here.

### Endpoint change: `src/app/api/import-doctra/route.ts`

After the existing summary block runs, write the timestamp:

```ts
await payload.updateGlobal({
  slug: 'site-settings',
  data: { lastDoctraSync: new Date().toISOString() },
})
```

Wrapped in its own try/catch so a global-write failure doesn't fail the whole import (just logs).

### Schema change: `SiteSettings`

Add one field:

```ts
{
  name: 'lastDoctraSync',
  type: 'date',
  admin: { position: 'sidebar', readOnly: true, hidden: true },
  // hidden from the global form because it's mechanical;
  // surfaced via the dashboard card instead
}
```

### Data flow

```
Dashboard mounts
  ↓
beforeDashboard server component reads SiteSettings.lastDoctraSync
  ↓
Renders DoctraSyncCard with `lastSyncedAt` prop (server-side, cache-friendly)
  ↓
[user clicks "Sync"]
  ↓
fetch('/api/import-doctra', { method: 'POST', credentials: 'include' })
  ↓
Endpoint: pulls Doctra → upserts Payload → writes lastDoctraSync → returns summary
  ↓
Card re-renders with summary; on close, navigates to router.refresh() to reload lastSyncedAt
```

### Error handling

| Failure | Surface |
|---|---|
| Doctra auth fails (no creds in env) | Red card: "Doctra-სთან კავშირი ვერ მოხერხდა" + the underlying error text |
| Doctra times out | Red card after 60s: "Doctra აღარ პასუხობს" |
| Per-doctor validation errors | Card shows green primary outcome but expandable "View N errors" with each error row |
| User isn't admin | 401 from endpoint → red card: "უფლებები არასაკმარისია" (shouldn't happen since they're already in /admin) |

### Last-synced display

Relative timestamp using `Intl.RelativeTimeFormat` with `ka` locale:
- `< 60s` → "ახლახანს"
- `< 1h` → "X წუთის წინ"
- `< 24h` → "X საათის წინ"
- `< 7d` → "X დღის წინ"
- otherwise → absolute date "5 მაისი 2026"

Never synced: "ჯერ არ არის სინქრონიზებული".

---

## 2. "Needs attention" surface

Two surfaces, same data:

### A. Dashboard card: `NeedsAttentionCard.tsx`

Three tiles in a row, mounted between sync card and stats grid:

```
┌─ 🖼 ფოტო აკლია ─────┐  ┌─ ✏️ სპეციალობა ─┐  ┌─ 🔇 დამალული ─┐
│       146           │  │       73         │  │       0       │
│ → იხილე ექიმები     │  │ → იხილე ექიმები │  │ → იხილე       │
└─────────────────────┘  └─────────────────┘  └───────────────┘
```

Counts shown are illustrative — the actual numbers are fetched live each render. Right after the initial Doctra import all 146 imported doctors lack photos and ~73 have placeholder specialty `—`; once admin starts curating, the counts drop and the tiles turn green when zero.

Each tile is a deep link with pre-applied where-filter:

| Tile | URL |
|---|---|
| No photo | `/admin/collections/doctors?where[and][0][photo][exists]=false` |
| Placeholder specialty | `/admin/collections/doctors?where[and][0][specialty][equals]=—` |
| Hidden (inactive) | `/admin/collections/doctors?where[and][0][inactive][equals]=true` |

Counts come from three `payload.find({ collection: 'doctors', where, limit: 0 })` calls, run server-side as part of the dashboard data load (not 3 client fetches).

Tile turns green ("✓ ყველაფერი წესრიგშია") when count is 0.

### B. List view filter chips: `DoctorListFilters.tsx`

Mounted via `admin.components.beforeListTable` on the doctors collection. Renders four chip buttons:

```
[ ყველა (146) ]  [ ფოტო აკლია (146) ]  [ სპეციალობა (73) ]  [ დამალული (0) ]
```

Clicking a chip applies the same where-filter via Payload's URL search params (Payload list view re-reads URL state). Chip is "active" (filled blackberry) when its filter is in the URL.

This piggybacks on Payload's existing list filter machinery — we don't fork the table.

---

## 3. Doctors edit form — tabs

`Doctors.ts` is restructured to use a `tabs` field as the top-level field. Existing fields move into the appropriate tab. Sidebar fields stay in the sidebar.

### New structure

```ts
fields: [
  // sidebar fields stay top-level so Payload places them in the sidebar
  { name: 'slug', ... },
  { name: 'doctraId', ... },
  { name: 'doctraBranchId', ... },
  { name: 'inactive', ... },
  { name: 'lastUpdated', ... },

  // main column becomes a single tabs field
  {
    type: 'tabs',
    tabs: [
      {
        label: 'იდენტობა',
        fields: ['name', 'photo'],
      },
      {
        label: 'პროფილი',
        fields: [
          'specialty',
          'biography',
          'qualifications',
          'specializations',
          'experienceYears',
          'languagesSpoken',
          'isDepartmentHead',
        ],
      },
      {
        label: 'Doctra',
        description: 'Doctra-სთან კავშირის ველები. ჩვეულებრივ არ რედაქტირდება.',
        fields: [
          // read-only display of doctraId/doctraBranchId for context
          // (the actual fields stay in sidebar, but we surface them here too)
        ],
      },
      {
        label: 'SEO',
        fields: [...seoFields.fields],
      },
    ],
  },
]
```

The Doctra tab is informational — fields are duplicated as `admin.readOnly` displays so admin can see "this doctor is linked to Doctra ID X" without leaving the tab they're in. The sidebar still has the editable copies.

### Tab order rationale

1. **Identity first** — name + photo are the 90% case after import
2. **Profile** — actual editorial content
3. **Doctra** — diagnostic/reference, rarely touched
4. **SEO** — optional polish, last

### Migration

Pure config change, no data migration. `push: true` in dev applies it on next reload.

---

## 4. "View live" link

### List view column: `DoctorRowActions.tsx`

Adds a custom column at the right edge of the doctors list. Renders an external-link icon. `target="_blank"`, `rel="noopener noreferrer"`.

URL: `/${defaultLocale}/doctors/${slug}` — uses Georgian by default since clinic admin is Georgian-first.

If `inactive === true`, the icon is dimmed and the link is `aria-disabled` (the row exists but isn't reachable on the public site, so opening it would 404).

### Edit form button

Top-right of the edit form, opposite the "Save" button. Same URL, same target. Plain text button styled as a tertiary action: "საიტზე ნახვა ↗".

Mounted via `admin.components.edit.beforeDocumentControls` on `Doctors.ts`.

---

## 5. Reviews curation

### Schema change: `Reviews.ts`

Add one field:

```ts
{
  name: 'published',
  type: 'checkbox',
  defaultValue: true,
  admin: {
    position: 'sidebar',
    description: 'მონიშნულია — ჩანს საიტზე. გაუქმებულია — დამალულია.',
  },
}
```

`defaultValue: true` so existing rows aren't suddenly hidden after the migration.

### Default columns update

```ts
defaultColumns: ['author', 'rating', 'published', 'source', 'date']
```

`published` between rating and source so the toggle is visible without scrolling. Payload renders booleans as inline-editable checkboxes by default — admin can toggle right from the list.

### Frontend filter: `src/lib/payload-data.ts`

The `getReviews` helper already exists; modify the where clause:

```ts
where: { published: { equals: true } }
```

As part of implementation, grep for every call site that reads from the `reviews` collection (`payload.find({ collection: 'reviews' })` patterns plus the `getReviews`-style helper) and apply the same filter. Single source of truth: a private helper `where: { published: { equals: true } }` reused by all read paths.

---

## 6. Dashboard visual refresh

### Color token consolidation

New file `src/components/admin/tokens.ts`:

```ts
export const colors = {
  blackberry: '#682149',
  blackberryDark: '#4A1735',
  pink: '#DD64A6',
  pinkSoft: '#FDF4F9',
  cream: '#FAFAF8',
  greyBorder: '#E4E4E4',
  greyText: '#6E6E6E',
  greenSuccess: '#2F9E6B',
  amberWarn: '#C58A23',
  redError: '#C84444',
}

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
}

export const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
}
```

Imported by every admin component. Replaces hard-coded hex `#6B1D4A` / `#E84B8A` etc.

### Icon system

New folder `src/components/admin/icons/` with simple inline SVG components:

```
icons/
├── DoctorIcon.tsx        (replaces 👨‍⚕️)
├── ServiceIcon.tsx       (replaces 🏥)
├── NewsIcon.tsx          (replaces 📰)
├── PageIcon.tsx          (replaces 📄)
├── ReviewIcon.tsx        (replaces ⭐)
├── CheckupIcon.tsx       (replaces ✅)
├── SyncIcon.tsx          (new)
├── PhotoMissingIcon.tsx  (new)
├── ExternalLinkIcon.tsx  (new)
└── index.ts
```

Each is ~10 lines: a stateless function returning a `<svg>` with consistent props (`width`, `height`, `stroke`, `strokeWidth: 1.5`). Lucide-aesthetic but hand-rolled to avoid the dep.

### Layout reorg

```
┌─────────────────────────────────────────────┐
│ Welcome banner (compact, blackberry gradient)│
├─────────────────────────────────────────────┤
│ Doctra sync card                             │
├─────────────────────────────────────────────┤
│ Needs attention (3 tiles)                    │
├──────────────────┬──────────────────────────┤
│ Stats list       │ Quick actions             │
│ (6 items)        │ (4 items + view-site)     │
└──────────────────┴──────────────────────────┘
```

### Server-side stats

Currently `Dashboard.tsx` does 6 parallel `fetch('/api/.../?limit=0')` on mount. Replace with a server component (`Dashboard.tsx` becomes a server component, hands props to a small client component for the few interactive bits — the sync card and needs-attention card stay as their own client components since they have state).

Server-side approach: one `getPayload({ config })` call at the top, then 6 parallel `payload.find({ collection: X, limit: 0 })` calls plus the 3 needs-attention queries plus the SiteSettings read. ~50ms total, all data ready on first paint.

**Cache discipline:** the dashboard server component must run dynamic per request — both `lastDoctraSync` (changes on every import) and the needs-attention counts (change as admin edits doctors) need to be fresh. Achieved by either calling a non-cached path (Payload's local API isn't auto-cached) or marking the parent route segment dynamic. No `unstable_cache` wrapping.

---

## 7. Login page polish

### `BeforeLogin.tsx` redesign

Currently: a single gray "ადმინისტრაციული პანელი" caption.

New layout (still inside Payload's login wrapper, doesn't replace the form):

```
┌──────────────────────────────────────┐
│        [logo, 80px tall]             │
│                                      │
│  ხოზრევანიძის კლინიკა                │
│  ადმინისტრაციული პანელი              │
│                                      │
│  ─────────────────────────────────   │
│                                      │
│  [Payload's email/password form]     │
│                                      │
│  ─────────────────────────────────   │
│                                      │
│  📞 (+995) 422 22 71 71              │
│  🌐 khozrevanidze.ge ↗               │
└──────────────────────────────────────┘
```

The bottom contact strip is rendered via Payload's `afterLogin` slot (also a custom component slot, not currently used).

### Background

Cream → soft-pink gradient applied to the whole login route via a small CSS injection in the admin's custom CSS file (Payload supports `admin.css` path). This is the only place we touch global admin CSS.

---

## Data model summary

| Collection / Global | Field added | Type | Default |
|---|---|---|---|
| `SiteSettings` | `lastDoctraSync` | date | null |
| `Reviews` | `published` | checkbox | `true` |

No other schema changes. No data migrations needed (default values handle existing rows).

`Doctors.ts` field structure changes (tabs) but no field is added/removed/renamed — purely cosmetic in the admin UI.

---

## Error handling principles

- **Sync card** — every error path produces a visible card with Georgian text. No silent failures.
- **Needs-attention counts** — if any of the 3 `payload.find` calls fails, that tile shows "—" and the others render normally. Don't block the whole dashboard.
- **List filter chips** — failures fall back to the unfiltered list. The chip just doesn't activate.
- **"View live" link** — if `slug` is missing on a row (shouldn't happen, but Doctra import seeds slug from doctraId, so theoretically possible), the icon is hidden, not broken.
- **Reviews `published` filter** — defaults to `true`, so a missing field reads as "show on site". Backwards-compatible with any pre-migration row that lacks the field.

---

## Testing approach

This project has no test framework. Verification is manual against the running dev environment we set up earlier (`docker compose --env-file .env.local up -d postgres` + `npm run dev`).

**Manual verification checklist** (will be in the implementation plan):

1. Sync card visible on first load; click triggers import; success card renders
2. Click "View errors" disclosure expands the error list
3. Force a Doctra failure (set bad password in `.env.local`) → red error card
4. Needs-attention tiles show correct counts (cross-check with raw Postgres queries)
5. Each tile's deep link applies the right filter
6. Doctors collection list shows the 4 chip filters; clicking each filters correctly
7. Doctor edit form opens on Identity tab by default; switching tabs works; Save preserves all fields
8. "View live" icon on each row opens the right URL; dimmed on inactive rows
9. Reviews list shows `published` column; toggling it from list view persists
10. `getReviews` on the public site only returns `published: true` rows
11. Login page renders the new layout; gradient applied; contact links work
12. All 10 emoji icons replaced with SVGs; no rendering inconsistencies between Chrome/Firefox/Safari

---

## Out of scope (logged for later)

- Google reviews API integration
- Doctor bulk-actions
- Production schema migrations (replacing `push: true`)
- Doctor photo auto-upload from Doctra `picture` URL (admin curates)
- Activity log / audit trail
- Multi-language admin UI (currently Georgian-only with some English Payload built-ins; out of scope to fully translate Payload itself)
- Role-based permissions on the sync button (currently any admin can trigger; no editor/admin distinction)
