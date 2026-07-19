// Repairs services_locales.description: every row currently holds a plain
// string instead of a SerializedEditorState, which crashes the admin
// Lexical editor. Wraps each string as a single paragraph node so the exact
// original text is preserved (multi-line text still renders correctly via
// the existing whitespace-pre-wrap CSS on the richText container).
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

function toLexical(text) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          textStyle: '',
          children: [
            {
              type: 'text',
              format: 0,
              detail: 0,
              mode: 'normal',
              style: '',
              text,
              version: 1,
            },
          ],
        },
      ],
    },
  }
}

const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()

try {
  const { rows } = await c.query(
    `SELECT id, _parent_id, _locale, description FROM "services_locales" WHERE description IS NOT NULL`,
  )
  const toFix = rows.filter((r) => typeof r.description === 'string')
  console.log(`Found ${toFix.length} rows to repair (of ${rows.length} total).`)

  const backupPath = path.resolve(
    `scripts/_backup-services-description-${DRY_RUN ? 'dryrun-' : ''}${Date.now()}.json`,
  )
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      toFix.map((r) => ({ id: r.id, parent_id: r._parent_id, locale: r._locale, old_value: r.description })),
      null,
      2,
    ),
    'utf8',
  )
  console.log(`Backup written to ${backupPath}`)

  if (DRY_RUN) {
    console.log('--dry-run: no writes performed.')
    console.log('Sample converted value for first row:')
    if (toFix[0]) console.log(JSON.stringify(toLexical(toFix[0].description), null, 2))
  } else {
    let count = 0
    for (const r of toFix) {
      const lexical = toLexical(r.description)
      await c.query(`UPDATE "services_locales" SET description = $1 WHERE id = $2`, [
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
