import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let v = m[2]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[m[1]]) process.env[m[1]] = v
  }
}
loadEnvFile(path.resolve('.env.local'))
loadEnvFile(path.resolve('.env'))

const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()
const total = await c.query('SELECT COUNT(*) FROM doctors')
const withSpec = await c.query(
  `SELECT COUNT(*) FROM doctors_locales WHERE specialty IS NOT NULL AND specialty != '' AND _locale = 'ge'`,
)
const emptyByLocale = await c.query(
  `SELECT _locale,
     COUNT(*) FILTER (WHERE specialty IS NULL OR specialty = '') AS empty,
     COUNT(*) AS total
   FROM doctors_locales GROUP BY _locale ORDER BY _locale`,
)
const sample = await c.query(
  `SELECT d.slug, dl.name, dl.specialty
   FROM doctors d
   LEFT JOIN doctors_locales dl ON dl._parent_id = d.id
   WHERE dl._locale = 'ge'
   ORDER BY d.created_at DESC
   LIMIT 20`,
)
const tamta = await c.query(
  `SELECT d.id, d.slug, d.doctra_id, d.doctra_branch_id, d.booking_enabled, dl.name, dl.specialty
   FROM doctors d
   LEFT JOIN doctors_locales dl ON dl._parent_id = d.id AND dl._locale = 'ge'
   WHERE dl.name ILIKE '%ვერძაძე%' OR dl.name ILIKE '%verdzadze%' OR d.slug ILIKE '%verdzadze%'`,
)
console.log('=== TOTALS ===')
console.log('total doctors:', total.rows[0].count)
console.log('doctors with non-empty ge specialty:', withSpec.rows[0].count)
console.log('\n=== EMPTY SPECIALTY BY LOCALE ===')
for (const r of emptyByLocale.rows) console.log(`  ${r._locale}: ${r.empty} empty / ${r.total} total`)
console.log('\n=== 20 MOST RECENT DOCTORS (ge) ===')
for (const r of sample.rows) {
  console.log(`  ${(r.slug || '').padEnd(34)} | ${(r.name || '').padEnd(28)} | ${r.specialty || '(empty)'}`)
}
console.log('\n=== TAMTA VERDZADZE ROW ===')
for (const r of tamta.rows) {
  console.log(JSON.stringify(r, null, 2))
}
await c.end()
