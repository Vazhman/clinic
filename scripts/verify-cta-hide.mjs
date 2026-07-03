#!/usr/bin/env node
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

const tests = [
  { slug: '3e24659e-4d02-11', name: 'დიანა ვერძაძე', expect: 'CTA visible' },
  { slug: '4ef1d62c-985d-11', name: 'ნანა გორგილაძე (no slots)', expect: 'CTA HIDDEN' },
]

for (const t of tests) {
  console.log(`\n=== ${t.name} (${t.expect}) ===`)
  await page.goto(`http://localhost:3000/ge/doctors/${t.slug}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1000)
  const found = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'))
    const gradient = allButtons.filter((b) => b.style.background?.includes('linear-gradient'))
    const minibooking = !!document.querySelector('[class*="rounded-2xl"][class*="shadow-lg"][class*="border-grey-lighter"]')
    return {
      totalButtons: allButtons.length,
      gradientButtons: gradient.length,
      gradientTexts: gradient.map((b) => b.textContent?.trim().slice(0, 60)),
      hasMiniBookingWidget: minibooking,
    }
  })
  console.log(`  total buttons: ${found.totalButtons}`)
  console.log(`  gradient buttons: ${found.gradientButtons}`)
  console.log(`  gradient texts:`, found.gradientTexts)
  console.log(`  mini-booking widget visible: ${found.hasMiniBookingWidget}`)
}

await browser.close()
