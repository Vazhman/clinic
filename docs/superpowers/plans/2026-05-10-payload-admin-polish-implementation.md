# Payload Admin Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Payload admin demo-ready by adding a Doctra sync button, surfacing data gaps after import, simplifying the doctor edit form, enabling reviews curation, and refreshing the dashboard + login page visuals — all while preserving Georgian-first UX for non-technical clinic staff.

**Architecture:** Payload 3 admin customization via the existing component-slot pattern (`payload.config.ts` references components by string path). All custom admin components are inline-styled (Payload's admin shell doesn't load Tailwind), with a shared `tokens.ts` module pulling color/spacing values into one place. Schema changes are minimal: one date field on `SiteSettings` (`lastDoctraSync`) and one boolean on `Reviews` (`published`). Defaults are picked so existing rows keep behaving as they do now (no data migration). Doctra import endpoint gains a single line that writes the timestamp after success.

**Tech Stack:** Next.js 16 (App Router, Turbopack), Payload CMS 3.83, Postgres (local: docker, prod: Neon), React 18, no test framework — manual verification against the running dev server. Spec: `docs/superpowers/specs/2026-05-10-payload-admin-polish-design.md`.

---

## File Structure

### New files (19)

| Path | Responsibility |
|---|---|
| `src/components/admin/tokens.ts` | Shared color/spacing/radii constants for all admin custom components |
| `src/components/admin/icons/SyncIcon.tsx` | Inline SVG: arrows-in-circle for the sync button |
| `src/components/admin/icons/DoctorIcon.tsx` | Inline SVG: stethoscope, replaces 👨‍⚕️ |
| `src/components/admin/icons/ServiceIcon.tsx` | Inline SVG: cross/heart, replaces 🏥 |
| `src/components/admin/icons/NewsIcon.tsx` | Inline SVG: newspaper, replaces 📰 |
| `src/components/admin/icons/PageIcon.tsx` | Inline SVG: document, replaces 📄 |
| `src/components/admin/icons/ReviewIcon.tsx` | Inline SVG: star, replaces ⭐ |
| `src/components/admin/icons/CheckupIcon.tsx` | Inline SVG: clipboard-check, replaces ✅ |
| `src/components/admin/icons/PhotoMissingIcon.tsx` | Inline SVG: image-with-question, for needs-attention tile |
| `src/components/admin/icons/SpecialtyIcon.tsx` | Inline SVG: pencil-edit, for needs-attention tile |
| `src/components/admin/icons/HiddenIcon.tsx` | Inline SVG: eye-off, for needs-attention tile |
| `src/components/admin/icons/ExternalLinkIcon.tsx` | Inline SVG: external-link arrow |
| `src/components/admin/icons/index.ts` | Barrel re-export |
| `src/components/admin/DoctraSyncCard.tsx` | Client component: button + state machine + summary display, calls `/api/import-doctra` |
| `src/components/admin/NeedsAttentionCard.tsx` | Client component: 3 tiles deep-linking to filtered doctor lists |
| `src/components/admin/DoctorListFilters.tsx` | Client component: chip filters mounted in `beforeListTable` of Doctors collection |
| `src/components/admin/DoctorRowActions.tsx` | List-view custom column: external-link icon → `/ge/doctors/[slug]` |
| `src/components/admin/DoctorViewLiveButton.tsx` | Edit-form button: same link, top of edit form |
| `src/components/admin/AfterLogin.tsx` | Login page contact strip (phone + site link) |

### Modified files (8)

| Path | What changes |
|---|---|
| `src/globals/SiteSettings.ts` | + `lastDoctraSync` field (date, hidden in admin form) |
| `src/collections/Reviews.ts` | + `published` checkbox (default true), `defaultColumns` updated |
| `src/collections/Doctors.ts` | Main column wrapped in `tabs` field (Identity / Profile / Doctra / SEO); wire `DoctorListFilters` to `beforeListTable`; wire `DoctorRowActions` and `DoctorViewLiveButton` |
| `src/app/api/import-doctra/route.ts` | Write `lastDoctraSync` to SiteSettings after success block |
| `src/lib/payload-data.ts` | `getReviews` filters `published: { equals: true }` |
| `src/components/admin/Dashboard.tsx` | Becomes server component; replaces emojis with SVG icons; integrates DoctraSyncCard + NeedsAttentionCard; uses tokens module |
| `src/components/admin/BeforeLogin.tsx` | Polished layout: tagline + clinic name + injected gradient style |
| `src/payload.config.ts` | Register `AfterLogin` component slot |

---

## Conventions for every task

- **Commit style:** `<type>(<scope>): <message>` — types: `feat`, `fix`, `chore`, `refactor`, `docs`. **No Claude attribution / no `Co-Authored-By` trailer.** Match the project's existing voice (`feat(booking):`, `fix(profile):`).
- **Verification approach:** This project has no test framework. Each task ends with a manual smoke step against the running dev server (`docker compose --env-file .env.local up -d postgres` + `npm run dev`). The dev server should already be running from earlier in the session.
- **Inline styles only** for components in `src/components/admin/`. Payload's admin shell does not load Tailwind. Pull all colors/spacing from `tokens.ts`.
- **`'use client'` directive** required for any component that uses `useState`, `useEffect`, or other client-side React features. Server components stay without the directive.
- **Schema sync:** `payload.config.ts` has `push: process.env.NODE_ENV !== 'production'` so schema changes apply on dev-server restart. After Tasks 3 and 14 (schema-touching), restart the dev server.

---

## Task 1: Create the admin tokens module

**Files:**
- Create: `src/components/admin/tokens.ts`

- [ ] **Step 1: Create the file**

```ts
// src/components/admin/tokens.ts

/**
 * Shared design tokens for all custom admin components.
 *
 * Payload admin doesn't load Tailwind, so admin custom components rely on
 * inline styles. Centralizing tokens here keeps the blackberry/pink palette
 * consistent across components and aligned with the public-site Tailwind
 * tokens (`tailwind.config.ts` blackberry: #682149, pink: #DD64A6).
 */

export const colors = {
  blackberry: '#682149',
  blackberryDark: '#4A1735',
  pink: '#DD64A6',
  pinkSoft: '#FDF4F9',
  pinkBorder: '#F7D6E7',
  cream: '#FAFAF8',
  white: '#FFFFFF',
  greyBorder: '#E4E4E4',
  greyText: '#6E6E6E',
  greyLightText: '#9CA3AF',
  greySubtle: '#F3F4F6',
  greenSuccess: '#2F9E6B',
  greenSuccessSoft: '#E5F7EE',
  amberWarn: '#C58A23',
  amberWarnSoft: '#FFF6E5',
  redError: '#C84444',
  redErrorSoft: '#FCE7E7',
} as const

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
} as const

export const radii = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
} as const

export const fontSizes = {
  xs: '11px',
  sm: '12px',
  md: '13px',
  lg: '15px',
  xl: '18px',
  xxl: '22px',
} as const
```

- [ ] **Step 2: Verify the file type-checks**

Run: `npx tsc --noEmit`
Expected: exit 0 (no new errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/tokens.ts
git commit -m "feat(admin): add shared design tokens module"
```

---

## Task 2: Create inline SVG icon components

Each icon is a stateless function returning a `<svg>`. Stroke-based, 24×24 viewBox, configurable size and color via props.

**Files:**
- Create: `src/components/admin/icons/SyncIcon.tsx`
- Create: `src/components/admin/icons/DoctorIcon.tsx`
- Create: `src/components/admin/icons/ServiceIcon.tsx`
- Create: `src/components/admin/icons/NewsIcon.tsx`
- Create: `src/components/admin/icons/PageIcon.tsx`
- Create: `src/components/admin/icons/ReviewIcon.tsx`
- Create: `src/components/admin/icons/CheckupIcon.tsx`
- Create: `src/components/admin/icons/PhotoMissingIcon.tsx`
- Create: `src/components/admin/icons/SpecialtyIcon.tsx`
- Create: `src/components/admin/icons/HiddenIcon.tsx`
- Create: `src/components/admin/icons/ExternalLinkIcon.tsx`
- Create: `src/components/admin/icons/index.ts`

- [ ] **Step 1: Create all icon files**

All icons share the same prop signature:

```ts
type IconProps = { size?: number; color?: string; strokeWidth?: number }
```

Each icon defaults to `size=18`, `color='currentColor'`, `strokeWidth=1.5`.

Create each file with the exact content below.

`src/components/admin/icons/SyncIcon.tsx`:
```tsx
import React from 'react'

export default function SyncIcon({ size = 18, color = 'currentColor', strokeWidth = 1.5 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}
```

`src/components/admin/icons/DoctorIcon.tsx`:
```tsx
import React from 'react'

export default function DoctorIcon({ size = 18, color = 'currentColor', strokeWidth = 1.5 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 2v2" /><path d="M5 2v2" /><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
      <path d="M8 15a6 6 0 0 0 12 0v-3" /><circle cx="20" cy="10" r="2" />
    </svg>
  )
}
```

`src/components/admin/icons/ServiceIcon.tsx`:
```tsx
import React from 'react'

export default function ServiceIcon({ size = 18, color = 'currentColor', strokeWidth = 1.5 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="M12 8v6" /><path d="M9 11h6" />
    </svg>
  )
}
```

`src/components/admin/icons/NewsIcon.tsx`:
```tsx
import React from 'react'

export default function NewsIcon({ size = 18, color = 'currentColor', strokeWidth = 1.5 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
    </svg>
  )
}
```

`src/components/admin/icons/PageIcon.tsx`:
```tsx
import React from 'react'

export default function PageIcon({ size = 18, color = 'currentColor', strokeWidth = 1.5 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  )
}
```

`src/components/admin/icons/ReviewIcon.tsx`:
```tsx
import React from 'react'

export default function ReviewIcon({ size = 18, color = 'currentColor', strokeWidth = 1.5 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
```

`src/components/admin/icons/CheckupIcon.tsx`:
```tsx
import React from 'react'

export default function CheckupIcon({ size = 18, color = 'currentColor', strokeWidth = 1.5 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  )
}
```

`src/components/admin/icons/PhotoMissingIcon.tsx`:
```tsx
import React from 'react'

export default function PhotoMissingIcon({ size = 18, color = 'currentColor', strokeWidth = 1.5 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-3.86-3.86a2 2 0 0 0-2.83 0L6 20" />
      <line x1="3" y1="3" x2="21" y2="21" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  )
}
```

`src/components/admin/icons/SpecialtyIcon.tsx`:
```tsx
import React from 'react'

export default function SpecialtyIcon({ size = 18, color = 'currentColor', strokeWidth = 1.5 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}
```

`src/components/admin/icons/HiddenIcon.tsx`:
```tsx
import React from 'react'

export default function HiddenIcon({ size = 18, color = 'currentColor', strokeWidth = 1.5 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}
```

`src/components/admin/icons/ExternalLinkIcon.tsx`:
```tsx
import React from 'react'

export default function ExternalLinkIcon({ size = 14, color = 'currentColor', strokeWidth = 1.5 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
```

`src/components/admin/icons/index.ts`:
```ts
export { default as SyncIcon } from './SyncIcon'
export { default as DoctorIcon } from './DoctorIcon'
export { default as ServiceIcon } from './ServiceIcon'
export { default as NewsIcon } from './NewsIcon'
export { default as PageIcon } from './PageIcon'
export { default as ReviewIcon } from './ReviewIcon'
export { default as CheckupIcon } from './CheckupIcon'
export { default as PhotoMissingIcon } from './PhotoMissingIcon'
export { default as SpecialtyIcon } from './SpecialtyIcon'
export { default as HiddenIcon } from './HiddenIcon'
export { default as ExternalLinkIcon } from './ExternalLinkIcon'
```

- [ ] **Step 2: Verify all files type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/icons
git commit -m "feat(admin): add inline SVG icon library"
```

---

## Task 3: Add `lastDoctraSync` field to SiteSettings

**Files:**
- Modify: `src/globals/SiteSettings.ts`

- [ ] **Step 1: Add the field**

Open `src/globals/SiteSettings.ts`. Inside the `fields` array, after the `contact` group (last existing field), add:

```ts
    {
      name: 'lastDoctraSync',
      type: 'date',
      admin: {
        hidden: true,
        readOnly: true,
        description: 'ბოლო Doctra სინქრონიზაციის დრო — ავტომატურად განახლდება იმპორტის შემდეგ',
      },
    },
```

The full updated `fields` array should be (illustrative, last item is the new one):

```ts
fields: [
  { name: 'stats', type: 'group', /* ... existing ... */ },
  { name: 'contact', type: 'group', /* ... existing ... */ },
  {
    name: 'lastDoctraSync',
    type: 'date',
    admin: {
      hidden: true,
      readOnly: true,
      description: 'ბოლო Doctra სინქრონიზაციის დრო — ავტომატურად განახლდება იმპორტის შემდეგ',
    },
  },
],
```

- [ ] **Step 2: Restart the dev server so `push: true` applies the column**

In the dev-server terminal: Ctrl-C, then `npm run dev` again.
Expected: server starts cleanly. Payload silently adds the `last_doctra_sync` column to the `site_settings` table.

- [ ] **Step 3: Verify the column exists in Postgres**

Run: `docker exec clinic-postgres psql -U clinic -d clinic -c "\d site_settings"`
Expected output includes a row with column name `last_doctra_sync` of type `timestamp(3) with time zone`.

- [ ] **Step 4: Commit**

```bash
git add src/globals/SiteSettings.ts
git commit -m "feat(cms): add lastDoctraSync field to SiteSettings"
```

---

## Task 4: Write `lastDoctraSync` from the import endpoint

**Files:**
- Modify: `src/app/api/import-doctra/route.ts`

- [ ] **Step 1: Add the timestamp write**

Open `src/app/api/import-doctra/route.ts`. The file currently ends with:

```ts
  return NextResponse.json({
    ok: true,
    triggeredBy: user.email,
    summary,
  });
}
```

Insert a write to SiteSettings just before the `return`. The full ending block becomes:

```ts
  // Persist last-synced timestamp on the SiteSettings global so the admin
  // dashboard can surface it. Best-effort — if this fails we still return the
  // import summary (the import itself succeeded).
  try {
    await payload.updateGlobal({
      slug: "site-settings",
      data: { lastDoctraSync: new Date().toISOString() } as never,
    });
  } catch (err) {
    console.error("Failed to update lastDoctraSync:", err);
  }

  return NextResponse.json({
    ok: true,
    triggeredBy: user.email,
    summary,
  });
}
```

- [ ] **Step 2: Trigger an import to verify**

Use the same admin token from earlier (or run `curl -X POST http://localhost:3000/api/users/first-register ...` if needed):

```bash
TOKEN="<your-jwt-from-earlier>"
curl -s -X POST http://localhost:3000/api/import-doctra -H "Authorization: JWT $TOKEN" | head -c 200
```

Expected: `{"ok":true,...}` (the existing summary response).

- [ ] **Step 3: Verify the timestamp was written**

Run: `docker exec clinic-postgres psql -U clinic -d clinic -c "SELECT last_doctra_sync FROM site_settings;"`
Expected: a recent timestamp (within the last minute).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/import-doctra/route.ts
git commit -m "feat(import): persist last-synced timestamp to SiteSettings"
```

---

## Task 5: Build the `DoctraSyncCard` component

**Files:**
- Create: `src/components/admin/DoctraSyncCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/admin/DoctraSyncCard.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { colors, spacing, radii, fontSizes } from './tokens'
import { SyncIcon } from './icons'

type ImportSummary = {
  services: { created: number; updated: number; skipped: number }
  doctors: { created: number; updated: number; skipped: number }
  errors: string[]
}

type State =
  | { status: 'idle' }
  | { status: 'running'; step: string }
  | { status: 'success'; summary: ImportSummary }
  | { status: 'error'; message: string }

function formatRelative(iso: string | null): string {
  if (!iso) return 'ჯერ არ არის სინქრონიზებული'
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'ახლახანს'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} წუთის წინ`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} საათის წინ`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} დღის წინ`
  return new Date(iso).toLocaleDateString('ka-GE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function DoctraSyncCard({ lastSyncedAt }: { lastSyncedAt: string | null }) {
  const router = useRouter()
  const [state, setState] = useState<State>({ status: 'idle' })
  const [showErrors, setShowErrors] = useState(false)
  // Re-render every 30s so the relative timestamp updates without a refresh
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  async function runSync() {
    setState({ status: 'running', step: 'ვითხოვ Doctra-ს განყოფილებებს...' })
    const t1 = setTimeout(() => setState((s) => (s.status === 'running' ? { status: 'running', step: 'ვიღებ ექიმებს...' } : s)), 2000)
    const t2 = setTimeout(() => setState((s) => (s.status === 'running' ? { status: 'running', step: 'ვწერ Payload-ში...' } : s)), 8000)
    try {
      const res = await fetch('/api/import-doctra', { method: 'POST', credentials: 'include' })
      clearTimeout(t1)
      clearTimeout(t2)
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setState({ status: 'error', message: data.error || `HTTP ${res.status}` })
        return
      }
      setState({ status: 'success', summary: data.summary })
      router.refresh()
    } catch (err) {
      clearTimeout(t1)
      clearTimeout(t2)
      setState({ status: 'error', message: (err as Error).message || 'ქსელის პრობლემა' })
    }
  }

  const cardBase: React.CSSProperties = {
    background: colors.white,
    border: `1px solid ${colors.greyBorder}`,
    borderRadius: radii.lg,
    padding: `${spacing.lg} ${spacing.xl}`,
    marginBottom: spacing.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    flexWrap: 'wrap',
  }

  if (state.status === 'running') {
    return (
      <div style={{ ...cardBase, borderColor: colors.pinkBorder, background: colors.pinkSoft }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <span style={{ display: 'inline-block', width: 18, height: 18, border: `2px solid ${colors.pink}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <div>
            <div style={{ fontWeight: 600, color: colors.blackberry, fontSize: fontSizes.md }}>{state.step}</div>
            <div style={{ fontSize: fontSizes.sm, color: colors.greyText, marginTop: 2 }}>5–15 წამი</div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (state.status === 'success') {
    const s = state.summary
    const total = s.doctors.created + s.doctors.updated + s.services.created + s.services.updated
    const hasErrors = s.errors.length > 0
    return (
      <div style={{ ...cardBase, borderColor: hasErrors ? colors.amberWarn : colors.greenSuccess, background: hasErrors ? colors.amberWarnSoft : colors.greenSuccessSoft }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: colors.blackberry, fontSize: fontSizes.md }}>
            ✓ სინქრონიზაცია დასრულდა
          </div>
          <div style={{ fontSize: fontSizes.sm, color: colors.greyText, marginTop: 4 }}>
            ექიმები: +{s.doctors.created} ახალი, {s.doctors.updated} განახლებული, {s.doctors.skipped} გამოტოვებული
            {' · '}
            სერვისები: +{s.services.created} ახალი, {s.services.updated} განახლებული
            {hasErrors && ` · ${s.errors.length} შეცდომა`}
          </div>
          {hasErrors && (
            <button onClick={() => setShowErrors((v) => !v)} style={{ marginTop: spacing.sm, background: 'transparent', border: 'none', color: colors.amberWarn, fontSize: fontSizes.sm, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              {showErrors ? 'დამალე შეცდომები' : `იხილე ${s.errors.length} შეცდომა`}
            </button>
          )}
          {showErrors && (
            <ul style={{ marginTop: spacing.sm, paddingLeft: spacing.lg, fontSize: fontSizes.xs, color: colors.greyText, maxHeight: 200, overflowY: 'auto' }}>
              {s.errors.map((e, i) => (<li key={i}>{e}</li>))}
            </ul>
          )}
        </div>
        <button onClick={() => setState({ status: 'idle' })} style={{ background: 'transparent', border: `1px solid ${colors.greyBorder}`, borderRadius: radii.md, padding: `${spacing.sm} ${spacing.md}`, fontSize: fontSizes.sm, cursor: 'pointer', color: colors.greyText }}>დახურვა</button>
        <div style={{ width: '100%', textAlign: 'right', fontSize: fontSizes.xs, color: total === 0 ? colors.greyLightText : colors.greenSuccess }}>
          {total === 0 && 'ბაზა უკვე განახლებული იყო'}
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div style={{ ...cardBase, borderColor: colors.redError, background: colors.redErrorSoft }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: colors.redError, fontSize: fontSizes.md }}>✗ სინქრონიზაცია ვერ მოხერხდა</div>
          <div style={{ fontSize: fontSizes.sm, color: colors.greyText, marginTop: 4, fontFamily: 'monospace' }}>{state.message}</div>
        </div>
        <button onClick={runSync} style={{ background: colors.redError, color: colors.white, border: 'none', borderRadius: radii.md, padding: `${spacing.sm} ${spacing.lg}`, fontSize: fontSizes.sm, fontWeight: 600, cursor: 'pointer' }}>თავიდან ცდა</button>
      </div>
    )
  }

  // idle
  return (
    <div style={cardBase}>
      <div>
        <div style={{ fontWeight: 600, color: colors.blackberry, fontSize: fontSizes.md, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <SyncIcon size={18} color={colors.blackberry} />
          Doctra სინქრონიზაცია
        </div>
        <div style={{ fontSize: fontSizes.sm, color: colors.greyText, marginTop: 4 }}>
          ბოლო სინქრონი: {formatRelative(lastSyncedAt)}
        </div>
      </div>
      <button onClick={runSync} style={{ background: colors.pink, color: colors.white, border: 'none', borderRadius: radii.md, padding: `${spacing.md} ${spacing.lg}`, fontSize: fontSizes.md, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: spacing.sm }}>
        <SyncIcon size={16} color={colors.white} />
        სინქრონიზაცია ახლა
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/DoctraSyncCard.tsx
git commit -m "feat(admin): add Doctra sync card component"
```

(Wiring into the dashboard happens in Task 11.)

---

## Task 6: Build the `NeedsAttentionCard` component

**Files:**
- Create: `src/components/admin/NeedsAttentionCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/admin/NeedsAttentionCard.tsx
import React from 'react'
import { colors, spacing, radii, fontSizes } from './tokens'
import { PhotoMissingIcon, SpecialtyIcon, HiddenIcon } from './icons'

export type NeedsAttentionCounts = {
  noPhoto: number
  placeholderSpecialty: number
  hidden: number
}

const tiles: Array<{
  key: keyof NeedsAttentionCounts
  label: string
  Icon: React.ComponentType<{ size?: number; color?: string }>
  href: string
  accent: string
}> = [
  {
    key: 'noPhoto',
    label: 'ფოტო აკლია',
    Icon: PhotoMissingIcon,
    href: '/admin/collections/doctors?where[and][0][photo][exists]=false',
    accent: colors.pink,
  },
  {
    key: 'placeholderSpecialty',
    label: 'სპეციალობა შესავსებია',
    Icon: SpecialtyIcon,
    href: '/admin/collections/doctors?where[and][0][specialty][equals]=—',
    accent: colors.amberWarn,
  },
  {
    key: 'hidden',
    label: 'დამალული ექიმები',
    Icon: HiddenIcon,
    href: '/admin/collections/doctors?where[and][0][inactive][equals]=true',
    accent: colors.greyText,
  },
]

export default function NeedsAttentionCard({ counts }: { counts: NeedsAttentionCounts }) {
  return (
    <div style={{ marginBottom: spacing.lg }}>
      <h3 style={{ fontSize: fontSizes.md, fontWeight: 600, color: colors.greyLightText, textTransform: 'uppercase', letterSpacing: '0.05em', margin: `0 0 ${spacing.md} 0` }}>
        საჭიროებს ყურადღებას
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.md }}>
        {tiles.map(({ key, label, Icon, href, accent }) => {
          const count = counts[key]
          const isClear = count === 0
          return (
            <a
              key={key}
              href={href}
              style={{
                display: 'block',
                background: colors.white,
                border: `1px solid ${isClear ? colors.greenSuccessSoft : colors.greyBorder}`,
                borderRadius: radii.md,
                padding: spacing.lg,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.15s ease, transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = isClear ? colors.greenSuccess : accent
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isClear ? colors.greenSuccessSoft : colors.greyBorder
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, color: isClear ? colors.greenSuccess : accent }}>
                <Icon size={16} color={isClear ? colors.greenSuccess : accent} />
                <span style={{ fontSize: fontSizes.sm, fontWeight: 500 }}>{label}</span>
              </div>
              <div style={{ fontSize: fontSizes.xxl, fontWeight: 700, marginTop: spacing.sm, color: isClear ? colors.greenSuccess : colors.blackberry }}>
                {isClear ? '✓' : count}
              </div>
              <div style={{ fontSize: fontSizes.xs, color: colors.greyLightText, marginTop: spacing.xs }}>
                {isClear ? 'ყველაფერი წესრიგშია' : 'იხილე ექიმები →'}
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/NeedsAttentionCard.tsx
git commit -m "feat(admin): add needs-attention card component"
```

(Wiring into the dashboard happens in Task 11.)

---

## Task 7: Build the `DoctorListFilters` component

**Files:**
- Create: `src/components/admin/DoctorListFilters.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/admin/DoctorListFilters.tsx
'use client'

import React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { colors, spacing, radii, fontSizes } from './tokens'

const presets = [
  { key: 'all', label: 'ყველა', params: null },
  { key: 'no-photo', label: 'ფოტო აკლია', params: { 'where[and][0][photo][exists]': 'false' } },
  { key: 'placeholder-specialty', label: 'სპეციალობა შესავსებია', params: { 'where[and][0][specialty][equals]': '—' } },
  { key: 'hidden', label: 'დამალული', params: { 'where[and][0][inactive][equals]': 'true' } },
] as const

export default function DoctorListFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function applyPreset(params: Record<string, string> | null) {
    const sp = new URLSearchParams()
    if (params) for (const [k, v] of Object.entries(params)) sp.set(k, v)
    router.push(`${pathname}?${sp.toString()}`)
  }

  function isActive(params: Record<string, string> | null): boolean {
    if (!params) {
      // "All" is active when no `where[and]` keys are set
      for (const k of searchParams.keys()) if (k.startsWith('where[and]')) return false
      return true
    }
    return Object.entries(params).every(([k, v]) => searchParams.get(k) === v)
  }

  return (
    <div style={{ display: 'flex', gap: spacing.sm, padding: `${spacing.md} ${spacing.lg}`, borderBottom: `1px solid ${colors.greyBorder}`, flexWrap: 'wrap', background: colors.white }}>
      {presets.map((p) => {
        const active = isActive(p.params)
        return (
          <button
            key={p.key}
            onClick={() => applyPreset(p.params)}
            style={{
              background: active ? colors.blackberry : colors.white,
              color: active ? colors.white : colors.blackberry,
              border: `1px solid ${active ? colors.blackberry : colors.greyBorder}`,
              borderRadius: radii.xl,
              padding: `${spacing.xs} ${spacing.md}`,
              fontSize: fontSizes.sm,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/DoctorListFilters.tsx
git commit -m "feat(admin): add chip filters for doctors list"
```

(Wiring into Doctors collection happens in Task 9.)

---

## Task 8: Build the "view live" components

**Files:**
- Create: `src/components/admin/DoctorRowActions.tsx`
- Create: `src/components/admin/DoctorViewLiveButton.tsx`

- [ ] **Step 1: Create `DoctorRowActions.tsx`**

This is a custom column rendered in the doctors list view. Payload passes the row data via cell props.

```tsx
// src/components/admin/DoctorRowActions.tsx
'use client'

import React from 'react'
import { colors } from './tokens'
import { ExternalLinkIcon } from './icons'

type CellProps = {
  rowData?: { slug?: string; inactive?: boolean }
}

export default function DoctorRowActions({ rowData }: CellProps) {
  const slug = rowData?.slug
  if (!slug) return null
  const disabled = !!rowData?.inactive
  const href = `/ge/doctors/${slug}`
  return (
    <a
      href={disabled ? undefined : href}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={disabled}
      title={disabled ? 'ექიმი დამალულია — საიტზე ვერ ნახავთ' : 'საიტზე ნახვა'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 6,
        color: disabled ? colors.greyLightText : colors.blackberry,
        opacity: disabled ? 0.5 : 1,
        textDecoration: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={(e) => { if (disabled) e.preventDefault() }}
    >
      <ExternalLinkIcon size={14} />
    </a>
  )
}
```

- [ ] **Step 2: Create `DoctorViewLiveButton.tsx`**

This renders at the top of the edit form. Payload's `beforeDocumentControls` slot passes the document data via context — we use Payload's `useDocumentInfo` hook.

```tsx
// src/components/admin/DoctorViewLiveButton.tsx
'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { colors, spacing, radii, fontSizes } from './tokens'
import { ExternalLinkIcon } from './icons'

export default function DoctorViewLiveButton() {
  const info = useDocumentInfo() as { savedDocumentData?: { slug?: string; inactive?: boolean } }
  const slug = info?.savedDocumentData?.slug
  const inactive = info?.savedDocumentData?.inactive
  if (!slug) return null
  const href = `/ge/doctors/${slug}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.md}`,
        background: 'transparent',
        border: `1px solid ${colors.greyBorder}`,
        borderRadius: radii.md,
        color: inactive ? colors.greyLightText : colors.blackberry,
        textDecoration: 'none',
        fontSize: fontSizes.sm,
        fontWeight: 500,
        opacity: inactive ? 0.6 : 1,
      }}
      title={inactive ? 'ექიმი დამალულია — საიტზე ვერ ნახავთ' : 'ექიმის გვერდი ახალ ფანჯარაში'}
    >
      <ExternalLinkIcon size={14} />
      საიტზე ნახვა
    </a>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0. If `useDocumentInfo`'s type signature doesn't match `savedDocumentData`, cast as in the example (`as { savedDocumentData?: ... }`) — Payload's `@payloadcms/ui` types are loosely defined for some hooks.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/DoctorRowActions.tsx src/components/admin/DoctorViewLiveButton.tsx
git commit -m "feat(admin): add view-live components for doctors"
```

---

## Task 9: Restructure Doctors collection — tabs + wire admin components

**Files:**
- Modify: `src/collections/Doctors.ts`

- [ ] **Step 1: Replace the entire `fields` array and add admin component slots**

Open `src/collections/Doctors.ts`. The current `fields` array contains 17+ entries; we keep the sidebar fields at the top level and wrap the rest in a `tabs` field. Also add admin component slots.

Replace the whole exported object with:

```ts
import type { CollectionConfig } from 'payload'
import { seoFields } from '../fields/seo'

export const Doctors: CollectionConfig = {
  slug: 'doctors',
  labels: { singular: 'ექიმი', plural: 'ექიმები' },
  admin: {
    useAsTitle: 'name',
    description: 'ექიმების პროფილების მართვა. ფოტო, ბიოგრაფია, სპეციალიზაცია.',
    defaultColumns: ['name', 'specialty', 'isDepartmentHead', 'inactive'],
    group: 'კონტენტი',
    components: {
      beforeListTable: ['/components/admin/DoctorListFilters'],
      edit: {
        beforeDocumentControls: ['/components/admin/DoctorViewLiveButton'],
      },
    },
  },
  access: { read: () => true },
  fields: [
    // ── Sidebar fields (Payload places these in the right sidebar) ────────
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar', description: 'URL მისამართი (მაგ: vasil-khozrevanidze)' } },
    { name: 'doctraId', type: 'text', unique: true, admin: { position: 'sidebar', description: 'Doctra API ექიმის ID — დაკავშირებულია ჩაწერის სისტემასთან' } },
    { name: 'doctraBranchId', type: 'text', admin: { position: 'sidebar', description: 'Doctra განყოფილების ID — პროფილზე ხელმისაწვდომი დროების საჩვენებლად' } },
    { name: 'inactive', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'მონიშვნისას ექიმი დამალულია საიტზე და ჩაწერის ფორმაში (ჩანაწერი არ წაიშლება)' } },
    {
      name: 'lastUpdated',
      type: 'date',
      label: 'Last Updated',
      admin: {
        position: 'sidebar',
        description: 'ექიმის ინფორმაციის ბოლო განახლების თარიღი — გამოჩნდება პროფილის გვერდზე',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
      },
    },

    // ── Main column: tabs ─────────────────────────────────────────────────
    {
      type: 'tabs',
      tabs: [
        {
          label: 'იდენტობა',
          description: 'სახელი და ფოტო — პირველი რაც პაციენტი ხედავს',
          fields: [
            { name: 'name', type: 'text', required: true, localized: true },
            { name: 'photo', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'პროფილი',
          description: 'სპეციალიზაცია, ბიოგრაფია, კვალიფიკაცია',
          fields: [
            { name: 'specialty', type: 'text', required: true, localized: true },
            { name: 'biography', type: 'richText', localized: true, admin: { description: 'ექიმის ბიოგრაფია და გამოცდილება' } },
            {
              name: 'qualifications',
              type: 'array',
              admin: { description: 'აკადემიური ხარისხები და სერტიფიკატები' },
              fields: [{ name: 'qualification', type: 'text', required: true, localized: true }],
            },
            {
              name: 'specializations',
              type: 'array',
              admin: { description: 'სამედიცინო სპეციალიზაციები' },
              fields: [{ name: 'specialization', type: 'text', required: true, localized: true }],
            },
            { name: 'experienceYears', type: 'number', min: 0, defaultValue: 0, admin: { description: 'სამუშაო გამოცდილება წლებში' } },
            {
              name: 'languagesSpoken',
              type: 'array',
              fields: [{
                name: 'language',
                type: 'select',
                required: true,
                options: [
                  { label: 'ქართული 🇬🇪 / Georgian', value: 'ka' },
                  { label: 'English 🇬🇧', value: 'en' },
                  { label: 'Русский 🇷🇺 / Russian', value: 'ru' },
                  { label: 'Türkçe 🇹🇷 / Turkish', value: 'tr' },
                  { label: 'Deutsch 🇩🇪 / German', value: 'de' },
                  { label: 'Français 🇫🇷 / French', value: 'fr' },
                  { label: 'Español 🇪🇸 / Spanish', value: 'es' },
                  { label: 'Italiano 🇮🇹 / Italian', value: 'it' },
                  { label: 'עברית 🇮🇱 / Hebrew', value: 'he' },
                  { label: 'العربية 🇸🇦 / Arabic', value: 'ar' },
                  { label: 'Azərbaycanca 🇦🇿 / Azerbaijani', value: 'az' },
                  { label: 'Հայերեն 🇦🇲 / Armenian', value: 'hy' },
                  { label: 'Українська 🇺🇦 / Ukrainian', value: 'uk' },
                  { label: 'فارسی 🇮🇷 / Persian', value: 'fa' },
                  { label: '中文 🇨🇳 / Chinese', value: 'zh' },
                ],
              }],
            },
            { name: 'isDepartmentHead', type: 'checkbox', defaultValue: false, label: 'განყოფილების ხელმძღვანელი' },
          ],
        },
        {
          label: 'SEO',
          description: 'საძიებო სისტემებისთვის (Google) — სურვილისამებრ',
          fields: [seoFields],
        },
      ],
    },
  ],
}
```

Note: this drops `seoFields` as a top-level field and moves it inside the SEO tab. `seoFields` is itself an array of fields (or a group field). Verify the export shape once before applying — if `seoFields` is a single field, wrap it in an array as shown above; if it's already an array, spread it: `fields: [...seoFields]`.

- [ ] **Step 2: Verify the `seoFields` shape**

Run: `head -30 src/fields/seo.ts` (or open the file). If the export is a single field object (e.g. `export const seoFields = { name: 'meta', type: 'group', fields: [...] }`), the form `fields: [seoFields]` is correct. If it's an array, change to `fields: [...seoFields]`.

- [ ] **Step 3: Restart the dev server**

Ctrl-C in the dev server terminal, then `npm run dev`. Watch for compile errors.
Expected: clean start. The Doctors edit form now shows tabs.

- [ ] **Step 4: Smoke check**

Open `http://localhost:3000/admin/collections/doctors`. The list view should show 4 chip filters along the top. Click an existing doctor row — the edit form should now show 3 tabs (იდენტობა, პროფილი, SEO) with fields under each.

Expected:
- Identity tab: name, photo
- Profile tab: specialty + bio + qualifications + specializations + experienceYears + languagesSpoken + isDepartmentHead
- SEO tab: meta fields
- Sidebar: slug, doctraId, doctraBranchId, inactive, lastUpdated
- Top of edit form: "საიტზე ნახვა" button (only renders for saved doctors with a slug)

- [ ] **Step 5: Smoke-check the chip filters**

On the doctors list, click "ფოტო აკლია". URL becomes `/admin/collections/doctors?where[and][0][photo][exists]=false`. The list filters to doctors without photos (146 right after the import).

Click "ყველა". URL clears. List shows everyone again.

- [ ] **Step 6: Smoke-check the view-live link**

Click an active doctor row → edit form. Click "საიტზე ნახვა" → opens `/ge/doctors/<slug>` in a new tab.
Mark a doctor inactive (sidebar checkbox), save. The "საიტზე ნახვა" button dims.

- [ ] **Step 7: Commit**

```bash
git add src/collections/Doctors.ts
git commit -m "refactor(admin): tabs for doctors edit form + wire view-live and chip filters"
```

---

## Task 10: Reviews `published` field + frontend filter

**Files:**
- Modify: `src/collections/Reviews.ts`
- Modify: `src/lib/payload-data.ts`

- [ ] **Step 1: Update Reviews collection**

Replace the whole exported object with:

```ts
import type { CollectionConfig } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'შეფასება', plural: 'შეფასებები' },
  admin: {
    useAsTitle: 'author',
    description: 'პაციენტების შეფასებების მართვა. \'გამოქვეყნებული\' ჩექბოქსი აკონტროლებს რა გამოჩნდეს საიტზე.',
    defaultColumns: ['author', 'rating', 'published', 'source', 'date'],
    group: 'კონტენტი',
  },
  access: { read: () => true },
  fields: [
    { name: 'author', type: 'text', required: true },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5 },
    { name: 'text', type: 'textarea', required: true, localized: true },
    { name: 'date', type: 'date', required: true },
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { label: 'Google', value: 'google' },
        { label: 'Internal', value: 'internal' },
      ],
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'მონიშნულია — ჩანს საიტზე. გაუქმებულია — დამალულია.',
      },
    },
  ],
}
```

- [ ] **Step 2: Filter `getReviews` to published only**

Open `src/lib/payload-data.ts`. Find the `getReviews` function around line 115. The current `payload.find` call:

```ts
const result = await payload.find({
  collection: 'reviews',
  locale,
  limit: 100,
  depth: 0,
  sort: '-date',
})
```

Change to:

```ts
const result = await payload.find({
  collection: 'reviews',
  where: { published: { equals: true } } as never,
  locale,
  limit: 100,
  depth: 0,
  sort: '-date',
})
```

(The `as never` cast matches the project's existing pattern for Payload `where` clauses, see `getBookingDoctorsFromPayload`.)

- [ ] **Step 3: Restart the dev server so `published` column is added**

Ctrl-C, `npm run dev`. Existing reviews get `published = true` (the default).

- [ ] **Step 4: Verify the schema**

Run: `docker exec clinic-postgres psql -U clinic -d clinic -c "\d reviews"`
Expected: `published` column of type `boolean` with default `true`.

- [ ] **Step 5: Smoke-check the admin behavior**

Open `http://localhost:3000/admin/collections/reviews`. The list shows the new `published` column with toggleable checkboxes. Toggling a row off should immediately persist (Payload's inline boolean editing).

- [ ] **Step 6: Smoke-check the public site**

Open `http://localhost:3000/ge/` (homepage shows reviews). Toggle a review's `published` to false in admin, refresh the homepage — that review should disappear.

- [ ] **Step 7: Commit**

```bash
git add src/collections/Reviews.ts src/lib/payload-data.ts
git commit -m "feat(reviews): add published toggle for site curation"
```

---

## Task 11: Refresh the Dashboard

**Files:**
- Modify: `src/components/admin/Dashboard.tsx`

This is the largest single task. The new Dashboard becomes a server component (so we get fresh `lastDoctraSync` + needs-attention counts on every load without an extra client fetch), composes the new sync card and needs-attention card, and replaces emojis with SVG icons.

- [ ] **Step 1: Replace `Dashboard.tsx` entirely**

```tsx
// src/components/admin/Dashboard.tsx
import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { colors, spacing, radii, fontSizes } from './tokens'
import { DoctorIcon, ServiceIcon, NewsIcon, PageIcon, ReviewIcon, CheckupIcon, ExternalLinkIcon } from './icons'
import DoctraSyncCard from './DoctraSyncCard'
import NeedsAttentionCard, { type NeedsAttentionCounts } from './NeedsAttentionCard'

type Stats = {
  doctors: number
  services: number
  news: number
  pages: number
  reviews: number
  checkups: number
}

async function loadDashboardData(): Promise<{
  stats: Stats
  attention: NeedsAttentionCounts
  lastSyncedAt: string | null
}> {
  try {
    const payload = await getPayload({ config })

    // 6 collection counts + 3 attention counts + global, all in parallel
    const [doctorsTotal, servicesTotal, newsTotal, pagesTotal, reviewsTotal, checkupsTotal, noPhoto, placeholderSpec, hidden, settings] = await Promise.all([
      payload.find({ collection: 'doctors', limit: 0 }),
      payload.find({ collection: 'services', limit: 0 }),
      payload.find({ collection: 'news', limit: 0 }),
      payload.find({ collection: 'pages', limit: 0 }),
      payload.find({ collection: 'reviews', limit: 0 }),
      payload.find({ collection: 'checkup-packages', limit: 0 }),
      payload.find({ collection: 'doctors', where: { photo: { exists: false } } as never, limit: 0 }),
      payload.find({ collection: 'doctors', where: { specialty: { equals: '—' } } as never, limit: 0 }),
      payload.find({ collection: 'doctors', where: { inactive: { equals: true } } as never, limit: 0 }),
      payload.findGlobal({ slug: 'site-settings' }),
    ])

    const settingsAny = settings as { lastDoctraSync?: string | null }

    return {
      stats: {
        doctors: doctorsTotal.totalDocs,
        services: servicesTotal.totalDocs,
        news: newsTotal.totalDocs,
        pages: pagesTotal.totalDocs,
        reviews: reviewsTotal.totalDocs,
        checkups: checkupsTotal.totalDocs,
      },
      attention: {
        noPhoto: noPhoto.totalDocs,
        placeholderSpecialty: placeholderSpec.totalDocs,
        hidden: hidden.totalDocs,
      },
      lastSyncedAt: settingsAny.lastDoctraSync ?? null,
    }
  } catch (err) {
    console.error('Dashboard load failed:', err)
    return {
      stats: { doctors: 0, services: 0, news: 0, pages: 0, reviews: 0, checkups: 0 },
      attention: { noPhoto: 0, placeholderSpecialty: 0, hidden: 0 },
      lastSyncedAt: null,
    }
  }
}

export default async function Dashboard() {
  const { stats, attention, lastSyncedAt } = await loadDashboardData()

  const statCards = [
    { label: 'ექიმები', value: stats.doctors, Icon: DoctorIcon, href: '/admin/collections/doctors', color: colors.blackberry },
    { label: 'სერვისები', value: stats.services, Icon: ServiceIcon, href: '/admin/collections/services', color: colors.pink },
    { label: 'სიახლეები', value: stats.news, Icon: NewsIcon, href: '/admin/collections/news', color: '#8B5CF6' },
    { label: 'გვერდები', value: stats.pages, Icon: PageIcon, href: '/admin/collections/pages', color: '#3B82F6' },
    { label: 'შეფასებები', value: stats.reviews, Icon: ReviewIcon, href: '/admin/collections/reviews', color: colors.amberWarn },
    { label: 'ჩექაფები', value: stats.checkups, Icon: CheckupIcon, href: '/admin/collections/checkup-packages', color: colors.greenSuccess },
  ]

  const quickActions = [
    { label: 'სიახლის დამატება', Icon: NewsIcon, href: '/admin/collections/news/create' },
    { label: 'გვერდის შექმნა', Icon: PageIcon, href: '/admin/collections/pages/create' },
    { label: 'ექიმის დამატება', Icon: DoctorIcon, href: '/admin/collections/doctors/create' },
  ]

  return (
    <div style={{ padding: `${spacing.xl} ${spacing.xl}` }}>
      {/* Welcome banner */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.blackberry} 0%, ${colors.blackberryDark} 100%)`,
        borderRadius: radii.lg,
        padding: `${spacing.lg} ${spacing.xl}`,
        marginBottom: spacing.lg,
        color: colors.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: spacing.md,
      }}>
        <div>
          <h1 style={{ fontSize: fontSizes.xl, fontWeight: 700, margin: 0 }}>მოგესალმებით 👋</h1>
          <p style={{ fontSize: fontSizes.md, opacity: 0.7, margin: `${spacing.xs} 0 0 0` }}>ხოზრევანიძის კლინიკის ადმინ-პანელი</p>
        </div>
        <div style={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap' }}>
          {statCards.slice(0, 4).map((card) => (
            <a key={card.label} href={card.href} style={{ textDecoration: 'none', color: colors.white, textAlign: 'center', minWidth: 60 }}>
              <div style={{ fontSize: fontSizes.xxl, fontWeight: 700, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: fontSizes.xs, opacity: 0.7, marginTop: spacing.xs }}>{card.label}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Doctra sync card */}
      <DoctraSyncCard lastSyncedAt={lastSyncedAt} />

      {/* Needs attention */}
      <NeedsAttentionCard counts={attention} />

      {/* Stats list + Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
        {/* Left: full stats list */}
        <div>
          <h3 style={{ fontSize: fontSizes.md, fontWeight: 600, color: colors.greyLightText, textTransform: 'uppercase', letterSpacing: '0.05em', margin: `0 0 ${spacing.md} 0` }}>
            კონტენტი
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {statCards.map((card) => (
              <a key={card.label} href={card.href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                background: colors.white,
                borderRadius: radii.md,
                padding: `${spacing.md} ${spacing.lg}`,
                textDecoration: 'none',
                border: `1px solid ${colors.greySubtle}`,
                transition: 'all 0.15s ease',
              }}>
                <span style={{ width: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                  <card.Icon size={20} color={card.color} />
                </span>
                <span style={{ fontSize: fontSizes.md, fontWeight: 500, color: '#374151', flex: 1 }}>{card.label}</span>
                <span style={{ fontSize: fontSizes.xl, fontWeight: 700, color: card.color }}>{card.value}</span>
                <span style={{ color: '#D1D5DB', fontSize: fontSizes.lg }}>›</span>
              </a>
            ))}
          </div>
        </div>

        {/* Right: quick actions */}
        <div>
          <h3 style={{ fontSize: fontSizes.md, fontWeight: 600, color: colors.greyLightText, textTransform: 'uppercase', letterSpacing: '0.05em', margin: `0 0 ${spacing.md} 0` }}>
            სწრაფი მოქმედებები
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {quickActions.map((action) => (
              <a key={action.label} href={action.href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                background: colors.white,
                borderRadius: radii.md,
                padding: `${spacing.md} ${spacing.lg}`,
                textDecoration: 'none',
                border: `1px solid ${colors.greySubtle}`,
                color: '#374151',
                fontSize: fontSizes.md,
                fontWeight: 500,
              }}>
                <span style={{ width: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <action.Icon size={20} color={colors.blackberry} />
                </span>
                <span style={{ flex: 1 }}>{action.label}</span>
                <span style={{ color: '#D1D5DB', fontSize: fontSizes.lg }}>›</span>
              </a>
            ))}
          </div>

          {/* View site button */}
          <a href="/" target="_blank" rel="noopener noreferrer" style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            marginTop: spacing.md,
            background: colors.blackberry,
            borderRadius: radii.md,
            padding: `${spacing.md} ${spacing.lg}`,
            textDecoration: 'none',
            color: colors.white,
            fontSize: fontSizes.md,
            fontWeight: 600,
          }}>
            <span style={{ width: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <ExternalLinkIcon size={18} color={colors.white} />
            </span>
            <span>საიტის ნახვა</span>
            <span style={{ marginLeft: 'auto' }}>↗</span>
          </a>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0. If you see "use server"-related errors about React server components calling client components, that's expected — just import the client components (`DoctraSyncCard`, `NeedsAttentionCard`) directly; Next.js handles the boundary.

- [ ] **Step 3: Smoke check the dashboard**

Open `http://localhost:3000/admin`. You should see:

1. Welcome banner with 4 inline stats (white-on-blackberry)
2. **DoctraSyncCard** with "ბოლო სინქრონი: X საათის წინ" + pink "სინქრონიზაცია ახლა" button
3. **NeedsAttentionCard** with 3 tiles (no-photo / placeholder-specialty / hidden) showing live counts, deep-linked to filtered doctor lists
4. Stats list (left) + Quick Actions + View Site button (right) — all using SVG icons, no emojis except the 👋 in welcome
5. Counts come back instantly (server-rendered, no `–` placeholder flicker)

- [ ] **Step 4: Smoke check the sync flow end-to-end**

Click "სინქრონიზაცია ახლა". Card shifts to spinner state with "ვითხოვ Doctra-ს განყოფილებებს...". After ~5–15s, success card appears with the summary. Click "დახურვა" — card returns to idle. The "ბოლო სინქრონი" timestamp updates to "ახლახანს".

- [ ] **Step 5: Smoke check needs-attention deep links**

Click the "ფოტო აკლია" tile → navigates to `/admin/collections/doctors?where[and][0][photo][exists]=false` and the list shows ~146 doctors.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/Dashboard.tsx
git commit -m "refactor(admin): redesign dashboard, server-render data, replace emojis with SVG"
```

---

## Task 12: Login page polish

**Files:**
- Modify: `src/components/admin/BeforeLogin.tsx`
- Create: `src/components/admin/AfterLogin.tsx`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Update `BeforeLogin.tsx`**

Replace contents:

```tsx
// src/components/admin/BeforeLogin.tsx
import React from 'react'
import { colors, spacing, fontSizes } from './tokens'

export default function BeforeLogin() {
  return (
    <>
      {/* Login background gradient injected via style tag — Payload's login
          shell wraps everything we render here. Targeting the form container
          via the `.payload__login` class structure that Payload renders. */}
      <style>{`
        body.template-default--login,
        .payload-login,
        section.template-default--login {
          background: linear-gradient(135deg, ${colors.cream} 0%, ${colors.pinkSoft} 100%) !important;
        }
      `}</style>
      <div style={{ textAlign: 'center', marginBottom: spacing.lg }}>
        <h2 style={{ margin: `0 0 ${spacing.xs} 0`, fontSize: fontSizes.xl, color: colors.blackberry, fontWeight: 700, letterSpacing: '-0.5px' }}>
          ხოზრევანიძის კლინიკა
        </h2>
        <p style={{ fontSize: fontSizes.sm, color: colors.greyText, margin: 0 }}>
          ადმინისტრაციული პანელი
        </p>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Create `AfterLogin.tsx`**

```tsx
// src/components/admin/AfterLogin.tsx
import React from 'react'
import { colors, spacing, fontSizes } from './tokens'

export default function AfterLogin() {
  return (
    <div style={{ marginTop: spacing.xl, paddingTop: spacing.lg, borderTop: `1px solid ${colors.greyBorder}`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      <a href="tel:+995422227171" style={{ color: colors.greyText, textDecoration: 'none', fontSize: fontSizes.sm, fontWeight: 500 }}>
        📞 (+995) 422 22 71 71
      </a>
      <a href="https://khozrevanidze.ge" target="_blank" rel="noopener noreferrer" style={{ color: colors.pink, textDecoration: 'none', fontSize: fontSizes.sm, fontWeight: 500 }}>
        🌐 khozrevanidze.ge ↗
      </a>
    </div>
  )
}
```

- [ ] **Step 3: Register `AfterLogin` in payload.config.ts**

Open `src/payload.config.ts`. Find the `admin.components` block (around line 73). It currently has:

```ts
components: {
  graphics: {
    Logo: '/components/admin/Logo',
    Icon: '/components/admin/Icon',
  },
  beforeLogin: ['/components/admin/BeforeLogin'],
  afterNavLinks: ['/components/admin/AfterNavLinks'],
  beforeDashboard: ['/components/admin/Dashboard'],
},
```

Add `afterLogin`:

```ts
components: {
  graphics: {
    Logo: '/components/admin/Logo',
    Icon: '/components/admin/Icon',
  },
  beforeLogin: ['/components/admin/BeforeLogin'],
  afterLogin: ['/components/admin/AfterLogin'],
  afterNavLinks: ['/components/admin/AfterNavLinks'],
  beforeDashboard: ['/components/admin/Dashboard'],
},
```

- [ ] **Step 4: Restart dev server (component-slot registration is read at startup)**

Ctrl-C, `npm run dev`.

- [ ] **Step 5: Smoke check the login page**

Open `http://localhost:3000/admin/logout` (logs you out, redirects to login). The page should now show:
- Cream-to-soft-pink gradient background
- Logo (existing)
- Heading: "ხოზრევანიძის კლინიკა"
- Caption: "ადმინისტრაციული პანელი"
- Email + password form (Payload's default)
- Below the form: phone link + clinic site link

If the gradient doesn't apply, the CSS selectors don't match Payload's actual class names. Inspect the body element via DevTools and adjust the `<style>` selectors in `BeforeLogin.tsx` to whatever class Payload uses (e.g. `.template-default__login` or similar).

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/BeforeLogin.tsx src/components/admin/AfterLogin.tsx src/payload.config.ts
git commit -m "feat(admin): polish login page with branded gradient and contact links"
```

---

## Task 13: Final manual verification + record of changes

This task has no code changes — it's a final end-to-end smoke against everything we built.

- [ ] **Step 1: Reset state and start clean**

```bash
docker compose --env-file .env.local ps          # postgres should be healthy
# dev server should already be running; if not: npm run dev
```

- [ ] **Step 2: Run through the full verification checklist**

For each item, click through and confirm. If any fail, fix in a follow-up commit before moving on.

- [ ] **A. Dashboard**
  - [ ] All 6 stat tiles render with SVG icons (no emoji icons in the body)
  - [ ] Counts are correct (cross-check with Postgres counts if needed)
  - [ ] Sync card shows "ბოლო სინქრონი: X" with the right relative time
  - [ ] Needs-attention 3 tiles show correct counts; tiles turn green when count is 0

- [ ] **B. Sync flow**
  - [ ] Click sync → spinner appears → success card appears with correct summary
  - [ ] Click "Show errors" disclosure (if any errors) → list expands
  - [ ] Click "დახურვა" → card returns to idle, "ბოლო სინქრონი" updates
  - [ ] Force-fail: edit `.env.local`, set `DOCTRA_PASSWORD="wrong"`. Click sync → red error card with the auth error message. Restore the password.

- [ ] **C. Doctors list**
  - [ ] 4 chip filters show along the top of the list
  - [ ] Each chip applies the correct URL filter
  - [ ] "ყველა" clears all filters
  - [ ] Right-edge external-link icon present on each row
  - [ ] Inactive doctors have dimmed icons

- [ ] **D. Doctor edit form**
  - [ ] 3 tabs render: იდენტობა, პროფილი, SEO
  - [ ] Switching tabs preserves dirty state until save
  - [ ] Sidebar fields (slug, doctraId, etc.) still in the right column
  - [ ] "საიტზე ნახვა" button at top opens `/ge/doctors/<slug>` in new tab
  - [ ] Save still works; all fields persist; tab content survives the save

- [ ] **E. Reviews**
  - [ ] List shows `published` column with toggleable checkboxes
  - [ ] Toggling persists immediately (Payload inline)
  - [ ] Public site (`/ge/`) only shows published reviews

- [ ] **F. Login page**
  - [ ] Gradient background applied
  - [ ] Heading + caption rendered above the form
  - [ ] Phone + site link rendered below the form
  - [ ] Login still works (admin@admin.ge / 111111)

- [ ] **Step 3: Final type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: both exit 0 (or with only the warnings that were already present before this work).

- [ ] **Step 4: If anything failed, fix it**

Common gotchas:
- If `DoctorListFilters` chips don't reflect URL state on load, ensure `usePathname` and `useSearchParams` hooks are imported from `next/navigation` (not `next/router`)
- If `DoctorViewLiveButton` returns null, `useDocumentInfo`'s `savedDocumentData` might be exposed under a different key in your Payload version — log the hook's full return value once and adjust
- If the login gradient doesn't apply, inspect via DevTools to see Payload's actual login wrapper class — adjust the `<style>` selectors in `BeforeLogin.tsx`

- [ ] **Step 5: Final commit (if any fixes were needed)**

```bash
git add -p   # review each change
git commit -m "fix(admin): address smoke-test findings"
```

---

## Notes on production deployment (out of scope, captured for later)

When this work moves to Vercel for the customer demo:

1. **Schema:** the `lastDoctraSync` column and `published` column need to exist in Neon. Either flip `push: true` to apply unconditionally (one-line in `payload.config.ts`) or generate migrations. Acceptable for a demo: just-in-time `push` with a one-time edit.
2. **Media uploads:** still using local `staticDir: 'media'` — won't survive on Vercel. Wire up `@payloadcms/storage-vercel-blob` before customer demo. Out of scope here.
3. **Doctra creds:** set `DOCTRA_USER` and `DOCTRA_PASSWORD` in Vercel env. Wrap the password in quotes to dodge the dotenv `#` issue we hit locally.
4. **Admin user:** since `/api/seed` errors on the legacy data, create the first admin via `/api/users/first-register` against the Vercel-deployed instance, same as we did locally.

---

## Self-review checklist (writer's notes — do not delete)

- ✓ Spec coverage: Sections 1–7 of the design spec map to Tasks 4–5 (sync), 6–9 (needs-attention + tabs + view-live), 10 (reviews), 11 (dashboard), 12 (login). Foundation in Tasks 1–3.
- ✓ No placeholders: every step contains complete code or an exact command. No TBDs/TODOs.
- ✓ Type consistency: `NeedsAttentionCounts` defined in Task 6 and imported in Task 11 — same name, same shape.
- ✓ File paths exact: every path is absolute under `src/`.
- ✓ Commit messages: every task ends with a concrete `git commit -m "..."` matching project style. No Claude attribution per memory.
