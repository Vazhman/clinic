// Visual check: mobile-viewport screenshots of every SnapCarousel section,
// before and after a swipe, so we can SEE centering + recede + dots.
import { chromium } from "playwright";
import fs from "node:fs/promises";

const SITE = process.argv[2] || "http://localhost:3000";
const OUT = "./test-screenshots/mobile-carousel";
await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});

const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));

async function shoot(url, sections) {
  await page.goto(`${SITE}${url}`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(1500);
  for (const { name, selector } of sections) {
    const region = page.locator(`[aria-roledescription="carousel"]`).filter({ has: page.locator(selector) }).first();
    const target = (await region.count()) ? region : page.locator(selector).first();
    if (!(await target.count())) { console.log(`SKIP ${name} (not found on ${url})`); continue; }
    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await target.screenshot({ path: `${OUT}/${name}-1-initial.png` });
    // swipe one card left inside the scroller
    const scroller = target.locator("div").first();
    const box = await target.boundingBox();
    if (box) {
      await page.touchscreen.tap(box.x + box.width / 2, box.y + 10); // settle
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
      // drag via touch
      await scroller.evaluate((el) => { el.scrollBy({ left: el.clientWidth * 0.7, behavior: "smooth" }); });
      await page.waitForTimeout(1200);
      await target.screenshot({ path: `${OUT}/${name}-2-swiped.png` });
    }
    console.log(`OK ${name}`);
  }
}

await shoot("/ge", [
  { name: "services", selector: "a[href*='servisebi']" },
  { name: "doctors", selector: "a[href*='eqimebi/']" },
  { name: "checkups", selector: "a[href*='cheqapi']" },
  { name: "reviews", selector: "svg.fill-amber-400" },
]);

console.log(errors.length ? `PAGE ERRORS:\n${errors.join("\n")}` : "no page errors");
await browser.close();
