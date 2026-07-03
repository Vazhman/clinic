#!/usr/bin/env node
/**
 * Partial seed: fills the EMPTY checkup-packages and reviews collections
 * with sample content from src/lib/data.ts. Doesn't touch services or
 * doctors (those came from Doctra sync — leave them alone).
 *
 * Run after the local DB has services + doctors but before clinic-content
 * pass. Idempotent: bails out per-collection if anything already exists.
 *
 * Usage:
 *   node scripts/seed-extra-content.mjs          # local
 *   node scripts/seed-extra-content.mjs --prod   # against clinic-one-blush.vercel.app
 *
 * Important: checkup `includedServices` is now a relationship to the
 * Services collection (was text). The static fallback data has service
 * names that don't match any of our 64 actual services (the static names
 * are TEST PROCEDURES like "სისხლის ზოგადი ანალიზი" but our services are
 * by SPECIALTY like "კარდიოლოგია"). So we seed checkups with an EMPTY
 * `includedServices` array — admin uses the new visual dropdown to pick
 * the right services per package after seeding.
 */

const isProd = process.argv.includes('--prod')
const SITE = isProd ? 'https://clinic-one-blush.vercel.app' : 'http://localhost:3000'
const EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.ge'
const PASSWORD = process.env.ADMIN_PASSWORD || '111111'

// Includes a list of service slugs we'll look up at runtime to seed
// `includedServices` (now a relationship to Services). Admin can edit
// these in /admin/collections/checkup-packages after seeding.
const CHECKUPS = [
  {
    name: 'ბაზისური ჩექაფი',
    description: 'ძირითადი ჯანმრთელობის შემოწმება',
    price: 150,
    currency: 'GEL',
    isFeatured: false,
    serviceSlugs: ['laboratoria', 'kardiologia'],
  },
  {
    name: 'სტანდარტული ჩექაფი',
    description: 'გაფართოებული ჯანმრთელობის შემოწმება',
    price: 350,
    currency: 'GEL',
    isFeatured: true,
    serviceSlugs: ['laboratoria', 'kardiologia', 'endokrinologia', 'gastroenterologia'],
  },
  {
    name: 'პრემიუმ ჩექაფი',
    description: 'ყოვლისმომცველი ჯანმრთელობის შემოწმება',
    price: 600,
    currency: 'GEL',
    isFeatured: false,
    serviceSlugs: ['laboratoria', 'kardiologia', 'endokrinologia', 'neuroloagia', 'oftalmologia'],
  },
]

async function fetchServiceIdsByName(token) {
  // Pull a chunk of services, then pick by Georgian-name partial match
  // (slugs are unreliable from Doctra sync).
  const res = await fetch(`${SITE}/api/services?limit=100&locale=ge`, {
    headers: { Authorization: `JWT ${token}` },
  })
  const data = await res.json()
  /** @type {{id: number, name: string}[]} */
  const docs = (data.docs ?? []).map((d) => ({ id: d.id, name: d.name }))
  const find = (term) => docs.find((d) => d.name?.includes(term))?.id
  return {
    lab: find('ლაბორატ'),
    cardio: find('კარდიოლოგი'),
    endo: find('ენდოკრინ'),
    gastro: find('გასტრო'),
    neuro: find('ნევრო'),
    ophthal: find('ოფთალმ'),
  }
}

const REVIEWS = [
  {
    author: 'ანა მ.',
    rating: 5,
    text: 'საუკეთესო კლინიკა ბათუმში! ძალიან კმაყოფილი ვარ მომსახურებით.',
    date: '2025-12-15',
    source: 'google',
    published: true,
  },
  {
    author: 'დავით კ.',
    rating: 5,
    text: 'პროფესიონალი ექიმები და მეგობრული პერსონალი. გირჩევთ ყველას!',
    date: '2025-11-20',
    source: 'google',
    published: true,
  },
  {
    author: 'Мария С.',
    rating: 5,
    text: 'Отличная клиника! Прекрасное обслуживание и профессиональные врачи.',
    date: '2025-10-10',
    source: 'google',
    published: true,
  },
  {
    author: 'ნინო თ.',
    rating: 4,
    text: 'კარგი მომსახურება, თანამედროვე აღჭურვილობა. რეკომენდირებულია!',
    date: '2025-09-05',
    source: 'google',
    published: true,
  },
]

async function login() {
  const res = await fetch(`${SITE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Login failed: HTTP ${res.status}`)
  const { token } = await res.json()
  return token
}

async function existingCount(slug, token) {
  const res = await fetch(`${SITE}/api/${slug}?limit=1`, {
    headers: { Authorization: `JWT ${token}` },
  })
  if (!res.ok) return -1
  const data = await res.json()
  return data.totalDocs ?? 0
}

async function create(slug, data, token, locale = 'ge') {
  const res = await fetch(`${SITE}/api/${slug}?locale=${locale}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

const token = await login()
console.log(`▶ Logged in as ${EMAIL} on ${SITE}`)

// --- Checkups ---------------------------------------------------------------
const ckCount = await existingCount('checkup-packages', token)
if (ckCount > 0) {
  console.log(`⏭  checkup-packages already has ${ckCount} row(s) — skipping`)
} else {
  console.log(`▶ Resolving service IDs for includedServices…`)
  const svcs = await fetchServiceIdsByName(token)
  console.log(`  resolved:`, svcs)

  // Build the includedServices array per checkup from the keyword map.
  const buckets = {
    laboratoria: svcs.lab,
    kardiologia: svcs.cardio,
    endokrinologia: svcs.endo,
    gastroenterologia: svcs.gastro,
    neuroloagia: svcs.neuro,
    oftalmologia: svcs.ophthal,
  }

  console.log(`\n▶ Creating ${CHECKUPS.length} checkup packages…`)
  for (const c of CHECKUPS) {
    const linked = c.serviceSlugs
      .map((slug) => buckets[slug])
      .filter((id) => typeof id === 'number')
    if (linked.length === 0) {
      console.error(`\n  ${c.name}: skipped — couldn't resolve any services`)
      continue
    }
    const payload = {
      name: c.name,
      description: c.description,
      price: c.price,
      currency: c.currency,
      isFeatured: c.isFeatured,
      includedServices: linked.map((id) => ({ service: id })),
    }
    try {
      await create('checkup-packages', payload, token)
      process.stdout.write('·')
    } catch (err) {
      process.stdout.write('✗')
      console.error(`\n  ${c.name}: ${err.message}`)
    }
  }
  console.log(`\n✓ Done. Edit /admin/collections/checkup-packages to refine the included services.`)
}

// --- Reviews ----------------------------------------------------------------
const rvCount = await existingCount('reviews', token)
if (rvCount > 0) {
  console.log(`\n⏭  reviews already has ${rvCount} row(s) — skipping`)
} else {
  console.log(`\n▶ Creating ${REVIEWS.length} reviews…`)
  for (const r of REVIEWS) {
    try {
      await create('reviews', r, token)
      process.stdout.write('·')
    } catch (err) {
      process.stdout.write('✗')
      console.error(`\n  ${r.author}: ${err.message}`)
    }
  }
  console.log(`\n✓ Done.`)
}

console.log(`\nFinal counts:`)
console.log(`  checkup-packages: ${await existingCount('checkup-packages', token)}`)
console.log(`  reviews:          ${await existingCount('reviews', token)}`)
