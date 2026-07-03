// Screenshot every [aria-roledescription=carousel] region on a page, by index.
import { chromium } from "playwright";
import fs from "node:fs/promises";

const SITE = process.argv[2] || "http://localhost:3000";
const PATH = process.argv[3] || "/ge";
const PREFIX = process.argv[4] || "home";
const OUT = "./test-screenshots/mobile-carousel";
await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));

await page.goto(`${SITE}${PATH}`, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(1500);

const regions = page.locator('[aria-roledescription="carousel"]');
const n = await regions.count();
console.log(`carousels on ${PATH}: ${n}`);
for (let i = 0; i < n; i++) {
  const r = regions.nth(i);
  await r.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(900);
  const scroller = r.locator("> div").first();
  await scroller.evaluate((el) => el.scrollBy({ left: el.clientWidth * 0.75, behavior: "smooth" }));
  await page.waitForTimeout(1100);
  await r.screenshot({ path: `${OUT}/${PREFIX}-carousel-${i}.png` }).catch((e) => console.log(`shot ${i} failed: ${String(e).slice(0, 80)}`));
  console.log(`OK region ${i}`);
}
console.log(errors.length ? `PAGE ERRORS:\n${errors.join("\n")}` : "no page errors");
await browser.close();
