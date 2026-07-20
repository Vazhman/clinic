// Repairs about_page_locales.ceo_message: every row currently holds a plain
// string instead of a SerializedEditorState, since AboutPage.ts's ceo.message
// field was changed from `textarea` to `richText` in code (2026-07-20) but the
// Neon column was never migrated — same class of bug as
// _fix-services-description-lexical.mjs / neon-migrate-2026-07-18-services-description-jsonb.sql.
// Splits on blank lines into one paragraph node per chunk (unlike the
// services fix, which kept everything as a single paragraph) so the CEO
// message renders as real paragraph breaks via the About page's Lexical
// paragraph renderer, matching how `description` already renders.
// Writes a JSON backup of old values before touching anything.
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

const DRY_RUN = process.argv.includes('--dry-run')

function textNode(text) {
  return { type: 'text', format: 0, detail: 0, mode: 'normal', style: '', text, version: 1 }
}
function paragraphNode(text) {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    textFormat: 0,
    textStyle: '',
    children: [textNode(text)],
  }
}
function toLexical(raw) {
  const paras = raw
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const children = (paras.length ? paras : [raw.trim()]).map(paragraphNode)
  return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } }
}

const cs = process.env.DATABASE_URL
const ssl = /neon\.tech/.test(cs) ? { rejectUnauthorized: false } : false
const c = new pg.Client({ connectionString: cs, ssl })
await c.connect()

try {
  const { rows } = await c.query(
    `SELECT id, _parent_id, _locale, ceo_message FROM "about_page_locales" WHERE ceo_message IS NOT NULL`,
  )
  const toFix = rows.filter((r) => typeof r.ceo_message === 'string')
  console.log(`Found ${toFix.length} rows to repair (of ${rows.length} total).`)

  const backupPath = path.resolve(
    `scripts/_backup-about-ceo-message-${DRY_RUN ? 'dryrun-' : ''}${Date.now()}.json`,
  )
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      toFix.map((r) => ({ id: r.id, parent_id: r._parent_id, locale: r._locale, old_value: r.ceo_message })),
      null,
      2,
    ),
    'utf8',
  )
  console.log(`Backup written to ${backupPath}`)

  if (DRY_RUN) {
    console.log('--dry-run: no writes performed.')
    console.log('Sample converted value for first row:')
    if (toFix[0]) console.log(JSON.stringify(toLexical(toFix[0].ceo_message), null, 2))
  } else {
    let count = 0
    for (const r of toFix) {
      const lexical = toLexical(r.ceo_message)
      await c.query(`UPDATE "about_page_locales" SET ceo_message = $1 WHERE id = $2`, [
        JSON.stringify(lexical),
        r.id,
      ])
      count++
    }
    console.log(`Updated ${count} rows.`)
  }
} finally {
  await c.end()
}
