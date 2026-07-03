import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

type ColumnsFields = {
  layout: '50-50' | '33-67' | '67-33' | '33-33-33'
  left: SerializedEditorState
  middle?: SerializedEditorState
  right: SerializedEditorState
}

// The converters from the parent LexicalContent are passed in so nested cells
// render Callout/Gallery/Upload nodes with the same brand styling. Without
// this, an image inside a column would fall back to Payload's default upload
// renderer and lose our alignment/size/border/shadow handling.
type Converters = ReturnType<JSXConvertersFunction>

// Layout values map to fixed Tailwind grid templates — editors pick from a
// select, they cannot inject classes. Extending this set requires updating
// ColumnsBlock.ts (the field's options array) so the renderer and the form
// stay in sync.
const gridClass: Record<ColumnsFields['layout'], string> = {
  '50-50': 'md:grid-cols-2',
  '33-67': 'md:grid-cols-[1fr_2fr]',
  '67-33': 'md:grid-cols-[2fr_1fr]',
  '33-33-33': 'md:grid-cols-3',
}

export function ColumnsRenderer({
  fields,
  converters,
}: {
  fields: ColumnsFields
  converters: Converters
}) {
  const showMiddle = fields.layout === '33-33-33' && fields.middle
  return (
    // `clear-both` is load-bearing: if a preceding image uses alignment=
    // left/right (CSS float), the columns row would otherwise wrap up
    // alongside it. Editors place columns BELOW such images and expect them
    // there on the page too — same fix is in GalleryRenderer / CalloutRenderer.
    //
    // Mobile-first: every layout collapses to a single column via the base
    // `grid-cols-1`, and `md:` overrides apply only from the md breakpoint up.
    <div
      className={`clear-both my-8 sm:my-10 grid grid-cols-1 gap-6 sm:gap-8 ${gridClass[fields.layout]}`}
    >
      <div>
        <RichText data={fields.left} converters={converters as never} />
      </div>
      {showMiddle && fields.middle && (
        <div>
          <RichText data={fields.middle} converters={converters as never} />
        </div>
      )}
      <div>
        <RichText data={fields.right} converters={converters as never} />
      </div>
    </div>
  )
}
