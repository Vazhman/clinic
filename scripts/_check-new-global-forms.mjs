import { chromium } from "playwright";
const SITE = process.env.SITE || "http://localhost:3001";
const b = await chromium.launch();
const page = await b.newPage();
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 120)); });
await page.goto(`${SITE}/admin/login`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', "admin@admin.ge");
await page.fill('input[name="password"]', "111111");
await page.click('button[type="submit"]');
await page.waitForTimeout(2500);
for (const slug of ["services-page", "doctors-page", "booking-page"]) {
  errs.length = 0;
  await page.goto(`${SITE}/admin/globals/${slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const ti = page.locator('input[name="title"]').first();
  const exists = await ti.count();
  const val = exists ? await ti.inputValue().catch(() => "(err)") : "(no input)";
  const editable = exists ? await ti.isEditable().catch(() => false) : false;
  console.log(`${slug}: title input present=${!!exists} value="${val}" editable=${editable} | consoleErrs=${errs.length}${errs.length ? " ["+errs[0]+"]" : ""}`);
}
await b.close();
