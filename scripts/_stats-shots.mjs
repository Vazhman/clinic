// Screenshot the stats section at mobile + desktop widths, with all 5 stats
// and again with one hidden (set to 0 via CMS, then restored).
import { chromium } from "playwright";
import fs from "node:fs/promises";

const SITE = process.argv[2] || "http://localhost:3000";
const OUT = "./test-screenshots/stats";
await fs.mkdir(OUT, { recursive: true });

const login = await fetch(`${SITE}/api/users/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@admin.ge", password: "111111" }),
}).then((r) => r.json());
const headers = { "Content-Type": "application/json", Authorization: `JWT ${login.token}` };

const before = await fetch(`${SITE}/api/globals/home-page?depth=0`, { headers }).then((r) => r.json());
const orig = before.stats ?? {};
console.log("stats before:", JSON.stringify(orig));

const browser = await chromium.launch();

async function shoot(tag) {
  for (const [w, h, label] of [[390, 844, "mobile"], [1366, 900, "desktop"]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(`${SITE}/ge`, { waitUntil: "networkidle", timeout: 120000 });
    const section = page.locator("section.bg-cream", { has: page.locator("p.tabular-nums") }).first();
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2600); // let counters finish
    await section.screenshot({ path: `${OUT}/${tag}-${label}.png` });
    await page.close();
  }
  console.log(`OK ${tag}`);
}

try {
  await shoot("5-stats");
  // hide one stat (operations -> 0)
  await fetch(`${SITE}/api/globals/home-page?depth=0`, {
    method: "POST",
    headers,
    body: JSON.stringify({ stats: { ...orig, operations: 0 } }),
  });
  await shoot("4-stats");
} finally {
  await fetch(`${SITE}/api/globals/home-page?depth=0`, {
    method: "POST",
    headers,
    body: JSON.stringify({ stats: orig }),
  });
  const check = await fetch(`${SITE}/api/globals/home-page?depth=0`, { headers }).then((r) => r.json());
  console.log("restored:", JSON.stringify(check.stats));
}
await browser.close();
