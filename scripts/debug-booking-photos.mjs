#!/usr/bin/env node
/**
 * Debug script: open the booking page on prod, navigate to the doctor list,
 * and report what the photo elements actually contain (src/initials/missing).
 * Also picks a real doctor slug and tests language-switching to /en + /ru.
 */
import { chromium } from 'playwright'

const SITE = process.env.SITE || 'https://clinic-one-blush.vercel.app'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

console.log(`▶ Loading ${SITE}/ge/booking`)
await page.goto(`${SITE}/ge/booking`, { waitUntil: 'networkidle', timeout: 60000 })
await page.screenshot({ path: 'test-screenshots/prod-booking-ge.png', fullPage: true })

// Look at the doctor cards in the wizard.
const photoStats = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('[type="button"]'))
    .filter((b) => b.querySelector('img, .rounded-full'))
  const rows = []
  for (const card of cards.slice(0, 12)) {
    const img = card.querySelector('img')
    const initialsEl = card.querySelector('.rounded-full:not(:has(img))')
    rows.push({
      hasImg: !!img,
      imgSrc: img?.getAttribute('src') ?? null,
      hasInitialsCircle: !!initialsEl && !img,
      text: card.textContent?.trim().slice(0, 60),
    })
  }
  return rows
})
console.log('First 12 doctor cards on /ge/booking:')
for (const r of photoStats) console.log(' ', JSON.stringify(r))

// Pick a real doctor slug from /ge/doctors and test language-switch.
console.log(`\n▶ Loading ${SITE}/ge/doctors`)
await page.goto(`${SITE}/ge/doctors`, { waitUntil: 'networkidle', timeout: 60000 })
const slugs = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('a[href*="/doctors/"]'))
    .map((a) => a.getAttribute('href'))
    .filter((h) => h && /\/doctors\/[a-z0-9-]+$/.test(h))
    .slice(0, 5)
})
console.log('Sample doctor links:', slugs)

if (slugs.length > 0) {
  const slug = slugs[0].split('/').pop()
  console.log(`\n▶ Testing ${slug} across locales`)
  for (const loc of ['ge', 'en', 'ru']) {
    const url = `${SITE}/${loc}/doctors/${slug}`
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const status = res?.status() ?? '?'
    const title = await page.title()
    console.log(`  /${loc}/doctors/${slug}  →  HTTP ${status}  —  ${title}`)
  }

  // Now try the LanguageSwitcher click flow from a doctor profile.
  console.log(`\n▶ Click-through: open /ge/doctors/${slug}, click language switcher EN`)
  await page.goto(`${SITE}/ge/doctors/${slug}`, { waitUntil: 'networkidle' })
  const enBtn = page.locator('button:has-text("EN")').first()
  if (await enBtn.count() > 0) {
    await Promise.all([
      page.waitForLoadState('networkidle'),
      enBtn.click(),
    ])
    console.log('  after EN click:', page.url())
    await page.screenshot({ path: 'test-screenshots/prod-doctor-after-switch-en.png' })
  }
}

await browser.close()
console.log('\nDone. Screenshots in test-screenshots/')
