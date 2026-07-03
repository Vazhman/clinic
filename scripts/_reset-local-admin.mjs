// Reset local dev admin password to the seed default (111111).
// LOCAL DOCKER DB ONLY — refuses to run against anything but localhost.
import crypto from "node:crypto";
import pg from "pg";

const url = process.env.DATABASE_URL || "postgresql://clinic:clinic@localhost:5432/clinic";
if (!/localhost|127\.0\.0\.1/.test(url)) {
  console.error("Refusing: DATABASE_URL is not localhost");
  process.exit(1);
}

const password = "111111";
const salt = crypto.randomBytes(32).toString("hex");
const hash = crypto.pbkdf2Sync(password, salt, 25000, 512, "sha256").toString("hex");

const client = new pg.Client({ connectionString: url });
await client.connect();
const r = await client.query(
  "UPDATE users SET salt=$1, hash=$2, lock_until=NULL, login_attempts=0 WHERE email=$3 RETURNING id,email",
  [salt, hash, "admin@admin.ge"],
);
console.log("updated:", r.rows);
await client.end();
