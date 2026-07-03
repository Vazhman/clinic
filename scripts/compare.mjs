#!/usr/bin/env node
// Builds side-by-side before/after composites using sharp.
//   node scripts/compare.mjs
// Writes:
//   docs/impeccable/compare-desktop.png   (1440x1440 above-fold pair)
//   docs/impeccable/compare-mobile.png    (390x1600 above-fold pair, stacked)
//   docs/impeccable/compare-desktop-full.png  (full height pair)

import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dir = resolve(root, 'docs/impeccable')

async function pair(label, beforePath, afterPath, opts) {
  const { height, stack } = opts
  const before = sharp(beforePath)
  const after = sharp(afterPath)
  const bMeta = await before.metadata()
  const aMeta = await after.metadata()

  const cropHeight = Math.min(height, bMeta.height, aMeta.height)
  const beforeBuf = await before
    .extract({ left: 0, top: 0, width: bMeta.width, height: cropHeight })
    .toBuffer()
  const afterBuf = await after
    .extract({ left: 0, top: 0, width: aMeta.width, height: cropHeight })
    .toBuffer()

  const gutter = 40
  const labelH = 60
  const padding = 20

  if (stack) {
    const width = Math.max(bMeta.width, aMeta.width)
    const totalH = (cropHeight + labelH) * 2 + gutter + padding * 2
    const composite = await sharp({
      create: { width: width + padding * 2, height: totalH, channels: 3, background: '#1a1a1a' },
    })
      .composite([
        { input: await labelImage('BEFORE', width, labelH), top: padding, left: padding },
        { input: beforeBuf, top: padding + labelH, left: padding },
        { input: await labelImage('AFTER', width, labelH), top: padding + labelH + cropHeight + gutter, left: padding },
        { input: afterBuf, top: padding + labelH * 2 + cropHeight + gutter, left: padding },
      ])
      .png()
      .toBuffer()
    const out = resolve(dir, `compare-${label}.png`)
    await sharp(composite).toFile(out)
    console.log(`wrote ${out}`)
  } else {
    const width = bMeta.width + aMeta.width + gutter + padding * 2
    const totalH = cropHeight + labelH + padding * 2
    const composite = await sharp({
      create: { width, height: totalH, channels: 3, background: '#1a1a1a' },
    })
      .composite([
        { input: await labelImage('BEFORE', bMeta.width, labelH), top: padding, left: padding },
        { input: beforeBuf, top: padding + labelH, left: padding },
        { input: await labelImage('AFTER', aMeta.width, labelH), top: padding, left: padding + bMeta.width + gutter },
        { input: afterBuf, top: padding + labelH, left: padding + bMeta.width + gutter },
      ])
      .png()
      .toBuffer()
    const out = resolve(dir, `compare-${label}.png`)
    await sharp(composite).toFile(out)
    console.log(`wrote ${out}`)
  }
}

async function labelImage(text, width, height) {
  return await sharp({
    create: { width, height, channels: 3, background: '#1a1a1a' },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${width}" height="${height}"><text x="0" y="${
            height - 18
          }" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#DD64A6" letter-spacing="6">${text}</text></svg>`,
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer()
}

async function pairCrop(label, beforePath, afterPath, { top, height }) {
  const before = sharp(beforePath)
  const after = sharp(afterPath)
  const bMeta = await before.metadata()
  const aMeta = await after.metadata()
  const beforeBuf = await before
    .extract({ left: 0, top, width: bMeta.width, height: Math.min(height, bMeta.height - top) })
    .toBuffer()
  const afterBuf = await after
    .extract({ left: 0, top, width: aMeta.width, height: Math.min(height, aMeta.height - top) })
    .toBuffer()
  const gutter = 40, labelH = 60, padding = 20
  const width = bMeta.width + aMeta.width + gutter + padding * 2
  const totalH = height + labelH + padding * 2
  const composite = await sharp({
    create: { width, height: totalH, channels: 3, background: '#1a1a1a' },
  })
    .composite([
      { input: await labelImage(`BEFORE — ${label}`, bMeta.width, labelH), top: padding, left: padding },
      { input: beforeBuf, top: padding + labelH, left: padding },
      { input: await labelImage(`AFTER — ${label}`, aMeta.width, labelH), top: padding, left: padding + bMeta.width + gutter },
      { input: afterBuf, top: padding + labelH, left: padding + bMeta.width + gutter },
    ])
    .png()
    .toBuffer()
  const out = resolve(dir, `compare-${label.toLowerCase().replace(/\s+/g, '-')}.png`)
  await sharp(composite).toFile(out)
  console.log(`wrote ${out}`)
}

await pair('desktop', resolve(dir, 'before-desktop.png'), resolve(dir, 'after-desktop.png'), {
  height: 1400,
  stack: false,
})
await pair('mobile', resolve(dir, 'before-mobile.png'), resolve(dir, 'after-mobile.png'), {
  height: 2400,
  stack: false,
})
// Mid-page (stats + services): scrolled view, desktop only
await pairCrop('stats-and-services', resolve(dir, 'before-desktop.png'), resolve(dir, 'after-desktop.png'), {
  top: 1500,
  height: 1600,
})
// v2 polish pass: before vs after-v2
await pair('v2-desktop', resolve(dir, 'before-desktop.png'), resolve(dir, 'after-v2-desktop.png'), {
  height: 1400,
  stack: false,
})
await pair('v2-mobile', resolve(dir, 'before-mobile.png'), resolve(dir, 'after-v2-mobile.png'), {
  height: 2400,
  stack: false,
})
// v1 vs v2 — what dialing up the motion changed
await pair('v1-vs-v2-desktop', resolve(dir, 'after-desktop.png'), resolve(dir, 'after-v2-desktop.png'), {
  height: 2200,
  stack: false,
})
console.log('done')
