// Restore doctor photos on prod. The Media DB records synced to Neon, but the
// binary files were never uploaded to prod's Blob (they 404). The files DO
// exist on local (served via /api/media/file/...). For each distinct media
// record a doctor's `photo` points to, download the file from LOCAL and
// re-upload it to the EXISTING prod Media record (PATCH) so the file lands in
// prod Blob. Doctors link by media id, so they start serving automatically.
//
// Idempotent-ish: skips any media that already serves 200 on prod.
// Usage: PROD=https://clinic-one-blush.vercel.app LOCAL=http://localhost:3001 node scripts/_restore-doctor-photos.mjs
const PROD = process.env.PROD || "https://clinic-one-blush.vercel.app";
const LOCAL = process.env.LOCAL || "http://localhost:3001";
const EMAIL = process.env.ADMIN_EMAIL || "admin@admin.ge";
const PASSWORD = process.env.ADMIN_PASSWORD || "111111";

async function login(base) {
  const r = await fetch(`${base}/api/users/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  const b = await r.json();
  if (!b?.token) throw new Error(`login failed on ${base}: ${r.status}`);
  return b.token;
}
const serves = async (base, fn) => (await fetch(`${base}/api/media/file/${encodeURIComponent(fn)}`, { method: "HEAD" })).status;

const PT = await login(PROD);
const LT = await login(LOCAL);

// collect distinct photo media {id, filename} across all prod doctors
const media = new Map();
let page = 1, doctors = 0;
while (true) {
  const o = await (await fetch(`${PROD}/api/doctors?locale=ge&depth=1&limit=100&page=${page}`, { headers: { Authorization: `JWT ${PT}` } })).json();
  for (const d of o.docs) {
    doctors++;
    if (d.photo && typeof d.photo === "object" && d.photo.id) media.set(d.photo.id, d.photo.filename);
  }
  if (!o.hasNextPage) break;
  page++;
}
console.log(`${doctors} doctors -> ${media.size} distinct photo media records\n`);

let restored = 0, alreadyOk = 0, noLocal = 0, failed = 0;
for (const [id, fn] of media) {
  if (!fn) { continue; }
  if ((await serves(PROD, fn)) === 200) { alreadyOk++; continue; }
  // download from local
  const lr = await fetch(`${LOCAL}/api/media/file/${encodeURIComponent(fn)}`);
  if (lr.status !== 200) { console.log(`NO LOCAL  media ${id}  ${fn}`); noLocal++; continue; }
  const buf = Buffer.from(await lr.arrayBuffer());
  const ct = lr.headers.get("content-type") || "image/jpeg";
  // re-upload the file onto the existing prod media record
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type: ct }), fn);
  const up = await fetch(`${PROD}/api/media/${id}`, { method: "PATCH", headers: { Authorization: `JWT ${PT}` }, body: fd });
  if (up.status === 200) { console.log(`RESTORED  media ${id}  ${fn}  (${Math.round(buf.length / 1024)}KB)`); restored++; }
  else { console.log(`FAIL  media ${id}  ${fn}  ${up.status}`); failed++; }
}

console.log(`\n=== ${restored} restored, ${alreadyOk} already served, ${noLocal} not on local, ${failed} failed ===`);
