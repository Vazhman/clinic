#!/usr/bin/env node
/**
 * Sample the live Doctra catalogue: for each unique branch, ask Doctra
 * which doctors have AVAILABLE slots in the next 14 days. Cross-reference
 * with the local DB to pretty-print doctor names + specialties.
 *
 * Output is intended as a quick "go test these" list — picks the first
 * 30 doctors with real availability so the user can run through the
 * booking flow without hunting.
 */
import pg from 'pg'

const SITE = 'http://localhost:3000'
const c = new pg.Client({ connectionString: 'postgresql://clinic:clinic@localhost:5432/clinic' })
await c.connect()

const today = new Date()
const begin = today.toISOString().split('T')[0]
const endDate = new Date(today)
endDate.setDate(endDate.getDate() + 14)
const end = endDate.toISOString().split('T')[0]

console.log(`▶ Checking availability ${begin} → ${end} (14 days)\n`)

// All doctors with their branch
const docsRes = await c.query(`
  SELECT d.doctra_id, d.doctra_branch_id, d.slug, dl.name, dl.specialty
  FROM doctors d
  LEFT JOIN doctors_locales dl ON dl._parent_id = d.id AND dl._locale = 'ge'
  WHERE d.doctra_id IS NOT NULL AND d.doctra_branch_id IS NOT NULL
    AND d.inactive = false
`)
const docs = docsRes.rows
const byOp = new Map(docs.map((d) => [d.doctra_id, d]))

// Unique branches
const branches = [...new Set(docs.map((d) => d.doctra_branch_id))]
console.log(`Sampling ${branches.length} branches across ${docs.length} doctors…\n`)

// For each branch, find one doctor in it and ask for the summary
// (Doctra returns slots per branch+operator; we cycle through doctors)
const withSlots = new Map() // doctra_id -> [dates]
let checked = 0

for (const branchId of branches) {
  // Find a doctor in this branch as the operator filter for the API
  const branchDocs = docs.filter((d) => d.doctra_branch_id === branchId)
  // Doctra returns slots for the WHOLE branch keyed by doctor_id; we just
  // need one operator to satisfy the API signature.
  const probe = branchDocs[0]
  if (!probe) continue

  try {
    // Use the public timeslots endpoint, but skip the operator filter at
    // the response layer — we want all doctor_ids that have available slots.
    const url = `${SITE}/api/booking/timeslots?summary=1&branchId=${encodeURIComponent(branchId)}&operatorId=${encodeURIComponent(probe.doctra_id)}&dateBegin=${begin}&dateEnd=${end}&lang=ge`
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) {
      process.stdout.write('✗')
      continue
    }
    const data = await res.json()
    const dates = data.availableDates ?? []
    if (dates.length > 0) {
      withSlots.set(probe.doctra_id, dates)
      process.stdout.write('·')
    } else {
      process.stdout.write('.')
    }
  } catch {
    process.stdout.write('✗')
  }
  checked++
}

console.log(`\n\nChecked ${checked} branches. Found ${withSlots.size} doctor probes with slots.\n`)

// The "summary" endpoint filters by operator, so what we really collected
// is the first doctor per branch that happens to have slots. To get the
// full per-doctor list we'd need to call the endpoint for every doctor —
// that's 146 calls. As a sampling pass, we just list the branches that
// returned ANY availability, plus all doctors inside those branches.
const branchesWithAnySlot = new Set(
  [...withSlots.keys()].map((opId) => byOp.get(opId)?.doctra_branch_id).filter(Boolean),
)

console.log(`Branches with ≥1 available doctor: ${branchesWithAnySlot.size}\n`)
console.log('Doctors in those branches — try these in the booking wizard:\n')

const candidates = docs.filter((d) => branchesWithAnySlot.has(d.doctra_branch_id))
for (const d of candidates.slice(0, 40)) {
  const probeDates = withSlots.get(d.doctra_id)
  const marker = probeDates ? `★ confirmed (${probeDates.length} day${probeDates.length === 1 ? '' : 's'})` : '  in same branch'
  console.log(`  ${marker.padEnd(28)} ${(d.name ?? '?').padEnd(28)} | ${d.specialty ?? '?'} | slug: ${d.slug}`)
}
if (candidates.length > 40) console.log(`  …and ${candidates.length - 40} more`)

await c.end()
console.log('\nLegend: ★ confirmed = we directly verified slots; otherwise it shares a branch with a doctor who has slots.')
