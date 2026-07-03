#!/usr/bin/env node
// Builds before/after side-by-side composites for every polished page.
//   node scripts/compare-pages.mjs

import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dir = resolve(root, 'docs/impeccable')

const PAGES = ['about', 'services', 'doctors', 'checkups', 'booking', 'blog', 'contact']

async function labelImage(text, width, height) {
  return await sharp({ create: { width, height, channels: 3, background: '#1a1a1a' } })
    .composite([{
      input: Buffer.from(
        `<svg width="${width}" height="${height}"><text x="0" y="${height - 18}" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#DD64A6" letter-spacing="6">${text}</text></svg>`,
      ),
      top: 0, left: 0,
    }])
    .png()
    .toBuffer()
}

async function makeComparison(slug, viewport) {
  const beforePath = resolve(dir, 'all-before', `${slug}-${viewport}.png`)
  const afterPath = resolve(dir, `${slug}-after-${viewport}.png`)
  if (!existsSync(beforePath) || !existsSync(afterPath)) {
    console.log(`  skip ${slug}/${viewport} (missing files)`)
    return
  }
  const before = sharp(beforePath)
  const after = sharp(afterPath)
  const bMeta = await before.metadata()
  const aMeta = await after.metadata()

  // Hero strip — top 1200px (or full height if shorter)
  const cropHeight = viewport === 'mobile'
    ? Math.min(2200, bMeta.height, aMeta.height)
    : Math.min(1300, bMeta.height, aMeta.height)

  const beforeBuf = await before.extract({ left: 0, top: 0, width: bMeta.width, height: cropHeight }).toBuffer()
  const afterBuf = await after.extract({ left: 0, top: 0, width: aMeta.width, height: cropHeight }).toBuffer()

  const gutter = 40, labelH = 60, padding = 20
  const compWidth = bMeta.width + aMeta.width + gutter + padding * 2
  const compHeight = cropHeight + labelH + padding * 2
  const composite = await sharp({ create: { width: compWidth, height: compHeight, channels: 3, background: '#1a1a1a' } })
    .composite([
      { input: await labelImage(`BEFORE — ${slug}`, bMeta.width, labelH), top: padding, left: padding },
      { input: beforeBuf, top: padding + labelH, left: padding },
      { input: await labelImage(`AFTER — ${slug}`, aMeta.width, labelH), top: padding, left: padding + bMeta.width + gutter },
      { input: afterBuf, top: padding + labelH, left: padding + bMeta.width + gutter },
    ])
    .png()
    .toBuffer()
  const out = resolve(dir, `pair-${slug}-${viewport}.png`)
  await sharp(composite).toFile(out)
  console.log(`  wrote ${out}`)
}

for (const page of PAGES) {
  console.log(page)
  await makeComparison(page, 'desktop')
  await makeComparison(page, 'mobile')
}
console.log('done')
