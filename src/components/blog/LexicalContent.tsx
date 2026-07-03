import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { SerializedUploadNode } from '@payloadcms/richtext-lexical'
import { StyledUpload } from './lexical-converters/StyledUpload'
import { CalloutRenderer } from './lexical-converters/CalloutRenderer'
import { GalleryRenderer } from './lexical-converters/GalleryRenderer'
import { ColumnsRenderer } from './lexical-converters/ColumnsRenderer'

// JSX converters map Lexical node types -> React components. We override the
// `upload` node (so it picks up our border/shadow/radius styling) and the
// `blocks` group (for our Callout + Gallery custom blocks). Everything else
// — paragraphs, headings, lists, links, blockquote, hr, alignment — falls
// through to Payload's default converters, which already produce semantic
// HTML that the surrounding `prose` Tailwind classes style correctly.
//
// `blocks` is keyed by block slug; TypeScript can't infer the inner node
// shape from the open-ended index type, so we annotate the parameter as
// `{ node: { fields: unknown } }` — the renderer's own prop type is the
// source of truth for `fields`, and `as never` bridges the structural gap.
type BlockArgs = { node: { fields: unknown } }
// Self-referencing converter map: we capture `map` in a `const` first so the
// nested ColumnsRenderer can re-use the same overrides when rendering the
// richText cells inside a columns block. Without this recursion, an image in
// a column would fall back to Payload's default upload converter and lose
// our brand styling (alignment / border / shadow / radius / widthPercent).
const converters: JSXConvertersFunction = ({ defaultConverters }) => {
  const map = {
    ...defaultConverters,
    upload: ({ node }: { node: SerializedUploadNode }) => <StyledUpload node={node} />,
    blocks: {
      callout: ({ node }: BlockArgs) => <CalloutRenderer fields={node.fields as never} />,
      gallery: ({ node }: BlockArgs) => <GalleryRenderer fields={node.fields as never} />,
      columns: ({ node }: BlockArgs) => (
        <ColumnsRenderer fields={node.fields as never} converters={map as never} />
      ),
    },
  }
  return map
}

export default function LexicalContent({ data }: { data: SerializedEditorState }) {
  return (
    /* `flow-root` establishes a block formatting context so floated images
       (alignment=left/right) stay contained inside the article instead of
       bleeding into the footer. Tailwind 4 ships this; the previous code
       used `clearfix` which wasn't defined anywhere — silent no-op. */
    <div className="prose prose-base sm:prose-lg max-w-none flow-root prose-headings:text-blackberry prose-headings:break-words prose-p:text-grey prose-p:break-words prose-a:text-pink prose-a:break-words prose-blockquote:border-pink prose-blockquote:bg-pink-light/30 prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-4 break-words">
      <RichText data={data} converters={converters} />
    </div>
  )
}
