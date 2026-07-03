// Reproduce home-page hero.headline PATCH 500 on prod, then restore.
const SITE = "https://clinic-one-blush.vercel.app";
const login = await fetch(`${SITE}/api/users/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@admin.ge", password: "111111" }),
}).then((r) => r.json());
const headers = { "Content-Type": "application/json", Authorization: `JWT ${login.token}` };

const before = await fetch(`${SITE}/api/globals/home-page?locale=ge&depth=0`, { headers }).then((r) => r.json());
console.log("hero before:", JSON.stringify(before.hero));

const res = await fetch(`${SITE}/api/globals/home-page?locale=ge&depth=0`, {
  method: "POST",
  headers,
  body: JSON.stringify({ hero: { headline: "QA_HERO_TEST" } }),
});
console.log("PATCH status:", res.status);
console.log((await res.text()).slice(0, 300));

if (res.status === 200) {
  // restore
  await fetch(`${SITE}/api/globals/home-page?locale=ge&depth=0`, {
    method: "POST",
    headers,
    body: JSON.stringify({ hero: { headline: before.hero?.headline ?? "" } }),
  });
}
