// Proves the editor workflow the user asked about:
//   1. mark a doctor `inactive` -> they disappear from the public list AND
//      their profile page 404s
//   2. re-pull from Doctra -> the inactive flag survives, the doctor is NOT
//      overwritten, and no duplicate is created (matched by doctraId)
// localhost only.
const SITE = process.env.SITE || "http://localhost:3001";
const H0 = { "Content-Type": "application/json" };
const login = await fetch(`${SITE}/api/users/login`, { method: "POST", headers: H0, body: JSON.stringify({ email: "admin@admin.ge", password: "111111" }) }).then((r) => r.json());
const H = { ...H0, Authorization: `JWT ${login.token}` };

const listLinks = async () => {
  const html = await fetch(`${SITE}/ge/eqimebi`, { headers: { "User-Agent": "qa" } }).then((r) => r.text());
  return new Set([...html.matchAll(/\/ge\/eqimebi\/([a-z0-9-]+)/g)].map((m) => m[1]));
};
const profileStatus = async (slug) => (await fetch(`${SITE}/ge/eqimebi/${slug}`, { headers: { "User-Agent": "qa" } })).status;

// pick a doctor that has a doctraId (so the re-pull will see it)
const d = (await fetch(`${SITE}/api/doctors?limit=1&depth=0&where[doctraId][exists]=true`, { headers: H }).then((r) => r.json())).docs[0];
console.log(`target doctor: id=${d.id} doctraId=${d.doctraId} slug=${d.slug}`);
console.log(`  name (raw): ${JSON.stringify(d.name)}\n`);

const before = await listLinks();
console.log(`STEP 0 (baseline): list shows ${before.size} doctors, target in list=${before.has(d.slug)}, profile=${await profileStatus(d.slug)}`);

// STEP 1: mark inactive
await fetch(`${SITE}/api/doctors/${d.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ inactive: true }) });
const afterHide = await listLinks();
console.log(`STEP 1 (inactive=true): list shows ${afterHide.size}, target in list=${afterHide.has(d.slug)}, profile=${await profileStatus(d.slug)}  -> expect: 1 fewer, NOT in list, profile 404`);

// STEP 2: re-pull from Doctra (the admin "Sync now" button)
console.log(`\nSTEP 2: re-pulling from Doctra (import-doctra)…`);
const imp = await fetch(`${SITE}/api/import-doctra`, { method: "POST", headers: H, signal: AbortSignal.timeout(300000) }).then((r) => r.json());
console.log(`  import summary: doctors created=${imp.summary?.doctors.created} updated=${imp.summary?.doctors.updated} skipped=${imp.summary?.doctors.skipped}`);

// STEP 3: verify the flag survived + no overwrite + no duplicate
const after = await fetch(`${SITE}/api/doctors/${d.id}?depth=0`, { headers: H }).then((r) => r.json());
const dupes = (await fetch(`${SITE}/api/doctors?depth=0&where[doctraId][equals]=${d.doctraId}&limit=0`, { headers: H }).then((r) => r.json())).totalDocs;
const list3 = await listLinks();
console.log(`\nSTEP 3 (after re-pull):`);
console.log(`  inactive flag still true? ${after.inactive === true}  -> expect true (re-pull must NOT reset it)`);
console.log(`  name unchanged? ${JSON.stringify(after.name) === JSON.stringify(d.name)}`);
console.log(`  rows with this doctraId: ${dupes}  -> expect 1 (no duplicate created)`);
console.log(`  still hidden from list? ${!list3.has(d.slug)} | profile still 404? ${(await profileStatus(d.slug)) === 404}`);

// restore so the local data is back to all-visible
await fetch(`${SITE}/api/doctors/${d.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ inactive: false }) });
console.log(`\n(restored target doctor to visible)`);
