import { Client } from 'pg'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const match = envContent.match(/DATABASE_URL="([^"]+)"/)
const DATABASE_URL = match[1]

const client = new Client({ connectionString: DATABASE_URL })
await client.connect()

const tables = await client.query("select table_name from information_schema.tables where table_name ilike '%doctor%' order by table_name")
console.log('TABLES:', tables.rows.map(r => r.table_name))

const cols = await client.query("select table_name, column_name, data_type from information_schema.columns where table_name ilike '%doctor%' and column_name ilike '%biography%'")
console.log('BIO COLUMNS:', cols.rows)

for (const row of cols.rows) {
  const sample = await client.query(`select id, "${row.column_name}" from "${row.table_name}" where "${row.column_name}" is not null limit 5`)
  console.log(`--- sample from ${row.table_name}.${row.column_name} ---`)
  for (const s of sample.rows) {
    const val = s[row.column_name]
    console.log('id:', s.id, 'typeof:', typeof val, 'preview:', JSON.stringify(val).slice(0, 300))
  }
}

await client.end()
