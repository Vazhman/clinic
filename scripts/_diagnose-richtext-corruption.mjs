// Read-only scan: find richText columns holding a plain string (or any
// non-Lexical-shaped value) instead of a SerializedEditorState object.
// This is what crashes the admin Lexical editor with "value passed to the
// Lexical editor is not an object".
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
loadEnvFile(path.resolve('.env'))

const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()

// table, column, id column, label
const TARGETS = [
  { table: 'services_locales', col: 'description', idCol: 'id', parentCol: '_parent_id' },
  { table: 'pages_locales', col: 'body', idCol: 'id', parentCol: '_parent_id' },
  { table: 'news_locales', col: 'body', idCol: 'id', parentCol: '_parent_id' },
  { table: 'lab_tests_locales', col: 'overview', idCol: 'id', parentCol: '_parent_id' },
  { table: 'lab_tests_locales', col: 'why_done', idCol: 'id', parentCol: '_parent_id' },
  { table: 'lab_tests_locales', col: 'preparation', idCol: 'id', parentCol: '_parent_id' },
  { table: 'lab_tests_locales', col: 'what_to_expect', idCol: 'id', parentCol: '_parent_id' },
  { table: 'lab_tests_locales', col: 'interpretation', idCol: 'id', parentCol: '_parent_id' },
  { table: 'doctors_locales', col: 'biography', idCol: 'id', parentCol: '_parent_id' },
  { table: 'policies_locales', col: 'terms', idCol: 'id', parentCol: '_parent_id' },
  { table: 'policies_locales', col: 'privacy', idCol: 'id', parentCol: '_parent_id' },
  { table: 'about_page_locales', col: 'description', idCol: 'id', parentCol: '_parent_id' },
]

try {
  const { rows: tables } = await c.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`,
  )
  const known = new Set(tables.map((t) => t.table_name))

  for (const t of TARGETS) {
    if (!known.has(t.table)) {
      console.log(`\n=== ${t.table}.${t.col}: TABLE MISSING (skip) ===`)
      continue
    }
    const { rows: cols } = await c.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name=$1`,
      [t.table],
    )
    const colNames = new Set(cols.map((r) => r.column_name))
    if (!colNames.has(t.col)) {
      console.log(`\n=== ${t.table}.${t.col}: COLUMN MISSING (skip) ===`)
      continue
    }

    const { rows } = await c.query(
      `SELECT ${t.idCol}, ${t.parentCol}, _locale, ${t.col}
       FROM "${t.table}"
       WHERE ${t.col} IS NOT NULL`,
    )
    const bad = rows.filter((r) => {
      const v = r[t.col]
      if (v === null) return false
      // pg jsonb comes back already parsed as JS value.
      if (typeof v !== 'object' || Array.isArray(v)) return true
      if (!v.root || typeof v.root !== 'object') return true
      return false
    })
    console.log(`\n=== ${t.table}.${t.col}: ${rows.length} rows, ${bad.length} corrupted ===`)
    for (const r of bad.slice(0, 20)) {
      const v = r[t.col]
      const preview = typeof v === 'string' ? v.slice(0, 60) : JSON.stringify(v).slice(0, 60)
      console.log(`  parent=${r[t.parentCol]} locale=${r._locale} type=${typeof v} preview="${preview}"`)
    }
    if (bad.length > 20) console.log(`  ...and ${bad.length - 20} more`)
  }
} finally {
  await c.end()
}
