#!/usr/bin/env node
/**
 * Verify on prod that doctors WITHOUT doctraId no longer see the booking CTA.
 *
 * 1. Pull list of doctors from /api/booking/all-doctors (only Doctra-linked).
 * 2. Pull all doctor profile slugs from /ge/doctors HTML.
 * 3. Diff → doctors NOT in the booking API are non-bookable.
 * 4. Open one bookable + one non-bookable doctor profile, check the CTA.
 */
import { chromium } from 'playwright'

const SITE = 'https://clinic-one-blush.vercel.app'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

// 1. Bookable doctor slugs (those with doctraId in the booking API)
const apiRes = await fetch(`${SITE}/api/booking/all-doctors?locale=ge`)
const apiData = await apiRes.json()
const bookableSlugs = new Set(
  (apiData.doctors ?? []).map((d) => d.operator?.slug).filter(Boolean),
)
console.log(`Bookable doctors (from API): ${bookableSlugs.size}`)

// 2. All doctor slugs visible on the public list page
await page.goto(`${SITE}/ge/doctors`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(2500)
const allSlugs = await page.evaluate(() => {
  return [...new Set(
    Array.from(document.querySelectorAll('a[href*="/doctors/"]'))
      .map((a) => {
        const m = a.getAttribute('href')?.match(/\/doctors\/([^/?#]+)$/)
        return m ? m[1] : null
      })
      .filter(Boolean),
  )]
})
console.log(`All doctor slugs on /ge/doctors: ${allSlugs.length}`)

// 3. Find one bookable + one non-bookable
const bookable = allSlugs.find((s) => bookableSlugs.has(s))
const nonBookable = allSlugs.find((s) => !bookableSlugs.has(s))
console.log(`Bookable test slug: ${bookable}`)
console.log(`Non-bookable test slug: ${nonBookable}`)

if (!bookable || !nonBookable) {
  console.log('Could not find both types of doctors. Bailing.')
  await browser.close()
  process.exit(1)
}

// 4. Inspect each profile
for (const [label, slug] of [['bookable', bookable], ['NON-bookable', nonBookable]]) {
  console.log(`\n▶ ${label} doctor → ${slug}`)
  await page.goto(`${SITE}/ge/doctors/${slug}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)

  const findings = await page.evaluate(() => {
    // The book CTA is a <button> with a gradient background containing
    // a "calendar / clock" SVG and the t(checkAvailability|bookAppointment) text.
    const buttons = Array.from(document.querySelectorAll('button'))
    const bookBtn = buttons.find((b) => {
      const txt = b.textContent?.trim() ?? ''
      return /ხილვადობ|შემოწმ|Book|Запис/i.test(txt) && b.style.background?.includes('linear-gradient')
    })

    // Desktop mini-booking widget — has a header with the doctor name.
    const widget = document.querySelector('[class*="rounded-2xl"][class*="shadow-lg"][class*="border-grey-lighter"]')

    // Mobile tab strip
    const mobileTabs = Array.from(document.querySelectorAll('button')).filter((b) => {
      const txt = b.textContent?.trim() ?? ''
      return /^(ბიოგრაფია|ჯავშანი|Biography|Book)/i.test(txt)
    })

    // Call us button (should always be present)
    const callBtn = Array.from(document.querySelectorAll('a[href^="tel:"]'))
      .find((a) => a.textContent?.trim().length > 0)

    return {
      hasBookCTA: !!bookBtn,
      hasMiniWidget: !!widget,
      hasMobileTabs: mobileTabs.length >= 2,
      hasCallButton: !!callBtn,
    }
  })
  console.log(`  CTA button:       ${findings.hasBookCTA ? '🟢 visible' : '⚪ hidden'}`)
  console.log(`  Mini-widget:      ${findings.hasMiniWidget ? '🟢 visible' : '⚪ hidden'}`)
  console.log(`  Call button:      ${findings.hasCallButton ? '🟢 visible' : '⚪ hidden'}`)

  await page.screenshot({ path: `test-screenshots/doctor-${label.replace(/ /g, '-')}.png`, fullPage: false })
}

await browser.close()
console.log('\nDone. Screenshots in test-screenshots/')
