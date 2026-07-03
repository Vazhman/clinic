#!/usr/bin/env node
/**
 * Take focused-search-bar screenshot to see the reported border bug.
 */
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await page.goto('https://clinic-one-blush.vercel.app/ge', { waitUntil: 'networkidle', timeout: 60000 })
// Scroll down to the SymptomNavigator section
await page.evaluate(() => {
  const input = document.querySelector('input[placeholder]')
  input?.scrollIntoView({ block: 'center' })
})
await page.waitForTimeout(800)

const input = page.locator('input[placeholder]').first()
await input.focus()
await page.waitForTimeout(500)

await page.screenshot({ path: 'test-screenshots/search-focused-full.png', fullPage: false })

// Tight crop of just the search bar
const box = await input.boundingBox()
if (box) {
  await page.screenshot({
    path: 'test-screenshots/search-focused-zoom.png',
    clip: { x: Math.max(0, box.x - 100), y: Math.max(0, box.y - 30), width: 700, height: 100 },
  })
}

await browser.close()
console.log('saved test-screenshots/search-focused-*.png')
