import { Client } from 'pg'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const match = envContent.match(/DATABASE_URL="([^"]+)"/)
const DATABASE_URL = match[1]

const client = new Client({ connectionString: DATABASE_URL })
await client.connect()

const rows = await client.query(`
  select d.id, d.slug, dl._locale, dl.biography
  from doctors d
  join doctors_locales dl on dl._parent_id = d.id
  where dl.biography is not null
  order by d.id
  limit 5
`)
for (const r of rows.rows) {
  console.log(r.id, r.slug, r._locale, JSON.stringify(r.biography).length, 'chars')
}

await client.end()
