import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { getPayload } from 'payload'
import config from '@payload-config'

// Dev-only one-shot migration: News.content (blocks[]) -> News.body
// (SerializedEditorState). Idempotent — skips any (doc, locale) pair where
// `body` is already populated.
//
// Why a Next.js API route instead of a standalone Node script?
// Payload 3.83's `getPayload` pulls in `@next/env`'s `loadEnvConfig` via an
// internal bootstrap that crashes in plain Node 24 outside Next's runtime
// (`Cannot destructure property 'loadEnvConfig'`). Running the migration as
// an API route reuses the dev server's already-initialized Payload instance,
// which is the supported way to use the local API in this stack. The thin
// runner script at scripts/migrate-news-content-to-body.mjs just POSTs here.

const LOCALES = ['ge', 'en', 'ru'] as const

function paragraphFromText(text: string) {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      { type: 'text', text: String(text ?? ''), format: 0, version: 1, detail: 0, mode: 'normal', style: '' },
    ],
  }
}

function uploadNode({ value, fields }: { value: { id: number | string } | number | string; fields: Record<string, unknown> }) {
  // `id` is a 24-hex ObjectId — what Lexical's UploadServerNode generates
  // for natively-edited content (node_modules/@payloadcms/richtext-lexical/
  // dist/features/upload/server/nodes/UploadNode.js:102). Without it the
  // editor would auto-generate one on first load but the regenerated id
  // wouldn't persist until the post is saved.
  return {
    type: 'upload',
    version: 3,
    format: '',
    id: randomBytes(12).toString('hex'),
    relationTo: 'media',
    value: typeof value === 'object' ? value.id : value,
    fields,
  }
}

function blockquoteNode(text: string, attribution?: string) {
  return {
    type: 'quote',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      ...(text ? [{ type: 'text', text, format: 0, version: 1, detail: 0, mode: 'normal', style: '' }] : []),
      ...(attribution
        ? [
            { type: 'linebreak', version: 1 },
            { type: 'text', text: `— ${attribution}`, format: 2, version: 1, detail: 0, mode: 'normal', style: '' },
          ]
        : []),
    ],
  }
}

function convertBlock(block: { blockType: string; [k: string]: unknown }): unknown[] {
  switch (block.blockType) {
    case 'richText': {
      const content = block.content as { root?: { children?: unknown[] } } | undefined
      const children = content?.root?.children
      return Array.isArray(children) ? children : []
    }
    case 'image': {
      const value = (typeof block.image === 'object' && block.image !== null ? block.image : { id: block.image }) as { id: number | string }
      return [
        uploadNode({
          value,
          fields: {
            alignment: (block.alignment as string | undefined) ?? 'center',
            borderStyle: 'none',
            shadow: 'none',
            radius: 'lg',
            caption: (block.caption as string | undefined) ?? '',
          },
        }),
      ]
    }
    case 'imageText': {
      const value = (typeof block.image === 'object' && block.image !== null ? block.image : { id: block.image }) as { id: number | string }
      const content = block.content as { root?: { children?: unknown[] } } | undefined
      return [
        uploadNode({
          value,
          fields: {
            alignment: block.imagePosition === 'right' ? 'right' : 'left',
            borderStyle: 'none',
            shadow: 'none',
            radius: 'lg',
            caption: '',
          },
        }),
        ...((content?.root?.children as unknown[] | undefined) ?? []),
      ]
    }
    case 'quote':
      return [blockquoteNode(block.quoteText as string, block.attribution as string | undefined)]
    default:
      return [paragraphFromText(`[unconverted block: ${block.blockType}]`)]
  }
}

function buildEditorStateFromBlocks(blocks: unknown): { root: Record<string, unknown> } | null {
  if (!Array.isArray(blocks) || blocks.length === 0) return null
  const children = blocks.flatMap((b) => convertBlock(b as { blockType: string }))
  if (children.length === 0) return null
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr',
    },
  }
}

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Migration is disabled in production' }, { status: 403 })
  }

  try {
    const payload = await getPayload({ config })

    const report: Array<{ slug: string; locale: string; result: 'ok' | 'skip-already-migrated' | 'skip-empty'; blocks?: number; nodes?: number }> = []
    let scanned = 0
    let migrated = 0
    let skipped = 0

    for (const locale of LOCALES) {
      // fallbackLocale: false — otherwise Payload returns the default-locale
      // value when a locale row is empty, which makes `body` and `content`
      // look populated for un-translated en/ru posts and corrupts the
      // "already migrated" check.
      const res = await payload.find({
        collection: 'news',
        locale,
        fallbackLocale: false,
        depth: 0,
        limit: 1000,
      })

      for (const doc of res.docs) {
        scanned++
        const body = (doc as { body?: { root?: { children?: unknown[] } } }).body
        const alreadyHasBody = !!body && typeof body === 'object' && Array.isArray(body.root?.children) && (body.root!.children as unknown[]).length > 0
        if (alreadyHasBody) {
          report.push({ slug: doc.slug, locale, result: 'skip-already-migrated' })
          skipped++
          continue
        }

        const content = (doc as { content?: unknown }).content
        const state = buildEditorStateFromBlocks(content)
        if (!state) {
          report.push({ slug: doc.slug, locale, result: 'skip-empty' })
          skipped++
          continue
        }

        await payload.update({
          collection: 'news',
          id: doc.id,
          locale,
          data: { body: state } as never,
        })
        report.push({
          slug: doc.slug,
          locale,
          result: 'ok',
          blocks: Array.isArray(content) ? content.length : 0,
          nodes: (state.root.children as unknown[]).length,
        })
        migrated++
      }
    }

    return NextResponse.json({ scanned, migrated, skipped, report })
  } catch (error) {
    console.error('migrate-news-to-body error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
