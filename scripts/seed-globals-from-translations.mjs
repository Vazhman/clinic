#!/usr/bin/env node
/**
 * Seed every Payload global with the text the live site currently shows via
 * next-intl fallbacks.
 *
 * Why: globals (HomePage, AboutPage, ContactPage, BookingPage, Footer,
 * Navigation) ship with NO DB rows. Public-facing components fall back to
 * `src/messages/{ge,en,ru}.json` when the CMS field is null, so the website
 * looks populated even though admin forms are empty. After running this
 * once, the admin shows the same text users see — and edits actually
 * override the JSON fallbacks.
 *
 * Safety:
 *   - Only fills EMPTY fields. Existing values are preserved.
 *   - Idempotent: re-running does nothing once everything is populated.
 *   - GETs the current global, deep-merges with our defaults (existing wins),
 *     then POSTs the result.
 *
 * Usage:
 *   node scripts/seed-globals-from-translations.mjs              # local (http://localhost:3000)
 *   SITE=https://clinic-one-blush.vercel.app node scripts/seed-globals-from-translations.mjs
 *
 * Requires dev server running (`npm run dev`) and TOTP_DISABLED=true for
 * password-only admin login.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const SITE = process.env.SITE || 'http://localhost:3000'
const EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.ge'
const PASSWORD = process.env.ADMIN_PASSWORD || '111111'
const LOCALES = ['ge', 'en', 'ru']
// OVERWRITE=true blows away whatever's in the DB and replaces it with our
// translation-file defaults. Use this exactly once if a previous run
// without `fallback-locale=null` polluted the EN/RU slots with Georgian
// text. Future runs should NOT set this — the default safe mode preserves
// any edits an admin has made in /admin.
const OVERWRITE = process.env.OVERWRITE === 'true'

// --- helpers -----------------------------------------------------------------

const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

/** Lexical empty-paragraph wrapper around a plain string. */
function lexicalParagraph(text) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
          ],
        },
      ],
    },
  }
}

function lexicalHasText(rt) {
  if (!rt || typeof rt !== 'object') return false
  let found = false
  const walk = (n) => {
    if (found || !n || typeof n !== 'object') return
    if (typeof n.text === 'string' && n.text.trim().length > 0) {
      found = true
      return
    }
    if (Array.isArray(n.children)) n.children.forEach(walk)
  }
  walk(rt.root ?? rt)
  return found
}

/**
 * Deep-merge `desired` into `current`. Existing scalar values in `current`
 * are preserved. Missing keys + null/empty strings in `current` get the value
 * from `desired`. Arrays: only filled if `current` is missing/empty.
 * Richtext (Lexical): only filled if `current` has no text content.
 */
function fillMissing(current, desired) {
  if (Array.isArray(desired)) {
    return Array.isArray(current) && current.length > 0 ? current : desired
  }
  if (desired && typeof desired === 'object' && desired.root) {
    // Lexical richText
    return lexicalHasText(current) ? current : desired
  }
  if (desired && typeof desired === 'object') {
    const out = { ...(current && typeof current === 'object' ? current : {}) }
    for (const [k, v] of Object.entries(desired)) {
      out[k] = fillMissing(out[k], v)
    }
    return out
  }
  // scalar
  return isBlank(current) ? desired : current
}

function readMessages(locale) {
  const p = path.join(ROOT, 'src', 'messages', `${locale}.json`)
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

const M = {
  ge: readMessages('ge'),
  en: readMessages('en'),
  ru: readMessages('ru'),
}

// --- per-global desired-state builders --------------------------------------

function buildHomePage(loc) {
  const h = M[loc].Hero
  const sn = M[loc].SymptomNavigator
  return {
    hero: {
      headline: h.headline,
      subheadline: h.subheadline,
      bookButtonText: h.bookVisit,
      consultButtonText: h.getConsultation,
      badgeText: h.activeSince,
    },
    trustStrip: {
      rating: '4.9',
      doctorCount: h.doctorsCount,
      patientCount: h.patientsCount,
    },
    symptomNavigator: {
      title: sn.title,
      subtitle: sn.subtitle,
      placeholder: sn.placeholder,
    },
  }
}

function buildAboutPage(loc) {
  const a = M[loc].About
  return {
    title: a.title,
    subtitle: a.subtitle,
    description: lexicalParagraph(a.description),
    stats: [
      { value: '2015', label: a.founded },
      { value: '40', label: a.beds },
      { value: '1st', label: a.coblation },
    ],
  }
}

function buildContactPage(loc) {
  const c = M[loc].Contact
  return {
    title: c.title,
    address: {
      label: c.address,
      value: c.addressValue,
      // Default lat/long for Khozrevanidze Clinic in Batumi. Will be skipped if
      // the admin has already entered coordinates.
      mapLatitude: 41.6168,
      mapLongitude: 41.6367,
    },
    phone: {
      label: c.phone,
      value: '+9950422227171',
      display: c.phoneValue,
    },
    email: {
      label: c.email,
      value: c.emailValue,
    },
    workingHours: {
      label: c.workingHours,
      weekdays: c.weekdays,
      weekends: c.weekends,
    },
    contactFormTitle: c.sendMessage,
  }
}

function buildBookingPage(loc) {
  const b = M[loc].Booking
  return {
    title: b.title,
    subtitle: b.subtitle,
    steps: {
      selectService: b.selectService,
      selectDoctor: b.selectDoctor,
      selectDate: b.selectDate,
      selectTime: b.selectTime,
      yourInfo: b.yourInfo,
      confirm: b.confirm,
    },
    form: {
      fullName: b.fullName,
      phoneNumber: b.phoneNumber,
      confirmButton: b.confirm,
      successMessage: b.successMessage,
    },
  }
}

function buildNavigation(loc) {
  const n = M[loc].Navigation
  return {
    mainMenu: [
      { label: n.home, href: '/', isHighlighted: false },
      { label: n.about, href: '/about', isHighlighted: false },
      { label: n.services, href: '/services', isHighlighted: false },
      { label: n.doctors, href: '/doctors', isHighlighted: false },
      { label: n.checkups, href: '/checkups', isHighlighted: false },
      { label: n.blog, href: '/blog', isHighlighted: false },
      { label: n.contact, href: '/contact', isHighlighted: false },
    ],
    ctaButton: {
      label: n.booking,
      href: '/booking',
    },
  }
}

function buildFooter(loc) {
  const f = M[loc].Footer
  const n = M[loc].Navigation
  const clinicName =
    loc === 'ge' ? 'ხოზრევანიძის კლინიკა' : loc === 'ru' ? 'Клиника Хозреванидзе' : 'Khozrevanidze Clinic'
  return {
    description: f.description,
    quickLinks: [
      { label: n.about, href: '/about' },
      { label: n.services, href: '/services' },
      { label: n.doctors, href: '/doctors' },
      { label: n.checkups, href: '/checkups' },
      { label: n.blog, href: '/blog' },
      { label: n.contact, href: '/contact' },
    ],
    copyright: `© ${new Date().getFullYear()} ${clinicName}. ${f.rights}.`,
    whatsappNumber: '995422227171',
  }
}

function buildSiteSettings() {
  // Not localized — just the numeric stats backstop.
  return {
    stats: {
      patients: 15000,
      doctors: 54,
      operations: 5000,
      experience: 9,
    },
  }
}

const PLAN = [
  { slug: 'home-page', build: buildHomePage, localized: true },
  { slug: 'about-page', build: buildAboutPage, localized: true },
  { slug: 'contact-page', build: buildContactPage, localized: true },
  { slug: 'booking-page', build: buildBookingPage, localized: true },
  { slug: 'navigation', build: buildNavigation, localized: true },
  { slug: 'footer', build: buildFooter, localized: true },
  { slug: 'site-settings', build: buildSiteSettings, localized: false },
]

// --- Payload REST plumbing ---------------------------------------------------

async function login() {
  const res = await fetch(`${SITE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Login failed: HTTP ${res.status} — ${body.slice(0, 200)}`)
  }
  const { token } = await res.json()
  if (!token) throw new Error('Login response had no token (TOTP may be enabled — set TOTP_DISABLED=true)')
  return token
}

async function getGlobal(slug, locale, token) {
  // fallback-locale=null disables Payload's locale-fallback for this read.
  // Without it (the config has localization.fallback:true), GET ?locale=en
  // on an empty EN field returns the GE value, so our "is empty?" check
  // thinks every locale is already populated and we write fallback-Georgian
  // text into the EN and RU columns.
  const url = locale
    ? `${SITE}/api/globals/${slug}?locale=${locale}&fallback-locale=null&depth=0`
    : `${SITE}/api/globals/${slug}?depth=0`
  const res = await fetch(url, { headers: { Authorization: `JWT ${token}` } })
  if (!res.ok) throw new Error(`GET ${slug} ${locale ?? '-'}: HTTP ${res.status}`)
  return res.json()
}

async function postGlobal(slug, locale, data, token) {
  const url = locale
    ? `${SITE}/api/globals/${slug}?locale=${locale}`
    : `${SITE}/api/globals/${slug}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`POST ${slug} ${locale ?? '-'}: HTTP ${res.status} — ${body.slice(0, 400)}`)
  }
  return res.json()
}

// --- main --------------------------------------------------------------------

const token = await login()
console.log(`▶ Logged in as ${EMAIL} on ${SITE}\n`)

for (const { slug, build, localized } of PLAN) {
  console.log(`▶ ${slug}`)
  if (!localized) {
    // Non-localized globals — single fill pass.
    try {
      const cur = await getGlobal(slug, null, token)
      const desired = build()
      const merged = OVERWRITE ? { ...cur, ...desired } : fillMissing(cur, desired)
      await postGlobal(slug, null, merged, token)
      console.log(`   ✓ ${OVERWRITE ? 'overwrote' : 'filled empty fields'}`)
    } catch (err) {
      console.error(`   ✗ ${err.message}`)
    }
    continue
  }

  // Localized globals. Important: when an array field contains localized
  // text (e.g. mainMenu[].label), every POST without explicit row `id`s
  // REPLACES the whole array — wiping out the previous locale's labels.
  // To preserve labels across locales, we POST the GE locale first (which
  // creates the array rows + GE labels), then re-fetch to capture the
  // generated row IDs, then POST EN and RU with those same IDs so Payload
  // updates the rows in place per-locale.
  try {
    // 1) GE pass — establishes array row IDs.
    const curGe = await getGlobal(slug, 'ge', token)
    const desiredGe = build('ge')
    const mergedGe = OVERWRITE ? { ...curGe, ...desiredGe } : fillMissing(curGe, desiredGe)
    await postGlobal(slug, 'ge', mergedGe, token)
    process.stdout.write(`   ✓ [ge]${OVERWRITE ? ' overwritten' : ''}\n`)

    // 2) Re-read GE to discover the row IDs Payload generated for arrays.
    const ge = await getGlobal(slug, 'ge', token)

    // 3) EN + RU passes — clone GE's array rows (so IDs are preserved) but
    //    replace localized text from the per-locale desired build.
    for (const locale of ['en', 'ru']) {
      const cur = await getGlobal(slug, locale, token)
      const desired = build(locale)
      const merged = OVERWRITE ? { ...cur, ...desired } : fillMissing(cur, desired)
      // For every key in desired that is an array, patch IDs from GE so the
      // array rows aren't recreated (which would drop GE's labels).
      for (const key of Object.keys(desired)) {
        if (Array.isArray(desired[key]) && Array.isArray(ge[key])) {
          merged[key] = desired[key].map((item, i) => ({
            ...item,
            ...(ge[key][i]?.id ? { id: ge[key][i].id } : {}),
          }))
        }
      }
      await postGlobal(slug, locale, merged, token)
      process.stdout.write(`   ✓ [${locale}]${OVERWRITE ? ' overwritten' : ''}\n`)
    }
  } catch (err) {
    console.error(`   ✗ ${err.message}`)
  }
}

console.log(`\n✓ Done. Open ${SITE}/admin and verify globals are pre-filled.`)
