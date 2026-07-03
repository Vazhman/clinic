// Isolate prod heroSlides POST 500: (a) resave unchanged, (b) append slide
// without image, (c) append slide with an existing media id. Restores after.
const SITE = process.env.SITE || "https://clinic-one-blush.vercel.app";
const login = await fetch(`${SITE}/api/users/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@admin.ge", password: "111111" }),
}).then((r) => r.json());
const headers = { "Content-Type": "application/json", Authorization: `JWT ${login.token}` };

const before = await fetch(`${SITE}/api/globals/home-page?locale=ge&depth=0`, { headers }).then((r) => r.json());
const slides = before.heroSlides ?? [];
console.log(`existing slides: ${slides.length}`);
console.log(JSON.stringify(slides, null, 2).slice(0, 1200));

async function post(label, arr) {
  const res = await fetch(`${SITE}/api/globals/home-page?locale=ge&depth=0`, {
    method: "POST", headers, body: JSON.stringify({ heroSlides: arr }),
  });
  const txt = (await res.text()).slice(0, 250);
  console.log(`\n[${label}] status=${res.status} ${txt}`);
  return res.status;
}

try {
  await post("a: resave unchanged", slides);
  await post("b: + slide WITHOUT image", [...slides, { headline: "QA_NOIMG", subheadline: "x", buttonLabel: "y", buttonHref: "/booking" }]);
  const someImage = slides.find((s) => s.image)?.image ?? null;
  if (someImage) await post("c: + slide WITH image id " + someImage, [...slides, { image: someImage, headline: "QA_IMG" }]);
} finally {
  const r = await post("restore original", slides);
  if (r !== 200) console.error("!! RESTORE FAILED — original slides:", JSON.stringify(slides));
}
