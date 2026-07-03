#!/usr/bin/env node
/**
 * Run a raw .sql file against a Postgres connection in a single round-trip.
 * The file is responsible for its own BEGIN/COMMIT (so it is atomic).
 *
 * Usage:
 *   CONN="postgresql://..." node scripts/_run-sql-file.mjs path/to/file.sql
 *
 * SSL is forced on with rejectUnauthorized:false so Neon's verify-full strings
 * work without shipping a CA bundle.
 */
import { readFileSync } from 'node:fs'
import pg from 'pg'

const file = process.argv[2]
const conn = process.env.CONN
if (!file || !conn) {
  console.error('usage: CONN=<url> node scripts/_run-sql-file.mjs <file.sql>')
  process.exit(2)
}

const sql = readFileSync(file, 'utf8')
const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })

await client.connect()
try {
  await client.query(sql)
  console.log('OK — sql applied')
} catch (e) {
  console.error('FAILED:', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
