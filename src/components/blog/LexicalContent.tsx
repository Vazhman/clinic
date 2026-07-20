import type { CSSProperties } from 'react'
import { RichText, type JSXConverterArgs, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { SerializedTextNode, SerializedUploadNode } from '@payloadcms/richtext-lexical'
import { StyledUpload } from './lexical-converters/StyledUpload'
import { CalloutRenderer } from './lexical-converters/CalloutRenderer'
import { GalleryRenderer } from './lexical-converters/GalleryRenderer'
import { ColumnsRenderer } from './lexical-converters/ColumnsRenderer'
import { textColorStates, backgroundColorStates } from '@/lexical/textStateColors'
import { fontSizeStates } from '@/lexical/fontSizeStates'
import { toCamelCaseCss } from '@/lexical/toCamelCaseCss'

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
    // Payload's `defaultConverters` has NO built-in handling for TextStateFeature
    // (color / background color) — the `$state` values only exist client-side
    // as data-attributes the editor's own StatePlugin writes to the DOM. On the
    // server-rendered frontend, a text node styled via TextState serializes as
    // `{ text, format, "$": { color?: 'text-blue', bgColor?: 'bg-red' } }` and,
    // without this override, silently renders as plain unstyled text. We run
    // the default text converter first (handles bold/italic/underline/etc via
    // the format bitmask) then wrap the result in a <span> carrying the color/
    // background CSS looked up from the same textStateColors config used by
    // payload.config.ts's editor, so admin and frontend stay in sync.
    text: (args: JSXConverterArgs<SerializedTextNode>) => {
      const textConverter = defaultConverters.text
      const rendered = typeof textConverter === 'function' ? textConverter(args) : textConverter
      const state = (args.node as { $?: { color?: string; bgColor?: string; fontSize?: string } }).$
      if (!state) return rendered
      const style: Record<string, string> = {}
      const colorCss = state.color
        ? textColorStates[state.color as keyof typeof textColorStates]?.css
        : undefined
      const bgCss = state.bgColor
        ? backgroundColorStates[state.bgColor as keyof typeof backgroundColorStates]?.css
        : undefined
      const sizeCss = state.fontSize
        ? fontSizeStates[state.fontSize as keyof typeof fontSizeStates]?.css
        : undefined
      // These `css` records come from Payload's defaultColors/fontSizeStates as
      // kebab-case CSS property names (e.g. `background-color`, `font-size`) —
      // React's `style` prop requires camelCase, so plain `Object.assign` here
      // silently drops anything but `color` (kebab === camel by coincidence).
      if (colorCss) Object.assign(style, toCamelCaseCss(colorCss))
      if (bgCss) Object.assign(style, toCamelCaseCss(bgCss))
      if (sizeCss) Object.assign(style, toCamelCaseCss(sizeCss))
      if (Object.keys(style).length === 0) return rendered
      return <span style={style as CSSProperties}>{rendered}</span>
    },
    blocks: {
      // Payload's `defaultConverters` also has NO `blocks` map at all in this
      // version (confirmed by reading node_modules — defaultJSXConverters is a
      // static object with no `blocks` key), so premade blocks like CodeBlock
      // get ZERO free rendering and must be converted explicitly here, same as
      // our own Callout/Gallery/Columns blocks below.
      callout: ({ node }: BlockArgs) => <CalloutRenderer fields={node.fields as never} />,
      gallery: ({ node }: BlockArgs) => <GalleryRenderer fields={node.fields as never} />,
      columns: ({ node }: BlockArgs) => (
        <ColumnsRenderer fields={node.fields as never} converters={map as never} />
      ),
      // Premade CodeBlock (BlocksFeature -> CodeBlock() in payload.config.ts).
      // fields.language is the language-select key (e.g. "javascript"); fields.code
      // is the raw code string. Kept as plain <pre>/<code> — no syntax-highlighting
      // library wired up on the frontend, but content renders correctly and is
      // XSS-safe (React text child, never dangerouslySetInnerHTML).
      Code: ({ node }: { node: { fields: { code?: string; language?: string } } }) => (
        <pre className="rounded-lg bg-blackberry text-white p-4 overflow-x-auto text-sm not-prose">
          <code className={node.fields.language ? `language-${node.fields.language}` : undefined}>
            {node.fields.code}
          </code>
        </pre>
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
    <div className="prose prose-base sm:prose-lg max-w-none flow-root prose-headings:text-blackberry prose-headings:break-words prose-p:text-grey prose-p:break-words prose-a:text-pink prose-a:break-words prose-blockquote:border-pink prose-blockquote:bg-pink-light/30 prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-4 break-words whitespace-pre-wrap">
      <RichText data={data} converters={converters} />
    </div>
  )
}
