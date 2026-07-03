// LOCAL dev helper: clear the sparse sample rows in the seedable collections
// and run /api/seed to load the full data.ts dataset (55 doctors, 8 services,
// checkups, reviews). Globals (home/nav/footer/contact + seeded nav labels)
// are NOT touched. Refuses to run against anything but localhost.
const SITE = process.env.SITE || "http://localhost:3001";
if (!/localhost|127\.0\.0\.1/.test(SITE)) { console.error("Refusing: SITE is not localhost"); process.exit(1); }

const login = await fetch(`${SITE}/api/users/login`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@admin.ge", password: "111111" }),
}).then((r) => r.json());
const H = { "Content-Type": "application/json", Authorization: `JWT ${login.token}` };

const COLLECTIONS = ["services", "doctors", "checkup-packages", "reviews"];

for (const col of COLLECTIONS) {
  // bulk delete every doc in the collection
  const res = await fetch(`${SITE}/api/${col}?where[id][exists]=true&limit=1000`, { method: "DELETE", headers: H });
  const body = await res.json().catch(() => ({}));
  const n = body?.docs?.length ?? body?.errors ? (body.docs?.length ?? "?") : "?";
  console.log(`cleared ${col}: HTTP ${res.status}, removed ${Array.isArray(body?.docs) ? body.docs.length : n}`);
}

// now /api/seed will see 0 services and load the full data.ts set
const seed = await fetch(`${SITE}/api/seed`, { method: "POST" });
console.log("\nseed:", seed.status, JSON.stringify(await seed.json().catch(() => ({}))));

// report final counts
for (const col of COLLECTIONS) {
  const c = await fetch(`${SITE}/api/${col}?limit=0`, { headers: H }).then((r) => r.json());
  console.log(`${col}: ${c.totalDocs}`);
}
