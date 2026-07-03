# CMS Guide — what every screen in the admin does

Reference for the Payload admin at `/admin`. Each entry: **Admin label (Georgian)** → what it controls on the public site, where it shows, and the gotchas. Source files in parentheses.

The admin nav is split into four groups: **კონტენტი** (Content collections), **გვერდები** (Page globals), **საიტის ელემენტები** (Site-wide elements), and **Media/Users**. A few items are hidden on purpose (listed at the bottom).

All content is localized to **ge / en / ru** — switch the locale in the top-right of the editor. Empty localized fields fall back to built-in translations on the public site (so a blank field is usually safe, not broken).

---

## კონტენტი — Content collections

These are lists you add/edit many rows in.

### სერვისები — Services (`src/collections/Services.ts`)
Clinic departments / service areas. Each = one page at `/services/<slug>`.
- **სახელი** name, **slug** (auto from name) — the URL.
- **მოკლე აღწერა** short description — one sentence. Shows in **3 places**: services-list card, home-page services grid, and under the hero title on the service page. Also the Google meta description.
- **სრული აღწერა** full description — only on the service page body.
- **ხატულა** icon — pick from a visual grid (heart, brain, baby…).
- **დამაგრებული** pinned (+ **დამაგრების რიგი** order) — push a service to the front of lists and the home page.
- **კატეგორია** category — filter on the booking page.
- **Doctra განყოფილების ID** — links the service to the HIS for booking (UUID).
- **სურათი** image, **SEO** tab.

### ექიმები — Doctors (`src/collections/Doctors.ts`)
⚠️ **The roster is owned by Doctra (the HIS).** You can't create or delete doctors here — new ones arrive via the Doctra sync, and you "remove" one with the **არააქტიური** checkbox. You curate the existing profiles.
- **არააქტიური** inactive — hides the doctor **everywhere** (site + booking). The record is kept, not deleted.
- **ჩაწერა ჩართულია** bookingEnabled — shows/hides the "ჯავშანი" button + calendar on the doctor's page. Turn off for doctors with no Doctra slots; the page stays visible, only the booking button hides.
- **ჩვენება ექიმების გვერდზე** showOnDoctorsPage — include in the `/doctors` list. Off = hidden from that list, but the profile is still reachable by direct link and still in booking. **In the list view this column is an inline toggle** — click it to show/hide a doctor without opening them. (The home page "Our doctors" section is controlled separately — see HomePage below.)
- ⚠️ **Newly synced doctors start hidden.** When the Doctra sync creates a new doctor, it sets `showOnDoctorsPage: false` so the un-curated profile doesn't go live automatically. Use the **„გვერდიდან დამალული"** filter chip (top of the list) to find them, add a photo/bio, then flip the inline toggle to publish. The sync never changes visibility on existing doctors.
- Tabs: **იდენტობა** (name, photo), **პროფილი** (specialty, bio, qualifications, languages, experience, "department head"), **SEO**.
- Sidebar: **ბოლო განახლება** lastUpdated (shows on the profile), Doctra IDs.

### ჩექაფ პაკეტები — Checkup Packages (`src/collections/CheckupPackages.ts`)
Health-check bundles shown on `/checkups`.
- **სახელი / აღწერა / ფასი / ვალუტა** (price defaults GEL).
- **ჩართული სერვისები** included services — free-text list (procedure/test names, typed per language — NOT relationships).
- **ჩართული გამოკვლევები** included tests — shown in the details popup.
- **ვისთვის (პერსონა)** audience — woman/man/child; empty = shows for all personas.
- **დონე** tier — GENERAL / ADVANCED / PREMIUM.
- **გამოკვეთილი** isFeatured — highlights the package.

### სიახლეები — News / Blog (`src/collections/News.ts`)
Blog posts at `/blog/<slug>`. Has **drafts** — set status before it shows.
- Tab **კონტენტი**: title, **მთავარი სურათი** featured image (required), body (rich text / Puck builder).
- Tab **პარამეტრები**: slug (auto), **კატეგორია**, **მოკლე აღწერა** excerpt (card + meta), author, **გამოქვეყნების თარიღი**, **სტატუსი** (draft/published — must be *published* to appear), **დამაგრებული ბლოგზე** pin to top, **მთავარ გვერდზე გამოჩენა** showOnHomepage (+ order).
- Tab **SEO**.

### ანალიზები — Lab Tests (`src/collections/LabTests.ts`)
SEO content library, one page per test at `/lab-tests/<slug>`. Not bookable — it's editorial content to rank on Google. Has **drafts** (**გამოქვეყნებული** checkbox).
- Sidebar: slug, **კატეგორია**, **გადახედა ექიმმა** reviewedBy (trust signal), **ბოლო გადახედვის თარიღი**, **გამოქვეყნებული**.
- Tab **ძირითადი**: title, aliases (synonyms for search/SEO), summary (card + meta).
- Tab **შინაარსი**: Mayo-Clinic-style sections — overview, why done, preparation, what to expect, interpretation. Fill all three languages.
- Tab **კავშირები**: relatedServices / relatedDoctors / relatedTests — cross-links that auto-link this test from those pages.
- Tab **SEO**.

### შეფასებები — Reviews (`src/collections/Reviews.ts`)
Patient reviews. Google ones sync via the dashboard "Google შეფასებები" button.
- **author / rating (1–5) / text / date / წყარო** source (Google or internal).
- **გამოქვეყნებული** published — checked = shows on site, unchecked = hidden. This is the on/off switch.
- Sidebar Google metadata is read-only/auto.

---

## გვერდები — Page globals

Single-screen settings for specific public pages (not lists).

### მთავარი გვერდი — HomePage (`src/globals/HomePage.ts`)
The home page. Key sections:
- **ჰერო სექცია** hero — headline / subheadline / book-button text / badge (all blank = default text).
- **ჰერო კარუსელის სლაიდები** heroSlides — the rotating hero. Each slide: image, headline, subheadline, button label + href. 3–5 recommended.
- **ექიმების სექციის ჩვენება მთავარ გვერდზე** showDoctorCard — master on/off for the whole "Our doctors" section.
- **მთავარი გვერდის ექიმების სია** featuredDoctors — pick which doctors are eligible for that section (multi-select; type a name, click to add, drag to reorder). Empty = all visible doctors.
- **ექიმები შემთხვევითად აირჩეს** randomizeFeaturedDoctors — on = pick randomly from the list on each visit; off = first ones in your order. **Always shows exactly 3** (the count is fixed in code; the old count field is hidden).
- **სანდოობის ზოლი** trustStrip — rating + doctor/patient counts under the hero.
- **სიმპტომების ნავიგატორი** symptomNavigator — title/subtitle/search placeholder.
- **სტატისტიკა (სრულად რედაქტირებადი)** statsList — the big numbers; first row = featured. Empty falls back to the old fixed five.
- **ხშირად დასმული კითხვები (FAQ)** faqs — Q&A on the home page; also emits FAQ structured data for Google/AI search. Empty = section hidden.

### ჩვენ შესახებ — About (`src/globals/AboutPage.ts`)
`/about` content: title, subtitle, main description (rich text), hero image, **CEO-ს მიმართვა** (name/role/photo/message — blank hides it), **მთავარი მახასიათებლები** highlights, **სტატისტიკა** stats array.

### საკონტაქტო გვერდი — Contact (`src/globals/ContactPage.ts`)
**This is where address/phone/email/hours live** (not SiteSettings). `/contact` + home contact strip.
- address (+ map lat/long), main phone, **დამატებითი ტელეფონები** extra phones, email, **სამუშაო საათები** working hours.

### ჯავშნის გვერდი — Booking (`src/globals/BookingPage.ts`)
`/booking` title + subtitle. The step/form text groups are **hidden** — the interactive wizard is disabled (clinic books by phone).

### სერვისების გვერდი — Services landing (`src/globals/ServicesPage.ts`)
Just the `/services` hero title + subtitle. (The service rows themselves are the Services collection.)

### ექიმების გვერდი — Doctors landing (`src/globals/DoctorsPage.ts`)
Just the `/doctors` hero title + subtitle. (The doctors are the Doctors collection; the home-page subset is on HomePage.)

---

## საიტის ელემენტები — Site-wide elements

### ნავიგაცია — Navigation (`src/globals/Navigation.ts`)
The header menu. **8 fixed routes** — home / about / services / doctors / checkups / health-library / blog / contact. You can't add/remove top-level routes here (they map to real pages). Per route:
- **enabled** show/hide, **label** per-locale override (blank = translation), **order** (lower = left).
- **ჩამოსაშლელი ქვემენიუ** hasDropdown + **ქვებმულები** subLinks — free-form dropdown entries (label + href, any internal/external URL).
- **CTA ღილაკი** — the highlighted right-side button (e.g. "ჯავშანი").
- ⚠️ To add a custom **Page** to the menu, you don't edit Navigation — you toggle **"მენიუში ჩვენება"** on that Page; it auto-appends.

### ფუტერი — Footer (`src/globals/Footer.ts`)
Bottom of every page: **description**, **სწრაფი ბმულები** quick links (label + href), **სოციალური ქსელები** social links (platform + url), **copyright** (blank = auto current year), **WhatsApp ნომერი**.

---

## Media & Users
- **Media** — uploaded images (auto-sized: thumbnail 400×300, card 768×512, hero 1400w). Add alt text for SEO/accessibility.
- **Users** — admin accounts for the CMS.

---

## Hidden on purpose (not bugs)
- **Pages collection** (`src/collections/Pages.ts`) — static legal pages (Privacy/Terms/etc.) at `/pages/<slug>`. Hidden from the nav because editors don't author free-form pages, but existing ones still render (footer legal links). Has a "Show in navigation" toggle and drafts.
- **საიტის პარამეტრები / SiteSettings** (`src/globals/SiteSettings.ts`) — fully hidden. Stats moved to HomePage, contact moved to ContactPage; kept only as a data fallback + for the Doctra sync timestamp.
- Various legacy fields across globals (old hero doctor-card, booking wizard text, old block `layout`) are hidden but kept so the DB schema isn't dropped.

---

## Two recurring gotchas
1. **A relationship/multi-select box that says "Select a value" is empty, not broken.** Click it, type to search, click a result to add it as a chip. Save.
2. **Schema changes don't auto-sync to the live Neon DB** (Payload `push` is a no-op on prod). Adding/changing a CMS field needs an additive SQL migration applied to both local Docker and Neon — see `CLAUDE.md` → "Deploying & CMS schema changes". Code-only/content changes are unaffected.
