// Compact-block → Payload Lexical editorState converter.
//
// The public renderer (src/components/blog/LexicalContent.tsx) uses Lexical's
// DEFAULT React converters for paragraph / heading / list / quote nodes, so we
// only need to emit those node shapes with the standard fields. Anything the
// default converter understands renders correctly inside the `prose` wrapper.
//
// Inline **bold** is parsed into separate text nodes (Lexical bold format = 1).
import type { Block } from './types'

// Minimal structural types — we deliberately avoid importing Lexical's
// SerializedEditorState here so this file stays usable from a plain script
// context without pulling editor internals. The object shape is what Payload
// stores and what `RichText` reads.
type TextNode = {
  type: 'text'
  text: string
  format: number
  style: string
  mode: 'normal'
  detail: number
  version: 1
}

type ElementNode = {
  type: string
  version: 1
  format: '' | string
  indent: 0
  direction: 'ltr'
  children: Array<TextNode | ElementNode>
  [key: string]: unknown
}

const IS_BOLD = 1

/** Split a string on **bold** spans into Lexical text nodes. */
function textNodes(raw: string): TextNode[] {
  const out: TextNode[] = []
  const parts = raw.split(/\*\*(.+?)\*\*/g) // odd indices are the bold captures
  parts.forEach((segment, i) => {
    if (segment === '') return
    out.push({
      type: 'text',
      text: segment,
      format: i % 2 === 1 ? IS_BOLD : 0,
      style: '',
      mode: 'normal',
      detail: 0,
      version: 1,
    })
  })
  // A paragraph/heading must contain at least one child for Lexical.
  if (out.length === 0) {
    out.push({ type: 'text', text: '', format: 0, style: '', mode: 'normal', detail: 0, version: 1 })
  }
  return out
}

function paragraph(text: string): ElementNode {
  return {
    type: 'paragraph',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    textFormat: 0,
    children: textNodes(text),
  }
}

function heading(text: string, tag: 'h2' | 'h3'): ElementNode {
  return {
    type: 'heading',
    tag,
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: textNodes(text),
  }
}

function quote(text: string): ElementNode {
  return {
    type: 'quote',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: textNodes(text),
  }
}

function bulletList(items: string[]): ElementNode {
  return {
    type: 'list',
    listType: 'bullet',
    start: 1,
    tag: 'ul',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: items.map((item, idx) => ({
      type: 'listitem',
      value: idx + 1,
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children: textNodes(item),
    })),
  }
}

/** Build a Payload Lexical editorState object from authored blocks. */
export function toLexical(blocks: Block[]): { root: ElementNode } {
  const children: ElementNode[] = blocks.map((block) => {
    if ('h2' in block) return heading(block.h2, 'h2')
    if ('h3' in block) return heading(block.h3, 'h3')
    if ('quote' in block) return quote(block.quote)
    if ('ul' in block) return bulletList(block.ul)
    return paragraph(block.p)
  })

  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children,
    },
  }
}
