#!/usr/bin/env node
/**
 * Seed the CMS ARRAY/LIST fields that were still empty (or held only stray test
 * rows) so an editor opening any home/about section sees real, editable content
 * instead of a blank list. Complements seed-cms-fallbacks.mjs (scalars) and
 * seed-cms-arrays.mjs (footer socials / first-pass arrays).
 *
 * Covers:
 *   - footer.quickLinks      REPLACE -> 7 canonical links (drops stray test row)
 *   - about-page.stats       REPLACE -> 3 facts 2015 / 40 / 1st (drops test row)
 *   - home-page.statsList     SEED   -> the 5 legacy stats as editable rows
 *   - home-page.heroSlides    SEED   -> 3 demo carousel slides (only if empty)
 *   - home-page.faqs          SEED   -> 6 demo Q&A (only if empty)
 *
 * Localised arrays are written ID-matched across ge/en/ru (create in ge to get
 * IDs, then update en/ru against the SAME ids) so Payload updates rows instead
 * of recreating them per-locale.
 *
 * Usage: SITE=http://localhost:3001 node scripts/seed-cms-demo-content.mjs [--dry]
 */
import geMsg from "../src/messages/ge.json" with { type: "json" };
import enMsg from "../src/messages/en.json" with { type: "json" };
import ruMsg from "../src/messages/ru.json" with { type: "json" };

const SITE = process.env.SITE || "http://localhost:3001";
const EMAIL = process.env.ADMIN_EMAIL || "admin@admin.ge";
const PASSWORD = process.env.ADMIN_PASSWORD || "111111";
const DRY = process.argv.includes("--dry");
const MSG = { ge: geMsg, en: enMsg, ru: ruMsg };
const LOCALES = ["ge", "en", "ru"];

let token = "";
async function api(path, opts = {}) {
  const res = await fetch(`${SITE}/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `JWT ${token}` } : {}), ...(opts.headers || {}) },
  });
  let body = null;
  try { body = await res.json(); } catch { /* */ }
  return { status: res.status, body };
}
const get = (o, p) => p.split(".").reduce((x, k) => (x == null ? x : x[k]), o);

// Write a localised array ID-matched across all three locales.
//   rowsByLocale: { ge:[...], en:[...], ru:[...] } — identical length/order;
//   only localised fields differ between locales.
async function writeLocalizedArray(slug, field, rowsByLocale) {
  // 1) ge first — generates the row ids
  let r = await api(`/globals/${slug}?locale=ge&depth=0`, { method: "POST", body: JSON.stringify({ [field]: rowsByLocale.ge }) });
  if (r.status !== 200) { console.error(`  !! ge PATCH failed ${r.status}: ${JSON.stringify(r.body?.errors).slice(0, 250)}`); return false; }
  const afterGe = await api(`/globals/${slug}?locale=ge&depth=0`);
  const ids = (get(afterGe.body, field) ?? []).map((row) => row.id);
  // 2) en/ru against the SAME ids
  for (const loc of ["en", "ru"]) {
    const rows = rowsByLocale[loc].map((row, i) => ({ ...row, id: ids[i] }));
    const rr = await api(`/globals/${slug}?locale=${loc}&depth=0`, { method: "POST", body: JSON.stringify({ [field]: rows }) });
    if (rr.status !== 200) console.error(`  !! ${loc} PATCH failed ${rr.status}: ${JSON.stringify(rr.body?.errors).slice(0, 200)}`);
  }
  return true;
}

// ── auth ──────────────────────────────────────────────────────────────────
{
  const { status, body } = await api("/users/login", { method: "POST", body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  if (status !== 200 || !body?.token) { console.error("LOGIN FAILED", status, body); process.exit(2); }
  token = body.token;
  console.log(`${DRY ? "[DRY] " : ""}seeding CMS demo content on ${SITE}\n`);
}

// ── 1. footer.quickLinks — REPLACE with the 7 canonical links ───────────────
{
  const QUICK = [
    { key: "about", href: "/about" },
    { key: "services", href: "/services" },
    { key: "doctors", href: "/doctors" },
    { key: "checkups", href: "/checkups" },
    { key: "labTests", href: "/lab-tests" },
    { key: "blog", href: "/blog" },
    { key: "gallery", href: "/gallery" },
  ];
  const rowsByLocale = Object.fromEntries(LOCALES.map((loc) => [loc, QUICK.map((q) => ({ label: MSG[loc].Navigation[q.key], href: q.href }))]));
  console.log(`${DRY ? "WOULD REPLACE" : "REPLACE"} footer.quickLinks -> ${QUICK.length} canonical links (${QUICK.map((q) => q.key).join(", ")})`);
  if (!DRY) await writeLocalizedArray("footer", "quickLinks", rowsByLocale);
}

// ── 2. about-page.stats — REPLACE with the 3 facts ──────────────────────────
{
  const FACTS = [
    { value: "2015", key: "founded" },
    { value: "40", key: "beds" },
    { value: "1st", key: "coblation" },
  ];
  const rowsByLocale = Object.fromEntries(LOCALES.map((loc) => [loc, FACTS.map((f) => ({ value: f.value, label: MSG[loc].About[f.key] }))]));
  console.log(`${DRY ? "WOULD REPLACE" : "REPLACE"} about-page.stats -> ${FACTS.map((f) => f.value).join(" / ")}`);
  if (!DRY) await writeLocalizedArray("about-page", "stats", rowsByLocale);
}

// ── 3. home-page.statsList — SEED the 5 legacy stats as editable rows ───────
{
  const before = await api(`/globals/home-page?locale=ge&depth=0&fallback-locale=null`);
  const existing = before.body?.statsList ?? [];
  if (existing.length > 0) {
    console.log(`home-page.statsList: already has ${existing.length} rows — skipped`);
  } else {
    // values from the legacy HomePage.stats group; labels from the Stats namespace
    const sg = before.body?.stats ?? {};
    const ROWS = [
      { value: sg.patients ?? 15000, suffix: "+", key: "patients" },
      { value: sg.satisfiedPatients ?? 14000, suffix: "+", key: "satisfiedPatients" },
      { value: sg.doctors ?? 54, suffix: "+", key: "doctors" },
      { value: sg.operations ?? 5000, suffix: "+", key: "operations" },
      { value: sg.experience ?? 9, suffix: "", key: "experience" },
    ].filter((r) => Number(r.value) > 0);
    const rowsByLocale = Object.fromEntries(LOCALES.map((loc) => [loc, ROWS.map((r) => ({ value: Number(r.value), suffix: r.suffix, label: MSG[loc].Stats[r.key] }))]));
    console.log(`${DRY ? "WOULD SEED" : "SEED"} home-page.statsList -> ${ROWS.map((r) => `${r.value}${r.suffix}`).join(", ")}`);
    if (!DRY) await writeLocalizedArray("home-page", "statsList", rowsByLocale);
  }
}

// ── 4. home-page.heroSlides — SEED 3 demo slides (only if empty) ────────────
{
  const before = await api(`/globals/home-page?locale=ge&depth=0&fallback-locale=null`);
  const existing = before.body?.heroSlides ?? [];
  if (existing.length > 0) {
    console.log(`home-page.heroSlides: already has ${existing.length} rows — skipped`);
  } else {
    // pick up to 3 real media ids to use as slide images
    const media = await api(`/media?limit=3&depth=0&sort=-createdAt`);
    const imgIds = (media.body?.docs ?? []).map((m) => m.id);
    const SLIDES = [
      {
        image: imgIds[0] ?? null, buttonHref: "/booking",
        ge: { headline: "მრავალპროფილური კლინიკა ბათუმში", subheadline: "სრული სამედიცინო მომსახურება ერთ სივრცეში — გამოცდილი ექიმები და თანამედროვე აღჭურვილობა.", buttonLabel: "დაჯავშნე ვიზიტი" },
        en: { headline: "Multi-Profile Clinic in Batumi", subheadline: "Complete medical care in one place — experienced doctors and modern equipment.", buttonLabel: "Book a Visit" },
        ru: { headline: "Многопрофильная клиника в Батуми", subheadline: "Полный спектр медицинских услуг в одном месте — опытные врачи и современное оборудование.", buttonLabel: "Записаться" },
      },
      {
        image: imgIds[1] ?? null, buttonHref: "/services",
        ge: { headline: "თანამედროვე დიაგნოსტიკა", subheadline: "ზუსტი კვლევები და სწრაფი შედეგი — ერთ სახურავქვეშ.", buttonLabel: "სერვისები" },
        en: { headline: "Modern Diagnostics", subheadline: "Accurate testing and fast results — all under one roof.", buttonLabel: "Our Services" },
        ru: { headline: "Современная диагностика", subheadline: "Точные исследования и быстрый результат — под одной крышей.", buttonLabel: "Услуги" },
      },
      {
        image: imgIds[2] ?? null, buttonHref: "/doctors",
        ge: { headline: "გამოცდილი ექიმები", subheadline: "ჩვენი სპეციალისტები თქვენი ჯანმრთელობის სამსახურში.", buttonLabel: "ჩვენი ექიმები" },
        en: { headline: "Experienced Doctors", subheadline: "Our specialists at the service of your health.", buttonLabel: "Our Doctors" },
        ru: { headline: "Опытные врачи", subheadline: "Наши специалисты на службе вашего здоровья.", buttonLabel: "Наши врачи" },
      },
    ];
    const rowsByLocale = Object.fromEntries(LOCALES.map((loc) => [loc, SLIDES.map((s) => ({ image: s.image, buttonHref: s.buttonHref, ...s[loc] }))]));
    console.log(`${DRY ? "WOULD SEED" : "SEED"} home-page.heroSlides -> ${SLIDES.length} slides (images ${imgIds.join(",") || "none"})`);
    if (!DRY) await writeLocalizedArray("home-page", "heroSlides", rowsByLocale);
  }
}

// ── 5. home-page.faqs — SEED 6 demo Q&A (only if empty) ─────────────────────
{
  const before = await api(`/globals/home-page?locale=ge&depth=0&fallback-locale=null`);
  const existing = before.body?.faqs ?? [];
  if (existing.length > 0) {
    console.log(`home-page.faqs: already has ${existing.length} rows — skipped`);
  } else {
    const FAQS = [
      {
        ge: { question: "რა არის სამუშაო საათები?", answer: "კლინიკა მუშაობს ორშაბათიდან პარასკევის ჩათვლით 09:00-დან 18:00 საათამდე, შაბათს 09:30-დან 17:00 საათამდე." },
        en: { question: "What are your working hours?", answer: "The clinic is open Monday to Friday 09:00–18:00 and Saturday 09:30–17:00." },
        ru: { question: "Какие у вас часы работы?", answer: "Клиника работает с понедельника по пятницу с 09:00 до 18:00 и в субботу с 09:30 до 17:00." },
      },
      {
        ge: { question: "როგორ დავჯავშნო ვიზიტი?", answer: "ვიზიტის დასაჯავშნად დაგვირეკეთ ნომერზე (+995) 422 22 71 71 ან მოგვწერეთ — ჩვენი ადმინისტრატორი დაგეხმარებათ შესაფერისი დროის შერჩევაში." },
        en: { question: "How do I book an appointment?", answer: "To book a visit, call us at (+995) 422 22 71 71 or message us — our administrator will help you find a convenient time." },
        ru: { question: "Как записаться на приём?", answer: "Чтобы записаться, позвоните нам по номеру (+995) 422 22 71 71 или напишите — администратор поможет выбрать удобное время." },
      },
      {
        ge: { question: "რა ენებზე იღებენ ექიმები პაციენტებს?", answer: "ჩვენი ექიმები გესაუბრებიან ქართულ, ინგლისურ და რუსულ ენებზე." },
        en: { question: "What languages do the doctors speak?", answer: "Our doctors speak Georgian, English and Russian." },
        ru: { question: "На каких языках говорят врачи?", answer: "Наши врачи говорят на грузинском, английском и русском языках." },
      },
      {
        ge: { question: "მჭირდება თუ არა წინასწარი ჩაწერა?", answer: "რეკომენდებულია წინასწარი ჩაწერა ლოდინის თავიდან ასაცილებლად, თუმცა ვიღებთ პაციენტებს ადგილზეც." },
        en: { question: "Do I need an appointment in advance?", answer: "We recommend booking in advance to avoid waiting, but we also accept walk-in patients." },
        ru: { question: "Нужна ли предварительная запись?", answer: "Рекомендуем записываться заранее, чтобы избежать ожидания, но мы принимаем и без записи." },
      },
      {
        ge: { question: "მუშაობთ თუ არა სადაზღვევო კომპანიებთან?", answer: "დიახ, ვთანამშრომლობთ წამყვან სადაზღვევო კომპანიებთან. დეტალებისთვის დაგვიკავშირდით." },
        en: { question: "Do you work with insurance companies?", answer: "Yes, we cooperate with leading insurance providers. Contact us for details." },
        ru: { question: "Работаете ли вы со страховыми компаниями?", answer: "Да, мы сотрудничаем с ведущими страховыми компаниями. Свяжитесь с нами для подробностей." },
      },
      {
        ge: { question: "სად მდებარეობს კლინიკა?", answer: "კლინიკა მდებარეობს ბათუმში. ზუსტი მისამართი და რუკა იხილეთ საკონტაქტო გვერდზე." },
        en: { question: "Where is the clinic located?", answer: "The clinic is located in Batumi. See the contact page for the exact address and map." },
        ru: { question: "Где находится клиника?", answer: "Клиника находится в Батуми. Точный адрес и карту смотрите на странице контактов." },
      },
    ];
    const rowsByLocale = Object.fromEntries(LOCALES.map((loc) => [loc, FAQS.map((f) => f[loc])]));
    console.log(`${DRY ? "WOULD SEED" : "SEED"} home-page.faqs -> ${FAQS.length} Q&A`);
    if (!DRY) await writeLocalizedArray("home-page", "faqs", rowsByLocale);
  }
}

console.log(`\n=== ${DRY ? "DRY RUN — " : ""}done ===`);
