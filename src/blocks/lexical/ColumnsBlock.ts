import type { Block } from 'payload'
import {
  lexicalEditor,
  FixedToolbarFeature,
  InlineToolbarFeature,
  AlignFeature,
  IndentFeature,
  BlockquoteFeature,
  ChecklistFeature,
  HorizontalRuleFeature,
  UploadFeature,
  BlocksFeature,
  CodeBlock,
  EXPERIMENTAL_TableFeature,
  TextStateFeature,
} from '@payloadcms/richtext-lexical'
import { CalloutBlock } from './CalloutBlock'
import { GalleryBlock } from './GalleryBlock'
import { ResizableUploadFeature } from '../../lexical/features/resizable-upload/feature'
import { RemoveFormattingFeature } from '../../lexical/features/remove-formatting/feature'
import { HtmlSourceFeature } from '../../lexical/features/html-source/feature'
import { textColorStates, backgroundColorStates } from '../../lexical/textStateColors'
import { fontSizeStates } from '../../lexical/fontSizeStates'

// Inline Lexical block: a 2-or-3-column row whose cells are themselves
// Lexical rich-text fields. Editors pick a `layout` (50/50, 33/67, 67/33,
// 33/33/33) and fill each cell independently. The middle cell only appears
// for the 3-column layout — the condition below toggles it in the admin UI.
//
// Each cell embeds its OWN lexicalEditor() instance. That instance mirrors
// the parent editor's feature set so editors get the same toolbar / slash
// menu inside a column as outside — EXCEPT ColumnsBlock is intentionally
// missing from BlocksFeature here, otherwise a column could contain another
// columns block, which would recurse without bound on every render.
const cellEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
    AlignFeature(),
    IndentFeature(),
    BlockquoteFeature(),
    ChecklistFeature(),
    HorizontalRuleFeature(),
    // Media-extra-fields config MUST stay in sync with the parent editor in
    // src/payload.config.ts so an image dragged into a column behaves the
    // same as one in the main body — same alignment / border / shadow /
    // radius / size radios, same caption, same hidden widthPercent.
    UploadFeature({
      collections: {
        media: {
          fields: [
            {
              name: 'alignment',
              type: 'radio',
              defaultValue: 'center',
              options: [
                { label: '⬅ Image left — text wraps right', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Image right — text wraps left ➡', value: 'right' },
                { label: 'Full width', value: 'fullWidth' },
              ],
            },
            {
              name: 'borderStyle',
              type: 'radio',
              defaultValue: 'none',
              options: [
                { label: 'No border', value: 'none' },
                { label: 'Pink border', value: 'pink' },
                { label: 'Blackberry border', value: 'blackberry' },
                { label: 'Grey border', value: 'grey' },
              ],
            },
            {
              name: 'shadow',
              type: 'radio',
              defaultValue: 'none',
              options: [
                { label: 'No shadow', value: 'none' },
                { label: 'Soft shadow', value: 'soft' },
                { label: 'Strong shadow', value: 'strong' },
              ],
            },
            {
              name: 'radius',
              type: 'radio',
              defaultValue: 'lg',
              options: [
                { label: 'Sharp corners', value: 'none' },
                { label: 'Rounded corners', value: 'lg' },
                { label: 'Circular', value: 'full' },
              ],
            },
            {
              name: 'size',
              type: 'radio',
              defaultValue: 'large',
              options: [
                { label: 'პატარა (≈33%)', value: 'small' },
                { label: 'საშუალო (≈50%)', value: 'medium' },
                { label: 'დიდი (≈75%)', value: 'large' },
                { label: 'სრული სიგანე', value: 'full' },
              ],
            },
            { name: 'caption', type: 'text', localized: true, label: 'Caption (optional)' },
            // Hidden numeric override so the parent UploadFeature (which is
            // adding the same field in a sibling change) and this cell-level
            // editor produce structurally identical upload nodes. Without
            // mirroring the field here, images dragged into a column would
            // silently lose any width override the editor set elsewhere.
            { name: 'widthPercent', type: 'number', min: 10, max: 100, admin: { hidden: true } },
          ],
        },
      },
    }),
    // ResizableUpload runs in the cell editor too, so images dropped into a
    // column get the same drag-handles + floating toolbar UX as images in the
    // main body. The Lexical node-replacement is registered per editor, so
    // installing it in the cell editor here does not conflict with the parent.
    ResizableUploadFeature(),
    // Text/background color + remove-formatting mirrored from the parent
    // editor — see the note above the media fields: any feature added to
    // src/payload.config.ts's main editor must be mirrored here too.
    TextStateFeature({
      state: {
        color: textColorStates,
        bgColor: backgroundColorStates,
        fontSize: fontSizeStates,
      },
    }),
    EXPERIMENTAL_TableFeature(),
    RemoveFormattingFeature(),
    // Mirrored from the parent editor — see note above the media fields.
    HtmlSourceFeature(),
    // Callout + Gallery + Code only. Excluding ColumnsBlock here is what
    // prevents infinite nesting: a column cannot contain another columns block.
    BlocksFeature({
      blocks: [CalloutBlock, GalleryBlock, CodeBlock()],
    }),
  ],
})

export const ColumnsBlock: Block = {
  slug: 'columns',
  labels: { singular: 'სვეტები', plural: 'სვეტები' },
  fields: [
    // `layout` drives both admin UI (the middle-cell condition below) and the
    // public renderer's Tailwind grid template. Values are machine-stable —
    // changing them requires updating ColumnsRenderer.tsx in lockstep.
    {
      name: 'layout',
      type: 'select',
      required: true,
      defaultValue: '50-50',
      options: [
        { label: '50 / 50', value: '50-50' },
        { label: '33 / 67', value: '33-67' },
        { label: '67 / 33', value: '67-33' },
        { label: '33 / 33 / 33', value: '33-33-33' },
      ],
    },
    { name: 'left', type: 'richText', required: true, localized: true, editor: cellEditor },
    // Middle cell is conditional on the 3-column layout. Hiding the field
    // (rather than always rendering it) keeps the admin form uncluttered for
    // 2-column layouts and avoids confusing editors with an unused slot.
    {
      name: 'middle',
      type: 'richText',
      localized: true,
      editor: cellEditor,
      admin: { condition: (_, siblings) => siblings?.layout === '33-33-33' },
    },
    { name: 'right', type: 'richText', required: true, localized: true, editor: cellEditor },
  ],
}
