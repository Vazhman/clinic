#!/usr/bin/env node
/**
 * One-shot tool: ask Doctra which doctors have ≥1 available slot in the
 * next 14 days, set `bookingEnabled` accordingly on each Payload doctor.
 *
 * Why: the doctor profile page reads `bookingEnabled` directly from the
 * DB to decide whether to render the booking CTA + widget — no Doctra
 * round-trip on render. This script gives the schema a sensible starting
 * point ("doctors with real slots = true, the rest = false") so admin
 * doesn't have to flip 146 checkboxes by hand. After this, admin
 * curates per-doctor in the Payload sidebar.
 *
 * Re-runnable: re-running picks up any new/lost availability since the
 * last run. Schedule via cron or just run before major customer demos.
 *
 * Usage:
 *   node scripts/sync-booking-enabled.mjs [--target=local|prod]
 *
 * Defaults to local. The Doctra hit goes through the site's own
 * /api/booking/timeslots endpoint (which has the auth + token caching
 * built in), so the site must be running.
 */

import pg from 'pg'

const argTarget = process.argv.find((a) => a.startsWith('--target='))?.split('=')[1] ?? 'local'
const SITE = argTarget === 'prod' ? 'https://clinic-one-blush.vercel.app' : 'http://localhost:3000'
const DATABASE_URL = argTarget === 'prod'
  ? process.env.NEON_DATABASE_URL // set this env var when running against prod Neon
  : 'postgresql://clinic:clinic@localhost:5432/clinic'

if (argTarget === 'prod' && !DATABASE_URL) {
  console.error('Set NEON_DATABASE_URL env var before running with --target=prod')
  process.exit(1)
}

// Concurrency cap — Doctra is single-threaded behind the scenes and gets
// grumpy with parallel requests. 8 is a safe middle ground.
const CONCURRENCY = 8

const today = new Date()
const begin = today.toISOString().split('T')[0]
const endDate = new Date(today)
endDate.setDate(endDate.getDate() + 14)
const end = endDate.toISOString().split('T')[0]

console.log(`▶ Target: ${SITE}`)
console.log(`▶ Window: ${begin} → ${end} (14 days)\n`)

const c = new pg.Client({ connectionString: DATABASE_URL })
await c.connect()

const docsRes = await c.query(`
  SELECT id, doctra_id, doctra_branch_id, booking_enabled
  FROM doctors
  WHERE doctra_id IS NOT NULL AND doctra_id <> ''
    AND doctra_branch_id IS NOT NULL AND doctra_branch_id <> ''
    AND (inactive IS NULL OR inactive = false)
`)
const docs = docsRes.rows
console.log(`▶ Checking ${docs.length} doctors with Doctra links…\n`)

async function hasSlot(doc) {
  const url = `${SITE}/api/booking/timeslots?summary=1&branchId=${encodeURIComponent(doc.doctra_branch_id)}&operatorId=${encodeURIComponent(doc.doctra_id)}&dateBegin=${begin}&dateEnd=${end}&lang=ge`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return null // unknown — leave existing state
    const data = await res.json()
    return Array.isArray(data.availableDates) && data.availableDates.length > 0
  } catch {
    return null // network blip — don't flip the switch
  }
}

// Process in batches of CONCURRENCY, show progress
const results = new Map() // id -> {prev, next, dates}
let progress = 0
for (let i = 0; i < docs.length; i += CONCURRENCY) {
  const batch = docs.slice(i, i + CONCURRENCY)
  const checks = await Promise.all(batch.map((d) => hasSlot(d)))
  batch.forEach((d, idx) => {
    const has = checks[idx]
    if (has === null) {
      results.set(d.id, { prev: d.booking_enabled, next: d.booking_enabled, skipped: true })
    } else {
      results.set(d.id, { prev: d.booking_enabled, next: has, skipped: false })
    }
    progress++
  })
  process.stdout.write(`  progress: ${progress}/${docs.length}\r`)
}
console.log(`\n`)

// Compute changes
const toEnable = []
const toDisable = []
const skipped = []
for (const [id, r] of results) {
  if (r.skipped) { skipped.push(id); continue }
  if (r.prev === false && r.next === true) toEnable.push(id)
  if (r.prev !== false && r.next === false) toDisable.push(id) // prev null/true → next false
}

console.log(`Doctors to ENABLE booking on:  ${toEnable.length}`)
console.log(`Doctors to DISABLE booking on: ${toDisable.length}`)
console.log(`Doctors skipped (Doctra error): ${skipped.length}`)
console.log(`Doctors unchanged:             ${docs.length - toEnable.length - toDisable.length - skipped.length}`)
console.log()

// Apply in two UPDATE statements
if (toEnable.length > 0) {
  await c.query(`UPDATE doctors SET booking_enabled = true WHERE id = ANY($1::int[])`, [toEnable])
  console.log(`✓ Enabled booking on ${toEnable.length} doctors`)
}
if (toDisable.length > 0) {
  await c.query(`UPDATE doctors SET booking_enabled = false WHERE id = ANY($1::int[])`, [toDisable])
  console.log(`✓ Disabled booking on ${toDisable.length} doctors`)
}

// Final state
const finalRes = await c.query(`SELECT COUNT(*) FILTER (WHERE booking_enabled = true) AS enabled, COUNT(*) FILTER (WHERE booking_enabled = false) AS disabled FROM doctors WHERE doctra_id IS NOT NULL`)
console.log(`\nFinal state:`)
console.log(`  enabled  = ${finalRes.rows[0].enabled}`)
console.log(`  disabled = ${finalRes.rows[0].disabled}`)

await c.end()
