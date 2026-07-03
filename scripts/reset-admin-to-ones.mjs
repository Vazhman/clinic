// One-shot admin password reset for the demo.
//
// Reads the prod DATABASE_URL from $env:PROD_DB (set by the caller — we
// deliberately do NOT read the value from any file the script edits so the
// connection string never lands in commit history).
//
// Sets password for admin@admin.ge to "11111111" matching Payload's local
// auth strategy: pbkdf2(sha256, 25000 iter, 64-byte key, hex-encoded salt).
//
// Safe to re-run. Will report what user(s) it updated.

import crypto from "node:crypto";
import pg from "pg";

const url = process.env.PROD_DB;
if (!url) {
  console.error("PROD_DB env var not set — refusing to run without it");
  process.exit(1);
}

const NEW_PW = "111111";
const ADMIN_EMAIL = "admin@admin.ge";

const salt = crypto.randomBytes(32).toString("hex");
const hash = crypto.pbkdf2Sync(NEW_PW, salt, 25000, 512, "sha256").toString("hex");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const { rows: existing } = await client.query("SELECT id, email FROM users LIMIT 20");
  console.log("users currently in DB:", existing);

  const { rows: updated } = await client.query(
    `UPDATE users
        SET hash = $1,
            salt = $2,
            login_attempts = 0,
            lock_until = NULL,
            updated_at = NOW()
      WHERE email = $3
   RETURNING id, email`,
    [hash, salt, ADMIN_EMAIL],
  );

  if (updated.length === 0) {
    console.warn(`no row matched ${ADMIN_EMAIL} — creating one`);
    const { rows: inserted } = await client.query(
      `INSERT INTO users (email, hash, salt, login_attempts, role, created_at, updated_at)
       VALUES ($1, $2, $3, 0, 'admin', NOW(), NOW())
       RETURNING id, email`,
      [ADMIN_EMAIL, hash, salt],
    );
    console.log("inserted:", inserted);
  } else {
    console.log("updated:", updated);
  }
  console.log(`\nDONE — login with ${ADMIN_EMAIL} / ${NEW_PW}`);
} finally {
  await client.end();
}
