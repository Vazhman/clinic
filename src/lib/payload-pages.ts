import { getPayload } from 'payload'
import config from '@payload-config'

type Locale = 'ge' | 'en' | 'ru'

export async function getPageBySlug(slug: string, locale: Locale) {
  try {
    const payload = await getPayload({ config })
    const where = { slug: { equals: slug }, status: { equals: 'published' } }

    const pages = await payload.find({ collection: 'pages', locale, depth: 2, where, limit: 1 })

    return pages.docs[0] ?? null
  } catch {
    // DB unavailable
    return null
  }
}

// Walk a Lexical rich-text tree and concatenate all text nodes into a plain
// string (for keyword search + giving the chat assistant something to read).
function lexicalToText(rt: unknown): string {
  if (!rt || typeof rt !== 'object') return ''
  const out: string[] = []
  const walk = (n: unknown): void => {
    if (!n || typeof n !== 'object') return
    const node = n as { text?: unknown; children?: unknown }
    if (typeof node.text === 'string') out.push(node.text)
    if (Array.isArray(node.children)) for (const c of node.children) walk(c)
  }
  const root = (rt as { root?: unknown }).root
  walk(root ?? rt)
  return out.join(' ').replace(/\s+/g, ' ').trim()
}

/** Published pages with their body flattened to plain text — used by the AI
 *  assistant's search_pages tool so it can answer from CMS page content. */
export async function getPagesContent(
  locale: Locale,
): Promise<{ title: string; slug: string; text: string }[]> {
  try {
    const payload = await getPayload({ config })
    const where = { status: { equals: 'published' } }
    const pages = await payload.find({ collection: 'pages', locale, depth: 0, where, limit: 100 })
    return pages.docs.map((doc) => ({
      title: String(doc.title ?? ''),
      slug: String(doc.slug ?? ''),
      text: lexicalToText((doc as { body?: unknown }).body),
    }))
  } catch {
    return []
  }
}

export async function getAllPages(locale: Locale) {
  try {
    const payload = await getPayload({ config })
    const where = { status: { equals: 'published' } }
    const pages = await payload.find({ collection: 'pages', locale, depth: 0, where, limit: 100 })

    return pages.docs.map((doc) => ({
      id: String(doc.id),
      title: doc.title,
      slug: doc.slug,
    }))
  } catch {
    // DB unavailable
    return []
  }
}
