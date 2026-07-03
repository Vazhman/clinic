#!/usr/bin/env node
/**
 * Seed / repair the checkup-packages collection into the canonical
 * tier × audience matrix the home page + /checkups page expect:
 *
 *     audience ∈ { woman, man, child }   ×   tier ∈ { economy, standard, premium }
 *     → 9 packages, one per cell.
 *
 * WHY: the home-page tier cards (CheckupCards) filter packages by `tier`, and
 * the new tier→gender→details modal flow needs exactly one package per
 * (tier, audience) cell. Some environments (e.g. local Docker) were left with
 * 3 legacy packages that have NO audience/tier set, so every tier filter came
 * back empty and the modal was blank. This script makes the collection match
 * the canonical 9-cell matrix on whatever SITE you point it at.
 *
 * Content source: scripts/checkup-matrix.json — the real clinic check-up
 * content (names ge/en/ru, examination counts, and the verbatim Georgian test
 * lists). The test lists are intentionally Georgian-only (en/ru fall back to
 * ge), exactly like the rest of the check-up catalogue. No content invented.
 *
 * IDEMPOTENT: each cell is keyed on (audience, tier). On re-run an existing
 * cell is PATCHed in place (no duplicates); missing cells are created. Legacy
 * packages with no audience AND no tier are deleted (they're the stale rows the
 * matrix replaces). Real matrix rows are never deleted.
 *
 * Usage:
 *   SITE=http://localhost:3005 node scripts/seed-checkup-matrix.mjs [--dry]
 *   SITE=https://clinic-one-blush.vercel.app node scripts/seed-checkup-matrix.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = process.env.SITE || "http://localhost:3005";
const EMAIL = process.env.ADMIN_EMAIL || "admin@admin.ge";
const PASSWORD = process.env.ADMIN_PASSWORD || "111111";
const DRY = process.argv.includes("--dry");
const LOCALES = ["ge", "en", "ru"];
const CURRENCY = "GEL";

const MATRIX = JSON.parse(
  fs.readFileSync(path.join(__dirname, "checkup-matrix.json"), "utf8"),
);

let token = "";
async function api(p, opts = {}) {
  const res = await fetch(`${SITE}/api${p}`, {
    ...opts,
    headers: {
      ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `JWT ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  let body = null;
  try { body = await res.json(); } catch { /* */ }
  return { status: res.status, body };
}

// ── auth ────────────────────────────────────────────────────────────────────
{
  const { status, body } = await api("/users/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (status !== 200 || !body?.token) {
    console.error("LOGIN FAILED", status, JSON.stringify(body).slice(0, 200));
    process.exit(2);
  }
  token = body.token;
  console.log(`${DRY ? "[DRY] " : ""}seeding checkup matrix on ${SITE}\n`);
}

// ── load current docs (ge) so we can match cells + find legacy rows ──────────
const existing = await api(`/checkup-packages?locale=ge&depth=0&limit=200`);
const docs = existing.body?.docs ?? [];
console.log(`current checkup-packages: ${docs.length}`);
const cellKey = (a, t) => `${a}|${t}`;
const byCell = new Map();
const legacy = [];
for (const d of docs) {
  if (d.audience && d.tier) byCell.set(cellKey(d.audience, d.tier), d);
  else legacy.push(d); // no audience+tier → stale row the matrix supersedes
}

// ── write one matrix cell (create or patch), ge first then en/ru ─────────────
async function writeCell(cell) {
  const existingDoc = byCell.get(cellKey(cell.audience, cell.tier));
  // ge payload carries the full row incl. the (ge-only) test list.
  const gePayload = {
    name: cell.name.ge,
    description: cell.description.ge,
    price: 0,
    currency: CURRENCY,
    isFeatured: false,
    audience: cell.audience,
    tier: cell.tier,
    includedServices: [],
    includedTests: cell.tests.map((t) => ({ test: t })),
  };

  if (DRY) {
    console.log(`[DRY] WOULD ${existingDoc ? `PATCH #${existingDoc.id}` : "CREATE"} ${cell.audience}/${cell.tier} (${cell.tests.length} tests)`);
    return;
  }

  let id = existingDoc?.id;
  if (id) {
    const r = await api(`/checkup-packages/${id}?locale=ge&depth=0`, { method: "PATCH", body: JSON.stringify(gePayload) });
    if (r.status !== 200) { console.error(`  !! patch ${cell.audience}/${cell.tier} ge ${r.status}: ${JSON.stringify(r.body?.errors).slice(0, 200)}`); return; }
  } else {
    const r = await api(`/checkup-packages?locale=ge&depth=0`, { method: "POST", body: JSON.stringify(gePayload) });
    if (r.status !== 201 && r.status !== 200) { console.error(`  !! create ${cell.audience}/${cell.tier} ${r.status}: ${JSON.stringify(r.body?.errors).slice(0, 200)}`); return; }
    id = r.body?.doc?.id;
  }

  // en/ru: localized name + description. The included-test rows are a
  // localized+required field, so each locale must carry a value — we store the
  // verbatim Georgian test names in every locale (the test catalogue is
  // Georgian-only by design; en/ru intentionally show the same clinical
  // terms). We re-fetch the row ids so the array rows update in place rather
  // than being recreated.
  const cur = await api(`/checkup-packages/${id}?locale=ge&depth=0`);
  const testRowIds = (cur.body?.includedTests ?? []).map((r) => r.id);
  for (const loc of ["en", "ru"]) {
    const r = await api(`/checkup-packages/${id}?locale=${loc}&depth=0`, {
      method: "PATCH",
      body: JSON.stringify({
        name: cell.name[loc],
        description: cell.description[loc],
        includedTests: cell.tests.map((t, i) => (testRowIds[i] ? { id: testRowIds[i], test: t } : { test: t })),
      }),
    });
    if (r.status !== 200) console.error(`  !! patch ${cell.audience}/${cell.tier} ${loc} ${r.status}: ${JSON.stringify(r.body?.errors).slice(0, 160)}`);
  }
  console.log(`  ✓ ${cell.audience}/${cell.tier} ${existingDoc ? "updated" : "created"} (#${id}, ${cell.tests.length} tests)`);
}

console.log(`\n▶ Writing ${MATRIX.length} matrix cells…`);
for (const cell of MATRIX) await writeCell(cell);

// ── delete stale legacy rows (no audience/tier) ──────────────────────────────
if (legacy.length > 0) {
  console.log(`\n▶ Removing ${legacy.length} legacy row(s) with no audience/tier…`);
  for (const d of legacy) {
    if (DRY) { console.log(`[DRY] WOULD DELETE legacy #${d.id} (${d.name})`); continue; }
    const r = await api(`/checkup-packages/${d.id}`, { method: "DELETE" });
    console.log(`  ${r.status === 200 ? "✓ deleted" : `!! delete failed ${r.status}`} #${d.id} (${d.name})`);
  }
}

// ── final summary ────────────────────────────────────────────────────────────
const after = await api(`/checkup-packages?locale=ge&depth=0&limit=200`);
const grid = {};
for (const d of after.body?.docs ?? []) {
  if (d.audience && d.tier) grid[`${d.audience}/${d.tier}`] = (d.includedTests?.length ?? 0);
}
console.log(`\n${DRY ? "[DRY] " : ""}done. matrix coverage (audience/tier → #tests):`);
for (const a of ["woman", "man", "child"])
  console.log(`  ${a}:`, ["economy", "standard", "premium"].map((t) => `${t}=${grid[`${a}/${t}`] ?? "MISSING"}`).join("  "));
console.log(`  total docs now: ${after.body?.totalDocs}`);
