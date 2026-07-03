#!/usr/bin/env node
/**
 * Visual end-to-end CMS-wiring verification.
 *
 * For each (global, field, locale): inject a sentinel via Payload REST, open
 * the rendered page in a real Chromium browser, screenshot it, and assert the
 * sentinel is visible in the DOM. This is one rung above the curl-and-grep
 * test because it actually renders React, runs hydration, and confirms the
 * value appears on a real page that a human eye would see.
 *
 * Output: PNG screenshots in ./test-screenshots/.
 */

import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const SITE = 'http://localhost:3000'
const EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.ge'
const PASSWORD = process.env.ADMIN_PASSWORD || '111111'
const OUT = './test-screenshots'

const CHECKS = [
  { global: 'contact-page', setPath: 'address.value', pageUrl: '/ge/contact', locale: 'ge', label: 'ContactPage.address.value', baseline: () => ({ title:'CMS_TITLE', address:{label:'',value:''}, phone:{value:'+995422227171'}, email:{value:'test@test.com'}, workingHours:{weekdays:'WD',weekends:'WE'}}) },
  { global: 'footer',       setPath: 'description',   pageUrl: '/ge',         locale: 'ge', label: 'Footer.description (ge)', baseline: () => ({}) },
  { global: 'footer',       setPath: 'description',   pageUrl: '/en',         locale: 'en', label: 'Footer.description (en)', baseline: () => ({}) },
  { global: 'footer',       setPath: 'description',   pageUrl: '/ru',         locale: 'ru', label: 'Footer.description (ru)', baseline: () => ({}) },
  { global: 'navigation',   setPath: 'ctaButton.label', pageUrl: '/ge',       locale: 'ge', label: 'Navigation.ctaButton.label', baseline: () => ({ ctaButton: { label:'', href:'/booking' } }) },
  { global: 'home-page',    setPath: 'hero.headline', pageUrl: '/ge',         locale: 'ge', label: 'HomePage.hero.headline', baseline: () => ({ hero: { headline:'', subheadline:'S', bookButtonText:'B', consultButtonText:'C' } }) },
  { global: 'about-page',   setPath: 'title',         pageUrl: '/ru/about',   locale: 'ru', label: 'AboutPage.title (ru)', baseline: () => ({ title:'', description:{ root: { type:'root', format:'', indent:0, version:1, direction:'ltr', children: [{ type:'paragraph', format:'', indent:0, version:1, direction:'ltr', children:[{type:'text', detail:0, format:0, mode:'normal', style:'', text:'X', version:1}]}] } } }) },
]

function setNested(obj, path, value) {
  const keys = path.split('.')
  let cur = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof cur[keys[i]] !== 'object' || cur[keys[i]] === null) cur[keys[i]] = {}
    cur = cur[keys[i]]
  }
  cur[keys[keys.length - 1]] = value
}

async function login() {
  const res = await fetch(`${SITE}/api/users/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Login: HTTP ${res.status}`)
  return (await res.json()).token
}

async function updateGlobal(slug, locale, data, token) {
  const res = await fetch(`${SITE}/api/globals/${slug}?locale=${locale}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`POST ${slug} ${locale}: HTTP ${res.status} — ${await res.text().catch(() => '')}`)
}

await fs.mkdir(OUT, { recursive: true })

const token = await login()
console.log(`Logged in as ${EMAIL}`)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

const results = []
for (const check of CHECKS) {
  const sentinel = `CMSVAL_${check.global.replace(/-/g,'_')}_${check.setPath.replace(/\./g,'_')}`
  try {
    const data = check.baseline()
    setNested(data, check.setPath, sentinel)
    await updateGlobal(check.global, check.locale, data, token)
    await page.goto(`${SITE}${check.pageUrl}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // Wait for the sentinel to appear (proves the page actually renders the CMS value).
    let visible = false
    try {
      await page.getByText(sentinel, { exact: false }).first().waitFor({ timeout: 5000 })
      visible = true
    } catch {}
    const screenshotPath = `${OUT}/${check.global}_${check.setPath.replace(/\./g,'_')}_${check.locale}.png`
    await page.screenshot({ path: screenshotPath, fullPage: false })
    results.push({ label: check.label, visible, screenshot: screenshotPath })
    console.log(`  ${visible ? '✓' : '✗'} ${check.label} — ${screenshotPath}`)
  } catch (err) {
    results.push({ label: check.label, visible: false, error: err.message })
    console.log(`  ✗ ${check.label} — ${err.message}`)
  }
}

await browser.close()

const pass = results.filter((r) => r.visible).length
console.log(`\n${pass}/${results.length} sentinel values were visible in real-browser rendering.`)
console.log(`Screenshots in ${OUT}/`)
process.exit(pass === results.length ? 0 : 1)
