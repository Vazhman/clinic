// Local-container verification of neon-migrate-2026-06-07-hero-slides-repair.sql.
// Worst-case drift: DROP both hero_slides tables + the enum, prove add-slide
// 500s, apply the migration, prove add-slide works again. LOCAL DOCKER ONLY.
import { execSync } from "node:child_process";
import fs from "node:fs";

const SITE = process.env.SITE || "http://localhost:3000";
const MIG = "scripts/neon-migrate-2026-06-07-hero-slides-repair.sql";

const psql = (sql) =>
  execSync(`docker compose exec -T postgres psql -U clinic -d clinic -v ON_ERROR_STOP=1`, {
    input: sql, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
  });

const login = await fetch(`${SITE}/api/users/login`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@admin.ge", password: "111111" }),
}).then((r) => r.json());
const headers = { "Content-Type": "application/json", Authorization: `JWT ${login.token}` };

async function addSlide() {
  // snapshot current slides so we always restore to exactly what was there
  const before = await fetch(`${SITE}/api/globals/home-page?locale=ge&depth=0`, { headers }).then((r) => r.json());
  const slides = before.heroSlides ?? [];
  const res = await fetch(`${SITE}/api/globals/home-page?locale=ge&depth=0`, {
    method: "POST", headers,
    body: JSON.stringify({ heroSlides: [...slides, { headline: "MIGTEST", buttonHref: "/booking" }] }),
  });
  const status = res.status;
  // restore
  await fetch(`${SITE}/api/globals/home-page?locale=ge&depth=0`, {
    method: "POST", headers, body: JSON.stringify({ heroSlides: slides }),
  });
  return status;
}

let ok = true;
try {
  console.log("1. DROP hero_slides tables + enum (simulate maximal Neon drift)…");
  psql(`DROP TABLE IF EXISTS home_page_hero_slides_locales CASCADE;
        DROP TABLE IF EXISTS home_page_hero_slides CASCADE;
        DROP TYPE  IF EXISTS enum_home_page_hero_slides_type;`);

  console.log("2. add-slide should now FAIL (500)…");
  const broken = await addSlide();
  console.log(`   → status ${broken} ${broken >= 500 ? "(reproduced ✓)" : "(unexpected!)"}`);
  if (broken < 500) ok = false;

  console.log("3. apply migration…");
  psql(fs.readFileSync(MIG, "utf8"));

  console.log("4. add-slide should now SUCCEED (200)…");
  const fixed = await addSlide();
  console.log(`   → status ${fixed} ${fixed === 200 ? "(healed ✓)" : "(STILL BROKEN!)"}`);
  if (fixed !== 200) ok = false;

  console.log("5. re-apply migration (idempotency check)…");
  psql(fs.readFileSync(MIG, "utf8"));
  const again = await addSlide();
  console.log(`   → status ${again} ${again === 200 ? "(idempotent ✓)" : "(broke on re-run!)"}`);
  if (again !== 200) ok = false;
} catch (e) {
  console.error("ERROR:", e.message);
  ok = false;
}

console.log(`\n=== ${ok ? "PASS" : "FAIL"} — hero-slides repair migration verified locally ===`);
process.exit(ok ? 0 : 1);
