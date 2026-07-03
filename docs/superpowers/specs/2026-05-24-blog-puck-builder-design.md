# Blog/News Visual Builder (Puck) — Design

- **Date:** 2026-05-24
- **Status:** Approved (design); pending spec review
- **Scope:** Replace the Lexical `body` editor for the **News/blog** collection with a Puck visual builder. CMS **Pages** are out of scope and keep Lexical.

## 1. Problem

Editors cannot control how images sit relative to text (next to it, text-wrapped, image-first) without trial and error, and they must **save and open the live site** to see what a post will look like. This was the headline complaint about the previous CMS. The current Lexical editor *can* float images and has a custom resize toolbar, but the controls are split/duplicated and there is **no full-page preview** — so editors still guess.

## 2. Goals

1. **Layout choices are explicit and reliable.** Editors choose layouts (image + text side-by-side, image with wrapped text, full-width image, gallery, callout, quote, CTA) as discrete, named blocks — not by fiddling with float CSS.
2. **True WYSIWYG with no save-and-check.** The editing canvas renders the *same* components as the published page, so what they build is what ships.
3. **Trilingual (ge/en/ru)** content, built as **one shared layout** with translatable text.
4. **Reuse the existing Media library** for images (no parallel upload system).
5. **Don't fight Payload.** Keep the post as a Payload record (auth, drafts/versions, slug/SEO/metadata fields, REST API). Puck owns only the body.

## 3. Non-goals

- Not touching CMS **Pages** (they stay on Lexical, with the existing image toolbar/converters).
- Not removing the Lexical upload feature, `StyledUpload`, `Columns`/`Callout`/`Gallery` converters, or `LexicalContent` — Pages still use them.
- No programmatic content migration (only 3 published posts exist; they are recreated by hand).

## 4. Why Puck fits

- Puck's editing canvas renders the actual React components, so **the canvas is the preview** — this directly removes the save-and-check loop.
- Puck **`slot` fields** give structured multi-area layouts (CSS-grid columns), so "image + text side-by-side" is a guaranteed layout, not a float that breaks with short text.
- Puck **`external` field** lets a block pull a record from an external source (our Payload `/api/media`) — clean reuse of the Media collection.
- Puck **`custom` field** lets us embed a small rich-text editor and locale-aware inputs.

## 5. Architecture overview

```
Payload News record
├─ metadata fields (Payload-native): title, slug, category, excerpt,
│  author, publishedDate, status, showOnHomepage, featuredImage, SEO
├─ puckData (json, NOT localized)  ← the shared Puck document tree
└─ body (Lexical richText, hidden, no longer required) ← kept for push-safety

Admin edit view (News)
├─ Tab "ბილდერი (Builder)"  → full-width <Puck> (client) editing puckData
└─ Tab "პარამეტრები / SEO" → the Payload metadata fields

Shared Puck config  (src/puck/config.tsx)
└─ components: Heading, RichText, Image, ImageText, Gallery, Callout,
   Quote, Button, Divider  (+ root article container)
   render() of each block = the real frontend component

Public blog page  /[locale]/blog/[slug]
└─ if puckData → <Render config data metadata={{ locale }} /> (RSC)
   else          → <LexicalContent> (fallback during transition)
```

## 6. Data model

- Add `puckData` to `News`: `type: 'json'`, **not** localized, `admin: { hidden: true }` (edited via the Builder tab, never as a raw json field).
- `News.body`: drop `required: true`, set `admin.hidden: true`. Retained so `push: true` does not drop the column and existing rows deserialize unchanged.
- No other collection changes. Drafts/versions continue to work (they snapshot the whole record including `puckData`).

## 7. Localization — one layout, translatable text

The Puck tree is shared across all three languages. Localization lives **inside each block's props**, not in Payload's field localization.

- Every human-readable value is stored as a **locale map**: `{ ge: <value>, en: <value>, ru: <value> }`. This applies to: rich-text content, headings, image captions, image alt overrides, button labels.
- Non-text props (which image, alignment, image-side, width, columns) are shared across locales.
- A **locale switcher** in the Puck header (a Puck UI override) sets the "current editing locale", propagated to the canvas and fields via Puck **`metadata.locale`**.
  - Changing it re-renders the canvas in that language and points every locale-aware field at `value[locale]`.
  - Structure and images never move when switching language.
- The public page passes the request locale as `metadata.locale`; each block resolves `value[locale] ?? value.ge`.

This is the most custom part of the build: locale-aware `custom` fields plus the header switcher override. It is well-bounded and contained to the field components and the editor wrapper.

## 8. Component palette

Each block's `render` is the real frontend component, styled with the existing brand tokens (blackberry/pink/cream, FiraGO, rounded-2xl, shadows) so the canvas matches the article.

| Block | Fields | Notes |
|-------|--------|-------|
| **Root** (article container) | — | Constrains to the article column width and applies base `prose`-like typography so canvas == page. |
| **Heading** | `level` (H2/H3), `text` (locale map, plain) | Section headings. |
| **RichText** | `content` (locale map, TipTap JSON) | Paragraph copy: bold, italic, link, bullet/numbered lists. |
| **Image** | `media` (external→Media), `align` (left/center/right/full-width), `width` (%), `caption` (locale map), `border`, `radius`, `shadow` | Standalone image. `align` controls **horizontal placement within the column** — not cross-block text wrap. Reuses current `StyledUpload` styling tokens. |
| **ImageText** | `image` slot, `text` slot, `imageSide` (left/right), `layout` (columns \| wrap), `ratio`, `vAlign` | The block that owns "text beside / wrapped around an image" — because image and text live in **one container**, so wrapping actually works. `columns` = CSS-grid side-by-side; `wrap` = floated image with text flowing around it. Stacks vertically on mobile. |
| **Gallery** | `images` (list of external→Media), `columns` | Grid gallery; mirrors existing `GalleryRenderer`. |
| **Callout** | `variant` (note/warning/tip), `content` (locale map, RichText) | Mirrors existing `CalloutRenderer`. |
| **Quote** | `text` (locale map), `attribution` (locale map) | Blockquote styled like the current `prose-blockquote`. |
| **Button** | `label` (locale map), `href`, `style` (primary/secondary) | Locale-aware CTA. |
| **Divider** | — | Horizontal rule. |

**Block-model note:** unlike a document editor, blocks are independent containers — a float in one block cannot wrap text in another. So *all* "text wraps around image" behavior is delivered by the **ImageText** block (image + text in one container), never by floating a standalone Image block.

(Adjustable — YouTube embed, stats row, and doctor-card blocks are candidates for later.)

## 9. Rich text inside blocks

- RichText/Callout content uses a small **TipTap** editor (bold, italic, link, bullet + numbered lists) rendered as a Puck **`custom` field**.
- Stored as **TipTap JSON per locale**: `content = { ge: <json>, en: <json>, ru: <json> }`.
- Frontend renders TipTap JSON → HTML **server-side** (TipTap `generateHTML` with the same extension set). No raw user HTML is stored or injected.
- New dependencies: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link` (admin-only bundle; server uses the HTML generator).

## 10. Media integration

- Image/Gallery blocks use Puck's **`external` field**:
  - `fetchList` → Payload REST `GET /api/media` (search supported), returning `{ id, filename, url, alt, sizes }`.
  - `getItemSummary` shows the filename/thumbnail in the picker.
  - The selected item is stored in the block props (id + url + alt + sizes), so the frontend renders without an extra fetch.
- A custom field can optionally open Payload's native media drawer instead of a list; the `external` list is the baseline.

## 11. Builder integration with Payload

- The News collection gets a **custom edit-view tab** ("ბილდერი (Builder)") via Payload's admin view component slots. It renders the `<Puck>` editor full-width (client component).
- The tab reads `puckData` from the current document and writes changes back to the same field; saving the record persists it through Payload's normal save (drafts/versions intact).
- The default fields tab holds metadata + SEO.
- Rationale: keeps the builder inside Payload's auth/nav/versioning while giving Puck the full canvas width.

## 12. Frontend rendering

- `src/puck/config.tsx` (or a thin split, see Open Questions) defines the component config once. Editor and page import the **same** config so they cannot drift.
- `/[locale]/blog/[slug]/page.tsx`: if `puckData` is present → `<Render config={config} data={puckData} metadata={{ locale }} />` (server component); else fall back to `<LexicalContent>`.
- The Root container reproduces the article column width + base typography so the canvas and the page match pixel-for-pixel.

## 13. Migration

- Recreate the **3 existing published posts** in the builder by hand. No migration code.
- During transition, posts without `puckData` still render via the Lexical fallback, so nothing 404s mid-rollout.

## 14. Dependencies

- Puck core package — **verify exact name/version at implementation** (`@measured/puck` vs `@puckeditor/core`; current docs reference both).
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`.

## 15. Open questions to resolve during planning/implementation

1. **Puck package name + current version** — pin before coding; confirm `slot`, `external`, `custom`, and `metadata` APIs against that version.
2. **Payload 3 custom edit-view API** — exact slot for a full-width tab and the supported way to read/write a sibling field's value from within a custom view (form context vs local API on save).
3. **Config client/server split** — `<Render>` runs in an RSC; `<Puck>` runs client-side. Block `render` components that need client interactivity must be `'use client'`. Decide whether one config file suffices (with per-component client boundaries) or whether a server render config + client editor config is cleaner. Default: one config, mark interactive blocks as client components.
4. **`metadata.locale` accessor** — confirm exact way render functions read `metadata` in the installed Puck version.
5. **TipTap SSR** — confirm `generateHTML` runs in the Node server runtime used by the blog route.

## 16. Acceptance criteria

- An editor can build a News post entirely in the Builder tab and see it render identically to the public page **without saving**.
- An "Image + Text" block places text beside an image, with a left/right toggle, and stays correct on mobile (stacks).
- Images are chosen from the existing Media library.
- Switching the builder language switch translates text in place without altering layout or images; the public `/ge`, `/en`, `/ru` pages each show the correct language.
- The 3 existing posts are rebuilt and render correctly; any not-yet-migrated post still renders via the Lexical fallback.
- `npm run build` and `npm run lint` pass; schema pushes cleanly.
