#!/usr/bin/env node
/**
 * End-to-end verification of CMS wiring via Payload's REST API.
 *
 * Steps:
 *   1. Log in as admin (TOTP_DISABLED=true must be set on the dev server).
 *   2. PATCH each global with a unique sentinel string per locale + field.
 *   3. Curl each public page that should render that field.
 *   4. Grep the rendered HTML for the sentinel.
 *   5. Reset every touched field back to empty so the customer sees a clean slate.
 *
 * If a sentinel appears on the rendered page in the correct locale, the wiring
 * for that (global, field, locale) is end-to-end working.
 */

const SITE = process.env.SITE || 'http://localhost:3000'
const EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.ge'
const PASSWORD = process.env.ADMIN_PASSWORD || '111111'

const LOCALES = ['ge', 'en', 'ru']

// Each test specifies (a) a complete minimum-valid baseline for the global that
// satisfies all `required: true` validators in the Payload schema, (b) the
// field we're using as the sentinel-bearer, and (c) the page that should
// render it. The baseline pre-fills required fields with `BASELINE_` strings;
// the sentinel field is then overwritten with the unique `SENTINEL_` value
// that we grep for in the rendered HTML.
const CHECKS = [
  {
    global: 'contact-page', setPath: 'address.value',
    pageUrl: '/{locale}/contact', label: 'ContactPage.address.value',
    baseline: () => ({
      title: 'BASELINE_TITLE',
      address: { label: 'BASELINE_ADDR_LABEL', value: 'BASELINE_ADDR_VALUE' },
      phone: { label: 'BASELINE_PHONE_LABEL', value: '+995555000000', display: '+995 555 000 000' },
      email: { label: 'BASELINE_EMAIL_LABEL', value: 'baseline@test.local' },
      workingHours: { label: 'BASELINE_HRS_LABEL', weekdays: 'BASELINE_WD', weekends: 'BASELINE_WE' },
      contactFormTitle: 'BASELINE_FORM_TITLE',
    }),
  },
  {
    global: 'footer', setPath: 'description',
    pageUrl: '/{locale}', label: 'Footer.description',
    baseline: () => ({}),
  },
  {
    global: 'navigation', setPath: 'ctaButton.label',
    pageUrl: '/{locale}', label: 'Navigation.ctaButton.label',
    baseline: () => ({ ctaButton: { label: 'BASELINE_CTA_LABEL', href: '/booking' } }),
  },
  {
    global: 'home-page', setPath: 'hero.headline',
    pageUrl: '/{locale}', label: 'HomePage.hero.headline',
    baseline: () => ({
      hero: {
        headline: 'BASELINE_HEADLINE', subheadline: 'BASELINE_SUBHEAD',
        bookButtonText: 'BASELINE_BOOK', consultButtonText: 'BASELINE_CONSULT',
        badgeText: 'BASELINE_BADGE',
      },
    }),
  },
  {
    global: 'home-page', setPath: 'symptomNavigator.title',
    pageUrl: '/{locale}', label: 'HomePage.symptomNavigator.title',
    baseline: () => ({
      hero: {
        headline: 'BASELINE_HEADLINE', subheadline: 'BASELINE_SUBHEAD',
        bookButtonText: 'BASELINE_BOOK', consultButtonText: 'BASELINE_CONSULT',
        badgeText: 'BASELINE_BADGE',
      },
      symptomNavigator: { title: 'BASELINE_SYMP_TITLE', subtitle: 'BASELINE_SYMP_SUB', placeholder: 'BASELINE_SYMP_PH' },
    }),
  },
  {
    global: 'about-page', setPath: 'title',
    pageUrl: '/{locale}/about', label: 'AboutPage.title',
    baseline: () => ({
      title: 'BASELINE_ABOUT_TITLE',
      subtitle: 'BASELINE_ABOUT_SUB',
      // Lexical richText minimum-valid empty doc — required by AboutPage schema.
      description: {
        root: {
          type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
          children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
            children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: 'BASELINE_ABOUT_DESC', version: 1 }] }],
        },
      },
    }),
  },
  {
    global: 'about-page', setPath: 'subtitle',
    pageUrl: '/{locale}/about', label: 'AboutPage.subtitle',
    baseline: () => ({
      title: 'BASELINE_ABOUT_TITLE',
      subtitle: 'BASELINE_ABOUT_SUB',
      description: {
        root: {
          type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
          children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
            children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: 'BASELINE_ABOUT_DESC', version: 1 }] }],
        },
      },
    }),
  },
  {
    global: 'booking-page', setPath: 'title',
    pageUrl: '/{locale}/booking', label: 'BookingPage.title',
    baseline: () => ({ title: 'BASELINE_BOOK_TITLE' }),
  },
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) {
    throw new Error(`Login failed: HTTP ${res.status} — ${await res.text()}`)
  }
  const { token } = await res.json()
  if (!token) throw new Error('Login response had no token')
  return token
}

async function getGlobal(slug, locale, token) {
  const res = await fetch(`${SITE}/api/globals/${slug}?locale=${locale}&depth=0`, {
    headers: { Authorization: `JWT ${token}` },
  })
  if (!res.ok) throw new Error(`GET ${slug} ${locale}: HTTP ${res.status}`)
  return res.json()
}

async function updateGlobal(slug, locale, data, token, { draft = false } = {}) {
  const url = `${SITE}/api/globals/${slug}?locale=${locale}${draft ? '&draft=true' : ''}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `JWT ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`POST ${slug} ${locale}: HTTP ${res.status} — ${await res.text().catch(() => '')}`)
  return res.json()
}

async function curlPage(url) {
  const res = await fetch(url, { redirect: 'follow' })
  const body = await res.text()
  return { status: res.status, body }
}

async function main() {
  console.log(`▶ Logging in as ${EMAIL}…`)
  let token
  try {
    token = await login()
  } catch (err) {
    console.error(`✗ ${err.message}`)
    console.error(`  (If TOTP is enabled, set TOTP_DISABLED=true and restart the dev server.)`)
    process.exit(2)
  }
  console.log('  authenticated.')

  // -------- INTERLEAVED WRITE → FETCH → ASSERT per check --------
  // We must NOT batch all writes then all reads: tests for the same global
  // share a baseline and one test's baseline overwrites the previous test's
  // sentinel field. Per-check write+read avoids the pollution.
  console.log(`\n▶ Running ${CHECKS.length} checks × 3 locales = ${CHECKS.length * 3} round-trips…`)
  const results = []
  for (const check of CHECKS) {
    for (const locale of LOCALES) {
      const sentinel = `SENTINEL_${check.global}_${locale}_${check.setPath.replace(/\./g, '_')}`
      const url = SITE + check.pageUrl.replace('{locale}', locale)
      try {
        const data = check.baseline()
        setNested(data, check.setPath, sentinel)
        await updateGlobal(check.global, locale, data, token)
        const r = await curlPage(url)
        results.push({
          label: check.label, locale, url, status: r.status,
          found: r.body.includes(sentinel),
        })
        process.stdout.write(r.body.includes(sentinel) ? '·' : '✗')
      } catch (err) {
        results.push({ label: check.label, locale, url, status: 'ERR', found: false, error: err.message })
        process.stdout.write('✗')
      }
    }
  }
  console.log(' done')

  // -------- REPORT --------
  console.log(`\n============= RESULTS =============`)
  let pass = 0, fail = 0
  const grouped = {}
  for (const r of results) {
    grouped[r.label] ??= []
    grouped[r.label].push(r)
  }
  for (const [label, rows] of Object.entries(grouped)) {
    const allOk = rows.every((x) => x.found)
    console.log(`\n  ${allOk ? '✓' : '✗'} ${label}`)
    for (const r of rows) {
      const mark = r.found ? '  ✓' : '  ✗'
      console.log(`    ${mark} [${r.locale}] HTTP ${r.status}  ${r.url}`)
      if (r.found) pass++; else fail++
    }
  }
  console.log(`\n${pass}/${pass + fail} sentinel hits — ${fail === 0 ? 'ALL WIRINGS WORK' : 'SOME WIRINGS BROKEN'}\n`)

  // -------- RESET PHASE --------
  // For globals with required fields, leaving a baseline in place would still
  // change visible behaviour (e.g. ContactPage.title now reads "BASELINE_TITLE"
  // instead of the next-intl fallback). To restore the "empty CMS" state seen
  // by a fresh clinic admin, we write a deliberately minimal payload — empty
  // strings for optional fields, dummy-but-realistic values for required ones.
  console.log(`▶ Cleaning up: writing a minimum payload that satisfies required validators while looking empty`)
  const RESET = {
    'contact-page': () => ({
      title: '',
      address: { label: '', value: '', mapLatitude: null, mapLongitude: null },
      phone: { label: '', value: '+995422227171', display: '' },
      email: { label: '', value: 'info@khozrevanidze.ge' },
      workingHours: { label: '', weekdays: '', weekends: '' },
      contactFormTitle: '',
    }),
    'footer':       () => ({ description: '', copyright: '', whatsappNumber: '' }),
    'navigation':   () => ({ ctaButton: { label: '', href: '' } }),
    'home-page':    () => ({
      hero: { headline: '', subheadline: '', bookButtonText: '', consultButtonText: '', badgeText: '' },
      symptomNavigator: { title: '', subtitle: '', placeholder: '' },
    }),
    'about-page':   () => ({
      title: '', subtitle: '',
      description: { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
        children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
          children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: '', version: 1 }] }] } },
    }),
    'booking-page': () => ({ title: '', subtitle: '' }),
  }
  const seen = new Set()
  for (const check of CHECKS) {
    for (const locale of LOCALES) {
      const key = `${check.global}|${locale}`
      if (seen.has(key)) continue
      seen.add(key)
      try {
        // draft=true bypasses Payload's `required` validators so we can wipe
        // every field back to "" / null without filling out the entire global.
        await updateGlobal(check.global, locale, RESET[check.global](), token, { draft: true })
        process.stdout.write('·')
      } catch (err) {
        process.stdout.write('✗')
        if (process.env.DEBUG) console.error(`\n  reset ${check.global} ${locale}: ${err.message}`)
      }
    }
  }
  console.log(' done\n')

  process.exit(fail === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(2)
})
