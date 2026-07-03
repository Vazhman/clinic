#!/usr/bin/env node
/**
 * Nuke any test-leftover values from the local Postgres so the dev site
 * renders next-intl fallbacks again. Run after verify-cms-wiring.mjs when
 * required-field validation prevents a clean reset via the REST API.
 *
 * Strategy: truncate the Payload global tables. Payload re-creates fresh
 * empty global rows on next read.
 */

import pg from 'pg'
import fs from 'node:fs'

const envFile = fs.readFileSync('.env.local', 'utf8')
const dbUrlMatch = envFile.match(/^DATABASE_URL="?([^"\n]+)"?/m)
if (!dbUrlMatch) {
  console.error('Could not read DATABASE_URL from .env.local')
  process.exit(1)
}
const DATABASE_URL = dbUrlMatch[1]

const GLOBALS_TO_RESET = [
  'contact_page', 'footer', 'navigation', 'home_page', 'about_page', 'booking_page',
]

const client = new pg.Client({ connectionString: DATABASE_URL })
await client.connect()
console.log(`▶ Connected to ${DATABASE_URL.replace(/:[^@]+@/, ':***@')}`)

// Discover real table names — Payload pluralizes/normalises global slugs
// inconsistently ("home-page" → "home_page"; locales table is suffixed).
const tableRes = await client.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
    AND (table_name LIKE 'contact_page%' OR table_name LIKE 'footer%' OR table_name LIKE 'navigation%'
         OR table_name LIKE 'home_page%' OR table_name LIKE 'about_page%' OR table_name LIKE 'booking_page%')
  ORDER BY table_name
`)
console.log('▶ Tables found:')
for (const r of tableRes.rows) console.log(`   ${r.table_name}`)

console.log('\n▶ Truncating…')
for (const row of tableRes.rows) {
  try {
    await client.query(`TRUNCATE TABLE "${row.table_name}" CASCADE`)
    console.log(`   ✓ truncated ${row.table_name}`)
  } catch (err) {
    console.log(`   ✗ ${row.table_name}: ${err.message}`)
  }
}

await client.end()
console.log('\n▶ Done. Visit the dev site to confirm next-intl fallbacks are back.')
