#!/usr/bin/env node
// scripts/migrate-news-content-to-body.mjs
// One-shot migration runner: POSTs the local dev server's
// /api/migrate-news-to-body endpoint, which converts News.content (blocks[])
// into News.body (SerializedEditorState) for every (doc, locale) that doesn't
// already have a populated body. The endpoint is idempotent — re-running this
// script is safe and reports skipped docs.
//
// Why a Next.js API route + thin runner instead of a standalone Payload script?
// Payload 3.83's `getPayload` pulls in `@next/env`'s `loadEnvConfig` via an
// internal bootstrap that crashes in plain Node 24 outside Next's runtime
// (`Cannot destructure property 'loadEnvConfig'`). Running the conversion as
// an API route reuses the dev server's already-initialized Payload instance.
//
// Usage:
//   1. Start the dev server in another terminal: `npm run dev`
//   2. Run this script:                          `node scripts/migrate-news-content-to-body.mjs`
//   3. (Optional) point at a different host:     `SITE=http://staging.example node scripts/...`
//
// The endpoint is dev-only (returns 403 in production) so this script cannot
// be used to migrate a prod database without a temporary preview deploy.

const SITE = process.env.SITE || 'http://localhost:3000'

async function main() {
  console.log(`▶ POST ${SITE}/api/migrate-news-to-body`)
  const res = await fetch(`${SITE}/api/migrate-news-to-body`, { method: 'POST' })
  const body = await res.text()
  if (!res.ok) {
    console.error(`HTTP ${res.status} — ${body}`)
    process.exit(1)
  }

  const parsed = JSON.parse(body)
  for (const entry of parsed.report ?? []) {
    if (entry.result === 'ok') {
      console.log(`[ok]   ${entry.slug} (${entry.locale}) — ${entry.blocks} block(s) -> ${entry.nodes} lexical node(s)`)
    } else if (entry.result === 'skip-already-migrated') {
      console.log(`[skip] ${entry.slug} (${entry.locale}) — body already populated`)
    } else {
      console.log(`[skip] ${entry.slug} (${entry.locale}) — no legacy content to migrate`)
    }
  }
  console.log(`\nDone. scanned=${parsed.scanned} migrated=${parsed.migrated} skipped=${parsed.skipped}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
