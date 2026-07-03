#!/usr/bin/env node
/**
 * Open key public pages on prod and report whether <img> elements
 * actually load (naturalWidth > 0) or fail (404/403/blocked).
 */
import { chromium } from 'playwright'

const SITE = process.env.SITE || 'https://clinic-one-blush.vercel.app'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

const failedRequests = []
page.on('response', async (res) => {
  const u = res.url()
  if ((u.includes('/api/media') || u.includes('/_next/image')) && res.status() >= 400) {
    failedRequests.push({ url: u, status: res.status() })
  }
})

const URLS = [
  `${SITE}/ge`,
  `${SITE}/ge/doctors`,
  `${SITE}/ge/booking`,
]

for (const url of URLS) {
  console.log(`\n▶ ${url}`)
  failedRequests.length = 0
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(2000)

  const imageStats = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'))
    const loaded = imgs.filter((i) => i.complete && i.naturalWidth > 0).length
    const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).length
    const pending = imgs.filter((i) => !i.complete).length
    return { total: imgs.length, loaded, broken, pending }
  })
  console.log(`  <img> stats: total=${imageStats.total} loaded=${imageStats.loaded} broken=${imageStats.broken} pending=${imageStats.pending}`)
  if (failedRequests.length > 0) {
    console.log(`  Failed network requests (first 5):`)
    for (const r of failedRequests.slice(0, 5)) {
      console.log(`    HTTP ${r.status}  ${r.url.slice(0, 120)}`)
    }
  } else {
    console.log(`  No failed image requests.`)
  }
}

await browser.close()
