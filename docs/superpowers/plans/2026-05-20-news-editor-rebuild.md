# News Editor Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rigid 4-block News content field with a Notion-/Medium-style rich-text editor that lets the clinic's editors drop styled images anywhere, wrap text around them, and embed callouts/galleries — while keeping brand styling (cream/blackberry/pink palette, FiraGO font, brand border/shadow tokens) under the renderer's control so editors cannot break the design.

**Architecture:**
- One Lexical `richText` field (`body`) replaces the current `content: blocks[]` array on the News collection.
- Lexical's built-in `UploadFeature` is extended with extra fields (`alignment`, `borderStyle`, `shadow`, `radius`, `caption`) so editors get a "drop an image, choose its style" experience inside the editor.
- Lexical's `BlocksFeature` adds two opinionated blocks the rich text cannot express on its own: `Callout` (icon + colored box) and `Gallery` (2/3/4-up image grid).
- The frontend renders via `@payloadcms/richtext-lexical/react`'s `RichText` component with a custom `converters` map that maps Lexical nodes onto branded React components.
- Existing news posts keep working: the render path checks the new `body` first and falls back to the legacy `content` blocks. A one-shot migration script converts old posts in place. The legacy `content` field is removed only after manual verification (Phase 4).

**Tech Stack:**
- Payload CMS 3.83 + `@payloadcms/richtext-lexical` 3.83 (server features + React converters).
- Postgres via `@payloadcms/db-postgres` (Neon on demo, cPanel on prod; SQLite is the alternate adapter — handled identically).
- Next.js 16 App Router + Tailwind 4 (`prose` is already wired to brand tokens — see `src/components/blog/ContentBlocks.tsx`).
- next-intl 4 (locales `ge`/`en`/`ru`; News `content` is `localized: true` so all three locales need migrating).
- **No test framework is configured.** Verification is manual: dev server (`npm run dev`) + admin UI at `/admin` + rendered `/ge/blog/<slug>` page + `npm run lint` + a TypeScript build (`npm run build` — Payload regenerates `src/payload-types.ts` during build).

---

## Phase 0 — Pre-flight checks

These are not tasks to mark done, just things the executor must confirm before starting.

- `npm run dev` boots without errors and the admin loads at `http://localhost:3000/admin`.
- At least one News post exists with non-empty `content` blocks in each of `ge` / `en` / `ru` — used as the smoke fixture across the plan. If none exist, seed one via the admin before Task 8. (The seeder POST is at `POST /api/seed` per CLAUDE.md.)
- Database is on the safe Postgres branch (Neon demo branch or local) — never run the migration script (Task 8) against a production database without a fresh dump.
- `BLOB_READ_WRITE_TOKEN` is set if working off Vercel Blob, otherwise uploads fall back to local disk (`src/payload.config.ts:164-170`). Either is fine.

---

## File Structure

**Files created in this plan:**

```
src/blocks/lexical/CalloutBlock.ts            # Lexical-inline Block config for callout boxes
src/blocks/lexical/GalleryBlock.ts            # Lexical-inline Block config for image grids
src/components/blog/LexicalContent.tsx        # New renderer: <RichText> with custom JSX converters
src/components/blog/lexical-converters/
    StyledUpload.tsx                          # Renders Lexical `upload` node with border/shadow/radius/alignment
    CalloutRenderer.tsx                       # Renders the `callout` block
    GalleryRenderer.tsx                       # Renders the `gallery` block
scripts/migrate-news-content-to-body.mjs      # One-shot data migration: blocks[] → SerializedEditorState
```

**Files modified:**

```
src/collections/News.ts                       # Add `body` (richText), keep `content` until Phase 4
src/payload.config.ts                         # Wire BlocksFeature + extended UploadFeature into lexicalEditor
src/app/(frontend)/[locale]/blog/[slug]/page.tsx  # Render body first, fall back to ContentBlocks
src/i18n/payload-ka.ts                        # Add Georgian labels for the new block/upload fields (admin UX)
```

**Files removed in Phase 4 (after sign-off):**

```
src/components/blog/ContentBlocks.tsx
src/blocks/ImageBlock.ts                      # Only if no other collection still references it (Pages uses Pages-specific blocks; News was the only consumer)
src/blocks/ImageTextBlock.ts                  # Same caveat
src/blocks/QuoteBlock.ts                      # Same caveat
src/blocks/RichTextBlock.ts                   # Same caveat
```

Before removing any of the four block files in Phase 4, grep for usage: `grep -r "from '@/blocks/ImageBlock'" src` etc. They were only imported by `src/collections/News.ts` at the time of writing, but Pages may have grown to use them.

---

## Phase 1 — Editor & schema setup

### Task 1: Add the inline Callout block config

**Files:**
- Create: `src/blocks/lexical/CalloutBlock.ts`

- [ ] **Step 1: Create the file with the full block definition**

```ts
// src/blocks/lexical/CalloutBlock.ts
import type { Block } from 'payload'

// Inline Lexical block: a coloured callout box rendered inside an article.
// Variants map to Tailwind classes in CalloutRenderer.tsx — extending this
// list here REQUIRES adding the matching className branch in the renderer.
export const CalloutBlock: Block = {
  slug: 'callout',
  labels: { singular: 'შენიშვნა (Callout)', plural: 'შენიშვნები' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'info',
      options: [
        { label: 'ინფორმაცია (ცისფერი)', value: 'info' },
        { label: 'რჩევა (ვარდისფერი)', value: 'tip' },
        { label: 'გაფრთხილება (ყვითელი)', value: 'warning' },
        { label: 'მნიშვნელოვანი (ჟოლოსფერი)', value: 'important' },
      ],
    },
    { name: 'title', type: 'text', localized: true, admin: { description: 'სათაური (არასავალდებულო)' } },
    { name: 'body', type: 'textarea', required: true, localized: true },
  ],
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit -p tsconfig.json` (or just rely on `npm run dev` complaining).
Expected: no TypeScript errors for the new file. If TypeScript flags missing `Block` export from `payload`, double-check the import — Payload 3.83 exports `Block` from the root `payload` package.

- [ ] **Step 3: Commit**

```bash
git add src/blocks/lexical/CalloutBlock.ts
git commit -m "feat(news): add lexical Callout block config"
```

---

### Task 2: Add the inline Gallery block config

**Files:**
- Create: `src/blocks/lexical/GalleryBlock.ts`

- [ ] **Step 1: Create the file**

```ts
// src/blocks/lexical/GalleryBlock.ts
import type { Block } from 'payload'

// Inline Lexical block: a 2/3/4-column image grid. Each image is a Media
// upload + optional caption. Layout is decided by `columns`; styling
// (rounded corners, brand shadow) lives in GalleryRenderer.tsx.
export const GalleryBlock: Block = {
  slug: 'gallery',
  labels: { singular: 'სურათების გალერეა', plural: 'გალერეები' },
  fields: [
    {
      name: 'columns',
      type: 'select',
      required: true,
      defaultValue: '3',
      options: [
        { label: '2 სვეტი', value: '2' },
        { label: '3 სვეტი', value: '3' },
        { label: '4 სვეტი', value: '4' },
      ],
    },
    {
      name: 'images',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 12,
      labels: { singular: 'სურათი', plural: 'სურათები' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', localized: true },
      ],
    },
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/blocks/lexical/GalleryBlock.ts
git commit -m "feat(news): add lexical Gallery block config"
```

---

### Task 3: Wire BlocksFeature + extended UploadFeature into the global Lexical editor

**Files:**
- Modify: `src/payload.config.ts` (the `lexicalEditor({...})` call at lines 76–94)

- [ ] **Step 1: Add the imports**

In `src/payload.config.ts`, lines 4–14 (the `@payloadcms/richtext-lexical` import block), add `BlocksFeature`:

```ts
import {
  lexicalEditor,
  AlignFeature,
  BlockquoteFeature,
  BlocksFeature,
  ChecklistFeature,
  FixedToolbarFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineToolbarFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
```

Add two new local imports below the existing collection imports (after line 36):

```ts
import { CalloutBlock } from './blocks/lexical/CalloutBlock'
import { GalleryBlock } from './blocks/lexical/GalleryBlock'
```

- [ ] **Step 2: Replace the `editor` block (lines 76–94) with the extended version**

Old (lines 76–94):

```ts
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      InlineToolbarFeature(),
      AlignFeature(),
      IndentFeature(),
      BlockquoteFeature(),
      ChecklistFeature(),
      HorizontalRuleFeature(),
      UploadFeature({
        collections: {
          media: {
            fields: [],
          },
        },
      }),
    ],
  }),
```

New:

```ts
  // Editor features:
  //  - default Lexical kit (paragraph, marks, headings, link, lists)
  //  - sticky + inline toolbars
  //  - alignment, indent, blockquote, checklist, horizontal rule
  //  - UploadFeature: inline images via the Media collection, with extra
  //    per-image fields (alignment, borderStyle, shadow, radius, caption)
  //    that the public renderer reads to apply brand styling. Editors pick
  //    these from dropdowns — they cannot type free-form CSS.
  //  - BlocksFeature: inline Callout + Gallery blocks (slash-menu insertable)
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      InlineToolbarFeature(),
      AlignFeature(),
      IndentFeature(),
      BlockquoteFeature(),
      ChecklistFeature(),
      HorizontalRuleFeature(),
      UploadFeature({
        collections: {
          media: {
            fields: [
              {
                name: 'alignment',
                type: 'select',
                defaultValue: 'center',
                options: [
                  { label: 'მარცხნივ (ტექსტი მარჯვნივ შემოეხვევა)', value: 'left' },
                  { label: 'ცენტრში', value: 'center' },
                  { label: 'მარჯვნივ (ტექსტი მარცხნივ შემოეხვევა)', value: 'right' },
                  { label: 'მთელი სიგანე', value: 'fullWidth' },
                ],
              },
              {
                name: 'borderStyle',
                type: 'select',
                defaultValue: 'none',
                options: [
                  { label: 'საზღვრის გარეშე', value: 'none' },
                  { label: 'ვარდისფერი ჩარჩო', value: 'pink' },
                  { label: 'ჟოლოსფერი ჩარჩო', value: 'blackberry' },
                  { label: 'ნაცრისფერი ჩარჩო', value: 'grey' },
                ],
              },
              {
                name: 'shadow',
                type: 'select',
                defaultValue: 'none',
                options: [
                  { label: 'ჩრდილის გარეშე', value: 'none' },
                  { label: 'მსუბუქი ჩრდილი', value: 'soft' },
                  { label: 'მკვეთრი ჩრდილი', value: 'strong' },
                ],
              },
              {
                name: 'radius',
                type: 'select',
                defaultValue: 'lg',
                options: [
                  { label: 'მკვეთრი კუთხეები', value: 'none' },
                  { label: 'სტანდარტული მომრგვალება', value: 'lg' },
                  { label: 'სრული მომრგვალება', value: 'full' },
                ],
              },
              { name: 'caption', type: 'text', localized: true },
            ],
          },
        },
      }),
      BlocksFeature({
        blocks: [CalloutBlock, GalleryBlock],
      }),
    ],
  }),
```

- [ ] **Step 3: Restart the dev server and verify the admin loads**

Stop and restart `npm run dev`. Wait for "Ready" output, then open `http://localhost:3000/admin` and log in.

Open any existing page that has a richText field (e.g. a Pages document or, if none, the News collection's existing nested richText inside `imageText` blocks). Confirm the toolbar now shows the "+" / blocks button and that clicking it lets you pick "შენიშვნა (Callout)" or "სურათების გალერეა".

Confirm that the UploadFeature image-insert flow now asks for `alignment`, `borderStyle`, `shadow`, `radius`, `caption` (Georgian labels) after picking a Media file.

Expected: editor renders, blocks appear in the insert menu, upload modal shows the 5 new fields. If TypeScript errors block startup, check the import names — Payload 3.83 exports `BlocksFeature` from `@payloadcms/richtext-lexical`.

- [ ] **Step 4: Commit**

```bash
git add src/payload.config.ts
git commit -m "feat(cms): extend lexical editor with BlocksFeature + styled upload fields"
```

---

### Task 4: Add the `body` field to the News collection

**Files:**
- Modify: `src/collections/News.ts` (the `content` field block at lines 38–45)

- [ ] **Step 1: Add `body` immediately above `content`**

Old (lines 38–45):

```ts
    {
      name: 'content',
      type: 'blocks',
      blocks: [RichTextBlock, ImageBlock, ImageTextBlock, QuoteBlock],
      required: true,
      localized: true,
      admin: { description: 'დაამატეთ ბლოკები: ტექსტი, სურათი, ციტატა და სხვა' },
    },
```

New:

```ts
    {
      name: 'body',
      type: 'richText',
      localized: true,
      // Not required during the transition — old posts still live in `content`.
      // After the migration script (scripts/migrate-news-content-to-body.mjs)
      // runs and the public site is verified, the legacy `content` field
      // will be removed and `body` made required (Phase 4).
      admin: {
        description: 'სტატიის შინაარსი. დაიწერეთ ტექსტი, ჩასვით სურათები სასურველ ადგილას, აირჩიეთ მათი სტილი (ჩარჩო, ჩრდილი). „+" ღილაკით ჩასვით შენიშვნა ან გალერეა.',
      },
    },
    {
      name: 'content',
      type: 'blocks',
      blocks: [RichTextBlock, ImageBlock, ImageTextBlock, QuoteBlock],
      // No longer required — `body` is the canonical content field. Existing
      // posts still render from here until the migration script runs.
      localized: true,
      admin: {
        description: 'მოძველებული ბლოკ-სტრუქტურა. ახალი სტატიებისთვის გამოიყენეთ ზემოთ მდებარე „body" ველი.',
        condition: (data) => Array.isArray(data?.content) && data.content.length > 0,
      },
    },
```

The `condition` makes the legacy field **invisible** in the admin UI for new posts (it only appears for posts that already have block data). This nudges editors toward `body` without losing migration safety.

- [ ] **Step 2: Restart the dev server, confirm schema sync ran**

Watch the console for Payload's schema push log. Expected: a line mentioning `body` column added to the `news_locales` table (or `news` if the project's localization scheme uses JSON per-row — both are valid; the column appears either way).

- [ ] **Step 3: Manually create a brand-new News post in the admin**

Go to `/admin/collections/news/create`. Title = "Test editor rebuild". Slug = "test-editor-rebuild". Category = anything. Featured image = anything from Media. Published date = today.

In the new `body` field: type a paragraph. Press `/` or click `+` and insert an image — confirm the upload modal asks for alignment/border/shadow/radius/caption. Save as draft. Reopen — confirm `body` round-trips (the image and its style choices persist).

Switch the locale picker at the top of the form to English. Confirm `body` is empty for English (because it is localized). Type a different paragraph. Save. Switch back to Georgian — confirm the Georgian paragraph is still there.

Expected: each locale persists its own `body`, the legacy `content` field is hidden, no errors in the server log.

- [ ] **Step 4: Commit**

```bash
git add src/collections/News.ts
git commit -m "feat(news): add `body` richText field alongside legacy `content`"
```

---

## Phase 2 — Frontend renderer

### Task 5: Build the StyledUpload renderer

**Files:**
- Create: `src/components/blog/lexical-converters/StyledUpload.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/blog/lexical-converters/StyledUpload.tsx
import type { SerializedUploadNode } from '@payloadcms/richtext-lexical'

// `fields` on the upload node = the extra metadata we declared on UploadFeature
// (alignment, borderStyle, shadow, radius, caption) in src/payload.config.ts.
// `value` is the populated Media doc (Payload depth >= 1 hydrates it).
type Fields = {
  alignment?: 'left' | 'center' | 'right' | 'fullWidth'
  borderStyle?: 'none' | 'pink' | 'blackberry' | 'grey'
  shadow?: 'none' | 'soft' | 'strong'
  radius?: 'none' | 'lg' | 'full'
  caption?: string
}

const alignmentClass: Record<NonNullable<Fields['alignment']>, string> = {
  left: 'md:float-left md:mr-8 mb-4 md:max-w-md',
  center: 'mx-auto max-w-3xl',
  right: 'md:float-right md:ml-8 mb-4 md:max-w-md',
  fullWidth: 'w-full max-w-none',
}

const borderClass: Record<NonNullable<Fields['borderStyle']>, string> = {
  none: '',
  pink: 'ring-2 ring-pink ring-offset-2 ring-offset-cream',
  blackberry: 'ring-2 ring-blackberry ring-offset-2 ring-offset-cream',
  grey: 'ring-2 ring-grey/30 ring-offset-2 ring-offset-cream',
}

const shadowClass: Record<NonNullable<Fields['shadow']>, string> = {
  none: '',
  soft: 'shadow-md shadow-blackberry/10',
  strong: 'shadow-xl shadow-blackberry/20',
}

const radiusClass: Record<NonNullable<Fields['radius']>, string> = {
  none: 'rounded-none',
  lg: 'rounded-xl sm:rounded-2xl',
  full: 'rounded-full aspect-square object-cover',
}

export function StyledUpload({ node }: { node: SerializedUploadNode }) {
  const value = node.value
  if (!value || typeof value !== 'object') return null

  const media = value as { url?: string | null; alt?: string | null }
  const fields = (node.fields ?? {}) as Fields

  const alignment = fields.alignment ?? 'center'
  const border = fields.borderStyle ?? 'none'
  const shadow = fields.shadow ?? 'none'
  const radius = fields.radius ?? 'lg'

  if (!media.url) return null

  return (
    <figure className={`my-6 sm:my-8 ${alignmentClass[alignment]}`}>
      <img
        src={media.url}
        alt={media.alt ?? ''}
        loading="lazy"
        className={`w-full ${radiusClass[radius]} ${borderClass[border]} ${shadowClass[shadow]}`}
      />
      {fields.caption && (
        <figcaption className="text-[13px] text-grey-light text-center mt-3 italic break-words">
          {fields.caption}
        </figcaption>
      )}
    </figure>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/blog/lexical-converters/StyledUpload.tsx
git commit -m "feat(news): add StyledUpload lexical converter with brand styling"
```

---

### Task 6: Build the CalloutRenderer

**Files:**
- Create: `src/components/blog/lexical-converters/CalloutRenderer.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/blog/lexical-converters/CalloutRenderer.tsx
type CalloutFields = {
  variant: 'info' | 'tip' | 'warning' | 'important'
  title?: string
  body: string
}

// Variants map to fixed Tailwind classes — editors pick from a select; they
// cannot inject classes. Extending this set requires updating CalloutBlock.ts
// (the field's options array) so the renderer and the form stay in sync.
const variantClass: Record<CalloutFields['variant'], { box: string; title: string }> = {
  info: {
    box: 'border-l-4 border-blue-400 bg-blue-50 text-blue-900',
    title: 'text-blue-900',
  },
  tip: {
    box: 'border-l-4 border-pink bg-pink-light/40 text-blackberry',
    title: 'text-pink',
  },
  warning: {
    box: 'border-l-4 border-yellow-400 bg-yellow-50 text-yellow-900',
    title: 'text-yellow-900',
  },
  important: {
    box: 'border-l-4 border-blackberry bg-blackberry/5 text-blackberry',
    title: 'text-blackberry',
  },
}

export function CalloutRenderer({ fields }: { fields: CalloutFields }) {
  const v = variantClass[fields.variant] ?? variantClass.info
  return (
    <aside className={`my-8 sm:my-10 px-5 py-4 rounded-r-xl sm:rounded-r-2xl ${v.box}`}>
      {fields.title && (
        <p className={`font-semibold mb-2 break-words ${v.title}`}>{fields.title}</p>
      )}
      <p className="text-[15px] sm:text-[16px] leading-relaxed break-words whitespace-pre-line">
        {fields.body}
      </p>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/blog/lexical-converters/CalloutRenderer.tsx
git commit -m "feat(news): add Callout lexical block renderer"
```

---

### Task 7: Build the GalleryRenderer

**Files:**
- Create: `src/components/blog/lexical-converters/GalleryRenderer.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/blog/lexical-converters/GalleryRenderer.tsx
type GalleryFields = {
  columns: '2' | '3' | '4'
  images: Array<{
    image: { url?: string | null; alt?: string | null } | number | string
    caption?: string
  }>
}

const colsClass: Record<GalleryFields['columns'], string> = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-2 sm:grid-cols-3',
  '4': 'grid-cols-2 sm:grid-cols-4',
}

export function GalleryRenderer({ fields }: { fields: GalleryFields }) {
  return (
    <div className={`my-8 sm:my-10 grid gap-3 sm:gap-4 ${colsClass[fields.columns]}`}>
      {fields.images.map((item, i) => {
        const url = typeof item.image === 'object' && item.image ? item.image.url ?? '' : ''
        const alt = typeof item.image === 'object' && item.image ? item.image.alt ?? '' : ''
        if (!url) return null
        return (
          <figure key={i} className="overflow-hidden rounded-xl shadow-sm shadow-blackberry/10">
            <img src={url} alt={alt} loading="lazy" className="w-full h-full object-cover aspect-square" />
            {item.caption && (
              <figcaption className="text-[12px] text-grey-light text-center mt-2 italic break-words px-1">
                {item.caption}
              </figcaption>
            )}
          </figure>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/blog/lexical-converters/GalleryRenderer.tsx
git commit -m "feat(news): add Gallery lexical block renderer"
```

---

### Task 8: Build the LexicalContent wrapper that wires the converters

**Files:**
- Create: `src/components/blog/LexicalContent.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/blog/LexicalContent.tsx
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { StyledUpload } from './lexical-converters/StyledUpload'
import { CalloutRenderer } from './lexical-converters/CalloutRenderer'
import { GalleryRenderer } from './lexical-converters/GalleryRenderer'

// JSX converters map Lexical node types -> React components. We override the
// `upload` node (so it picks up our border/shadow/radius styling) and the
// `blocks` group (for our Callout + Gallery custom blocks). Everything else
// — paragraphs, headings, lists, links, blockquote, hr, alignment — falls
// through to Payload's default converters, which already produce semantic
// HTML that the surrounding `prose` Tailwind classes style correctly.
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  upload: ({ node }) => <StyledUpload node={node} />,
  blocks: {
    callout: ({ node }) => <CalloutRenderer fields={node.fields as never} />,
    gallery: ({ node }) => <GalleryRenderer fields={node.fields as never} />,
  },
})

export default function LexicalContent({ data }: { data: SerializedEditorState }) {
  return (
    <div className="prose prose-base sm:prose-lg max-w-none clearfix prose-headings:text-blackberry prose-headings:break-words prose-p:text-grey prose-p:break-words prose-a:text-pink prose-a:break-words prose-blockquote:border-pink prose-blockquote:bg-pink-light/30 prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-4 break-words">
      <RichText data={data} converters={converters} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/blog/LexicalContent.tsx
git commit -m "feat(news): add LexicalContent renderer with JSX converters"
```

---

### Task 9: Render `body` from the blog page (with fallback to legacy `content`)

**Files:**
- Modify: `src/app/(frontend)/[locale]/blog/[slug]/page.tsx` (lines 158–160 — the `<ContentBlocks>` render)

- [ ] **Step 1: Add the import**

At the top of the file (with the other `@/components/blog/...` imports), add:

```ts
import LexicalContent from "@/components/blog/LexicalContent";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
```

- [ ] **Step 2: Replace the content render**

Old (lines 158–160):

```tsx
          {article.content && Array.isArray(article.content) && (
              <ContentBlocks blocks={article.content} />
          )}
```

New:

```tsx
          {/*
            Prefer the new Lexical `body` field. Fall back to the legacy
            block-list `content` for posts that haven't been migrated yet
            (see scripts/migrate-news-content-to-body.mjs). After the
            migration is verified, the fallback is removed in Phase 4.
          */}
          {article.body && typeof article.body === 'object' && 'root' in article.body ? (
            <LexicalContent data={article.body as SerializedEditorState} />
          ) : article.content && Array.isArray(article.content) ? (
            <ContentBlocks blocks={article.content} />
          ) : null}
```

- [ ] **Step 3: Manual verify in the browser**

With `npm run dev` running, open the post you created in Task 4 (e.g. `http://localhost:3000/ge/blog/test-editor-rebuild`). Confirm:
- The paragraph you typed renders.
- The inline image renders with the alignment / border / shadow / radius you picked.
- Adding a Callout via the admin and reloading shows the coloured aside.
- Adding a Gallery shows the responsive grid.

Then open one of the legacy posts (e.g. `http://localhost:3000/ge/blog/<existing-slug>`). Confirm it still renders via `ContentBlocks` exactly as before — nothing broken for un-migrated posts.

Run `npm run lint` and `npm run build`. Expected: zero new errors. `payload-types.ts` regenerates with `body?: SerializedEditorState` on the News doc type.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/blog/\[slug\]/page.tsx
git commit -m "feat(news): render body via LexicalContent, fall back to legacy blocks"
```

---

## Phase 3 — Data migration

### Task 10: Write the one-shot block→Lexical migration script

**Files:**
- Create: `scripts/migrate-news-content-to-body.mjs`

The script must:
1. Connect via Payload's local API (same pattern as `scripts/sync-booking-enabled.mjs` and `scripts/verify-cta-hide.mjs` — see those for the boilerplate).
2. For each News doc, for each of the three locales (`ge`, `en`, `ru`): read `content` (blocks array), build a `SerializedEditorState`, and write it to `body` for that locale.
3. **Never overwrite a non-empty `body`** — if a post has already been migrated (or hand-authored), skip that locale.
4. Be idempotent: a second run on the same data is a no-op.
5. Print a per-doc, per-locale report so the operator can verify.

- [ ] **Step 1: Create the script**

```js
// scripts/migrate-news-content-to-body.mjs
// One-shot migration: News.content (blocks[]) -> News.body (SerializedEditorState).
// Idempotent — skips any (doc, locale) pair where `body` is already populated.
// Run with: node scripts/migrate-news-content-to-body.mjs
// Requires the same env vars as the dev server (DATABASE_URL, PAYLOAD_SECRET).

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

const LOCALES = ['ge', 'en', 'ru']

function emptyEditorState() {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [],
      direction: 'ltr',
    },
  }
}

function paragraphFromHtml(text) {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      { type: 'text', text: String(text ?? ''), format: 0, version: 1, detail: 0, mode: 'normal', style: '' },
    ],
  }
}

// Lexical's serialized upload node shape (matches what UploadFeature emits).
function uploadNode({ relationTo, value, fields }) {
  return {
    type: 'upload',
    version: 3,
    format: '',
    relationTo,
    value: typeof value === 'object' ? value.id : value,
    fields: fields ?? {},
  }
}

function blockNode({ blockType, fields }) {
  return {
    type: 'block',
    version: 2,
    format: '',
    fields: { blockType, ...fields },
  }
}

function blockquoteNode(text, attribution) {
  return {
    type: 'quote',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      ...(text ? [{ type: 'text', text, format: 0, version: 1, detail: 0, mode: 'normal', style: '' }] : []),
      ...(attribution
        ? [{ type: 'linebreak', version: 1 }, { type: 'text', text: `— ${attribution}`, format: 2, version: 1, detail: 0, mode: 'normal', style: '' }]
        : []),
    ],
  }
}

// Convert one legacy block into one (or more) Lexical root children.
function convertBlock(block) {
  switch (block.blockType) {
    case 'richText': {
      // Old richText block already stored a SerializedEditorState in
      // block.content. Splice its children straight into the new root.
      const children = block.content?.root?.children
      return Array.isArray(children) ? children : []
    }
    case 'image': {
      const value = typeof block.image === 'object' ? block.image : { id: block.image }
      return [
        uploadNode({
          relationTo: 'media',
          value,
          fields: {
            alignment: block.alignment ?? 'center',
            borderStyle: 'none',
            shadow: 'none',
            radius: 'lg',
            caption: block.caption ?? '',
          },
        }),
      ]
    }
    case 'imageText': {
      const value = typeof block.image === 'object' ? block.image : { id: block.image }
      return [
        uploadNode({
          relationTo: 'media',
          value,
          fields: {
            alignment: block.imagePosition === 'right' ? 'right' : 'left',
            borderStyle: 'none',
            shadow: 'none',
            radius: 'lg',
            caption: '',
          },
        }),
        ...(block.content?.root?.children ?? []),
      ]
    }
    case 'quote':
      return [blockquoteNode(block.quoteText, block.attribution)]
    default:
      return [paragraphFromHtml(`[unconverted block: ${block.blockType}]`)]
  }
}

function buildEditorStateFromBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null
  const children = blocks.flatMap(convertBlock)
  if (children.length === 0) return null
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr',
    },
  }
}

async function main() {
  const payload = await getPayload({ config })

  let scanned = 0
  let migrated = 0
  let skipped = 0

  for (const locale of LOCALES) {
    const res = await payload.find({
      collection: 'news',
      locale,
      depth: 0,
      limit: 1000,
    })

    for (const doc of res.docs) {
      scanned++
      const alreadyHasBody = doc.body && typeof doc.body === 'object' && Array.isArray(doc.body.root?.children) && doc.body.root.children.length > 0
      if (alreadyHasBody) {
        console.log(`[skip] ${doc.slug} (${locale}) — body already populated`)
        skipped++
        continue
      }

      const state = buildEditorStateFromBlocks(doc.content)
      if (!state) {
        console.log(`[skip] ${doc.slug} (${locale}) — no legacy content to migrate`)
        skipped++
        continue
      }

      await payload.update({
        collection: 'news',
        id: doc.id,
        locale,
        data: { body: state },
      })
      console.log(`[ok]   ${doc.slug} (${locale}) — migrated ${doc.content.length} block(s) -> ${state.root.children.length} lexical node(s)`)
      migrated++
    }
  }

  console.log(`\nDone. scanned=${scanned} migrated=${migrated} skipped=${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Run the script against the dev database**

Stop the dev server first so the local Payload instance in the script can take exclusive control (otherwise both will try to push schema changes).

```bash
node scripts/migrate-news-content-to-body.mjs
```

Expected output: one `[ok]` line per (doc, locale) that had legacy `content`, and a final summary. No errors.

- [ ] **Step 3: Re-run to confirm idempotency**

```bash
node scripts/migrate-news-content-to-body.mjs
```

Expected: every line is `[skip]`. `migrated=0`.

- [ ] **Step 4: Manually verify in the admin and on the public site**

Restart `npm run dev`. Open a previously-legacy post in the admin — confirm the new `body` field has content and the (now-hidden) `content` field's data is still intact (it should still be there; we never deleted it).

Open the same post's public URL (`/ge/blog/<slug>`, then `/en/`, then `/ru/`). Confirm each locale renders via the new path. Compare side-by-side against git stash of the old render if needed.

Known imperfections to expect:
- Images migrated from `ImageText` blocks now sit on their own line with text wrapping around them, not in a strict half-and-half column. The shape is similar but not identical. **This is acceptable** — the goal is editors get fresh flexibility, not a pixel-perfect freeze of old posts.
- Captions from the legacy `Image` block flow through fine.

If any post looks wrong, the editor can open it in the admin and tweak — they no longer need a developer.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-news-content-to-body.mjs
git commit -m "chore(news): add one-shot migration script for content -> body"
```

---

## Phase 4 — Cleanup (only after client sign-off)

**Do not run Phase 4 until the client has reviewed migrated posts on a deploy and approved.** This phase deletes the safety net.

### Task 11: Remove the legacy `content` field

**Files:**
- Modify: `src/collections/News.ts`
- Modify: `src/app/(frontend)/[locale]/blog/[slug]/page.tsx`
- Delete: `src/components/blog/ContentBlocks.tsx`
- Delete (only if grep confirms no other usage): `src/blocks/ImageBlock.ts`, `src/blocks/ImageTextBlock.ts`, `src/blocks/QuoteBlock.ts`, `src/blocks/RichTextBlock.ts`

- [ ] **Step 1: Confirm no remaining usage**

Run from the repo root:

```bash
grep -rn "ContentBlocks" src
grep -rn "from '@/blocks/ImageBlock'" src
grep -rn "from '@/blocks/ImageTextBlock'" src
grep -rn "from '@/blocks/QuoteBlock'" src
grep -rn "from '@/blocks/RichTextBlock'" src
grep -rn "from '../blocks/ImageBlock'" src
grep -rn "from '../blocks/ImageTextBlock'" src
grep -rn "from '../blocks/QuoteBlock'" src
grep -rn "from '../blocks/RichTextBlock'" src
```

Expected after Task 9 + 10: only `src/collections/News.ts` references the four block files; nothing else references `ContentBlocks`. If anything else does, **stop and revisit the scope of Phase 4**.

- [ ] **Step 2: Remove the imports + the `content` field from News.ts**

In `src/collections/News.ts`, delete the four block imports at lines 2–5 and delete the entire `content` field object that was inserted in Task 4. The `body` field stays. Make `body` required now:

```ts
    {
      name: 'body',
      type: 'richText',
      required: true,
      localized: true,
      admin: {
        description: 'სტატიის შინაარსი. დაიწერეთ ტექსტი, ჩასვით სურათები სასურველ ადგილას, აირჩიეთ მათი სტილი (ჩარჩო, ჩრდილი). „+" ღილაკით ჩასვით შენიშვნა ან გალერეა.',
      },
    },
```

- [ ] **Step 3: Remove the fallback render branch**

In `src/app/(frontend)/[locale]/blog/[slug]/page.tsx`, replace the Task-9 conditional with just the Lexical path. Also remove the `ContentBlocks` import.

```tsx
          {article.body && typeof article.body === 'object' && 'root' in article.body && (
            <LexicalContent data={article.body as SerializedEditorState} />
          )}
```

- [ ] **Step 4: Delete the obsolete files**

```bash
git rm src/components/blog/ContentBlocks.tsx
git rm src/blocks/ImageBlock.ts
git rm src/blocks/ImageTextBlock.ts
git rm src/blocks/QuoteBlock.ts
git rm src/blocks/RichTextBlock.ts
```

(Only the files confirmed unused in Step 1 — if `RichTextBlock` is still used by another collection, leave it.)

- [ ] **Step 5: Schema cleanup**

Removing a Payload field with `push: true` does **not** drop the column — it just stops reading/writing it. The orphan column will sit in `news_locales` (Postgres) or in the JSON locale blob (SQLite). That is fine and harmless; if the operator wants it gone, write a one-line SQL migration outside this plan. **Do not add `ALTER TABLE ... DROP COLUMN` to this commit.**

- [ ] **Step 6: Final verification**

`npm run lint && npm run build`. Smoke-test the public blog index and one detail page per locale. Confirm a fresh `News` create form in the admin only shows the new `body` field — no legacy block dropdown.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(news): drop legacy block content field, body is the source of truth"
```

---

## Self-review checklist (for the plan author / reviewer)

**Spec coverage**

- "Drop image where they like" → Task 3 (UploadFeature with alignment field) + Task 5 (StyledUpload renderer reads alignment).
- "Maintain styling — border color, shadow" → Task 3 (UploadFeature border/shadow/radius dropdowns) + Task 5 (renderer applies fixed Tailwind classes; editors cannot inject CSS).
- "Big editor component" → Task 3 (FixedToolbarFeature + BlocksFeature + extended UploadFeature) + Task 8 (single rich-text field with full prose styling).
- "Maintain styling generally" → All renderer files use brand tokens (cream/blackberry/pink) and `prose-*` already wired to those tokens (`src/components/blog/ContentBlocks.tsx:26` for the existing pattern). Editors cannot bypass these.
- Migration safety → Phase 3 (idempotent script, never overwrites, manual verify) + Phase 4 (gated on sign-off).
- Localization (ge/en/ru) → Task 4 (`body` is `localized: true`); Task 10 iterates all three locales.

**Placeholder scan**: no "TBD", no "add appropriate error handling", every code block is complete.

**Type consistency**: `SerializedEditorState` imported from `@payloadcms/richtext-lexical/lexical` in both `LexicalContent.tsx` (Task 8) and `blog/[slug]/page.tsx` (Task 9). `Fields` shape in `StyledUpload.tsx` (Task 5) matches the option values declared in `UploadFeature` (Task 3). Callout `variant` options in `CalloutBlock.ts` (Task 1) match the `variantClass` keys in `CalloutRenderer.tsx` (Task 6). Gallery `columns` options in `GalleryBlock.ts` (Task 2) match `colsClass` keys in `GalleryRenderer.tsx` (Task 7).

**Risks called out inline**:
- `push: true` does not drop columns (Task 11 Step 5).
- Stopping the dev server before running the migration script (Task 10 Step 2) — Payload's local API cannot share the connection.
- Imperfect visual parity for migrated ImageText blocks (Task 10 Step 4) — flagged explicitly as acceptable.
- Phase 4 gated on client sign-off, not auto-run.
