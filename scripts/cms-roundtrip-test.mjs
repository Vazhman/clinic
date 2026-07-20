#!/usr/bin/env node
/**
 * Automated CMS write→read→public-page roundtrip test against the LIVE site.
 *
 * Coverage (every editable field that renders publicly):
 *   1. text/textarea fields on every global, per locale — sentinel PATCH →
 *      stored → visible in public HTML → restored
 *   2. array fields (FAQs, stats list, hero slides, highlights, quick links,
 *      social links, extra phones, included services) — append item → visible
 *      on page → restored
 *   3. richText (about description, doctor biography) — append paragraph →
 *      visible → restored
 *   4. collection text fields (doctors, services, news, checkups, reviews,
 *      lab-tests) — update → visible on the doc's public page → restored
 *   5. create→render→delete lifecycles: published Page (incl. nav auto-include),
 *      News post (incl. homepage carousel), Review (homepage carousel),
 *      LabTest, Media upload
 *
 * Safe-by-construction: every mutation is restored in a finally block; the
 * sentinel is timestamped so a crashed run is identifiable and re-runnable.
 *
 * Usage: SITE=https://clinic-olive-nu.vercel.app ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/cms-roundtrip-test.mjs
 */

const SITE = process.env.SITE || "https://clinic-olive-nu.vercel.app";
const EMAIL = process.env.ADMIN_EMAIL || "admin@admin.ge";
const PASSWORD = process.env.ADMIN_PASSWORD || "111111";
const SENTINEL = `QA${Date.now().toString(36).toUpperCase()}`;

let token = "";
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function api(path, opts = {}) {
  const res = await fetch(`${SITE}/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `JWT ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, body };
}

async function publicHtml(path) {
  const res = await fetch(`${SITE}${path}`, { redirect: "follow", headers: { "User-Agent": "qa-bot" } });
  return { status: res.status, html: await res.text() };
}

// ── auth ────────────────────────────────────────────────────────────────────
{
  const { status, body } = await api("/users/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (status !== 200 || !body?.token) {
    console.error("LOGIN FAILED", status, body);
    process.exit(2);
  }
  token = body.token;
  console.log(`logged in as ${EMAIL}\nsentinel: ${SENTINEL}\nsite: ${SITE}\n`);
}

const get = (obj, dotted) => dotted.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
const setDeep = (dotted, value) => {
  // Build a minimal nested patch object {a:{b:value}}
  const keys = dotted.split(".");
  const root = {};
  let cur = root;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] = {};
  cur[keys[keys.length - 1]] = value;
  return root;
};

// ── global scalar roundtrips ────────────────────────────────────────────────
// Each entry: global slug, dot-path of a text field, public page whose HTML
// must contain the sentinel, locale to test.
const GLOBAL_CHECKS = [
  // contact-page — every field that renders on /kontaqti (+ footer/home card)
  { slug: "contact-page", path: "title", page: "/ge/kontaqti", locale: "ge" },
  { slug: "contact-page", path: "contactFormTitle", page: "/ge/kontaqti", locale: "ge" },
  { slug: "contact-page", path: "address.label", page: "/ge/kontaqti", locale: "ge" },
  { slug: "contact-page", path: "address.value", page: "/ge/kontaqti", locale: "ge" },
  { slug: "contact-page", path: "phone.label", page: "/ge/kontaqti", locale: "ge" },
  { slug: "contact-page", path: "phone.display", page: "/ge/kontaqti", locale: "ge" },
  { slug: "contact-page", path: "email.label", page: "/ge/kontaqti", locale: "ge" },
  { slug: "contact-page", path: "workingHours.label", page: "/ge/kontaqti", locale: "ge" },
  { slug: "contact-page", path: "workingHours.weekdays", page: "/ge/kontaqti", locale: "ge" },
  { slug: "contact-page", path: "workingHours.weekends", page: "/ge/kontaqti", locale: "ge" },
  // locale plumbing: the same localized field must roundtrip independently
  // in EN and RU and land on the locale-prefixed public routes.
  { slug: "contact-page", path: "title", page: "/en/contact", locale: "en" },
  { slug: "contact-page", path: "title", page: "/ru/kontakty", locale: "ru" },

  // footer
  { slug: "footer", path: "description", page: "/ge", locale: "ge" },
  { slug: "footer", path: "copyright", page: "/ge", locale: "ge" },

  // navigation — every route label renders in the header on every page
  { slug: "navigation", path: "homeRoute.label", page: "/ge", locale: "ge" },
  { slug: "navigation", path: "aboutRoute.label", page: "/ge", locale: "ge" },
  { slug: "navigation", path: "servicesRoute.label", page: "/ge", locale: "ge" },
  { slug: "navigation", path: "doctorsRoute.label", page: "/ge", locale: "ge" },
  { slug: "navigation", path: "checkupsRoute.label", page: "/ge", locale: "ge" },
  { slug: "navigation", path: "blogRoute.label", page: "/ge", locale: "ge" },
  { slug: "navigation", path: "contactRoute.label", page: "/ge", locale: "ge" },
  { slug: "navigation", path: "ctaButton.label", page: "/ge", locale: "ge" },

  // home-page hero + trust strip + symptom navigator
  { slug: "home-page", path: "hero.headline", page: "/ge", locale: "ge" },
  { slug: "home-page", path: "hero.subheadline", page: "/ge", locale: "ge" },
  { slug: "home-page", path: "hero.bookButtonText", page: "/ge", locale: "ge" },
  { slug: "home-page", path: "hero.consultButtonText", page: "/ge", locale: "ge" },
  { slug: "home-page", path: "hero.badgeText", page: "/ge", locale: "ge" },
  { slug: "home-page", path: "trustStrip.rating", page: "/ge", locale: "ge" },
  { slug: "home-page", path: "trustStrip.doctorCount", page: "/ge", locale: "ge" },
  { slug: "home-page", path: "trustStrip.patientCount", page: "/ge", locale: "ge" },
  { slug: "home-page", path: "symptomNavigator.title", page: "/ge", locale: "ge" },
  { slug: "home-page", path: "symptomNavigator.subtitle", page: "/ge", locale: "ge" },
  { slug: "home-page", path: "symptomNavigator.placeholder", page: "/ge", locale: "ge" },

  // about-page
  { slug: "about-page", path: "title", page: "/ge/shesakheb", locale: "ge" },
  { slug: "about-page", path: "subtitle", page: "/ge/shesakheb", locale: "ge" },

  // booking-page — only title/subtitle render now. The interactive wizard is
  // disabled (clinic books by phone), so the steps.*/form.* groups are orphaned
  // and intentionally NOT asserted (they're hidden in admin).
  { slug: "booking-page", path: "title", page: "/ge/chawera", locale: "ge" },
  { slug: "booking-page", path: "subtitle", page: "/ge/chawera", locale: "ge" },

  // services-page / doctors-page — landing-hero copy (added so these headings
  // are CMS-editable instead of i18n-only).
  { slug: "services-page", path: "title", page: "/ge/servisebi", locale: "ge" },
  { slug: "services-page", path: "subtitle", page: "/ge/servisebi", locale: "ge" },
  { slug: "doctors-page", path: "title", page: "/ge/eqimebi", locale: "ge" },
  { slug: "doctors-page", path: "subtitle", page: "/ge/eqimebi", locale: "ge" },
];
// site-settings is intentionally NOT write-tested: every field on it is
// hidden/legacy (stats moved to HomePage; lastDoctraSync is machine-set).
// Footer.whatsappNumber is editable but not rendered anywhere (known gap).

for (const c of GLOBAL_CHECKS) {
  const name = `global:${c.slug}.${c.path} -> ${c.page}`;
  let original;
  try {
    const before = await api(`/globals/${c.slug}?locale=${c.locale}&depth=0`);
    if (before.status !== 200) { record(name, false, `GET ${before.status}`); continue; }
    original = get(before.body, c.path);

    const patch = await api(`/globals/${c.slug}?locale=${c.locale}&depth=0`, {
      method: "POST",
      body: JSON.stringify(setDeep(c.path, SENTINEL)),
    });
    if (patch.status !== 200) { record(name, false, `PATCH ${patch.status}: ${JSON.stringify(patch.body?.errors || patch.body).slice(0, 200)}`); continue; }

    const after = await api(`/globals/${c.slug}?locale=${c.locale}&depth=0`);
    const stored = get(after.body, c.path);
    if (stored !== SENTINEL) { record(name, false, `stored=${JSON.stringify(stored)} (write didn't stick)`); continue; }

    const pub = await publicHtml(c.page);
    const onPage = pub.html.includes(SENTINEL);
    record(name, onPage, onPage ? "sentinel visible on public page" : `saved in CMS but NOT on public page (HTTP ${pub.status})`);
  } catch (e) {
    record(name, false, e.message);
  } finally {
    // Always restore — a previously-empty field goes back to "" (still falsy
    // for the frontend fallbacks), never leave the sentinel behind.
    const restore = await api(`/globals/${c.slug}?locale=${c.locale}&depth=0`, {
      method: "POST",
      body: JSON.stringify(setDeep(c.path, original ?? "")),
    });
    const check = await api(`/globals/${c.slug}?locale=${c.locale}&depth=0`);
    const now = get(check.body, c.path);
    const restored = (now ?? "") === (original ?? "");
    if (!restored) console.error(`  !! RESTORE FAILED for ${name}: now=${JSON.stringify(now)} expected=${JSON.stringify(original)} (patch ${restore.status})`);
  }
}

// ── about-page CEO block (renders only when the group is filled) ───────────
// message is richText (see the ceo.message richtext check further below,
// grouped with the other richText checks so it can reuse withSentinelParagraph);
// name/role are still plain text fields, tested here together.
{
  const name = "global:about-page.ceo.{name,role} -> /ge/shesakheb";
  const before = await api(`/globals/about-page?locale=ge&depth=0`);
  const orig = before.body?.ceo ?? {};
  try {
    const patch = await api(`/globals/about-page?locale=ge&depth=0`, {
      method: "POST",
      body: JSON.stringify({ ceo: { ...orig, name: `${SENTINEL}N`, role: `${SENTINEL}R` } }),
    });
    if (patch.status !== 200) {
      record(name, false, `PATCH ${patch.status}: ${JSON.stringify(patch.body?.errors).slice(0, 200)}`);
    } else {
      const pub = await publicHtml("/ge/shesakheb");
      const all = ["N", "R"].filter((s) => pub.html.includes(`${SENTINEL}${s}`));
      record(name, all.length === 2, `visible: ${all.length}/2 (name/role)`);
    }
  } finally {
    await api(`/globals/about-page?locale=ge&depth=0`, {
      method: "POST",
      body: JSON.stringify({ ceo: { name: orig.name ?? "", role: orig.role ?? "", message: orig.message ?? null, photo: orig.photo ?? null } }),
    });
  }
}

// ── array fields: append an item → it must APPEAR on the page → restore ────
const ARRAY_CHECKS = [
  { slug: "home-page", path: "faqs", page: "/ge", locale: "ge",
    item: { question: `კითხვა ${SENTINEL}?`, answer: `პასუხი ${SENTINEL}` } },
  { slug: "home-page", path: "statsList", page: "/ge", locale: "ge",
    item: { value: 4321, suffix: "+", label: `სტატი ${SENTINEL}` } },
  { slug: "home-page", path: "heroSlides", page: "/ge", locale: "ge",
    item: { headline: `სლაიდი ${SENTINEL}`, subheadline: `ქვესათაური ${SENTINEL}`, buttonLabel: `ღილაკი ${SENTINEL}`, buttonHref: "/booking" } },
  { slug: "about-page", path: "highlights", page: "/ge/shesakheb", locale: "ge",
    item: { title: `მახასიათებელი ${SENTINEL}`, text: `ტექსტი ${SENTINEL}`, icon: "✓" } },
  { slug: "about-page", path: "stats", page: "/ge/shesakheb", locale: "ge",
    item: { label: `ფაქტი ${SENTINEL}`, value: `2026` } },
  { slug: "footer", path: "quickLinks", page: "/ge", locale: "ge",
    item: { label: `ბმული ${SENTINEL}`, href: "/services" } },
  { slug: "footer", path: "socialLinks", page: "/ge", locale: "ge",
    item: { platform: "facebook", url: `https://facebook.com/${SENTINEL}` } },
  { slug: "contact-page", path: "phones", page: "/ge/kontaqti", locale: "ge",
    item: { label: "QA", value: "+995500000000", display: SENTINEL } },
];

for (const c of ARRAY_CHECKS) {
  const name = `global-array:${c.slug}.${c.path}[+1] -> ${c.page}`;
  const before = await api(`/globals/${c.slug}?locale=${c.locale}&depth=0`);
  const originalArr = before.body?.[c.path] ?? [];
  try {
    if (before.status !== 200) { record(name, false, `GET ${before.status}`); continue; }
    const patch = await api(`/globals/${c.slug}?locale=${c.locale}&depth=0`, {
      method: "POST",
      body: JSON.stringify({ [c.path]: [...originalArr, c.item] }),
    });
    if (patch.status !== 200) { record(name, false, `PATCH ${patch.status}: ${JSON.stringify(patch.body?.errors || patch.body).slice(0, 250)}`); continue; }
    const pub = await publicHtml(c.page);
    const onPage = pub.html.includes(SENTINEL);
    record(name, onPage, onPage ? "added item visible on public page" : `saved but NOT on public page (HTTP ${pub.status})`);
  } catch (e) {
    record(name, false, e.message);
  } finally {
    const r = await api(`/globals/${c.slug}?locale=${c.locale}&depth=0`, {
      method: "POST",
      body: JSON.stringify({ [c.path]: originalArr }),
    });
    const check = await api(`/globals/${c.slug}?locale=${c.locale}&depth=0`);
    if ((check.body?.[c.path] ?? []).length !== originalArr.length)
      console.error(`  !! RESTORE FAILED for ${name} (patch ${r.status})`);
  }
}

// ── richText: append a sentinel paragraph → visible → restore ──────────────
const sentinelParagraph = (text) => ({
  type: "paragraph", version: 1, format: "", indent: 0, direction: null,
  children: [{ type: "text", version: 1, text, format: 0, style: "", mode: "normal", detail: 0 }],
});
const emptyLexical = () => ({
  root: { type: "root", version: 1, format: "", indent: 0, direction: null, children: [] },
});
const withSentinelParagraph = (rich, text) => {
  const doc = rich?.root ? JSON.parse(JSON.stringify(rich)) : emptyLexical();
  doc.root.children = [...(doc.root.children ?? []), sentinelParagraph(text)];
  return doc;
};

// about-page.description (required richText on /shesakheb)
{
  const name = "global-richtext:about-page.description -> /ge/shesakheb";
  const before = await api(`/globals/about-page?locale=ge&depth=0`);
  const original = before.body?.description;
  try {
    const patch = await api(`/globals/about-page?locale=ge&depth=0`, {
      method: "POST",
      body: JSON.stringify({ description: withSentinelParagraph(original, SENTINEL) }),
    });
    if (patch.status !== 200) {
      record(name, false, `PATCH ${patch.status}: ${JSON.stringify(patch.body?.errors).slice(0, 200)}`);
    } else {
      const pub = await publicHtml("/ge/shesakheb");
      record(name, pub.html.includes(SENTINEL), pub.html.includes(SENTINEL) ? "rich text paragraph visible" : `saved but NOT on page (HTTP ${pub.status})`);
    }
  } finally {
    if (original !== undefined) {
      await api(`/globals/about-page?locale=ge&depth=0`, {
        method: "POST",
        body: JSON.stringify({ description: original }),
      });
    }
  }
}

// about-page.ceo.message (optional richText greeting on /shesakheb)
{
  const name = "global-richtext:about-page.ceo.message -> /ge/shesakheb";
  const before = await api(`/globals/about-page?locale=ge&depth=0`);
  const origCeo = before.body?.ceo ?? {};
  try {
    const patch = await api(`/globals/about-page?locale=ge&depth=0`, {
      method: "POST",
      body: JSON.stringify({ ceo: { ...origCeo, message: withSentinelParagraph(origCeo.message, SENTINEL) } }),
    });
    if (patch.status !== 200) {
      record(name, false, `PATCH ${patch.status}: ${JSON.stringify(patch.body?.errors).slice(0, 200)}`);
    } else {
      const pub = await publicHtml("/ge/shesakheb");
      record(name, pub.html.includes(SENTINEL), pub.html.includes(SENTINEL) ? "rich text paragraph visible" : `saved but NOT on page (HTTP ${pub.status})`);
    }
  } finally {
    await api(`/globals/about-page?locale=ge&depth=0`, {
      method: "POST",
      body: JSON.stringify({ ceo: { name: origCeo.name ?? "", role: origCeo.role ?? "", message: origCeo.message ?? null, photo: origCeo.photo ?? null } }),
    });
  }
}

// doctors[0].biography (optional richText on the profile page)
{
  const name = "richtext:doctors.biography -> profile page";
  const list = await api(`/doctors?limit=1&locale=ge&depth=0&where[inactive][not_equals]=true`);
  const doc = list.body?.docs?.[0];
  if (!doc) {
    record(name, false, "no doctors found");
  } else {
    const original = doc.biography;
    try {
      const patch = await api(`/doctors/${doc.id}?locale=ge&depth=0`, {
        method: "PATCH",
        body: JSON.stringify({ biography: withSentinelParagraph(original, SENTINEL) }),
      });
      if (patch.status !== 200) {
        record(name, false, `PATCH ${patch.status}: ${JSON.stringify(patch.body?.errors).slice(0, 200)}`);
      } else {
        const pub = await publicHtml(`/ge/eqimebi/${doc.slug}`);
        record(name, pub.html.includes(SENTINEL), pub.html.includes(SENTINEL) ? "bio paragraph visible on profile" : `saved but NOT on page (HTTP ${pub.status})`);
      }
    } finally {
      await api(`/doctors/${doc.id}?locale=ge&depth=0`, {
        method: "PATCH",
        body: JSON.stringify({ biography: original ?? null }),
      });
    }
  }
}

// ── lab-tests fixture: local DBs may have none — create one so the update
//    roundtrips below have a doc to work with; deleted after the loop. ──────
let labTestFixtureId = null;
{
  const list = await api(`/lab-tests?limit=1&locale=ge&depth=0&where[published][equals]=true`);
  if (list.status === 200 && !list.body?.docs?.length) {
    const res = await api(`/lab-tests?locale=ge`, {
      method: "POST",
      body: JSON.stringify({
        title: `ფიქსტურა ${SENTINEL}`,
        category: "biochemistry",
        summary: `ფიქსტურის აღწერა ${SENTINEL}`,
        published: true,
        _status: "published",
      }),
    });
    labTestFixtureId = res.body?.doc?.id ?? null;
    if (labTestFixtureId) console.log(`(created lab-test fixture id=${labTestFixtureId} — collection was empty)\n`);
  }
}

// ── collection roundtrips (update one real doc, restore) ──────────────────
const COLLECTION_CHECKS = [
  // `inactive` doctors have no public profile (getDoctors filters them), so the
  // sentinel must target an active one — same filter as the biography check.
  { col: "doctors", field: "name", locale: "ge", where: "&where[inactive][not_equals]=true", publicPage: (doc) => `/ge/eqimebi/${doc.slug}` },
  { col: "doctors", field: "specialty", locale: "ge", where: "&where[inactive][not_equals]=true", publicPage: (doc) => `/ge/eqimebi/${doc.slug}` },
  { col: "services", field: "name", locale: "ge", publicPage: (doc) => `/ge/servisebi/${doc.slug}` },
  { col: "services", field: "shortDescription", locale: "ge", publicPage: (doc) => `/ge/servisebi/${doc.slug}` },
  { col: "services", field: "description", locale: "ge", publicPage: (doc) => `/ge/servisebi/${doc.slug}` },
  // NB: the blog DETAIL route is /siakhlebi/ (routing.ts) while the list is
  // /siaxleebi/ — different transliterations, easy to trip on.
  { col: "news", field: "title", locale: "ge", publicPage: (doc) => `/ge/siakhlebi/${doc.slug}` },
  { col: "news", field: "excerpt", locale: "ge", publicPage: (doc) => `/ge/siakhlebi/${doc.slug}` },
  { col: "checkup-packages", field: "name", locale: "ge", publicPage: () => `/ge/cheqapi` },
  { col: "checkup-packages", field: "description", locale: "ge", publicPage: () => `/ge/cheqapi` },
  // published review text renders in the homepage carousel (SSR)
  { col: "reviews", field: "text", locale: "ge", where: "&where[published][equals]=true", publicPage: () => `/ge` },
  { col: "reviews", field: "author", locale: "ge", where: "&where[published][equals]=true", publicPage: () => `/ge` },
  { col: "lab-tests", field: "title", locale: "ge", where: "&where[published][equals]=true", publicPage: (doc) => `/ge/analizebi/${doc.slug}` },
  { col: "lab-tests", field: "summary", locale: "ge", where: "&where[published][equals]=true", publicPage: (doc) => `/ge/analizebi/${doc.slug}` },
];

for (const c of COLLECTION_CHECKS) {
  const name = `collection:${c.col}.${c.field}`;
  let docId, original;
  try {
    const list = await api(`/${c.col}?limit=1&locale=${c.locale}&depth=0${c.where ?? ""}`);
    if (list.status !== 200 || !list.body?.docs?.length) { record(name, false, `no docs (list ${list.status}, ${list.body?.docs?.length ?? 0} found)`); continue; }
    const doc = list.body.docs[0];
    docId = doc.id;
    original = doc[c.field];

    const patch = await api(`/${c.col}/${docId}?locale=${c.locale}&depth=0`, {
      method: "PATCH",
      body: JSON.stringify({ [c.field]: `${original ?? ""} ${SENTINEL}`.trim() }),
    });
    if (patch.status !== 200) { record(name, false, `PATCH ${patch.status}: ${JSON.stringify(patch.body?.errors || patch.body).slice(0, 200)}`); docId = null; continue; }

    const after = await api(`/${c.col}/${docId}?locale=${c.locale}&depth=0`);
    const ok = after.body?.[c.field]?.includes(SENTINEL);
    let pubOk = null;
    if (ok) {
      const pub = await publicHtml(c.publicPage(doc));
      pubOk = pub.html.includes(SENTINEL);
    }
    record(name, !!ok && pubOk !== false, ok ? (pubOk ? "write OK, visible on public page" : "write OK but NOT visible on public page") : "write didn't stick");
  } catch (e) {
    record(name, false, e.message);
  } finally {
    if (docId != null && original !== undefined) {
      const r = await api(`/${c.col}/${docId}?locale=${c.locale}&depth=0`, {
        method: "PATCH",
        body: JSON.stringify({ [c.field]: original }),
      });
      const check = await api(`/${c.col}/${docId}?locale=${c.locale}&depth=0`);
      if (check.body?.[c.field] !== original) console.error(`  !! RESTORE FAILED for ${name} (patch ${r.status})`);
    }
  }
}

if (labTestFixtureId) await api(`/lab-tests/${labTestFixtureId}`, { method: "DELETE" });

// ── checkup includedServices[]: add a line → appears in package data ────────
{
  const name = "collection-array:checkup-packages.includedServices[+1] -> /ge/cheqapi";
  const list = await api(`/checkup-packages?limit=1&locale=ge&depth=0`);
  const doc = list.body?.docs?.[0];
  if (!doc) {
    record(name, false, "no checkup packages found");
  } else {
    const originalArr = doc.includedServices ?? [];
    try {
      const patch = await api(`/checkup-packages/${doc.id}?locale=ge&depth=0`, {
        method: "PATCH",
        body: JSON.stringify({ includedServices: [...originalArr, { service: `სერვისი ${SENTINEL}` }] }),
      });
      if (patch.status !== 200) {
        record(name, false, `PATCH ${patch.status}: ${JSON.stringify(patch.body?.errors).slice(0, 250)}`);
      } else {
        const pub = await publicHtml("/ge/cheqapi");
        record(name, pub.html.includes(SENTINEL), pub.html.includes(SENTINEL) ? "added service line visible" : "saved but NOT in page payload");
      }
    } finally {
      await api(`/checkup-packages/${doc.id}?locale=ge&depth=0`, {
        method: "PATCH",
        body: JSON.stringify({ includedServices: originalArr }),
      });
    }
  }
}

// ── create→delete lifecycle: slug must AUTO-GENERATE when left blank ──────
{
  const name = "collection:pages create without slug (auto-slug)";
  const res = await api(`/pages?locale=ge`, {
    method: "POST",
    body: JSON.stringify({ title: `საცდელი გვერდი ${SENTINEL}`, _status: "draft" }),
  });
  const doc = res.body?.doc;
  if ((res.status === 201 || res.status === 200) && doc?.id) {
    const slugOk = typeof doc.slug === "string" && /^[a-z0-9-]+$/.test(doc.slug) && doc.slug.length > 3;
    record(name, slugOk, `auto slug="${doc.slug}" (from Georgian title)`);
    await api(`/pages/${doc.id}`, { method: "DELETE" });
  } else {
    record(name, false, `HTTP ${res.status}: ${JSON.stringify(res.body?.errors?.[0]?.data?.errors || res.body?.errors).slice(0, 200)}`);
  }
}

// ── lifecycle: PUBLISHED page → public URL renders + appears in nav ────────
{
  const name = "lifecycle:pages publish -> /ge/gverdebi/[slug] + nav auto-include";
  let pageId;
  try {
    const res = await api(`/pages?locale=ge`, {
      method: "POST",
      body: JSON.stringify({
        title: `ცდელი ${SENTINEL}`,
        status: "published",
        _status: "published",
        showInNav: true,
        navLabel: `მენიუ${SENTINEL}`,
      }),
    });
    const doc = res.body?.doc;
    if (!((res.status === 201 || res.status === 200) && doc?.id)) {
      record(name, false, `create HTTP ${res.status}: ${JSON.stringify(res.body?.errors).slice(0, 200)}`);
    } else {
      pageId = doc.id;
      const pub = await publicHtml(`/ge/gverdebi/${doc.slug}`);
      const pageOk = pub.status === 200 && pub.html.includes(SENTINEL);
      const home = await publicHtml(`/ge`);
      const navOk = home.html.includes(`მენიუ${SENTINEL}`);
      record(name, pageOk && navOk, `page ${pub.status} sentinel=${pageOk}, nav link=${navOk}`);
    }
  } catch (e) {
    record(name, false, e.message);
  } finally {
    if (pageId) await api(`/pages/${pageId}`, { method: "DELETE" });
  }
}

// ── lifecycle: News post → blog list + detail + homepage carousel ──────────
{
  const name = "lifecycle:news create -> list + detail + homepage";
  let newsId, mediaId;
  try {
    // featuredImage is required → upload a 1x1 png first
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    );
    const form = new FormData();
    form.append("file", new Blob([png], { type: "image/png" }), `qa-news-${SENTINEL.toLowerCase()}.png`);
    form.append("_payload", JSON.stringify({ alt: `QA news ${SENTINEL}` }));
    const up = await fetch(`${SITE}/api/media?locale=ge`, {
      method: "POST", headers: { Authorization: `JWT ${token}` }, body: form,
    });
    const upBody = await up.json().catch(() => null);
    mediaId = upBody?.doc?.id;
    if (!mediaId) {
      record(name, false, `media upload failed HTTP ${up.status}`);
    } else {
      const res = await api(`/news?locale=ge`, {
        method: "POST",
        body: JSON.stringify({
          title: `სიახლე ${SENTINEL}`,
          excerpt: `ანონსი ${SENTINEL}`,
          category: "clinic-news",
          publishedDate: new Date().toISOString(),
          status: "published",
          _status: "published",
          featuredImage: mediaId,
          showOnHomepage: true,
          homepageOrder: 0,
        }),
      });
      const doc = res.body?.doc;
      if (!((res.status === 201 || res.status === 200) && doc?.id)) {
        record(name, false, `create HTTP ${res.status}: ${JSON.stringify(res.body?.errors).slice(0, 250)}`);
      } else {
        newsId = doc.id;
        const detail = await publicHtml(`/ge/siakhlebi/${doc.slug}`);
        const listPg = await publicHtml(`/ge/siaxleebi`);
        const home = await publicHtml(`/ge`);
        const d = detail.status === 200 && detail.html.includes(SENTINEL);
        const l = listPg.html.includes(SENTINEL);
        const h = home.html.includes(SENTINEL);
        record(name, d && l && h, `detail=${d} (HTTP ${detail.status}), blog list=${l}, homepage=${h}`);
      }
    }
  } catch (e) {
    record(name, false, e.message);
  } finally {
    if (newsId) await api(`/news/${newsId}`, { method: "DELETE" });
    if (mediaId) await api(`/media/${mediaId}`, { method: "DELETE" });
  }
}

// ── lifecycle: Review → homepage carousel ──────────────────────────────────
{
  const name = "lifecycle:reviews create published -> homepage carousel";
  let reviewId;
  try {
    const res = await api(`/reviews?locale=ge`, {
      method: "POST",
      body: JSON.stringify({
        author: `ავტორი ${SENTINEL}`,
        rating: 5,
        text: `მიმოხილვა ${SENTINEL}`,
        date: new Date().toISOString(),
        published: true,
        source: "internal",
      }),
    });
    const doc = res.body?.doc;
    if (!((res.status === 201 || res.status === 200) && doc?.id)) {
      record(name, false, `create HTTP ${res.status}: ${JSON.stringify(res.body?.errors).slice(0, 200)}`);
    } else {
      reviewId = doc.id;
      const home = await publicHtml(`/ge`);
      record(name, home.html.includes(SENTINEL), home.html.includes(SENTINEL) ? "new review visible on homepage" : "created but NOT on homepage");
    }
  } catch (e) {
    record(name, false, e.message);
  } finally {
    if (reviewId) await api(`/reviews/${reviewId}`, { method: "DELETE" });
  }
}

// ── lifecycle: LabTest → list + detail page ────────────────────────────────
{
  const name = "lifecycle:lab-tests create published -> /ge/analizebi/[slug]";
  let testId;
  try {
    const res = await api(`/lab-tests?locale=ge`, {
      method: "POST",
      body: JSON.stringify({
        title: `ანალიზი ${SENTINEL}`,
        category: "biochemistry",
        summary: `აღწერა ${SENTINEL}`,
        published: true,
        _status: "published",
      }),
    });
    const doc = res.body?.doc;
    if (!((res.status === 201 || res.status === 200) && doc?.id)) {
      record(name, false, `create HTTP ${res.status}: ${JSON.stringify(res.body?.errors).slice(0, 250)}`);
    } else {
      testId = doc.id;
      const detail = await publicHtml(`/ge/analizebi/${doc.slug}`);
      const listPg = await publicHtml(`/ge/analizebi`);
      const d = detail.status === 200 && detail.html.includes(SENTINEL);
      const l = listPg.html.includes(SENTINEL);
      record(name, d && l, `detail=${d} (HTTP ${detail.status}), list=${l}, slug=${doc.slug}`);
    }
  } catch (e) {
    record(name, false, e.message);
  } finally {
    if (testId) await api(`/lab-tests/${testId}`, { method: "DELETE" });
  }
}

// ── HomePage.showDoctorCard=false must HIDE the doctors section ────────────
{
  const name = "global:home-page.showDoctorCard toggle hides doctors section";
  const before = await api(`/globals/home-page?locale=ge&depth=0`);
  const original = before.body?.showDoctorCard;
  try {
    const off = await api(`/globals/home-page?locale=ge&depth=0`, {
      method: "POST",
      body: JSON.stringify({ showDoctorCard: false }),
    });
    if (off.status !== 200) {
      record(name, false, `PATCH ${off.status}: ${JSON.stringify(off.body?.errors).slice(0, 250)}`);
    } else {
      const pub = await publicHtml("/ge");
      // DoctorsPreview links to /ge/eqimebi/<slug>; the header nav links to
      // /ge/eqimebi (no slug), so probe for the deep links specifically.
      const hasDoctorCards = /\/ge\/eqimebi\/[a-z0-9-]/.test(pub.html);
      record(name, !hasDoctorCards, hasDoctorCards ? "doctors section STILL renders with toggle off" : "section hidden when toggled off");
    }
  } finally {
    await api(`/globals/home-page?locale=ge&depth=0`, {
      method: "POST",
      body: JSON.stringify({ showDoctorCard: original ?? true }),
    });
  }
}

// ── media upload lifecycle: upload tiny PNG → Blob URL serves → delete ────
{
  const name = "collection:media upload->serve->delete";
  try {
    // 1x1 transparent PNG
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    );
    const form = new FormData();
    form.append("file", new Blob([png], { type: "image/png" }), `qa-${SENTINEL.toLowerCase()}.png`);
    form.append("_payload", JSON.stringify({ alt: `QA test ${SENTINEL}` }));
    const up = await fetch(`${SITE}/api/media?locale=ge`, {
      method: "POST",
      headers: { Authorization: `JWT ${token}` },
      body: form,
    });
    const upBody = await up.json().catch(() => null);
    const doc = upBody?.doc;
    if ((up.status !== 201 && up.status !== 200) || !doc?.id) {
      record(name, false, `upload HTTP ${up.status}: ${JSON.stringify(upBody?.errors).slice(0, 200)}`);
    } else {
      const fileUrl = doc.url?.startsWith("http") ? doc.url : `${SITE}${doc.url}`;
      const served = await fetch(fileUrl);
      const ok = served.status === 200 && (served.headers.get("content-type") || "").includes("image");
      const del = await api(`/media/${doc.id}`, { method: "DELETE" });
      record(name, ok && del.status === 200,
        `uploaded id=${doc.id}, served ${served.status} ${served.headers.get("content-type")}, deleted ${del.status}`);
    }
  } catch (e) {
    record(name, false, e.message);
  }
}

// ── summary ────────────────────────────────────────────────────────────────
const fails = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - fails.length}/${results.length} PASS ===`);
if (fails.length) {
  console.log("FAILURES:");
  for (const f of fails) console.log(`  - ${f.name}: ${f.detail}`);
}
process.exit(fails.length ? 1 : 0);
