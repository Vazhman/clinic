// E2E: write a CUSTOM statsList (different texts + counts), check the public
// page renders them (and not the legacy labels), screenshot, restore.
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

const custom = [
  { value: 24000, suffix: "+", label: "ნამკურნალები პაციენტი" },
  { value: 12, suffix: "", label: "განყოფილება" },
  { value: 24, suffix: "/7", label: "გადაუდებელი დახმარება" },
];

try {
  const set = await fetch(`${SITE}/api/globals/home-page?locale=ge&depth=0`, {
    method: "POST", headers, body: JSON.stringify({ statsList: custom }),
  });
  console.log("set custom statsList:", set.status);

  const browser = await chromium.launch();
  for (const [w, h, label] of [[390, 844, "mobile"], [1366, 900, "desktop"]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(`${SITE}/ge`, { waitUntil: "networkidle", timeout: 120000 });
    const html = await page.content();
    const hasCustom = html.includes("განყოფილება") && html.includes("/7");
    const hasLegacy = html.includes("15,000");
    console.log(`${label}: custom rendered=${hasCustom}, legacy hidden=${!hasLegacy}`);
    const section = page.locator("section.bg-cream", { has: page.locator("p.tabular-nums") }).first();
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2600);
    await section.screenshot({ path: `${OUT}/custom-${label}.png` });
    await page.close();
  }
  await browser.close();
} finally {
  const restore = await fetch(`${SITE}/api/globals/home-page?locale=ge&depth=0`, {
    method: "POST", headers, body: JSON.stringify({ statsList: [] }),
  });
  const check = await fetch(`${SITE}/api/globals/home-page?locale=ge&depth=0`, { headers }).then((r) => r.json());
  console.log(`restored (${restore.status}): statsList now ${JSON.stringify(check.statsList)}`);
}
