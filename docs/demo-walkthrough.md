# Customer Demo Walkthrough

A 10-minute script for showing the Khozrevanidze Clinic site to the
customer. Run through it once on https://clinic-one-blush.vercel.app
before the live demo to make sure everything's smooth.

## Pre-demo checklist (do this 5 minutes before)

- [ ] Open https://clinic-one-blush.vercel.app in a clean browser
      window (private/incognito so you start logged-out)
- [ ] Verify the page loads in <2 seconds
- [ ] Have `/admin` credentials ready: `admin@admin.ge` / `111111`
- [ ] Have this doc open on a second screen for reference

## Part 1 — Public site (5 minutes)

### Stop 1: Homepage (https://clinic-one-blush.vercel.app/ge)

**What to show:**
- Hero: solid blackberry headline + drifting pink wash. Two CTAs: "Book a
  visit" (blackberry pill, lifts on hover) and "Get consultation"
  (outlined pill). Trust strip below shows "4.9" rating typographically.
- Hero carousel (5 clinic photos rotating, fade transitions) on the right
- "What concerns you?" symptom search input (blackberry section)
- Stats: editorial inline row, one feature stat in big type with a pink
  accent rule that draws in on scroll
- Services: 8 featured services in cards with hover-lift (cards rise, icon
  scales + rotates slightly, a pink wash blob fades in from the corner, a
  "Learn more →" arrow slides in from the left). Below the grid, a
  prominent "View all (64)" pill button leads to the full /services page.
- Doctors preview (3 featured doctors with real photos)
- Checkup packages (Basic / Standard / Premium when data exists)
- Reviews carousel (4 reviews, mix of GE/EN/RU sources)
- Contact map

**Talking points:**
- "Everything you see here is editable from the admin panel"
- "The carousel images, hero text, doctor list, services — all CMS-driven"
- Hover over any service card to show the motion details
- Mention: 200+ pages, all server-rendered, indexable by Google
- The whole site honors the visitor's OS "reduce motion" preference

### Stop 2: Language switch

- Click the language switcher (top right, currently shows 🇬🇪)
- Switch to **English** — show the entire page re-renders in English
- Switch to **Russian** — same, fully translated
- Switch back to GE

**Talking point:** "Every visible string switches — doctor names, service
names, specialties, reviews, page titles, even URL slugs (/doctors vs
/eqimebi vs /vrachi)."

### Stop 3: Doctors page

- Click "ექიმები" (Doctors) in nav
- Show the search bar + specialty dropdown
- Type a partial doctor name → see the list filter live
- Click the specialty dropdown → show the search-within-list (50+ specialties)
- Pick "კარდიოლოგია" → list narrows to cardiology doctors only
- Click on any doctor with a real photo → opens their profile

**Talking point:** "146 doctors are synced from your Doctra system.
Photos and biographies are managed by your team."

### Stop 4: Doctor profile

- Show the doctor's photo, name, specialty, biography (in Georgian)
- Show languages spoken (flag icons)
- Click "ჩაწერა" (Book) button → goes to booking flow with pre-selected doctor

### Stop 5: Booking flow (DO NOT submit — kill-switch is on, but still respect it)

- Step 1: Service is pre-selected (e.g., Cardiology)
- Step 2: Doctor pre-selected
- Step 3: Calendar
  - Show the loading state (dimmed grid + spinner overlay) for ~1-2 seconds
  - Available days light up, unavailable greyed out
  - Pick a day → time slots appear
- Step 4: Patient details form
- Step 5: Review and submit

**Talking point:** "The calendar shows real availability from Doctra.
When the patient confirms, this hits Doctra's `booking_without_otac` API
and creates an actual appointment in your system. Today the submit is
disabled in demo mode so we don't create a real booking."

**STOP HERE in the booking flow — don't actually submit unless you've
turned off `BOOKING_SUBMIT_DISABLED`.**

## Part 2 — Admin panel (5 minutes)

### Stop 6: Login

- Open `/admin` in a new tab
- Enter `admin@admin.ge` / `111111`
- Show the polished login page (clinic logo, branded gradient)

### Stop 7: Dashboard

- Show the welcome banner (blackberry gradient with stats)
- Point out the **Doctra Sync card** at top
  - "Last synced: X hours ago"
  - Pink "სინქრონიზაცია ახლა" button
- Point out the **Needs Attention** tiles
  - "🖼 No photo: 99" — doctors that still need photos
  - "✏️ Specialty placeholder: 0" (after the dept-name fallback fix)
  - "🔇 Hidden: 0"
- Show the stats list (left) and quick actions (right)

**Talking point:** "Click any of the 'needs attention' tiles to jump
straight to the doctors that need work. Saves a lot of time."

### Stop 8: Click the Sync from Doctra button

- Click **„სინქრონიზაცია ახლა"**
- Show the spinner + step text ("Fetching departments...", "Fetching doctors...")
- Wait ~5–10 seconds
- Show the green success card: "0 new, 0 updated, 146 skipped"
- Click "დახურვა" to close
- "Last synced" timestamp updates to "now"

**Talking point:** "Every time your team adds a doctor to Doctra, your
admin clicks this button and the new doctor appears on the site
automatically. Photos and biographies they add via Payload are NEVER
overwritten."

### Stop 9: Doctor management

- Navigate to **/admin/collections/doctors**
- Show the 4 chip filters at top
- Click "ფოტო აკლია" — list filters to ~99 doctors
- Click any doctor without a photo
- Show the tabbed edit form:
  - **იდენტობა** tab: name + photo upload
  - **პროფილი** tab: specialty, biography, qualifications
  - **SEO** tab: per-doctor meta tags
- Show "საიტზე ნახვა" button at top (opens public profile)
- Switch the locale dropdown (top-right) — show name in EN, then RU
- Don't actually edit anything — just show the UI

### Stop 10: Reviews curation

- Navigate to **/admin/collections/reviews**
- Show the 4 demo reviews with `published` checkboxes
- Click one off → it disappears from the public homepage (refresh /ge in
  the other tab to demonstrate)
- Click it back on

**Talking point:** "Reviews can be curated. When the Google Reviews
integration is added later, reviews flow in automatically and you choose
which to show."

### Stop 11: Hero carousel

- Navigate to **/admin/globals/home-page**
- Scroll to "გალერეის სლაიდები"
- Show the array structure (image + label per slide)
- Mention: drag-to-reorder, upload up to 8 images

## Closing notes

- Demo time: ~10 minutes
- Site URL: https://clinic-one-blush.vercel.app
- Admin URL: https://clinic-one-blush.vercel.app/admin
- Customer documentation: `docs/admin-guide-ge.md` (Georgian)
- Production deployment: see `docs/cpanel-deploy.md`

## Things to NOT click during demo

- Don't trigger the actual booking submit (kill-switch is on but still
  goes through the API call)
- Don't change the admin password live — do it after demo with the customer
- Don't delete any data — every action is permanent

## If something goes wrong during demo

| Issue | What to say |
|---|---|
| Page slow to load | "Vercel cold start — first request after idle takes ~1-2 seconds. Production hosting will be different." |
| Image not loading | "Cached image issue — Ctrl+F5 fixes it. Won't happen for real users." |
| Doctra sync errors | "Doctra API is sometimes slow. Click again in a minute." |
| Booking calendar shows nothing | "That doctor doesn't have an active schedule in Doctra — pick a different doctor." |
