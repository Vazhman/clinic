#!/usr/bin/env node
/**
 * Seed 3 sample news articles into the News collection so /ge/blog (and
 * the home-page News section) actually have something to display. Uses
 * the doctor placeholder image as featured-image stand-in — admin
 * replaces with real photos later.
 *
 * Idempotent: bails out if any news rows already exist.
 *
 * Usage:
 *   node scripts/seed-news.mjs          # local
 *   node scripts/seed-news.mjs --prod   # against clinic-one-blush.vercel.app
 */

const isProd = process.argv.includes('--prod')
const SITE = isProd ? 'https://clinic-one-blush.vercel.app' : 'http://localhost:3000'
const EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.ge'
const PASSWORD = process.env.ADMIN_PASSWORD || '111111'

const PLACEHOLDER_MEDIA_ID = 1 // doctor-placeholder.jpg — exists in both local + prod

// Each news item: title/excerpt/content all set in `ge` (the wizard mounts
// at locale=ge by default). Admin translates to en/ru later by switching
// the locale picker on the edit form.
const NEWS = [
  {
    slug: 'gulis-jandasaagi-yoveldgiur-tsxovrebis-tsesi',
    title: 'გულის ჯანმრთელობა — ყოველდღიური ცხოვრების წესი',
    excerpt: 'კარდიოვასკულარული დაავადებების პრევენცია იწყება ჯანსაღი დიეტით, რეგულარული ვარჯიშით და ცხოვრების წესის შეცვლით. გავიგოთ რა მარტივი ცვლილებები ეხმარება გულის ხანგრძლივ მუშაობას.',
    bodyText: 'გული ერთ-ერთი ყველაზე მნიშვნელოვანი ორგანოა და მისი მოვლა ყოველდღიური საქმეა. დიეტა, ფიზიკური აქტივობა, საკმარისი ძილი, სტრესის მართვა — ეს ოთხი სვეტი დგას გულის ჯანმრთელობის უკან. ჩვენი კარდიოლოგები გვირჩევენ პერიოდულ შემოწმებას 40 წლის ასაკიდან.',
    category: 'health-tips',
    homepageOrder: 1,
  },
  {
    slug: 'sezonuri-grippi-vaktsinatsia-2026',
    title: 'სეზონური გრიპი — ვაქცინაცია 2026',
    excerpt: 'ხოზრევანიძის კლინიკაში ხელმისაწვდომია სეზონური გრიპის ვაქცინაცია. რეკომენდირებულია მოწყვლადი ჯგუფებისთვის — ხანდაზმულები, ქრონიკული დაავადებების მქონე პირები და ბავშვები.',
    bodyText: 'წლის ეს დრო კვლავ მოვიდა — გრიპის სეზონი დასაწყისშია. რეკომენდირებულია ვაქცინაცია სამიზნე ჯგუფებისთვის. ჩვენი თერაპევტები მოგცემენ ინდივიდუალურ რეკომენდაციას.',
    category: 'announcements',
    homepageOrder: 2,
  },
  {
    slug: 'akhali-laboratoriul-tsenttri-gakhsna',
    title: 'ახალი ლაბორატორიული ცენტრის გახსნა',
    excerpt: 'ხოზრევანიძის კლინიკის ახალი ლაბორატორიული ცენტრი იხსნება ბათუმში. თანამედროვე აღჭურვილობა, სწრაფი შედეგები და ფართო სპექტრის ანალიზები — ერთ ადგილზე.',
    bodyText: 'სიამოვნებით ვაცხადებთ ჩვენი ახალი ლაბორატორიული ცენტრის გახსნას. გამოყენებულია უახლესი თაობის ანალიზის აპარატურა. შედეგები მზადდება 24 საათში მცირე ანალიზებზე, რთულ კვლევებზე — 3 დღემდე.',
    category: 'clinic-news',
    homepageOrder: 3,
  },
]

async function login() {
  const res = await fetch(`${SITE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Login: HTTP ${res.status}`)
  return (await res.json()).token
}

async function existingCount(token) {
  const res = await fetch(`${SITE}/api/news?limit=1`, {
    headers: { Authorization: `JWT ${token}` },
  })
  if (!res.ok) return -1
  const data = await res.json()
  return data.totalDocs ?? 0
}

/**
 * Build a minimum-valid Lexical richText document containing a single
 * paragraph with the provided plain text. This is the JSON shape Payload
 * stores when admin types a paragraph in the editor.
 */
function lexicalParagraph(text) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
          ],
        },
      ],
    },
  }
}

const token = await login()
console.log(`▶ Logged in as ${EMAIL} on ${SITE}`)

const existing = await existingCount(token)
if (existing > 0) {
  console.log(`⏭  news already has ${existing} row(s) — skipping`)
  process.exit(0)
}

console.log(`▶ Creating ${NEWS.length} news articles…`)
for (const n of NEWS) {
  const payload = {
    title: n.title,
    slug: n.slug,
    excerpt: n.excerpt,
    featuredImage: PLACEHOLDER_MEDIA_ID,
    category: n.category,
    body: lexicalParagraph(n.bodyText),
    author: 'ხოზრევანიძის კლინიკა',
    publishedDate: new Date().toISOString(),
    status: 'published',
    showOnHomepage: true,
    homepageOrder: n.homepageOrder,
  }

  try {
    const res = await fetch(`${SITE}/api/news?locale=ge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`  ✗ ${n.title}: HTTP ${res.status} — ${text.slice(0, 200)}`)
      continue
    }
    process.stdout.write('·')
  } catch (err) {
    console.error(`  ✗ ${n.title}: ${err.message}`)
  }
}

console.log(`\n\nFinal count: news = ${await existingCount(token)}`)
console.log(`\nVisit /ge/blog to see them.`)
