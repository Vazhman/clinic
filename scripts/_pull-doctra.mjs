// LOCAL: replace the data.ts sample doctors/services with the REAL Doctra data.
// Clears services+doctors, then runs the same import the admin "Sync" button
// triggers (POST /api/import-doctra). Reviews/checkups (not Doctra-sourced) are
// left intact. localhost only.
const SITE = process.env.SITE || "http://localhost:3001";
if (!/localhost|127\.0\.0\.1/.test(SITE)) { console.error("Refusing: SITE is not localhost"); process.exit(1); }

const login = await fetch(`${SITE}/api/users/login`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@admin.ge", password: "111111" }),
}).then((r) => r.json());
const token = login.token;
const H = { "Content-Type": "application/json", Authorization: `JWT ${token}` };

for (const col of ["doctors", "services"]) {
  const res = await fetch(`${SITE}/api/${col}?where[id][exists]=true&limit=1000`, { method: "DELETE", headers: H });
  const body = await res.json().catch(() => ({}));
  console.log(`cleared ${col}: HTTP ${res.status}, removed ${Array.isArray(body?.docs) ? body.docs.length : "?"}`);
}

console.log("\nrunning Doctra import (this is what the admin 'Sync now' button does)…");
const res = await fetch(`${SITE}/api/import-doctra`, {
  method: "POST", headers: H, signal: AbortSignal.timeout(300000),
});
const data = await res.json().catch(() => ({}));
console.log("import HTTP", res.status);
console.log(JSON.stringify(data.summary ?? data, null, 2));

for (const col of ["doctors", "services"]) {
  const c = await fetch(`${SITE}/api/${col}?limit=0`, { headers: H }).then((r) => r.json());
  console.log(`${col}: ${c.totalDocs}`);
}
