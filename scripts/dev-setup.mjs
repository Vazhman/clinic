#!/usr/bin/env node
// One-shot local dev bootstrap. Idempotent — safe to re-run.
//
//   node scripts/dev-setup.mjs    (or `npm run setup`)
//
// What it does:
//   1. Checks Node 20+ and Docker are installed.
//   2. Starts the Postgres container (docker-compose.yml).
//   3. Waits for Postgres to accept connections.
//   4. Copies .env.example → .env.local if missing.
//   5. Runs `npm install` if node_modules is missing.
//   6. Generates Payload types (best-effort).
//   7. Prints the next steps.

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, copyFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILE = resolve(root, '.env.local')
const ENV_TEMPLATE = resolve(root, '.env.example')

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
}
const log = {
  step: (n, msg) => console.log(`\n${c.bold}${c.cyan}[${n}/6]${c.reset} ${c.bold}${msg}${c.reset}`),
  ok:   (msg) => console.log(`  ${c.green}✓${c.reset} ${msg}`),
  warn: (msg) => console.log(`  ${c.yellow}!${c.reset} ${msg}`),
  err:  (msg) => console.error(`  ${c.red}✗${c.reset} ${msg}`),
  info: (msg) => console.log(`  ${c.dim}${msg}${c.reset}`),
}

function die(msg) {
  log.err(msg)
  process.exit(1)
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32', ...opts })
  return { code: r.status ?? 1, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() }
}

function runStream(cmd, args) {
  return new Promise((res, rej) => {
    const child = spawn(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
    child.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${cmd} ${args.join(' ')} exited ${code}`))))
  })
}

// 1. Pre-flight ---------------------------------------------------------------
log.step(1, 'Pre-flight')

const nodeMajor = Number(process.versions.node.split('.')[0])
if (nodeMajor < 20) die(`Node ${process.versions.node} is too old. Install Node 20+ (24 LTS recommended).`)
log.ok(`Node ${process.versions.node}`)

const docker = run('docker', ['--version'])
if (docker.code !== 0) die('Docker not found. Install Docker Desktop: https://www.docker.com/products/docker-desktop/')
log.ok(docker.stdout)

const compose = run('docker', ['compose', 'version'])
if (compose.code !== 0) die('`docker compose` not available. Update Docker Desktop.')
log.ok(compose.stdout)

// 2. Postgres -----------------------------------------------------------------
log.step(2, 'Starting Postgres')
try {
  await runStream('docker', ['compose', 'up', '-d', 'postgres'])
  log.ok('container up')
} catch (e) {
  die(`docker compose up failed: ${e.message}`)
}

// 3. Wait for healthy ---------------------------------------------------------
log.step(3, 'Waiting for Postgres to accept connections')
const start = Date.now()
const TIMEOUT_MS = 60_000
let ready = false
while (Date.now() - start < TIMEOUT_MS) {
  const r = run('docker', ['exec', 'clinic-postgres', 'pg_isready', '-U', 'clinic', '-d', 'clinic'])
  if (r.code === 0) { ready = true; break }
  await new Promise((res) => setTimeout(res, 1000))
}
if (!ready) die('Postgres did not become ready in 60s. Check `docker logs clinic-postgres`.')
log.ok('Postgres ready on localhost:5432 (user: clinic, db: clinic)')

// 4. .env.local ---------------------------------------------------------------
log.step(4, 'Environment file')
if (existsSync(ENV_FILE)) {
  log.ok('.env.local already exists — leaving it alone')
} else {
  if (!existsSync(ENV_TEMPLATE)) die('.env.example missing. Pull the latest main.')
  copyFileSync(ENV_TEMPLATE, ENV_FILE)
  log.ok('.env.local created from .env.example')
  log.warn('Fill in DOCTRA_USER / DOCTRA_PASSWORD if you need the booking flow to work.')
}

// 5. Dependencies -------------------------------------------------------------
log.step(5, 'Dependencies')
if (existsSync(resolve(root, 'node_modules'))) {
  log.ok('node_modules present — skipping install (delete it to force a reinstall)')
} else {
  log.info('Running npm install (this may take a minute)…')
  try {
    await runStream(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install'])
    log.ok('dependencies installed')
  } catch (e) {
    die(`npm install failed: ${e.message}`)
  }
}

// 6. Payload types ------------------------------------------------------------
log.step(6, 'Payload types')
try {
  const envFile = readFileSync(ENV_FILE, 'utf8')
  for (const line of envFile.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
    if (!(key in process.env)) process.env[key] = val
  }
  await runStream(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['payload', 'generate:types'])
  log.ok('src/payload-types.ts regenerated')
} catch (e) {
  log.warn(`Skipped type generation: ${e.message}`)
  log.info('You can rerun later with: npx payload generate:types')
}

// Done ------------------------------------------------------------------------
console.log(`
${c.bold}${c.green}Setup complete.${c.reset}

Next steps:
  ${c.cyan}npm run dev${c.reset}      ${c.dim}# start the app at http://localhost:3000${c.reset}
  ${c.cyan}npm run seed${c.reset}     ${c.dim}# seed demo content (run once, dev server must be up)${c.reset}

Then open:
  ${c.cyan}http://localhost:3000${c.reset}            ${c.dim}# public site${c.reset}
  ${c.cyan}http://localhost:3000/admin${c.reset}      ${c.dim}# Payload admin (admin@admin.ge / 111111 after seed)${c.reset}

Other helpers:
  ${c.cyan}npm run db:down${c.reset}   ${c.dim}# stop the Postgres container${c.reset}
  ${c.cyan}npm run db:reset${c.reset}  ${c.dim}# wipe the database volume and start fresh${c.reset}
`)
