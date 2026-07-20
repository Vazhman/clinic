#!/usr/bin/env node
/**
 * Headless-browser test of the Payload ADMIN UI on the live deployment.
 *
 * Two layers:
 *   1. View smoke tests — every list/edit view renders (no white screen, no
 *      console/page errors, no 5xx), screenshots land in ./test-screenshots/admin/.
 *   2. PREFILL checks — for every global and one doc per collection, the form
 *      inputs must SHOW the currently-saved values (fetched from the REST API),
 *      so editors see what they are changing. An empty input for a populated
 *      field is a failure.
 *
 * Usage: node scripts/admin-ui-test.mjs [siteUrl]
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";

const SITE = process.argv[2] || process.env.SITE || "https://clinic-olive-nu.vercel.app";
const EMAIL = process.env.ADMIN_EMAIL || "admin@admin.ge";
const PASSWORD = process.env.ADMIN_PASSWORD || "111111";
const OUT = "./test-screenshots/admin";

await fs.mkdir(OUT, { recursive: true });

// API token for reading current values (globals may not be world-readable)
let token = "";
{
  const res = await fetch(`${SITE}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const body = await res.json().catch(() => null);
  if (!body?.token) { console.error("API LOGIN FAILED", res.status); process.exit(2); }
  token = body.token;
}
const apiGet = async (path) =>
  fetch(`${SITE}/api${path}`, { headers: { Authorization: `JWT ${token}` } }).then((r) => r.json()).catch(() => null);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const consoleErrors = [];
const pageErrors = [];
const failedReqs = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300)); });
page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 300)));
page.on("response", (r) => { if (r.status() >= 500) failedReqs.push(`${r.status()} ${r.url().replace(SITE, "")}`); });

function drainErrors() {
  const out = { console: [...consoleErrors], page: [...pageErrors], http5xx: [...failedReqs] };
  consoleErrors.length = pageErrors.length = failedReqs.length = 0;
  return out;
}

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

// ── login via UI ────────────────────────────────────────────────────────────
await page.goto(`${SITE}/admin/login`, { waitUntil: "networkidle", timeout: 60000 });
await page.fill('input[name="email"]', EMAIL);
await page.fill('input[name="password"]', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 });
record("admin login", true, page.url().replace(SITE, ""));
drainErrors();

// ── helper: visit a view, wait, screenshot, report errors + assertion ──────
async function view(name, path, assertFn) {
  try {
    // Pin the content locale to ge — otherwise the form renders whatever
    // locale is persisted on this admin account's session (getRequestLocale
    // falls back to the user's saved preference, not the config default),
    // which can silently diverge from the ?locale=ge API comparisons below.
    const url = new URL(`${SITE}${path}`);
    if (!url.searchParams.has("locale")) url.searchParams.set("locale", "ge");
    await page.goto(url.toString(), { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2500); // late hydration / async field components
    const shot = `${OUT}/${name.replace(/[^a-z0-9-]/gi, "_")}.png`;
    await page.screenshot({ path: shot, fullPage: false });
    const errs = drainErrors();
    const assertion = assertFn ? await assertFn() : { ok: true, detail: "" };
    const errNote = [
      errs.page.length ? `pageErrors: ${errs.page[0]}` : "",
      errs.http5xx.length ? `5xx: ${errs.http5xx.join(", ")}` : "",
      errs.console.length ? `consoleErrors(${errs.console.length}): ${errs.console[0]}` : "",
    ].filter(Boolean).join(" | ");
    record(name, assertion.ok && errs.page.length === 0 && errs.http5xx.length === 0,
      [assertion.detail, errNote].filter(Boolean).join(" | "));
  } catch (e) {
    record(name, false, String(e).slice(0, 200));
  }
}

// body text length — a white screen has (almost) none
const bodyTextLen = async () => (await page.evaluate(() => document.body.innerText.trim().length));

// ── prefill machinery ──────────────────────────────────────────────────────
// Collect every named input/textarea on the form, PLUS every Lexical richText
// field (ceo.message, services.description, etc.) — those render as a
// contenteditable div, not an <input>/<textarea>, so they need a separate
// query. Payload wraps every richText field in a div carrying
// `data-field-path="<path>"` (see generateFieldID's sibling convention in
// @payloadcms/richtext-lexical's Field component) — read its editor text
// straight from the DOM instead of expecting a form-element value.
// Tabbed views (doctors) unmount inactive tabs, so click through every tab
// and merge.
async function collectFormValues() {
  const grab = () => page.evaluate(() => {
    const out = {};
    document.querySelectorAll("input[name], textarea[name]").forEach((el) => {
      out[el.getAttribute("name")] = el.value;
    });
    document.querySelectorAll("div.rich-text-lexical[data-field-path]").forEach((el) => {
      const path = el.getAttribute("data-field-path");
      const editor = el.querySelector('[contenteditable="true"]');
      if (path && editor) out[path] = editor.innerText;
    });
    return out;
  });
  // Heavy global forms (home-page has heroSlides/statsList/faqs array fields)
  // mount their lower fields lazily — scroll the whole form into view first so
  // every input is in the DOM before we read it.
  await page.evaluate(() => new Promise((resolve) => {
    let y = 0;
    const step = () => {
      window.scrollTo(0, y);
      y += Math.round(window.innerHeight * 0.8);
      if (y < document.body.scrollHeight + window.innerHeight) setTimeout(step, 120);
      else { window.scrollTo(0, 0); resolve(); }
    };
    step();
  }));
  await page.waitForTimeout(600);
  let values = await grab();
  const tabs = page.locator(".tabs-field__tabs button");
  const n = await tabs.count().catch(() => 0);
  for (let i = 0; i < n; i++) {
    await tabs.nth(i).click().catch(() => {});
    await page.waitForTimeout(700);
    values = { ...values, ...(await grab()) };
  }
  return values;
}

const getDeep = (o, p) => p.split(".").reduce((x, k) => (x == null ? x : x[k]), o);

// Lexical richText fields come back from the API as a JSON AST (root ->
// children -> ... -> {text}), not a plain string — flatten it to comparable
// text the same way the DOM editor would display it.
function lexicalPlainText(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(lexicalPlainText).join(" ");
  if (typeof node === "object") {
    if (typeof node.text === "string") return node.text;
    if (Array.isArray(node.children)) return node.children.map(lexicalPlainText).join(" ");
    if (node.root) return lexicalPlainText(node.root);
  }
  return "";
}
const normalizeWs = (s) => String(s).replace(/\s+/g, " ").trim();

// Compare admin form inputs against the API's stored values. Only fields the
// API actually has a value for are asserted (an empty CMS field may render an
// empty input — that's correct). At least one field must be comparable.
async function prefillCheck(name, adminPath, apiDoc, fields) {
  await view(name, adminPath, async () => {
    if (!apiDoc) return { ok: false, detail: "API doc not found" };
    const values = await collectFormValues();
    const mismatches = [];
    const checked = [];
    for (const f of fields) {
      let apiVal = getDeep(apiDoc, f);
      if (apiVal === undefined || apiVal === null || apiVal === "") continue;
      if (typeof apiVal === "object") apiVal = lexicalPlainText(apiVal);
      if (apiVal === "") continue; // richText with no actual text content
      const formVal = values[f];
      if (formVal === undefined) mismatches.push(`${f}: NO INPUT in form`);
      else if (normalizeWs(formVal) !== normalizeWs(apiVal))
        mismatches.push(`${f}: form="${String(formVal).slice(0, 30)}" ≠ api="${String(apiVal).slice(0, 30)}"`);
      else checked.push(f);
    }
    if (!checked.length && !mismatches.length) return { ok: false, detail: "nothing comparable (all fields empty in CMS?)" };
    return {
      ok: mismatches.length === 0,
      detail: mismatches.length ? mismatches.slice(0, 4).join("; ") : `${checked.length}/${fields.length} populated fields shown correctly`,
    };
  });
}

// ── list-view smoke tests ───────────────────────────────────────────────────
await view("doctors list", "/admin/collections/doctors?limit=10", async () => {
  const cells = await page.locator("table tbody tr td a").allInnerTexts().catch(() => []);
  const named = cells.filter((t) => t.trim().length > 1);
  return { ok: named.length > 0, detail: `row links with text: ${named.length}; sample: ${named.slice(0, 3).join(" | ") || "(none)"}` };
});

await view("news list", "/admin/collections/news?limit=10", async () => {
  const len = await bodyTextLen();
  const cells = await page.locator("table tbody tr td a").allInnerTexts().catch(() => []);
  return { ok: cells.length > 0, detail: `rows: ${cells.length}, bodyTextLen: ${len}` };
});

// (There used to be a check here asserting the Pages collection admin route
// 404s. Pages.ts has no `admin.hidden` config — Payload's `admin.hidden` only
// removes a collection from the nav sidebar, it never blocks the route — so
// that assertion's premise was never true in this codebase; removed.)

// ── prefill: globals ────────────────────────────────────────────────────────
{
  const g = await apiGet(`/globals/home-page?locale=ge&depth=0`);
  await prefillCheck("prefill home-page", "/admin/globals/home-page", g, [
    "hero.headline", "hero.subheadline", "hero.bookButtonText", "hero.badgeText",
    "trustStrip.rating", "trustStrip.doctorCount", "trustStrip.patientCount",
    "symptomNavigator.title", "symptomNavigator.subtitle", "symptomNavigator.placeholder",
    "heroSlides.0.headline", "heroSlides.0.buttonHref",
    "statsList.0.value", "statsList.0.label",
    "faqs.0.question", "faqs.0.answer",
  ]);
}
{
  const g = await apiGet(`/globals/contact-page?locale=ge&depth=0`);
  await prefillCheck("prefill contact-page", "/admin/globals/contact-page", g, [
    "title", "contactFormTitle",
    "address.label", "address.value",
    "phone.label", "phone.value", "phone.display",
    "phones.0.value", "phones.0.display",
    "email.label", "email.value",
    "workingHours.label", "workingHours.weekdays", "workingHours.weekends",
  ]);
}
{
  const g = await apiGet(`/globals/about-page?locale=ge&depth=0`);
  await prefillCheck("prefill about-page", "/admin/globals/about-page", g, [
    "title", "subtitle",
    "ceo.name", "ceo.role", "ceo.message",
    "highlights.0.title", "highlights.0.text",
    "stats.0.label", "stats.0.value",
  ]);
}
{
  const g = await apiGet(`/globals/navigation?locale=ge&depth=0`);
  await prefillCheck("prefill navigation", "/admin/globals/navigation", g, [
    "homeRoute.label", "aboutRoute.label", "servicesRoute.label", "doctorsRoute.label",
    "checkupsRoute.label", "blogRoute.label", "contactRoute.label",
    "ctaButton.label", "ctaButton.href",
  ]);
}
{
  const g = await apiGet(`/globals/footer?locale=ge&depth=0`);
  await prefillCheck("prefill footer", "/admin/globals/footer", g, [
    "description", "copyright",
    "quickLinks.0.label", "quickLinks.0.href",
    "socialLinks.0.url",
  ]);
}
{
  // Only title/subtitle are editable now — the booking wizard is disabled, so
  // the steps.*/form.* groups are hidden in admin (not rendered as inputs).
  const g = await apiGet(`/globals/booking-page?locale=ge&depth=0`);
  await prefillCheck("prefill booking-page", "/admin/globals/booking-page", g, [
    "title", "subtitle",
  ]);
}
{
  const g = await apiGet(`/globals/services-page?locale=ge&depth=0`);
  await prefillCheck("prefill services-page", "/admin/globals/services-page", g, ["title", "subtitle"]);
}
{
  const g = await apiGet(`/globals/doctors-page?locale=ge&depth=0`);
  await prefillCheck("prefill doctors-page", "/admin/globals/doctors-page", g, ["title", "subtitle"]);
}

// ── prefill: one doc per collection ─────────────────────────────────────────
async function firstDoc(col, extra = "") {
  const res = await apiGet(`/${col}?limit=1&locale=ge&depth=0${extra}`);
  return res?.docs?.[0] ?? null;
}

{
  const doc = await firstDoc("doctors");
  if (doc) {
    await prefillCheck("prefill doctor edit", `/admin/collections/doctors/${doc.id}`, doc, [
      "name", "slug", "specialty", "experienceYears",
      "qualifications.0.qualification", "specializations.0.specialization",
    ]);
  } else record("prefill doctor edit", false, "no doctors in CMS");
}
{
  const doc = await firstDoc("services");
  if (doc) {
    await prefillCheck("prefill service edit", `/admin/collections/services/${doc.id}`, doc, [
      "name", "slug", "shortDescription", "description",
    ]);
  } else record("prefill service edit", false, "no services in CMS");
}
{
  const doc = await firstDoc("news");
  if (doc) {
    await prefillCheck("prefill news edit", `/admin/collections/news/${doc.id}`, doc, [
      "title", "slug", "excerpt", "author",
    ]);
  } else record("prefill news edit", false, "no news in CMS");
}
{
  const doc = await firstDoc("checkup-packages");
  if (doc) {
    await prefillCheck("prefill checkup edit", `/admin/collections/checkup-packages/${doc.id}`, doc, [
      "name", "description", "price", "currency", "includedServices.0.service",
    ]);
  } else record("prefill checkup edit", false, "no checkup packages in CMS");
}
{
  const doc = await firstDoc("reviews");
  if (doc) {
    await prefillCheck("prefill review edit", `/admin/collections/reviews/${doc.id}`, doc, [
      "author", "text", "rating",
    ]);
  } else record("prefill review edit", false, "no reviews in CMS");
}
{
  // LabTests.ts sets admin.hidden when feature-toggles.labTests is off
  // (in-memory cache, same flag cms-roundtrip-test.mjs's lifecycle check
  // skips on) — the collection's own /api reads still work (access.read is
  // always true), but its admin edit view is unreachable, so don't treat
  // that as a prefill bug when the toggle is off site-wide.
  const toggles = await apiGet(`/globals/feature-toggles?locale=ge&depth=0`);
  if (toggles?.labTests === false) {
    record("prefill lab-test edit", true, "SKIP — feature-toggles.labTests is off, admin view hidden by design");
  } else {
    const doc = await firstDoc("lab-tests");
    if (doc) {
      await prefillCheck("prefill lab-test edit", `/admin/collections/lab-tests/${doc.id}`, doc, [
        "title", "slug", "summary",
      ]);
    } else record("prefill lab-test edit", true, "SKIP — no lab tests in this environment");
  }
}
// (no "prefill page edit" check — out of scope for this pass, see plan.)

// ── footer copyright must expose a placeholder (so the dynamic default is
//    visible to editors even when the field is intentionally left blank) ─────
await view("footer copyright placeholder", "/admin/globals/footer", async () => {
  const ph = await page.locator('input[name="copyright"]').getAttribute("placeholder").catch(() => null);
  return { ok: !!ph && ph.trim().length > 3, detail: `placeholder=${JSON.stringify(ph)}` };
});

// ── editability: the doctor name input must be enabled ──────────────────────
{
  const doc = await firstDoc("doctors");
  await view("doctor edit form editable", `/admin/collections/doctors/${doc.id}`, async () => {
    const firstTab = page.locator(".tabs-field__tabs button").first();
    if (await firstTab.count()) await firstTab.click().catch(() => {});
    await page.waitForTimeout(800);
    const nameVal = await page.locator('input[name="name"]').inputValue().catch(() => "(no name input)");
    const disabled = await page.locator('input[name="name"]').isDisabled().catch(() => true);
    return { ok: nameVal.trim().length > 1 && !disabled, detail: `name input="${nameVal}" disabled=${disabled}` };
  });
}

await browser.close();

const fails = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - fails.length}/${results.length} PASS ===`);
for (const f of fails) console.log(`  FAIL ${f.name}: ${f.detail}`);
process.exit(fails.length ? 1 : 0);
