#!/usr/bin/env node
// End-to-end smoke check: hit every route + critical API and report status.
//   node scripts/smoke-test.mjs

const base = process.env.SMOKE_BASE || 'http://localhost:3000'

const checks = [
  // Public pages — every locale, redirect-following
  { name: 'home (ge)',           url: '/ge',                                expect: 200, follow: true },
  { name: 'home (en)',           url: '/en',                                expect: 200, follow: true },
  { name: 'home (ru)',           url: '/ru',                                expect: 200, follow: true },
  { name: 'about',               url: '/ge/about',                          expect: 200, follow: true },
  { name: 'services list',       url: '/ge/services',                       expect: 200, follow: true },
  { name: 'doctors list',        url: '/ge/doctors',                        expect: 200, follow: true },
  { name: 'checkups',            url: '/ge/checkups',                       expect: 200, follow: true },
  { name: 'booking',             url: '/ge/booking',                        expect: 200, follow: true },
  { name: 'blog list',           url: '/ge/blog',                           expect: 200, follow: true },
  { name: 'contact',             url: '/ge/contact',                        expect: 200, follow: true },
  // DISABLED 2026-05-30 per client request — page intentionally 404s (kept in codebase).
  { name: 'health-library (off)', url: '/ge/health-library',                expect: 404, follow: true },

  // Site infrastructure
  { name: 'root redirect',       url: '/',                                  expect: 200, follow: true },
  { name: 'sitemap',             url: '/sitemap.xml',                       expect: 200 },
  { name: 'robots.txt',          url: '/robots.txt',                        expect: 200 },

  // Payload admin
  { name: 'admin login page',    url: '/admin',                             expect: 200, follow: true },

  // Booking APIs
  { name: 'booking services',    url: '/api/booking/services',              expect: 200 },
  { name: 'booking doctors',     url: '/api/booking/all-doctors',           expect: 200 },

  // Translation TTS
  { name: 'tts (ge)',            url: '/api/tts?q=test&lang=ka',            expect: [200, 400] },

  // Headers / meta
  { name: 'home OG image',       url: '/ge', checkHtml: ['og:image', 'og:title'] },
]

let pass = 0, fail = 0
const fails = []

for (const c of checks) {
  const url = base + c.url
  try {
    const res = await fetch(url, { redirect: c.follow ? 'follow' : 'manual', signal: AbortSignal.timeout(30_000) })
    const status = res.status
    const expects = Array.isArray(c.expect) ? c.expect : c.expect ? [c.expect] : null

    let ok = expects ? expects.includes(status) || (c.follow && status >= 200 && status < 400) : status >= 200 && status < 400

    let extra = ''
    if (c.checkHtml && ok) {
      const html = await res.text()
      const missing = c.checkHtml.filter(s => !html.includes(s))
      if (missing.length) { ok = false; extra = ` (missing: ${missing.join(', ')})` }
    }

    if (ok) {
      pass++
      console.log(`✓ ${c.name.padEnd(28)} ${status}  ${url}`)
    } else {
      fail++
      const msg = `✗ ${c.name.padEnd(28)} ${status}${extra}  ${url}`
      console.log(msg)
      fails.push(msg)
    }
  } catch (e) {
    fail++
    const msg = `✗ ${c.name.padEnd(28)} ERROR  ${e.message}`
    console.log(msg)
    fails.push(msg)
  }
}

console.log(`\n${pass} passed, ${fail} failed`)
if (fails.length) {
  console.log('\nfailures:')
  for (const f of fails) console.log('  ' + f)
  process.exit(1)
}
