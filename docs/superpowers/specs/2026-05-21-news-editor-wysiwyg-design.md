# News Editor WYSIWYG + Columns + Drag-Resize — Design

**Date:** 2026-05-21
**Scope:** Project-wide Lexical editor (used by News, Pages, and any future richText field).
**Driver:** Editors writing news articles cannot resize images by dragging, cannot place items side-by-side, and the editor canvas does not match the published page (no float-wrap preview, image edits require a full-page drawer).

## Goals

1. Word-doc behavior for inline images: click → handles + floating toolbar; drag a corner to resize; alignment toggles wrap text around the image **inside the editor canvas**.
2. A "Columns" block that holds two or three independently-editable rich-text cells inline (no drawer).
3. Editor canvas renders floated images the same way the public page does — true WYSIWYG.
4. Eliminate the full-page drawer for common image operations.

## Non-goals

- Replacing Lexical with TipTap / ProseMirror.
- Free-form "drop anywhere on the canvas" page-builder behavior.
- Nesting columns inside columns (one level only).
- Net-new DB columns. Everything persists inside the existing Lexical JSON blob.

## Architecture

Four additions to the existing project-wide `lexicalEditor` config in `src/payload.config.ts`. They compose; each is independently shippable.

### Piece 1 — `ColumnsBlock` (BlocksFeature)

A new block alongside the existing `CalloutBlock` and `GalleryBlock`. Layout picker: `50-50`, `33-67`, `67-33`, `33-33-33`. Each cell is a nested `richText` field with its own `lexicalEditor()` instance running the same features as the parent **except** `ColumnsBlock` itself — that breaks recursion deterministically.

```
src/blocks/lexical/ColumnsBlock.ts                              # block + nested cellEditor
src/components/blog/lexical-converters/ColumnsRenderer.tsx      # public-page renderer (recursive RichText)
src/app/(payload)/admin/custom.scss                             # one rule that lays the inline cells side-by-side in the editor
```

In the editor canvas, Payload's default behavior for blocks with nested `richText` fields is to render the cells inline as live editors. We add CSS to lay them out as a 2 or 3 column grid. Editing a cell is just typing in it. No drawer.

Persisted shape inside `news.body`:

```json
{
  "type": "block",
  "fields": {
    "blockType": "columns",
    "layout": "67-33",
    "left":   { "root": { /* SerializedEditorState */ } },
    "right":  { "root": { /* SerializedEditorState */ } }
  }
}
```

### Piece 2 — `ResizableUploadFeature`

A client-only Lexical feature that replaces the stock `UploadNode` canvas component via Lexical's `LexicalNodeReplacement` — same serialized `'upload'` type, same `fields` shape, same persistence path. Only the `decorate()` method changes.

```
src/lexical/features/resizable-upload/
    feature.client.ts                 # createClientFeature({ nodes: [{replace, with}], plugins: [...] })
    ResizableUploadNode.ts            # extends Payload's UploadNode, overrides decorate()
    ResizableUploadComponent.tsx      # the React component: <img> + 8 handles + selection
    FloatingUploadToolbar.tsx         # Piece 3 — lives next door, same feature
```

`ResizableUploadComponent`:

- Renders the same `<img>` Payload renders today.
- Wraps with 8 drag handles (corners + edges) using the Lexical playground `ImageResizer` pattern.
- During drag: mutates the `<img>` element's inline width directly. **No Lexical commit per frame.**
- On `pointerup`: commits the new width into `node.__data.fields.widthPercent` via `node.setData(...)`.
- Selection state from `useLexicalNodeSelection(nodeKey)`. Handles + toolbar only render when selected.
- Click an image → selected. Click elsewhere → deselected. Escape → deselected. Backspace/Delete → image removed.
- Lazy-loaded with `React.lazy()` (same pattern as Payload's stock UploadNode).

New field `widthPercent: number` (min 10, max 100, `admin.hidden: true`) appended to the existing `media.fields` array. Controlled exclusively by the drag handles and toolbar — no manual input.

### Piece 3 — `FloatingUploadToolbarPlugin`

A sibling Lexical plugin registered in the `floatingAnchorElem` slot (same slot Payload's own `InlineToolbar` uses). Cloned from `InlineToolbar` skeleton:

- Watches selection. When `$isNodeSelection` and the selected node is `UploadNode`, portals a toolbar above the image via `setFloatingElemPosition` + `createPortal(_, anchorElem)`.
- Toolbar layout (left → right):
  - **Alignment** (4 toggle buttons): ⬅ left-wrap, center, right-wrap ➡, full-width
  - **Width chips** (6 buttons): 25 / 33 / 50 / 66 / 75 / 100 %. Disabled when alignment = full-width.
  - **⚙ style** popover: border / shadow / radius (existing radio fields)
  - **Caption** inline input — saves on blur
  - **🗑 delete**
- Buttons mutate the node via `editor.update(() => { node.setFormat(...); node.setData({...}) })`.
- Drag-hide trick: `document` `mousemove` listener sets `opacity:0; pointer-events:none` while a Lexical drag is active; `mouseup` restores.

The full-screen drawer no longer needs to open for any common operation. A `…more` overflow keeps the drawer accessible for replace-file / alt-text edge cases.

### Piece 4 — Editor-canvas WYSIWYG parity for float-wrap

`ResizableUploadComponent` reads `fields.alignment` and applies the same Tailwind classes the public renderer uses (`float-left`, `md:float-right`, etc.). Lexical's `contenteditable` respects CSS float, so text typed below the image wraps around it inside the editor — matching the published page exactly.

For Phase 1 (before Piece 2 ships), a small SCSS rule in `src/app/(payload)/admin/custom.scss` applies the same float classes to the stock UploadComponent — the implementation plan will identify which DOM attribute / class the stock component exposes for alignment (`data-align`, format-prop class, or similar) and target that. If no usable hook exists, Phase 1 ships only the columns block and float-wrap parity moves into Phase 2 alongside the node replacement.

## Composition in `src/payload.config.ts`

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
          fields: [
            // ...existing alignment / size / borderStyle / shadow / radius / caption
            { name: 'widthPercent', type: 'number', min: 10, max: 100, admin: { hidden: true } },
          ],
        },
      },
    }),
    ResizableUploadFeature(),                                              // ← new (Pieces 2 + 3)
    BlocksFeature({ blocks: [CalloutBlock, GalleryBlock, ColumnsBlock] }), // ← new block (Piece 1)
  ],
}),
```

## Data model & persistence

### `widthPercent`

- Lives inside the Lexical JSON blob in the rich-text column (e.g. `news.body`). No DB schema migration.
- Write path: `node.setData({ ...node.getData(), fields: { ...fields, widthPercent: 62 }})` from resize handles / toolbar chips.
- Read path: `node.fields.widthPercent` in `StyledUpload.tsx`.
- Fallback: when unset, the renderer keeps the existing `size` preset (small/medium/large/full). Existing content keeps working without backfill.

### `StyledUpload.tsx` precedence rule

```tsx
const widthPercent = fields.widthPercent
const inlineStyle = widthPercent ? { width: `${widthPercent}%`, maxWidth: '100%' } : undefined
const sizeClassValue = widthPercent ? '' : sizeClass[size]
```

- If the user dragged or used a width chip → inline `width: N%`.
- If untouched → preset class wins.
- `fullWidth` alignment ignores both (already in StyledUpload).
- Toolbar's "clear width" action removes `widthPercent` and reverts to the size preset.

### `ColumnsBlock` localization

Each cell field is `localized: true`. The locale picker at the top of the form switches all cells together. Same UX as the parent body.

### `ColumnsBlock` recursion guard

`cellEditor` defined in the same file as `ColumnsBlock`. Its features omit `ColumnsBlock` itself. Schema sanitizer is satisfied (each nested richText explicitly declares its editor — required by Payload). One-level nesting only, by construction.

## Render-side wiring

`src/components/blog/LexicalContent.tsx`:

```tsx
const converters: JSXConvertersFunction = ({ defaultConverters }) => {
  const map = {
    ...defaultConverters,
    upload: ({ node }) => <StyledUpload node={node} />,
    blocks: {
      callout: ({ node }) => <CalloutRenderer fields={node.fields as never} />,
      gallery: ({ node }) => <GalleryRenderer fields={node.fields as never} />,
      columns: ({ node }) => <ColumnsRenderer fields={node.fields as never} converters={map} />,
    },
  }
  return map
}
```

`ColumnsRenderer` calls `<RichText data={cell} converters={converters} />` for each cell recursively, so callouts / images / galleries nested inside columns render with the same brand styling.

## UX walkthrough

### Inserting + resizing an image

1. `/` → slash menu → `Image`. Upload or pick from Media. (Unchanged.)
2. Image inserts as a 75%-wide centered figure (default).
3. Click image once → 8 drag handles + floating toolbar appear.
4. Drag a corner → image resizes live; aspect ratio locked (Shift to unlock). On `pointerup`, width saved.
5. Click elsewhere → handles + toolbar fade. Image keeps new width.
6. Delete / Backspace removes the image. Escape deselects.

### Floating toolbar

```
┌──────────────────────────────────────────────────────────────┐
│  ⬅  ⬛  ➡  ⬛⬛   │   25 33 50 66 75 100 %   │   ⚙ caption  🗑 │
└──────────────────────────────────────────────────────────────┘
```

### Inserting a columns row

1. `/` → slash menu → `სვეტები`.
2. Block inserts with `50/50`, two empty cells side-by-side as live editors.
3. Click into a cell, type. Slash menu, images, callouts all work inside.
4. Layout change (50/50 → 67/33) via the block header select. Updates inline.

### Float-wrap parity

- Editor canvas now renders floated images with the same `float-left` / `float-right` CSS the public page uses. Text typed below wraps around the image identically to the published article.

## Phasing

### Phase 1 — Columns + float-parity (small, high-value, low-risk)

- `ColumnsBlock` + `cellEditor` + `ColumnsRenderer` + admin SCSS for 2/3-column inline layout.
- Float-wrap CSS injected into the stock UploadComponent via admin SCSS (no node replacement).
- **Result**: side-by-side via columns, floated images wrap in the editor too.

### Phase 2 — Resize + floating toolbar (the bigger lift)

- `ResizableUploadNode` (LexicalNodeReplacement).
- `ResizableUploadComponent` with 8 drag handles.
- `FloatingUploadToolbarPlugin`.
- `widthPercent` field.
- `StyledUpload.tsx` precedence update.
- **Result**: drag-resize + inline toolbar replaces the drawer for common ops.

Each phase is independently mergeable and reversible.

## Risks & gotchas

| Risk | Mitigation |
|---|---|
| Lexical `contenteditable` swallows pointer events on resize handles | `e.preventDefault()` + `setPointerCapture` on `pointerdown` (playground pattern). |
| Live preview re-renders on every drag frame | Mutate inline `width` on the `<img>` DOM during drag; `editor.update()` only on `pointerup`. |
| Admin bundle bloat from replacement node | `React.lazy()` the component (same as stock UploadNode). |
| Float-left + columns block | Columns uses CSS grid; floats stay inside their cell. Safe by construction. |
| Existing news posts | Both phases additive. No content migration. `widthPercent` falls back to `size`; `columns` block simply doesn't appear in legacy posts. |
| Payload `importMap.js` auto-generation | Re-generates on `npm run dev`. New string-path components register cleanly. |
| Performance of nested richText editors | One-level deep is the documented sweet spot. Recursion blocked by construction. |
| Locale switching with nested cells | Each cell is `localized: true`. Locale picker switches all cells together. |

## File-level change inventory

### New files

- `src/blocks/lexical/ColumnsBlock.ts`
- `src/components/blog/lexical-converters/ColumnsRenderer.tsx`
- `src/lexical/features/resizable-upload/feature.client.ts`
- `src/lexical/features/resizable-upload/ResizableUploadNode.ts`
- `src/lexical/features/resizable-upload/ResizableUploadComponent.tsx`
- `src/lexical/features/resizable-upload/FloatingUploadToolbar.tsx`

### Modified files

- `src/payload.config.ts` — append `widthPercent` field; register `ResizableUploadFeature`; add `ColumnsBlock` to BlocksFeature.
- `src/components/blog/LexicalContent.tsx` — add `columns` to the blocks converter map.
- `src/components/blog/lexical-converters/StyledUpload.tsx` — read `widthPercent` and apply inline width.
- `src/app/(payload)/admin/custom.scss` — admin CSS rules for inline columns layout + float-wrap parity for the stock UploadComponent (Phase 1) and resizer cursor / handle styles (Phase 2).
- `src/app/(payload)/admin/importMap.js` — auto-regenerated by Payload, not hand-edited.

### Files not touched

- Database schema. Everything lives in existing JSONB columns.
- `src/collections/News.ts`. No collection field changes.
- Other collections / globals.

## Reference paths (Payload + Lexical internals consulted)

- `node_modules/@payloadcms/richtext-lexical/dist/features/upload/client/nodes/UploadNode.js`
- `node_modules/@payloadcms/richtext-lexical/dist/features/upload/client/component/index.js`
- `node_modules/@payloadcms/richtext-lexical/dist/features/blocks/client/component/BlockContent.js`
- `node_modules/@payloadcms/richtext-lexical/dist/features/toolbars/inline/client/Toolbar/index.js`
- `node_modules/@payloadcms/richtext-lexical/dist/lexical/utils/setFloatingElemPosition.js`
- `node_modules/@lexical/react/useLexicalNodeSelection.dev.js`
- `facebook/lexical` → `packages/lexical-playground/src/nodes/ImageResizer.tsx`
