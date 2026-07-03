#!/usr/bin/env node
// Capture full-page screenshots of one or more routes at desktop + mobile.
//
//   node scripts/screenshot.mjs <label>                   (home page)
//   node scripts/screenshot.mjs <label> /ge/doctors /ge/services
//   node scripts/screenshot.mjs <label> --all             (all known routes)
//
// Writes to docs/impeccable/<label>/<route-slug>-{desktop,mobile}.png
// (or docs/impeccable/<label>-{desktop,mobile}.png if only one route is given)

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const label = args.shift() || 'capture'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const ALL_ROUTES = [
  '/ge',
  '/ge/about',
  '/ge/services',
  '/ge/doctors',
  '/ge/checkups',
  '/ge/booking',
  '/ge/blog',
  // '/ge/health-library', // DISABLED 2026-05-30 per client request (route now 404s)
  '/ge/contact',
]

let routes
if (args.length === 0) routes = ['/ge']
else if (args[0] === '--all') routes = ALL_ROUTES
else routes = args

const baseUrl = process.env.SCREENSHOT_BASE || 'http://localhost:3000'
const baseOutDir = resolve(root, 'docs/impeccable')

const viewports = [
  { name: 'desktop', width: 1440, height: 900, dsf: 1 },
  { name: 'mobile', width: 390, height: 844, dsf: 2 },
]

function slugOf(route) {
  if (route === '/' || route === '/ge') return 'home'
  return route.replace(/^\/ge\//, '').replace(/\//g, '-')
}

const browser = await chromium.launch()
for (const route of routes) {
  const slug = slugOf(route)
  const outDir = routes.length > 1 ? resolve(baseOutDir, label) : baseOutDir
  mkdirSync(outDir, { recursive: true })
  for (const v of viewports) {
    const ctx = await browser.newContext({
      viewport: { width: v.width, height: v.height },
      deviceScaleFactor: v.dsf,
      locale: 'ka-GE',
      reducedMotion: 'reduce',
    })
    const page = await ctx.newPage()
    const url = baseUrl + route
    console.log(`[${slug}/${v.name}] ${url}`)
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
    } catch (e) {
      console.warn(`  navigation slow, continuing: ${e.message}`)
    }
    await page.waitForTimeout(1500)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)
    const filename = routes.length > 1
      ? `${slug}-${v.name}.png`
      : `${label}-${v.name}.png`
    const out = resolve(outDir, filename)
    await page.screenshot({ path: out, fullPage: true })
    console.log(`  wrote ${out}`)
    await ctx.close()
  }
}
await browser.close()
console.log('done')
