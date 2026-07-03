// One-shot cleanup: removes the orphan lab_tests_route_* columns from the
// `navigation` global's Postgres tables, left behind when the labTestsRoute
// fixed-route group was added then removed in the same session. With these
// columns gone, Payload's `push: true` boots without prompting.
//
// Idempotent: each statement uses `IF EXISTS`. Safe to re-run.
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

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const client = new pg.Client({ connectionString: url })
await client.connect()

const inspect = async (table) => {
  const r = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name LIKE 'lab_tests_route%'`,
    [table],
  )
  return r.rows.map((row) => row.column_name)
}

const navCols = await inspect('navigation')
const navLocCols = await inspect('navigation_locales')

console.log('orphans on navigation:', navCols)
console.log('orphans on navigation_locales:', navLocCols)

const drops = [
  ...navCols.map((c) => `ALTER TABLE navigation DROP COLUMN IF EXISTS "${c}"`),
  ...navLocCols.map((c) => `ALTER TABLE navigation_locales DROP COLUMN IF EXISTS "${c}"`),
]

for (const sql of drops) {
  console.log(sql)
  await client.query(sql)
}

await client.end()
console.log('done')
