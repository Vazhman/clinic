#!/usr/bin/env node
/**
 * Replace the leftover TEST/placeholder content on the "About Us" (about-page)
 * global with real clinic content scraped from khozrevanidze.ge, in ge/en/ru:
 *   - subtitle  (hero H1)     -> clinic vision line
 *   - description (richText)  -> founding history (2015, ENT, 1st coblation) + mission
 *   - highlights (3 cards)    -> Mission / Vision / Values
 *   - ceo group               -> real founder Gela Khozrevanidze (replaces the
 *                                "ვაჟა ჩიტაიშვილი / ტესტერი" test entry) + real photo
 * Leaves about-page.stats untouched (already real: 2015 / 40 / 1st).
 *
 * The director photo is uploaded to the Media collection (Vercel Blob in prod)
 * and reused on re-runs (matched by filename) so the script is idempotent.
 *
 * Usage:
 *   SITE=http://localhost:3005 node scripts/seed-about-real-content.mjs [--dry]
 *   SITE=https://clinic-one-blush.vercel.app node scripts/seed-about-real-content.mjs
 */
import fs from "node:fs";

const SITE = process.env.SITE || "http://localhost:3005";
const EMAIL = process.env.ADMIN_EMAIL || "admin@admin.ge";
const PASSWORD = process.env.ADMIN_PASSWORD || "111111";
const PHOTO = process.env.GELA_PHOTO ||
  "C:/Users/NIKAFA~1.LCI/AppData/Local/Temp/claude/C--Users-nika-fartenadze-LCIBATUMI-Desktop-cl-clinic/c8d6a680-b7d6-4945-b86e-1c148077dc20/scratchpad/gela-khozrevanidze.jpg";
const PHOTO_FILENAME = "gela-khozrevanidze.jpg";
const DRY = process.argv.includes("--dry");
const LOCALES = ["ge", "en", "ru"];

let token = "";
async function api(path, opts = {}) {
  const res = await fetch(`${SITE}/api${path}`, {
    ...opts,
    headers: {
      ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `JWT ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  let body = null;
  try { body = await res.json(); } catch { /* */ }
  return { status: res.status, body };
}

// Build a minimal Lexical richText doc from one or more paragraph strings.
function richText(paragraphs) {
  return {
    root: {
      type: "root", format: "", indent: 0, version: 1, direction: "ltr",
      children: paragraphs.map((p) => ({
        type: "paragraph", format: "", indent: 0, version: 1, direction: "ltr",
        textFormat: 0, textStyle: "",
        children: [{ type: "text", text: p, format: 0, detail: 0, mode: "normal", style: "", version: 1 }],
      })),
    },
  };
}

// ── Real content (scraped from khozrevanidze.ge) ────────────────────────────
const SUBTITLE = {
  ge: "წამყვანი სტაციონარული კლინიკა, აღიარებული განსაკუთრებული მოვლისთვის",
  en: "A leading inpatient clinic, recognised for exceptional care",
  ru: "Ведущая стационарная клиника, признанная за исключительный уход",
};

const DESCRIPTION = {
  ge: [
    "ხოზრევანიძის კლინიკა დაარსდა 2015 წელს, თავდაპირველად ოტორინოლარინგოლოგიის მიმართულებით, სადაც პირველად საქართველოში დაინერგა ცივი პლაზმის (კობლაციის) მეთოდი.",
    "დღეს ეს არის თანამედროვე, მრავალპროფილური სტაციონარული კლინიკა ბათუმში, რომელიც პაციენტს უმაღლესი ხარისხის სამედიცინო მომსახურებას სთავაზობს უსაფრთხო და მზრუნველ გარემოში.",
  ],
  en: [
    "Khozrevanidze Clinic was founded in 2015, initially in otorhinolaryngology, where the cold-plasma (coblation) method was introduced in Georgia for the very first time.",
    "Today it is a modern, multidisciplinary inpatient clinic in Batumi, offering patients the highest quality of medical care in a safe and caring environment.",
  ],
  ru: [
    "Клиника Хозреванидзе основана в 2015 году, первоначально в направлении оториноларингологии, где впервые в Грузии был внедрён метод холодной плазмы (кобляции).",
    "Сегодня это современная многопрофильная стационарная клиника в Батуми, предлагающая пациентам медицинскую помощь высочайшего качества в безопасной и заботливой среде.",
  ],
};

const HIGHLIGHTS = {
  ge: [
    { title: "მისია", text: "უმაღლესი ხარისხის სამედიცინო მომსახურება პაციენტის უსაფრთხო გარემოში." },
    { title: "ხედვა", text: "წამყვანი სტაციონარული კლინიკა, რომელიც აღიარებულია განსაკუთრებული მოვლისთვის." },
    { title: "ღირებულებები", text: "თანაგრძნობა, სრულყოფილება, კეთილსინდისიერება, თანამშრომლობა, ინოვაცია, პატივისცემა და უსაფრთხოება." },
  ],
  en: [
    { title: "Mission", text: "The highest quality of medical care for every patient, in a safe environment." },
    { title: "Vision", text: "A leading inpatient clinic, recognised for its exceptional care." },
    { title: "Values", text: "Compassion, excellence, integrity, collaboration, innovation, respect and safety." },
  ],
  ru: [
    { title: "Миссия", text: "Медицинская помощь высочайшего качества для каждого пациента в безопасной среде." },
    { title: "Видение", text: "Ведущая стационарная клиника, признанная за исключительный уход." },
    { title: "Ценности", text: "Сострадание, совершенство, добросовестность, сотрудничество, инновации, уважение и безопасность." },
  ],
};

const CEO_NAME = {
  ge: "გელა ხოზრევანიძე",
  en: "Gela Khozrevanidze",
  ru: "Гела Хозреванидзе",
};
const CEO_ROLE = {
  ge: "კლინიკის დამფუძნებელი · ოტორინოლარინგოლოგიური მიმართულების ხელმძღვანელი",
  en: "Founder · Head of the ENT Department",
  ru: "Основатель клиники · руководитель оториноларингологического направления",
};
const CEO_MESSAGE = {
  ge: "ხოზრევანიძის კლინიკა შეიქმნა იმ რწმენით, რომ თითოეული პაციენტი იმსახურებს უმაღლესი ხარისხის სამედიცინო მომსახურებას მზრუნველ და უსაფრთხო გარემოში. 2015 წლიდან ჩვენ ვაერთიანებთ გამოცდილ ექიმებსა და თანამედროვე ტექნოლოგიებს, რათა თქვენი ჯანმრთელობა საიმედო ხელში იყოს. მოგესალმებით ჩვენს კლინიკაში.",
  en: "Khozrevanidze Clinic was built on the belief that every patient deserves the highest quality of medical care in a caring, safe environment. Since 2015 we have combined experienced physicians with modern technology so that your health is always in trusted hands. Welcome to our clinic.",
  ru: "Клиника Хозреванидзе создана с убеждением, что каждый пациент заслуживает медицинской помощи высочайшего качества в заботливой и безопасной среде. С 2015 года мы объединяем опытных врачей и современные технологии, чтобы ваше здоровье было в надёжных руках. Добро пожаловать в нашу клинику.",
};

// ── auth ────────────────────────────────────────────────────────────────────
{
  const { status, body } = await api("/users/login", { method: "POST", body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  if (status !== 200 || !body?.token) { console.error("LOGIN FAILED", status, JSON.stringify(body).slice(0, 200)); process.exit(2); }
  token = body.token;
  console.log(`${DRY ? "[DRY] " : ""}seeding about-page real content on ${SITE}\n`);
}

// ── 1. director photo: reuse if already uploaded (match by filename), else upload ──
let photoId = null;
{
  const found = await api(`/media?where[filename][like]=gela-khozrevanidze&limit=1&depth=0`);
  const hit = found.body?.docs?.[0];
  if (hit?.id) {
    photoId = hit.id;
    console.log(`photo: reusing existing media #${photoId} (${hit.filename})`);
  } else if (DRY) {
    console.log(`[DRY] WOULD upload ${PHOTO_FILENAME}`);
  } else {
    if (!fs.existsSync(PHOTO)) { console.error(`PHOTO not found at ${PHOTO}`); process.exit(3); }
    const buf = fs.readFileSync(PHOTO);
    const fd = new FormData();
    fd.append("file", new Blob([buf], { type: "image/jpeg" }), PHOTO_FILENAME);
    fd.append("alt", CEO_NAME.ge);
    const up = await api(`/media`, { method: "POST", body: fd });
    if (up.status !== 201 && up.status !== 200) { console.error("PHOTO upload failed", up.status, JSON.stringify(up.body?.errors || up.body).slice(0, 300)); process.exit(3); }
    photoId = up.body?.doc?.id;
    console.log(`photo: uploaded media #${photoId}`);
  }
}

// ── 2. about-page fields, ge first (to mint highlight row ids), then en/ru ────
async function writeLocale(loc, highlightIds) {
  const ceo = { name: CEO_NAME[loc], role: CEO_ROLE[loc], message: CEO_MESSAGE[loc] };
  if (photoId) ceo.photo = photoId;
  const highlights = HIGHLIGHTS[loc].map((h, i) => (highlightIds ? { ...h, id: highlightIds[i] } : { ...h }));
  const payload = {
    subtitle: SUBTITLE[loc],
    description: richText(DESCRIPTION[loc]),
    highlights,
    ceo,
  };
  if (DRY) { console.log(`[DRY] WOULD PATCH about-page [${loc}]`); return null; }
  const r = await api(`/globals/about-page?locale=${loc}&depth=0`, { method: "POST", body: JSON.stringify(payload) });
  if (r.status !== 200) { console.error(`  !! ${loc} failed ${r.status}: ${JSON.stringify(r.body?.errors).slice(0, 300)}`); return null; }
  console.log(`  ✓ ${loc} updated (ceo=${CEO_NAME[loc]}, ${HIGHLIGHTS[loc].length} highlights)`);
  return r;
}

await writeLocale("ge", null);
let ids = null;
if (!DRY) {
  const after = await api(`/globals/about-page?locale=ge&depth=0`);
  ids = (after.body?.highlights ?? []).map((row) => row.id);
}
await writeLocale("en", ids);
await writeLocale("ru", ids);

console.log(`\n${DRY ? "[DRY] " : ""}done.`);
