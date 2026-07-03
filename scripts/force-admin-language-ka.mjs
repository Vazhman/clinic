#!/usr/bin/env node
/**
 * Force every admin user's UI language preference to 'ka' (Georgian).
 *
 * Why this exists: Payload 3 stores per-user UI language as a row in
 * `payload_preferences` (key='language', value='"ka"' as JSONB) linked to
 * the user via a polymorphic join table `payload_preferences_rels`
 * (parent_id → preference.id, users_id → users.id, path='user'). When a
 * user has never opened the language picker, no row exists and Payload
 * falls back to the browser Accept-Language header — which on Windows en-US
 * installs is English regardless of how much Georgian sits in the schema.
 *
 * Safe to re-run: upserts the language pref + its join row, ignores other
 * preferences (locale, list-column layouts, etc).
 *
 * Usage:  node scripts/force-admin-language-ka.mjs
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

const client = new pg.Client({ connectionString: DATABASE_URL })
await client.connect()
console.log(`▶ Connected to ${DATABASE_URL.replace(/:[^@]+@/, ':***@')}`)

const users = await client.query('SELECT id, email FROM users')
console.log(`▶ Found ${users.rows.length} user(s)`)

for (const u of users.rows) {
  // Step 1: find or create the preferences row for this user's language.
  // The join is reached via payload_preferences_rels (path='user',
  // users_id=u.id) — we look up the parent_id and then check that the
  // preference has key='language'.
  const existing = await client.query(
    `SELECT p.id, p.value
       FROM payload_preferences p
       JOIN payload_preferences_rels r ON r.parent_id = p.id
      WHERE r.users_id = $1 AND r.path = 'user' AND p.key = 'language'`,
    [u.id],
  )

  if (existing.rows.length > 0) {
    const prefId = existing.rows[0].id
    const prevValue = existing.rows[0].value
    await client.query(
      `UPDATE payload_preferences SET value = $1::jsonb, updated_at = NOW() WHERE id = $2`,
      ['"ka"', prefId],
    )
    console.log(`  ✓ ${u.email}: was ${JSON.stringify(prevValue)} → now "ka"`)
  } else {
    // Insert preference row first to get its id, then create the join row.
    const insertPref = await client.query(
      `INSERT INTO payload_preferences (key, value, created_at, updated_at)
       VALUES ('language', $1::jsonb, NOW(), NOW())
       RETURNING id`,
      ['"ka"'],
    )
    const prefId = insertPref.rows[0].id
    await client.query(
      `INSERT INTO payload_preferences_rels (parent_id, path, users_id)
       VALUES ($1, 'user', $2)`,
      [prefId, u.id],
    )
    console.log(`  + ${u.email}: created language=ka`)
  }
}

await client.end()
console.log('▶ Done. Hard-refresh the admin (Ctrl+Shift+R) to see Georgian UI.')
