#!/usr/bin/env node
/**
 * One-shot demo helper: set admin@admin.ge's password to '111111' so the
 * Vercel demo can be logged into without remembering anything.
 *
 * Uses Payload's exact hash format (pbkdf2-sha256, 25000 iterations,
 * 512-byte output) so the resulting hash/salt validate against Payload's
 * `authenticate.js` local strategy. Direct DB UPDATE because the local-API
 * boot path is brittle from scripts (it tries to load @next/env which
 * doesn't always resolve outside next dev).
 *
 * Targets whichever Postgres `.env.local` DATABASE_URL points at — same
 * Neon database the Vercel deployment uses.
 *
 * Usage:  node scripts/reset-admin-password.mjs
 */

import pg from 'pg'
import crypto from 'node:crypto'
import fs from 'node:fs'

// Resolution order:
//   1. Inline env: DATABASE_URL='postgresql://...' node scripts/reset-admin-password.mjs
//      — useful when targeting Neon (Vercel's prod DB) without editing .env.local
//   2. .env.local — local Postgres for dev
// Pasting the Neon URL inline avoids ever writing it to disk.
let DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  try {
    const envFile = fs.readFileSync('.env.local', 'utf8')
    DATABASE_URL = envFile.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1]
  } catch {}
}
if (!DATABASE_URL) {
  console.error('No DATABASE_URL provided. Either:')
  console.error('  - set DATABASE_URL=... inline, or')
  console.error('  - have DATABASE_URL= in .env.local')
  process.exit(1)
}

const EMAIL = 'admin@admin.ge'
const NEW_PASSWORD = '111111'

const salt = crypto.randomBytes(32).toString('hex')
const hash = crypto.pbkdf2Sync(NEW_PASSWORD, salt, 25000, 512, 'sha256').toString('hex')

const client = new pg.Client({ connectionString: DATABASE_URL })
await client.connect()
console.log(`▶ Connected to ${DATABASE_URL.replace(/:[^@]+@/, ':***@')}`)

// Reset hash + salt and clear lockout state so the account is immediately
// usable. login_attempts/lock_until are set when failed logins accumulate
// — leaving them stale could lock the new password out.
const result = await client.query(
  `UPDATE users
     SET hash = $1,
         salt = $2,
         login_attempts = 0,
         lock_until = NULL,
         updated_at = NOW()
   WHERE email = $3
   RETURNING id, email`,
  [hash, salt, EMAIL],
)

if (result.rows.length === 0) {
  console.error(`✗ No user with email ${EMAIL}`)
  process.exit(1)
}

console.log(`✓ Password reset for ${result.rows[0].email} (id=${result.rows[0].id})`)
console.log(`   New password: ${NEW_PASSWORD}`)
console.log(`   Hash format: pbkdf2-sha256, 25000 iterations, 512-byte output (Payload's local strategy)`)

await client.end()
