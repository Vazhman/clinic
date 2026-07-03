// Read-only Doctra connectivity + auth check. Confirms the credentials in
// .env.local work and the API is reachable BEFORE running the writing import.
// Run: node --env-file=.env.local scripts/_test-doctra.mjs
const API_URL = process.env.DOCTRA_API_URL || "http://31.146.167.162:9090/doctra/hs/portal_exchange/v1";
const USER = process.env.DOCTRA_USER || "";
const PASSWORD = process.env.DOCTRA_PASSWORD || "";

console.log(`API_URL: ${API_URL}`);
console.log(`USER:    ${USER || "(empty!)"}`);
console.log(`PASSWORD set: ${PASSWORD ? "yes (" + PASSWORD.length + " chars)" : "NO"}\n`);

const ctrl = AbortSignal.timeout(20000);

// 1) token
let token;
try {
  const res = await fetch(`${API_URL}/token`, {
    method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl,
    body: JSON.stringify({ auth_type: 0, user: USER, password: PASSWORD }),
  });
  const data = await res.json();
  if (data.status !== 0) { console.error(`AUTH FAILED: status=${data.status} ${data.error_text || ""}`); process.exit(1); }
  token = data.token;
  console.log(`✓ AUTH OK — token (${token?.length} chars), active ${data.token_active_time} min`);
} catch (e) {
  console.error(`✗ CANNOT REACH DOCTRA (${API_URL}): ${e.message}`);
  console.error("  (the Doctra API may only be reachable from the clinic network / a whitelisted IP)");
  process.exit(2);
}

// 2) departments
const depRes = await fetch(`${API_URL}/get_departments`, {
  method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer_${token}` },
  body: JSON.stringify({ hash: "" }), signal: AbortSignal.timeout(20000),
});
const depData = await depRes.json();
const departments = depData.departments ?? [];
console.log(`✓ departments: ${departments.length}`);
if (departments[0]) console.log(`  e.g. ${departments.slice(0, 3).map((d) => d.name || d.name_en).join(" | ")}`);

// 3) doctors of the first department
if (departments[0]) {
  const docRes = await fetch(`${API_URL}/get_doctors`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer_${token}` },
    body: JSON.stringify({ department_id: departments[0].id, doctor_id: "", with_files: false, doctor_name: "", hash: "" }),
    signal: AbortSignal.timeout(20000),
  });
  const docData = await docRes.json();
  const doctors = docData.doctors ?? [];
  console.log(`✓ doctors in "${departments[0].name || departments[0].name_en}": ${doctors.length}`);
  if (doctors[0]) console.log(`  e.g. ${doctors.slice(0, 3).map((d) => d.name || d.name_en).join(" | ")}`);
}

let total = 0;
for (const dep of departments) {
  try {
    const r = await fetch(`${API_URL}/get_doctors`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer_${token}` },
      body: JSON.stringify({ department_id: dep.id, doctor_id: "", with_files: false, doctor_name: "", hash: "" }),
      signal: AbortSignal.timeout(20000),
    });
    const j = await r.json();
    total += (j.doctors ?? []).length;
  } catch { /* ignore one dept */ }
}
console.log(`\n✓ total doctor rows across all departments (with dupes): ${total}`);
console.log("Doctra is reachable and the credentials are valid — the import will work.");
