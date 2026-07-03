# Blog/News Visual Builder (Puck) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Lexical `body` editor for the News/blog collection with a Puck visual builder whose editing canvas renders the real page components (true WYSIWYG), supports explicit image/text layout blocks, reuses the Media library, and stores one shared layout with per-locale (ge/en/ru) text.

**Architecture:** A shared Puck `Config` (`src/puck/`) defines every block; the same config powers both the admin editor and the public render so they cannot drift. The builder is embedded in Payload as a custom `Field` component on a new unlocalized `puckData` JSON field (driven by `useField` + `onChange`; Payload's normal Save persists it). Text values are stored as `{ge,en,ru}` locale maps; the active language is carried by Puck `metadata.locale` (display) and a React context (editing). The public blog page renders `<Render data={puckData} metadata={{locale}}>`, falling back to the existing `LexicalContent` when a post has no `puckData`.

**Tech Stack:** Next.js 16 (App Router), Payload CMS 3.83, Puck (visual editor), TipTap (in-block rich text), Tailwind 4, Postgres.

---

## Conventions for this plan

- **No unit tests exist in this repo** (`CLAUDE.md`: "No test framework is configured"). Verification = `npm run lint`, `npm run build`, schema push via `npm run dev`, and browser smoke checks. Do not scaffold a test framework.
- **Puck package specifier:** RESOLVED in Task 1 — the package is **`@puckeditor/core`** (v0.21.2; `@puckeditor/core` is deprecated). All imports below use `@puckeditor/core`; CSS is `@puckeditor/core/puck.css`. Confirmed APIs: `onChange?: (data: Data) => void` (single arg), render reads locale via `puck.metadata.locale`, `external` field `fetchList` receives `{ query, filters }`, `overrides.header`/`headerActions` exist, and `ComponentConfig`/`Config`/`Slot`/`Data`/`FieldLabel` are exported.
- **Commits:** No AI attribution trailers (project rule). Commit after each task.
- **Dev server:** Port 3000 may be busy; the dev server picks the next free port (e.g. 3002). Use whatever it prints.
- **importMap:** Payload references admin components by string path and needs `npx payload generate:importmap` after adding one (the project already has `src/app/(payload)/admin/importMap.js`).

## File structure

| File | Responsibility |
|------|----------------|
| `src/puck/types.ts` | Shared TS types: `Loc<T>` locale map, `BuilderLocale`, block prop types, `pickLocale` helper. |
| `src/puck/locale-context.tsx` | `BuilderLocaleContext` + provider/hook for the *editing* locale (used only by custom fields in admin). |
| `src/puck/tiptap.ts` | Shared TipTap extension list + `richTextToHtml(json)` server renderer. |
| `src/puck/fields/LocalizedTextField.tsx` | Puck `custom` field: single-line/multiline text editing `value[editLocale]`. |
| `src/puck/fields/LocalizedRichTextField.tsx` | Puck `custom` field: TipTap editor editing `value[editLocale]`. |
| `src/puck/blocks/*.tsx` | One file per block; each exports a Puck `ComponentConfig` (fields + render). |
| `src/puck/config.tsx` | Assembles all blocks into one `Config`; defines Root container. Imported by editor AND page. |
| `src/puck/empty-data.ts` | `EMPTY_PUCK_DATA` default for new posts. |
| `src/components/admin/PuckBuilderField.tsx` | Payload custom Field component: `useField` + `<Puck>` + locale switcher header + full-width. |
| `src/components/blog/PuckArticle.tsx` | `'use client'` wrapper: `<Render config data metadata={{locale}}>`. |
| `src/collections/News.ts` | Add `puckData` json field (hidden, custom Field); make `body` optional + hidden. |
| `src/lib/payload-data.ts` | `getNewsBySlug` returns `puckData`. |
| `src/app/(frontend)/[locale]/blog/[slug]/page.tsx` | Render `PuckArticle` when `puckData` present, else `LexicalContent`. |
| `src/app/(payload)/custom.scss` | Full-bleed CSS for the builder field. |

---

## Task 1: Install and pin Puck + TipTap; verify API

**Files:**
- Modify: `package.json` (via npm)
- Modify: `src/app/(payload)/layout.tsx` (import Puck CSS once)

- [ ] **Step 1: Determine the correct Puck package name + version**

Run:
```bash
npm view @puckeditor/core version dist-tags
npm view @puckeditor/core version dist-tags
```
Expected: one resolves to a current version (e.g. `0.20.x` or `1.x`), the other may 404 or be deprecated. **Use whichever is current.** Record the chosen specifier; if it is `@puckeditor/core`, substitute it for `@puckeditor/core` everywhere in this plan.

- [ ] **Step 2: Install dependencies**

Run (substitute the verified Puck package from Step 1):
```bash
npm install @puckeditor/core @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/html @tiptap/pm
```
Expected: installs succeed, `package.json` updated.

- [ ] **Step 3: Confirm key APIs against the installed version**

Run:
```bash
node -e "const p=require('@puckeditor/core'); console.log(['Puck','Render','FieldLabel'].map(k=>k+':'+(k in p)).join(' '))"
```
Expected: `Puck:true Render:true FieldLabel:true`. Then open `node_modules/@puckeditor/core/dist/index.d.ts` and confirm: `onChange` callback argument shape (the `Data` object), `metadata` prop on `Puck`/`Render`, field types `slot`/`external`/`custom`, and `overrides.header`. Note any signature differences and adapt later tasks accordingly.

- [ ] **Step 4: Import Puck CSS once in the admin layout**

In `src/app/(payload)/layout.tsx`, add at the top with the other imports:
```tsx
import '@puckeditor/core/puck.css'
```

- [ ] **Step 5: Verify build still compiles**

Run: `npm run build`
Expected: exit 0 (no usage yet, just the CSS import + deps present).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json "src/app/(payload)/layout.tsx"
git commit -m "chore: add Puck + TipTap deps, import Puck CSS in admin"
```

---

## Task 2: Core types, locale helper, editing-locale context

**Files:**
- Create: `src/puck/types.ts`
- Create: `src/puck/locale-context.tsx`

- [ ] **Step 1: Write `src/puck/types.ts`**

```ts
// Locale map: one value per site language. `ge` is the source-of-truth
// fallback (matches the rest of the codebase).
export type BuilderLocale = 'ge' | 'en' | 'ru'
export const BUILDER_LOCALES: BuilderLocale[] = ['ge', 'en', 'ru']

export type Loc<T> = Partial<Record<BuilderLocale, T>>

// Resolve a locale map to a concrete value, falling back to ge then ''.
export function pickLocale<T>(map: Loc<T> | undefined, locale: BuilderLocale): T | undefined {
  if (!map) return undefined
  return map[locale] ?? map.ge
}

export function pickText(map: Loc<string> | undefined, locale: BuilderLocale): string {
  return pickLocale(map, locale) ?? ''
}

// A media reference stored by the external Media field.
export type MediaRef = {
  id: string | number
  url: string
  alt?: string | null
  width?: number | null
  height?: number | null
}
```

- [ ] **Step 2: Write `src/puck/locale-context.tsx`**

```tsx
'use client'

import { createContext, useContext } from 'react'
import type { BuilderLocale } from './types'

// The locale currently being *edited* in the builder. Custom fields read
// this so a single shared layout edits the right language's text. Display
// (block render) uses Puck `metadata.locale` instead — see config.tsx.
export const BuilderLocaleContext = createContext<BuilderLocale>('ge')

export function useBuilderLocale(): BuilderLocale {
  return useContext(BuilderLocaleContext)
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors in the two new files (pre-existing errors elsewhere are out of scope; confirm none reference `src/puck/`).

- [ ] **Step 4: Commit**

```bash
git add src/puck/types.ts src/puck/locale-context.tsx
git commit -m "feat(puck): core locale types + editing-locale context"
```

---

## Task 3: Shared TipTap extensions + server HTML renderer

**Files:**
- Create: `src/puck/tiptap.ts`

- [ ] **Step 1: Write `src/puck/tiptap.ts`**

```ts
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { generateHTML } from '@tiptap/html'
import type { JSONContent } from '@tiptap/react'

// One extension list shared by the editor (LocalizedRichTextField) and the
// server renderer, so what editors type renders identically on the page.
export const tiptapExtensions = [
  StarterKit.configure({ heading: { levels: [3, 4] } }),
  Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener', class: 'text-pink underline' } }),
]

// Render stored TipTap JSON to a sanitized HTML string on the server. We
// generate from structured JSON (not stored HTML) so no raw user HTML is
// ever injected.
export function richTextToHtml(json: JSONContent | undefined | null): string {
  if (!json) return ''
  try {
    return generateHTML(json, tiptapExtensions)
  } catch {
    return ''
  }
}

export type { JSONContent }
```

- [ ] **Step 2: Verify the generator runs in Node**

Run:
```bash
node --input-type=module -e "import('@tiptap/html').then(m=>console.log(typeof m.generateHTML))"
```
Expected: prints `function`. (If `@tiptap/html` resolves only as CJS, import via `require` in the file instead — note and adapt.)

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add src/puck/tiptap.ts
git commit -m "feat(puck): shared TipTap extensions + server HTML renderer"
```

---

## Task 4: Custom locale-aware fields (text + rich text)

**Files:**
- Create: `src/puck/fields/LocalizedTextField.tsx`
- Create: `src/puck/fields/LocalizedRichTextField.tsx`

- [ ] **Step 1: Write `src/puck/fields/LocalizedTextField.tsx`**

```tsx
'use client'

import * as React from 'react'
import { FieldLabel } from '@puckeditor/core'
import { useBuilderLocale } from '../locale-context'
import type { Loc } from '../types'

// A Puck `custom` field render that edits one language of a Loc<string>.
// `multiline` toggles textarea vs input.
export function localizedTextField(opts: { label: string; multiline?: boolean }) {
  return {
    type: 'custom' as const,
    render: ({ value, onChange }: { value?: Loc<string>; onChange: (v: Loc<string>) => void }) => {
      const locale = useBuilderLocale()
      const current = value?.[locale] ?? ''
      const set = (next: string) => onChange({ ...(value ?? {}), [locale]: next })
      return (
        <FieldLabel label={`${opts.label} (${locale.toUpperCase()})`}>
          {opts.multiline ? (
            <textarea
              value={current}
              onChange={(e) => set(e.currentTarget.value)}
              rows={3}
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
            />
          ) : (
            <input
              value={current}
              onChange={(e) => set(e.currentTarget.value)}
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
            />
          )}
        </FieldLabel>
      )
    },
  }
}
```

- [ ] **Step 2: Write `src/puck/fields/LocalizedRichTextField.tsx`**

```tsx
'use client'

import * as React from 'react'
import { FieldLabel } from '@puckeditor/core'
import { useEditor, EditorContent } from '@tiptap/react'
import { tiptapExtensions, type JSONContent } from '../tiptap'
import { useBuilderLocale } from '../locale-context'
import type { Loc } from '../types'

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null
  const btn = (active: boolean): React.CSSProperties => ({
    padding: '2px 8px', marginRight: 4, borderRadius: 4,
    border: '1px solid #ddd', background: active ? '#DD64A6' : '#fff',
    color: active ? '#fff' : '#3D3D3D', cursor: 'pointer',
  })
  return (
    <div style={{ marginBottom: 6 }}>
      <button type="button" style={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
      <button type="button" style={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}>i</button>
      <button type="button" style={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>• list</button>
      <button type="button" style={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. list</button>
      <button type="button" style={btn(editor.isActive('link'))} onClick={() => {
        const url = window.prompt('URL') || ''
        if (url) editor.chain().focus().setLink({ href: url }).run()
        else editor.chain().focus().unsetLink().run()
      }}>link</button>
    </div>
  )
}

// Inner editor keyed by locale so switching language remounts with that
// language's content (TipTap is uncontrolled after init).
function RichTextEditor({ value, onChange }: { value: JSONContent | undefined; onChange: (j: JSONContent) => void }) {
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: value ?? { type: 'doc', content: [] },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    immediatelyRender: false,
  })
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 8 }}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export function localizedRichTextField(opts: { label: string }) {
  return {
    type: 'custom' as const,
    render: ({ value, onChange }: { value?: Loc<JSONContent>; onChange: (v: Loc<JSONContent>) => void }) => {
      const locale = useBuilderLocale()
      const current = value?.[locale]
      const set = (next: JSONContent) => onChange({ ...(value ?? {}), [locale]: next })
      return (
        <FieldLabel label={`${opts.label} (${locale.toUpperCase()})`}>
          <RichTextEditor key={locale} value={current} onChange={set} />
        </FieldLabel>
      )
    },
  }
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit`
Expected: no errors in `src/puck/fields/`.
```bash
git add src/puck/fields
git commit -m "feat(puck): locale-aware custom fields (text + TipTap rich text)"
```

---

## Task 5: Puck config skeleton + Root + simple blocks (Heading, Quote, Button, Divider)

**Files:**
- Create: `src/puck/blocks/Heading.tsx`
- Create: `src/puck/blocks/Quote.tsx`
- Create: `src/puck/blocks/Button.tsx`
- Create: `src/puck/blocks/Divider.tsx`
- Create: `src/puck/empty-data.ts`
- Create: `src/puck/config.tsx`

- [ ] **Step 1: Write `src/puck/blocks/Heading.tsx`**

```tsx
import type { ComponentConfig } from '@puckeditor/core'
import { localizedTextField } from '../fields/LocalizedTextField'
import { pickText, type Loc, type BuilderLocale } from '../types'

export type HeadingProps = { level: 'h2' | 'h3'; text: Loc<string> }

export const Heading: ComponentConfig<HeadingProps> = {
  label: 'სათაური (Heading)',
  fields: {
    level: { type: 'radio', options: [ { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' } ] },
    text: localizedTextField({ label: 'Heading text' }),
  },
  defaultProps: { level: 'h2', text: {} },
  render: ({ level, text, puck }) => {
    const locale = (puck?.metadata?.locale as BuilderLocale) ?? 'ge'
    const Tag = level
    return <Tag className="text-blackberry font-bold mt-8 mb-3 break-words">{pickText(text, locale)}</Tag>
  },
}
```

- [ ] **Step 2: Write `src/puck/blocks/Quote.tsx`**

```tsx
import type { ComponentConfig } from '@puckeditor/core'
import { localizedTextField } from '../fields/LocalizedTextField'
import { pickText, type Loc, type BuilderLocale } from '../types'

export type QuoteProps = { text: Loc<string>; attribution: Loc<string> }

export const Quote: ComponentConfig<QuoteProps> = {
  label: 'ციტატა (Quote)',
  fields: {
    text: localizedTextField({ label: 'Quote', multiline: true }),
    attribution: localizedTextField({ label: 'Attribution' }),
  },
  defaultProps: { text: {}, attribution: {} },
  render: ({ text, attribution, puck }) => {
    const locale = (puck?.metadata?.locale as BuilderLocale) ?? 'ge'
    return (
      <blockquote className="border-l-4 border-pink bg-pink-light/30 rounded-r-xl py-3 px-5 my-6">
        <p className="text-grey italic break-words">{pickText(text, locale)}</p>
        {pickText(attribution, locale) && (
          <cite className="block mt-2 text-[13px] text-grey-light not-italic">— {pickText(attribution, locale)}</cite>
        )}
      </blockquote>
    )
  },
}
```

- [ ] **Step 3: Write `src/puck/blocks/Button.tsx`**

```tsx
import type { ComponentConfig } from '@puckeditor/core'
import { localizedTextField } from '../fields/LocalizedTextField'
import { pickText, type Loc, type BuilderLocale } from '../types'

export type ButtonProps = { label: Loc<string>; href: string; variant: 'primary' | 'secondary' }

export const Button: ComponentConfig<ButtonProps> = {
  label: 'ღილაკი (Button)',
  fields: {
    label: localizedTextField({ label: 'Button label' }),
    href: { type: 'text' },
    variant: { type: 'radio', options: [ { label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' } ] },
  },
  defaultProps: { label: {}, href: '#', variant: 'primary' },
  render: ({ label, href, variant, puck }) => {
    const locale = (puck?.metadata?.locale as BuilderLocale) ?? 'ge'
    const cls = variant === 'primary'
      ? 'bg-blackberry text-white hover:bg-blackberry-light'
      : 'border border-blackberry/20 text-blackberry hover:bg-white'
    return (
      <a href={href} className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold no-underline my-4 transition-colors ${cls}`}>
        {pickText(label, locale)}
      </a>
    )
  },
}
```

- [ ] **Step 4: Write `src/puck/blocks/Divider.tsx`**

```tsx
import type { ComponentConfig } from '@puckeditor/core'

export type DividerProps = Record<string, never>

export const Divider: ComponentConfig<DividerProps> = {
  label: 'გამყოფი ხაზი (Divider)',
  fields: {},
  render: () => <hr className="my-8 border-t border-blackberry/10" />,
}
```

- [ ] **Step 5: Write `src/puck/empty-data.ts`**

```ts
import type { Data } from '@puckeditor/core'

export const EMPTY_PUCK_DATA: Data = { content: [], root: {} }
```

- [ ] **Step 6: Write `src/puck/config.tsx`**

```tsx
import type { Config } from '@puckeditor/core'
import { Heading, type HeadingProps } from './blocks/Heading'
import { Quote, type QuoteProps } from './blocks/Quote'
import { Button, type ButtonProps } from './blocks/Button'
import { Divider, type DividerProps } from './blocks/Divider'

// Props union for all components. Extend as blocks are added in later tasks.
export type Components = {
  Heading: HeadingProps
  Quote: QuoteProps
  Button: ButtonProps
  Divider: DividerProps
}

// Root constrains width + base typography so the editor canvas matches the
// public article column (max-w-4xl, prose-like spacing).
export const config: Config<Components> = {
  root: {
    render: ({ children }) => (
      <div className="prose prose-base sm:prose-lg max-w-none flow-root prose-headings:text-blackberry prose-p:text-grey prose-a:text-pink break-words">
        {children}
      </div>
    ),
  },
  components: {
    Heading,
    Quote,
    Button,
    Divider,
  },
}
```

- [ ] **Step 7: Typecheck + commit**

Run: `npx tsc --noEmit`
Expected: no errors in `src/puck/`.
```bash
git add src/puck
git commit -m "feat(puck): config skeleton + Root, Heading, Quote, Button, Divider blocks"
```

---

## Task 6: RichText block

**Files:**
- Create: `src/puck/blocks/RichText.tsx`
- Modify: `src/puck/config.tsx`

- [ ] **Step 1: Write `src/puck/blocks/RichText.tsx`**

```tsx
import type { ComponentConfig } from '@puckeditor/core'
import { localizedRichTextField } from '../fields/LocalizedRichTextField'
import { richTextToHtml, type JSONContent } from '../tiptap'
import { pickLocale, type Loc, type BuilderLocale } from '../types'

export type RichTextProps = { content: Loc<JSONContent> }

export const RichText: ComponentConfig<RichTextProps> = {
  label: 'ტექსტი (Rich text)',
  fields: { content: localizedRichTextField({ label: 'Text' }) },
  defaultProps: { content: {} },
  render: ({ content, puck }) => {
    const locale = (puck?.metadata?.locale as BuilderLocale) ?? 'ge'
    const html = richTextToHtml(pickLocale(content, locale))
    return <div className="my-4 break-words" dangerouslySetInnerHTML={{ __html: html }} />
  },
}
```

- [ ] **Step 2: Register it in `src/puck/config.tsx`**

Add the import and entry:
```tsx
import { RichText, type RichTextProps } from './blocks/RichText'
```
Add `RichText: RichTextProps` to `Components`, and `RichText,` to `components`.

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add src/puck/blocks/RichText.tsx src/puck/config.tsx
git commit -m "feat(puck): RichText block (TipTap, per-locale)"
```

---

## Task 7: Image block (external Media field)

**Files:**
- Create: `src/puck/fields/mediaField.ts`
- Create: `src/puck/blocks/Image.tsx`
- Modify: `src/puck/config.tsx`

- [ ] **Step 1: Write `src/puck/fields/mediaField.ts`**

```ts
import type { MediaRef } from '../types'

// Puck `external` field that lists images from Payload's Media collection
// via REST. The selected row is stored (id+url+alt) on the block props.
export const mediaField = {
  type: 'external' as const,
  placeholder: 'აირჩიეთ სურათი',
  // Map Payload's media doc -> the row shape Puck displays and stores.
  mapProp: (item: Record<string, unknown>): MediaRef => ({
    id: item.id as string | number,
    url: (item.url as string) ?? '',
    alt: (item.alt as string) ?? '',
    width: (item.width as number) ?? null,
    height: (item.height as number) ?? null,
  }),
  getItemSummary: (item: MediaRef) => (item.alt || String(item.url).split('/').pop() || 'image'),
  // Confirmed (Task 1): external fetchList receives { query, filters }.
  fetchList: async ({ query }: { query: string; filters: Record<string, unknown> }): Promise<MediaRef[]> => {
    const params = new URLSearchParams({ limit: '50', depth: '0' })
    if (query) params.set('where[filename][contains]', query)
    const res = await fetch(`/api/media?${params.toString()}`, { credentials: 'include' })
    if (!res.ok) return []
    const json = (await res.json()) as { docs?: Array<Record<string, unknown>> }
    return (json.docs ?? []).map((d) => ({
      id: d.id as string | number,
      url: (d.url as string) ?? '',
      alt: (d.alt as string) ?? '',
      width: (d.width as number) ?? null,
      height: (d.height as number) ?? null,
    }))
  },
}
```

> Note for executor: confirm the `external` field's `fetchList`/`mapProp`/`getItemSummary` signatures against `index.d.ts` from Task 1; adjust arg names if the installed version differs.

- [ ] **Step 2: Write `src/puck/blocks/Image.tsx`**

```tsx
import type { ComponentConfig } from '@puckeditor/core'
import { mediaField } from '../fields/mediaField'
import { localizedTextField } from '../fields/LocalizedTextField'
import { pickText, type Loc, type MediaRef, type BuilderLocale } from '../types'

export type ImageProps = {
  media: MediaRef | null
  align: 'left' | 'center' | 'right' | 'full'
  width: number
  caption: Loc<string>
  radius: 'none' | 'lg' | 'full'
  shadow: 'none' | 'soft' | 'strong'
}

const alignClass: Record<ImageProps['align'], string> = {
  left: 'mr-auto', center: 'mx-auto', right: 'ml-auto', full: 'w-full',
}
const radiusClass: Record<ImageProps['radius'], string> = {
  none: 'rounded-none', lg: 'rounded-xl sm:rounded-2xl', full: 'rounded-full aspect-square object-cover',
}
const shadowClass: Record<ImageProps['shadow'], string> = {
  none: '', soft: 'shadow-md shadow-blackberry/10', strong: 'shadow-xl shadow-blackberry/20',
}

export const Image: ComponentConfig<ImageProps> = {
  label: 'სურათი (Image)',
  fields: {
    media: mediaField,
    align: { type: 'radio', options: [
      { label: '◀ Left', value: 'left' }, { label: 'Center', value: 'center' },
      { label: 'Right ▶', value: 'right' }, { label: 'Full width', value: 'full' },
    ] },
    width: { type: 'number', min: 10, max: 100 },
    caption: localizedTextField({ label: 'Caption' }),
    radius: { type: 'radio', options: [ { label: 'Sharp', value: 'none' }, { label: 'Rounded', value: 'lg' }, { label: 'Circle', value: 'full' } ] },
    shadow: { type: 'radio', options: [ { label: 'None', value: 'none' }, { label: 'Soft', value: 'soft' }, { label: 'Strong', value: 'strong' } ] },
  },
  defaultProps: { media: null, align: 'center', width: 75, caption: {}, radius: 'lg', shadow: 'none' },
  render: ({ media, align, width, caption, radius, shadow, puck }) => {
    const locale = (puck?.metadata?.locale as BuilderLocale) ?? 'ge'
    if (!media?.url) {
      return <div className="my-6 p-6 text-center text-grey-light border border-dashed border-grey/30 rounded-lg">აირჩიეთ სურათი</div>
    }
    const style = align === 'full' ? undefined : { width: `${width}%` }
    return (
      <figure className={`my-6 sm:my-8 max-w-full ${align === 'full' ? '' : 'block'} ${alignClass[align]}`} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.url} alt={media.alt ?? pickText(caption, locale)} className={`block w-full h-auto ${radiusClass[radius]} ${shadowClass[shadow]}`} />
        {pickText(caption, locale) && (
          <figcaption className="text-[13px] text-grey-light text-center mt-3 italic break-words">{pickText(caption, locale)}</figcaption>
        )}
      </figure>
    )
  },
}
```

- [ ] **Step 3: Register in `src/puck/config.tsx`** (import + `Image: ImageProps` in `Components` + `Image,` in `components`).

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add src/puck/fields/mediaField.ts src/puck/blocks/Image.tsx src/puck/config.tsx
git commit -m "feat(puck): Image block using Media library (external field)"
```

---

## Task 8: ImageText block (slots, columns | wrap)

**Files:**
- Create: `src/puck/blocks/ImageText.tsx`
- Modify: `src/puck/config.tsx`

- [ ] **Step 1: Write `src/puck/blocks/ImageText.tsx`**

```tsx
import type { CSSProperties } from 'react'
import type { ComponentConfig, Slot } from '@puckeditor/core'

export type ImageTextProps = {
  image: Slot
  text: Slot
  imageSide: 'left' | 'right'
  layout: 'columns' | 'wrap'
  ratio: '1-1' | '1-2' | '2-1'
}

export const ImageText: ComponentConfig<ImageTextProps> = {
  label: 'სურათი + ტექსტი (Image + Text)',
  fields: {
    image: { type: 'slot' },
    text: { type: 'slot' },
    imageSide: { type: 'radio', options: [ { label: 'Image left', value: 'left' }, { label: 'Image right', value: 'right' } ] },
    layout: { type: 'radio', options: [ { label: 'Side-by-side', value: 'columns' }, { label: 'Text wraps image', value: 'wrap' } ] },
    ratio: { type: 'radio', options: [ { label: '1:1', value: '1-1' }, { label: '1:2', value: '1-2' }, { label: '2:1', value: '2-1' } ] },
  },
  defaultProps: { image: [], text: [], imageSide: 'left', layout: 'columns', ratio: '1-1' },
  render: ({ image: ImageZone, text: TextZone, imageSide, layout, ratio }) => {
    if (layout === 'wrap') {
      // Float the image inside one flow container so text wraps around it.
      return (
        <div className="my-6 flow-root">
          <div className={`max-w-full mb-4 ${imageSide === 'left' ? 'md:float-left md:mr-6' : 'md:float-right md:ml-6'} md:w-1/2`}>
            <ImageZone />
          </div>
          <TextZone />
        </div>
      )
    }
    // ratio is image:text. Each slot is rendered EXACTLY ONCE (Puck breaks
    // if a slot renders twice). Mobile: grid-cols-1 stacks them, image first
    // (DOM order). Desktop: 2 columns sized by ratio; CSS `order` puts the
    // image on the chosen side without re-rendering.
    const [imgFr, txtFr] = ratio === '1-1' ? [1, 1] : ratio === '1-2' ? [1, 2] : [2, 1]
    const gridCols = imageSide === 'left' ? `${imgFr}fr ${txtFr}fr` : `${txtFr}fr ${imgFr}fr`
    return (
      <div
        className="my-6 grid grid-cols-1 gap-6 items-center md:[grid-template-columns:var(--it-cols)]"
        style={{ '--it-cols': gridCols } as CSSProperties}
      >
        <div className={imageSide === 'left' ? 'md:order-1' : 'md:order-2'}>
          <ImageZone />
        </div>
        <div className={imageSide === 'left' ? 'md:order-2' : 'md:order-1'}>
          <TextZone />
        </div>
      </div>
    )
  },
}
```

> Note: slots accept any component; in practice editors drop an **Image** into `image` and **RichText** into `text`. No restriction needed, but `allow` can be added later.

- [ ] **Step 2: Register in `src/puck/config.tsx`** (import + `ImageText: ImageTextProps` + `ImageText,`).

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add src/puck/blocks/ImageText.tsx src/puck/config.tsx
git commit -m "feat(puck): ImageText block (slots; side-by-side + wrap layouts)"
```

---

## Task 9: Gallery + Callout blocks

**Files:**
- Create: `src/puck/blocks/Gallery.tsx`
- Create: `src/puck/blocks/Callout.tsx`
- Modify: `src/puck/config.tsx`

- [ ] **Step 1: Write `src/puck/blocks/Gallery.tsx`**

```tsx
import type { ComponentConfig } from '@puckeditor/core'
import { mediaField } from '../fields/mediaField'
import type { MediaRef } from '../types'

export type GalleryProps = { images: { media: MediaRef | null }[]; columns: 2 | 3 | 4 }

export const Gallery: ComponentConfig<GalleryProps> = {
  label: 'გალერეა (Gallery)',
  fields: {
    images: { type: 'array', arrayFields: { media: mediaField }, getItemSummary: (_, i) => `Image ${(i ?? 0) + 1}` },
    columns: { type: 'radio', options: [ { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 } ] },
  },
  defaultProps: { images: [], columns: 3 },
  render: ({ images, columns }) => (
    <div className="my-6 grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {images.filter((it) => it.media?.url).map((it, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={it.media!.url} alt={it.media!.alt ?? ''} className="w-full h-full object-cover rounded-xl aspect-[4/3]" />
      ))}
    </div>
  ),
}
```

- [ ] **Step 2: Write `src/puck/blocks/Callout.tsx`**

```tsx
import type { ComponentConfig } from '@puckeditor/core'
import { localizedRichTextField } from '../fields/LocalizedRichTextField'
import { richTextToHtml, type JSONContent } from '../tiptap'
import { pickLocale, type Loc, type BuilderLocale } from '../types'

export type CalloutProps = { variant: 'note' | 'warning' | 'tip'; content: Loc<JSONContent> }

const variantClass: Record<CalloutProps['variant'], string> = {
  note: 'bg-pink-light/30 border-pink', warning: 'bg-amber-50 border-amber-400', tip: 'bg-blackberry/5 border-blackberry',
}

export const Callout: ComponentConfig<CalloutProps> = {
  label: 'შენიშვნა (Callout)',
  fields: {
    variant: { type: 'radio', options: [ { label: 'Note', value: 'note' }, { label: 'Warning', value: 'warning' }, { label: 'Tip', value: 'tip' } ] },
    content: localizedRichTextField({ label: 'Callout text' }),
  },
  defaultProps: { variant: 'note', content: {} },
  render: ({ variant, content, puck }) => {
    const locale = (puck?.metadata?.locale as BuilderLocale) ?? 'ge'
    return (
      <div className={`my-6 border-l-4 rounded-r-xl px-5 py-4 break-words ${variantClass[variant]}`}
        dangerouslySetInnerHTML={{ __html: richTextToHtml(pickLocale(content, locale)) }} />
    )
  },
}
```

- [ ] **Step 3: Register both in `src/puck/config.tsx`** (imports + `Gallery: GalleryProps`, `Callout: CalloutProps` + `Gallery,`, `Callout,`).

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add src/puck/blocks/Gallery.tsx src/puck/blocks/Callout.tsx src/puck/config.tsx
git commit -m "feat(puck): Gallery + Callout blocks"
```

---

## Task 10: Locale switcher header override

**Files:**
- Create: `src/puck/LocaleSwitcherHeader.tsx`

- [ ] **Step 1: Write `src/puck/LocaleSwitcherHeader.tsx`**

```tsx
'use client'

import * as React from 'react'
import { BUILDER_LOCALES, type BuilderLocale } from './types'

// Returns a Puck `overrides.header` render that adds a GE/EN/RU switch
// alongside the default actions. The selected locale is lifted to the
// parent (PuckBuilderField) so it can drive metadata + the edit context.
export function makeLocaleHeader(locale: BuilderLocale, setLocale: (l: BuilderLocale) => void) {
  return function Header({ actions }: { actions: React.ReactNode }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #eee', background: '#fff' }}>
        <strong style={{ color: '#682149' }}>ბილდერი</strong>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div role="group" aria-label="Edit language" style={{ display: 'flex', gap: 4 }}>
            {BUILDER_LOCALES.map((l) => (
              <button key={l} type="button" onClick={() => setLocale(l)}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer',
                  background: l === locale ? '#DD64A6' : '#fff', color: l === locale ? '#fff' : '#3D3D3D', fontWeight: 600 }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div>{actions}</div>
        </div>
      </div>
    )
  }
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add src/puck/LocaleSwitcherHeader.tsx
git commit -m "feat(puck): builder header with GE/EN/RU edit-language switch"
```

---

## Task 11: Payload Field component (embed Puck) + full-width CSS

**Files:**
- Create: `src/components/admin/PuckBuilderField.tsx`
- Modify: `src/app/(payload)/custom.scss`

- [ ] **Step 1: Write `src/components/admin/PuckBuilderField.tsx`**

```tsx
'use client'

import * as React from 'react'
import { useField } from '@payloadcms/ui'
import { Puck, type Data } from '@puckeditor/core'
import { config } from '@/puck/config'
import { EMPTY_PUCK_DATA } from '@/puck/empty-data'
import { BuilderLocaleContext } from '@/puck/locale-context'
import { makeLocaleHeader } from '@/puck/LocaleSwitcherHeader'
import type { BuilderLocale } from '@/puck/types'

// Custom Field for the unlocalized `puckData` JSON field. Drives Puck via
// onChange -> setValue; Payload's Save button persists the value. The Puck
// "Publish" button is overridden away (we save through Payload, not Puck).
export const PuckBuilderField: React.FC<{ path?: string }> = ({ path = 'puckData' }) => {
  const { value, setValue } = useField<Data>({ path })
  const [locale, setLocale] = React.useState<BuilderLocale>('ge')
  const data = (value && typeof value === 'object' && 'content' in value) ? value : EMPTY_PUCK_DATA

  const Header = React.useMemo(() => makeLocaleHeader(locale, setLocale), [locale])

  return (
    <div className="puck-builder-field" data-puck-locale={locale}>
      <BuilderLocaleContext.Provider value={locale}>
        <Puck
          config={config}
          data={data}
          metadata={{ locale }}
          onChange={(next: Data) => setValue(next)}
          overrides={{
            header: Header,
            // Hide Puck's own publish action — Payload owns saving.
            headerActions: () => null,
          }}
        />
      </BuilderLocaleContext.Provider>
    </div>
  )
}

export default PuckBuilderField
```

> Note: confirm `onChange`'s argument from Task 1. If the installed version passes `(data, appState)` or only updates via a different prop, adapt this single call site.

- [ ] **Step 2: Add full-bleed CSS to `src/app/(payload)/custom.scss`**

Append:
```scss
/* Puck builder field: break out of the constrained form column and give the
   editor real width + height. Mirrors the full-bleed treatment used for
   .field-news-body. */
.puck-builder-field {
  margin-inline: calc(-50vw + 50%);
  width: 100vw;
  max-width: 100vw;
  height: 80vh;
  min-height: 600px;
}
.puck-builder-field .Puck {
  height: 100%;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/PuckBuilderField.tsx "src/app/(payload)/custom.scss"
git commit -m "feat(admin): PuckBuilderField embedding Puck via useField + full-bleed CSS"
```

---

## Task 12: Wire News collection + push schema

**Files:**
- Modify: `src/collections/News.ts`

- [ ] **Step 1: Add the `puckData` field and relax `body`**

In `src/collections/News.ts`, inside the "კონტენტი" tab `fields` array, after the `body` field, add:
```ts
{
  name: 'puckData',
  type: 'json',
  label: false,
  // Unlocalized: one shared layout; per-language text lives inside the
  // Puck tree as {ge,en,ru} maps. Edited only via the builder component.
  admin: {
    components: { Field: '/components/admin/PuckBuilderField#PuckBuilderField' },
  },
},
```
Change the existing `body` field: remove `required: true`, and add `admin: { ..., hidden: true }` (keep the existing `className`/`description` keys; just add `hidden: true` and drop `required`). Keeping the column avoids a destructive `push`.

- [ ] **Step 2: Regenerate the import map**

Run: `npx payload generate:importmap`
Expected: `src/app/(payload)/admin/importMap.js` updated to include `PuckBuilderField`. Confirm the export appears.

- [ ] **Step 3: Push schema via dev server**

Run (background): `npm run dev`
Then load the admin News create page (use the printed port):
```bash
curl -s -o /dev/null -w "%{http_code}\n" --max-time 90 http://localhost:3002/admin/collections/news/create
```
Expected: `200`. Check the dev log shows schema sync with no errors and that a `puck_data` JSON column was added to `news`:
```bash
docker exec clinic-postgres psql -U clinic -d clinic -t -c "select column_name from information_schema.columns where table_name='news' and column_name='puck_data';"
```
Expected: prints `puck_data`.

- [ ] **Step 4: Manual smoke check (browser)**

Open `http://localhost:3002/admin/collections/news/create`. Confirm: the Builder field renders Puck full-width; the GE/EN/RU switch shows in the header; dragging a Heading + RichText onto the canvas works; switching language changes the editable text while structure stays. Save the draft; reopen; confirm the layout persisted.

- [ ] **Step 5: Commit**

```bash
git add src/collections/News.ts "src/app/(payload)/admin/importMap.js"
git commit -m "feat(news): add puckData builder field; body now optional/hidden"
```

---

## Task 13: Frontend render (Puck with Lexical fallback)

**Files:**
- Create: `src/components/blog/PuckArticle.tsx`
- Modify: `src/lib/payload-data.ts` (`getNewsBySlug`)
- Modify: `src/app/(frontend)/[locale]/blog/[slug]/page.tsx`

- [ ] **Step 1: Write `src/components/blog/PuckArticle.tsx`**

```tsx
'use client'

import { Render, type Data } from '@puckeditor/core'
import { config } from '@/puck/config'
import type { BuilderLocale } from '@/puck/types'

// Renders a published Puck layout for the given locale. Client component so
// Puck's <Render> runs without RSC edge-cases; Next still SSRs the markup
// for SEO.
export default function PuckArticle({ data, locale }: { data: Data; locale: BuilderLocale }) {
  return <Render config={config} data={data} metadata={{ locale }} />
}
```

- [ ] **Step 2: Return `puckData` from `getNewsBySlug`**

In `src/lib/payload-data.ts`, find `getNewsBySlug` and add `puckData` to the returned object:
```ts
puckData: (doc.puckData as Record<string, unknown> | null) ?? null,
```
(Place it alongside `body` in the mapped return.)

- [ ] **Step 3: Swap the render in the blog page**

In `src/app/(frontend)/[locale]/blog/[slug]/page.tsx`:

Add imports near the top:
```tsx
import PuckArticle from "@/components/blog/PuckArticle";
import type { Data } from "@puckeditor/core";
```

Replace the existing body render block (currently):
```tsx
          {article.body && typeof article.body === 'object' && 'root' in article.body && (
            <LexicalContent data={article.body as SerializedEditorState} />
          )}
```
with:
```tsx
          {article.puckData && typeof article.puckData === 'object' && 'content' in article.puckData ? (
            <PuckArticle data={article.puckData as Data} locale={loc} />
          ) : (
            article.body && typeof article.body === 'object' && 'root' in article.body && (
              <LexicalContent data={article.body as SerializedEditorState} />
            )
          )}
```

- [ ] **Step 4: Verify render + build**

With dev running, open a saved Puck post in the browser at `/ge/blog/<slug>` and confirm it matches the builder canvas; switch to `/en/blog/<slug>` and `/ru/...` and confirm the text language changes while layout stays.
Run: `npm run build`
Expected: exit 0, TypeScript clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/blog/PuckArticle.tsx src/lib/payload-data.ts "src/app/(frontend)/[locale]/blog/[slug]/page.tsx"
git commit -m "feat(blog): render Puck layout on article page with Lexical fallback"
```

---

## Task 14: Final verification + migrate the 3 existing posts

**Files:** none (content + verification)

- [ ] **Step 1: Lint the new code**

Run: `npx eslint src/puck "src/components/admin/PuckBuilderField.tsx" "src/components/blog/PuckArticle.tsx"`
Expected: exit 0 (fix any new errors; pre-existing repo errors elsewhere are out of scope).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: exit 0, TypeScript clean, all routes compile.

- [ ] **Step 3: Recreate the 3 published posts in the builder**

For each of the 3 existing published posts: open it in admin, rebuild the body using Puck blocks (GE/EN/RU via the switch), Save. Confirm each renders correctly at `/ge|/en|/ru/blog/<slug>`.

- [ ] **Step 4: Acceptance pass (from the spec §16)**

Confirm in the browser, no code saving needed to preview:
- Builder canvas matches the public page.
- "Image + Text" places text beside an image with left/right toggle; stacks on mobile.
- Images come from the Media library.
- Language switch translates text in place without moving layout/images.
- A post with only legacy `body` still renders via the Lexical fallback.

- [ ] **Step 5: Final commit (if any tweaks)**

```bash
git add -A
git commit -m "chore(puck): final fixes after acceptance pass"
```

---

## Self-review notes (author)

- **Spec coverage:** §5 palette → Tasks 5–9 (Heading/Quote/Button/Divider/RichText/Image/ImageText/Gallery/Callout). §6 data model → Task 12. §7 localization → Tasks 2,4,10,11 (Loc maps, custom fields, context, metadata, switcher). §9 rich text → Tasks 3,4,6. §10 media → Task 7. §11 builder placement → Task 11–12. §12 frontend → Task 13. §13 migration → Task 14.
- **Open items deferred to Task 1 verification:** exact Puck package name and `onChange`/`external`-field signatures. All later code uses `@puckeditor/core`; substitute if Task 1 says otherwise.
- **Known caveat:** Puck `slot` rendering inside the `wrap` layout (Task 8) floats the image container; confirm wrapping behaves with short text in the browser during Task 12 smoke check.
