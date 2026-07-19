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
const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()
const { rows } = await c.query(
  `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name='services_locales'`,
)
console.log(rows)
await c.end()
