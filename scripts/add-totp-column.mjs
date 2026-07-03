// One-shot: add `totp_secret` column to the users table on Neon.
// payload-totp persists the user's TOTP shared secret in this column.
// Run after deploying the TOTP plugin to a serverless target where
// push:true doesn't fire automatically.
//
//   node scripts/add-totp-column.mjs

import fs from 'node:fs'
import pg from 'pg'

// Minimal .env parser — avoids needing the dotenv package.
for (const line of fs.readFileSync('.env.dev-pull', 'utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue
  const eq = line.indexOf('=')
  if (eq < 0) continue
  const key = line.slice(0, eq).trim()
  let val = line.slice(eq + 1).trim()
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
  process.env[key] = val
}

const url = process.env.DATABASE_URL
if (!url || !url.startsWith('postgres')) {
  console.error('DATABASE_URL missing or not a Postgres URL (got:', url?.slice(0, 12), '...)')
  process.exit(1)
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()

const { rows: cols } = await client.query(`
  SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
   WHERE table_name = 'users' AND column_name = 'totp_secret'
`)

if (cols.length > 0) {
  console.log('already exists:', cols[0])
} else {
  console.log('adding column users.totp_secret text NULL …')
  await client.query(`ALTER TABLE users ADD COLUMN totp_secret text`)
  console.log('done.')
}

const { rows: verify } = await client.query(`
  SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
   WHERE table_name = 'users'
   ORDER BY ordinal_position
`)
console.log('\nfinal users schema:')
for (const r of verify) console.log(`  ${r.column_name.padEnd(28)} ${r.data_type.padEnd(20)} ${r.is_nullable}`)

await client.end()
