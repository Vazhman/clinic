import { Client } from 'pg'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const match = envContent.match(/DATABASE_URL="([^"]+)"/)
const DATABASE_URL = match[1]

const client = new Client({ connectionString: DATABASE_URL })
await client.connect()

const sample = await client.query(`select id, biography from doctors_locales where biography is not null`)
const typeSet = new Set()
function walk(n) {
  if (!n || typeof n !== 'object') return
  if (n.type) typeSet.add(n.type)
  if (Array.isArray(n.children)) n.children.forEach(walk)
}
for (const row of sample.rows) {
  walk(row.biography?.root)
}
console.log('Node types found across all doctor biographies:', [...typeSet])
console.log('Total rows with biography:', sample.rows.length)

// check for null/malformed roots
for (const row of sample.rows) {
  if (!row.biography?.root) {
    console.log('MALFORMED (no root):', row.id, JSON.stringify(row.biography).slice(0,200))
  }
}

await client.end()
