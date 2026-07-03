import type { JSONContent } from '@tiptap/core'

// Convert a Payload Lexical `SerializedEditorState` into TipTap JSON (the format
// the builder's RichText block stores). Used to seed the builder from an
// article's classic `body` when it has no `puckData` yet — so existing /
// imported articles open in the builder WITH their content instead of blank.
//
// Covers the node set our seeded/authored bodies use: paragraph, heading,
// list, quote, text (bold/italic/strike/code), linebreak, link. Anything else
// degrades to a plain paragraph of its text. Heading levels are clamped to
// 3–4 (the StarterKit config in tiptap.ts only registers those).

const FMT_BOLD = 1
const FMT_ITALIC = 2
const FMT_STRIKE = 4
const FMT_CODE = 16

type LexNode = { type?: string; [k: string]: unknown }

function marksFromFormat(format: number): { type: string }[] {
  const m: { type: string }[] = []
  if (format & FMT_BOLD) m.push({ type: 'bold' })
  if (format & FMT_ITALIC) m.push({ type: 'italic' })
  if (format & FMT_STRIKE) m.push({ type: 'strike' })
  if (format & FMT_CODE) m.push({ type: 'code' })
  return m
}

function inlineChildren(children: LexNode[] = []): JSONContent[] {
  const out: JSONContent[] = []
  for (const c of children) {
    if (c.type === 'text') {
      const text = String(c.text ?? '')
      if (!text) continue
      const node: JSONContent = { type: 'text', text }
      const marks = marksFromFormat(Number(c.format) || 0)
      if (marks.length) node.marks = marks
      out.push(node)
    } else if (c.type === 'linebreak') {
      out.push({ type: 'hardBreak' })
    } else if (c.type === 'link' || c.type === 'autolink') {
      const fields = (c.fields as { url?: string } | undefined) ?? undefined
      const href = fields?.url || (c.url as string) || '#'
      for (const t of inlineChildren(c.children as LexNode[])) {
        t.marks = [...(t.marks ?? []), { type: 'link', attrs: { href } }]
        out.push(t)
      }
    } else if (Array.isArray(c.children)) {
      out.push(...inlineChildren(c.children as LexNode[]))
    }
  }
  return out
}

function blockNode(n: LexNode): JSONContent | null {
  const kids = (n.children as LexNode[]) ?? []
  switch (n.type) {
    case 'heading': {
      const tag = String(n.tag ?? 'h3')
      let level = Number(tag.replace(/[^0-9]/g, '')) || 3
      level = Math.min(4, Math.max(3, level))
      return { type: 'heading', attrs: { level }, content: inlineChildren(kids) }
    }
    case 'quote':
      return { type: 'blockquote', content: [{ type: 'paragraph', content: inlineChildren(kids) }] }
    case 'list': {
      const ordered = n.listType === 'number' || n.tag === 'ol'
      const items = kids.map((li) => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: inlineChildren((li.children as LexNode[]) ?? []) }],
      }))
      return { type: ordered ? 'orderedList' : 'bulletList', content: items }
    }
    case 'paragraph':
    default: {
      const content = inlineChildren(kids)
      return content.length ? { type: 'paragraph', content } : { type: 'paragraph' }
    }
  }
}

export function lexicalToTiptap(state: unknown): JSONContent | null {
  const root = (state as { root?: { children?: LexNode[] } } | null)?.root
  const children = root?.children
  if (!Array.isArray(children) || children.length === 0) return null
  const content = children.map(blockNode).filter(Boolean) as JSONContent[]
  if (content.length === 0) return null
  return { type: 'doc', content }
}
