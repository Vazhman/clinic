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

const sql = fs.readFileSync(
  path.resolve('scripts/neon-migrate-2026-07-18-services-description-jsonb.sql'),
  'utf8',
)
const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()
try {
  await c.query(sql)
  console.log('OK — sql applied')
} finally {
  await c.end()
}
