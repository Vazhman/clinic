// Throwaway: verify the HomePage "featured doctors" controls (pool + count +
// randomize) actually drive the home-page doctors section. Saves the current
// config, applies a test config, and restores it.
const SITE = process.env.SITE || 'http://localhost:3001'
const api = async (path, opts = {}) => {
  const res = await fetch(`${SITE}/api${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(global.TOKEN ? { Authorization: `JWT ${global.TOKEN}` } : {}), ...(opts.headers || {}) },
  })
  let body = null
  try { body = await res.json() } catch {}
  return { status: res.status, body }
}

// auth
{
  const r = await api('/users/login', { method: 'POST', body: JSON.stringify({ email: 'admin@admin.ge', password: '111111' }) })
  global.TOKEN = r.body?.token
  if (!global.TOKEN) { console.error('login failed', r.status); process.exit(2) }
}

// 4-doctor pool (id + slug)
const docsRes = await api('/doctors?limit=4&depth=0&locale=ge')
const pool = docsRes.body.docs.map((d) => ({ id: d.id, slug: d.slug }))
console.log('pool (4):', pool.map((d) => `${d.id}=${d.slug}`).join(', '))

// save current config
const before = await api('/globals/home-page?depth=0')
const saved = {
  featuredDoctors: (before.body.featuredDoctors ?? []).map((d) => (typeof d === 'object' ? d.id : d)),
  featuredDoctorCount: before.body.featuredDoctorCount ?? 3,
  randomizeFeaturedDoctors: before.body.randomizeFeaturedDoctors ?? false,
}
console.log('saved config:', JSON.stringify(saved))

// apply test config: this pool, count 3, randomize ON
const set = await api('/globals/home-page?depth=0', {
  method: 'POST',
  body: JSON.stringify({ featuredDoctors: pool.map((d) => d.id), featuredDoctorCount: 3, randomizeFeaturedDoctors: true }),
})
console.log('apply test config ->', set.status, set.status !== 200 ? JSON.stringify(set.body?.errors)?.slice(0, 200) : '')

// read back to confirm it stored
const after = await api('/globals/home-page?depth=0')
console.log('stored:', 'count=' + after.body.featuredDoctorCount, 'random=' + after.body.randomizeFeaturedDoctors, 'pool=' + (after.body.featuredDoctors ?? []).length)

// hit the home page 6x, collect which doctor slugs appear in the section
const poolSlugs = new Set(pool.map((d) => d.slug))
const seen = new Set()
const sets = []
for (let i = 0; i < 6; i++) {
  const html = await (await fetch(`${SITE}/ge`)).text()
  const slugs = [...new Set([...html.matchAll(/\/eqimebi\/([a-z0-9-]+)/g)].map((m) => m[1]))]
    .filter((s) => poolSlugs.has(s))
  slugs.forEach((s) => seen.add(s))
  sets.push(slugs.join(','))
}
console.log('home loads (pool-members shown each load):')
sets.forEach((s, i) => console.log(`  load ${i + 1}: [${s}]`))
console.log('distinct pool doctors seen across loads:', seen.size, '/ 4  (>3 means it reshuffles)')
console.log('all shown doctors are within the selected pool:', sets.every((s) => s.split(',').filter(Boolean).every((x) => poolSlugs.has(x))))

// restore
const restore = await api('/globals/home-page?depth=0', {
  method: 'POST',
  body: JSON.stringify(saved),
})
console.log('restore original config ->', restore.status)
