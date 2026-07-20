import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import config from '@payload-config'
import type { Service, Doctor, CheckupPackage, Review, SeoOverrides } from '@/types'

// Shape returned by Payload for the seo group. ogImage may be the populated
// Media object (depth >= 1) or just the ID (depth: 0). We normalize to a URL
// string so callers don't have to discriminate.
type RawSeo = {
  metaTitle?: string | null
  metaDescription?: string | null
  ogImage?: { url?: string | null } | string | null
  noIndex?: boolean | null
} | null | undefined

function normalizeSeo(raw: RawSeo): SeoOverrides | undefined {
  if (!raw) return undefined
  const metaTitle = typeof raw.metaTitle === 'string' && raw.metaTitle.length > 0 ? raw.metaTitle : undefined
  const metaDescription = typeof raw.metaDescription === 'string' && raw.metaDescription.length > 0 ? raw.metaDescription : undefined
  const ogImage =
    typeof raw.ogImage === 'object' && raw.ogImage !== null && typeof raw.ogImage.url === 'string'
      ? raw.ogImage.url
      : typeof raw.ogImage === 'string' && raw.ogImage.length > 0
        ? raw.ogImage
        : undefined
  const noIndex = raw.noIndex === true ? true : undefined
  if (!metaTitle && !metaDescription && !ogImage && !noIndex) return undefined
  return { metaTitle, metaDescription, ogImage, noIndex }
}
import {
  services as legacyServices,
  doctors as legacyDoctors,
  stats as legacyStats,
  getLocalizedServices,
  getLocalizedDoctors,
  getLocalizedCheckupPackages,
  getLocalizedReviews,
} from '@/lib/data'
import type { BookingService, BookingOperator } from '@/lib/booking-data'
import { getTimeSlots } from '@/lib/doctra-api'

type Locale = 'ge' | 'en' | 'ru'

// Walk Payload's Lexical rich-text structure and return the plain text
// inside (depth-first concatenation of every `text` node). Used wherever a
// richText field also needs a plain-text projection (SEO/meta description,
// JSON-LD, or legacy string fallback for rows saved before a field was
// upgraded from textarea to richText — Payload/SQLite will happily store
// a bare string in a richText column, so `typeof rt === 'string'` guards
// against that transitional shape instead of crashing on it).
function extractLexicalText(rt: unknown): string {
  if (typeof rt === 'string') return rt
  if (!rt || typeof rt !== 'object') return ''
  const out: string[] = []
  const walk = (n: unknown): void => {
    if (!n || typeof n !== 'object') return
    const node = n as { text?: unknown; children?: unknown }
    if (typeof node.text === 'string') out.push(node.text)
    if (Array.isArray(node.children)) for (const c of node.children) walk(c)
  }
  const root = (rt as { root?: unknown }).root
  walk(root ?? rt)
  return out.join(' ').replace(/\s+/g, ' ').trim()
}

async function getPayloadClient() {
  return getPayload({ config })
}

// ---------------------------------------------------------------------------
// Data cache wrapper
//
// Every CMS-content getter below is a private `_get*` impl, re-exported at the
// bottom of this file wrapped in `cached(...)`. Results are served from Next's
// data cache (Vercel Data Cache on serverless; in-memory on the cPanel Node
// host) across requests — so a page render no longer re-queries Payload/Neon
// for content that hasn't changed. The cache is busted the instant an editor
// saves: Payload `afterChange`/`afterDelete` hooks (injected in
// payload.config.ts) call `revalidateTag(slug)`, and each getter is tagged with
// the slug(s) it reads. `revalidate: 3600` is only a safety net in case an
// on-demand bust is ever missed.
//
// `unstable_cache` keys each entry on the wrapped fn's runtime arguments, so
// per-locale / per-slug calls get distinct cache entries automatically.
//
// NEVER wrap a getter that reads live/external data (the Doctra booking sweeps)
// — those must stay request-fresh and are left uncached.
// ---------------------------------------------------------------------------
function cached<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  key: string,
  tags: string[],
): (...args: A) => Promise<R> {
  return unstable_cache(fn, [key], { tags, revalidate: 3600 })
}

async function _getServices(locale: Locale): Promise<Service[]> {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'services',
      locale,
      limit: 100,
      depth: 1,
      // `slug` (not `name`) as the tiebreak — `name` is localized and often
      // untranslated for en/ru, which would make those locales sort by
      // arbitrary row order and disagree with the ge page (same bug found
      // and fixed for doctors).
      sort: ['displayOrder', 'slug'] as never,
    })

    const legacyImageMap = new Map(legacyServices.map((s) => [s.slug, s.image]))

    // The one `featured` service (if any) always leads — that's what renders
    // as the large purple card on /services. Pinned services float next
    // (ordered by pinnedOrder); everything else keeps the displayOrder/slug
    // sort from the query above. JS sort is stable, so unpinned rows stay in
    // that relative order.
    type PinFields = { pinned?: boolean | null; pinnedOrder?: number | null; featured?: boolean | null }
    const sortedDocs = [...result.docs].sort((a, b) => {
      const af = (a as PinFields).featured ? 1 : 0
      const bf = (b as PinFields).featured ? 1 : 0
      if (af !== bf) return bf - af
      const ap = (a as PinFields).pinned ? 1 : 0
      const bp = (b as PinFields).pinned ? 1 : 0
      if (ap !== bp) return bp - ap
      if (ap && bp) return ((a as PinFields).pinnedOrder ?? 0) - ((b as PinFields).pinnedOrder ?? 0)
      return 0
    })

    return sortedDocs.map((doc) => ({
      id: String(doc.id),
      slug: doc.slug,
      name: doc.name,
      // `description` field was upgraded textarea -> richText for full
      // editor-toolbar parity (Item 4). Keep a plain-text projection under
      // `description` for SEO/JSON-LD consumers (generateServiceSchema,
      // meta descriptions) and pass the raw serialized Lexical state through
      // as `descriptionRichText` for the actual page body render.
      // `extractLexicalText` also tolerates legacy rows still holding the
      // old plain string (pre-migration data).
      description: extractLexicalText(doc.description),
      descriptionRichText: doc.description ?? null,
      shortDescription: doc.shortDescription,
      icon: doc.icon,
      image: (typeof doc.image === 'object' && doc.image !== null ? doc.image.url : null) || legacyImageMap.get(doc.slug) || '',
      seo: normalizeSeo((doc as { seo?: RawSeo }).seo),
    }))
  } catch {
    // DB unavailable — use locale-aware seed data
    return getLocalizedServices(locale)
  }
}

async function _getDoctors(
  locale: Locale,
  limit?: number,
  opts: { includeHidden?: boolean; ids?: (string | number)[] } = {},
): Promise<Doctor[]> {
  try {
    const payload = await getPayloadClient()
    // `inactive` hides a doctor from the ENTIRE public site (list, related strip,
    // profile, AND booking). `showOnDoctorsPage:false` is the lighter switch:
    // hide ONLY from the /doctors list, while the profile stays reachable by
    // direct link and booking is unaffected (booking has its own filter). The
    // profile-page slug lookup passes `includeHidden:true` so a hidden-but-
    // bookable doctor's page resolves instead of 404ing. The home "our doctors"
    // section does NOT use this filter — it's driven by HomePage.featuredDoctors
    // (an explicit per-doctor selection), fetched here via `opts.ids`.
    // (`not_equals` keeps rows where the field is false/unset.)
    const where: Record<string, unknown> = { inactive: { not_equals: true } }
    if (!opts.includeHidden) where.showOnDoctorsPage = { not_equals: false }
    // Restrict to specific doctor IDs — the home page uses this to fetch ONLY
    // the few featured doctors instead of all ~147 (big perf win on every page
    // load, since the home grid only shows 3).
    if (opts.ids && opts.ids.length > 0) where.id = { in: opts.ids }
    const result = await payload.find({
      collection: 'doctors',
      locale,
      where: where as never,
      // Default raised from 100 → 500 because production has many doctors.
      // With the previous default of 100, doctors fell outside the result on
      // default sort order, making their public profile pages 404.
      limit: limit ?? (opts.ids?.length ?? 500),
      depth: 1,
      // Admin-controlled manual ordering (drag-and-drop in the CMS). All
      // doctors default to displayOrder:0, so `slug` is the secondary sort
      // key — a stable starting point until an admin reorders. `slug` (not
      // `name`) because `name` is localized and often untranslated for
      // en/ru, which made those locales sort by arbitrary row order and
      // disagree with the ge page.
      sort: ['displayOrder', 'slug'] as never,
    })

    const legacyMap = new Map(legacyDoctors.map((d) => [d.slug, d]))

    return result.docs.map((doc) => {
      const legacy = legacyMap.get(doc.slug)
      const bio = extractLexicalText(doc.biography)
      // Drop rows with no value in the current locale — Payload returns the
      // array shape but individual string fields can be undefined, which
      // breaks any consumer that calls string methods on them.
      const quals = (doc.qualifications ?? [])
        .map((q: { qualification?: string | null }) => q?.qualification)
        .filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)
      const specs = (doc.specializations ?? [])
        .map((s: { specialization?: string | null }) => s?.specialization)
        .filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)
      const langs = (doc.languagesSpoken ?? [])
        .map((l: { language?: string | null }) => l?.language)
        .filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)
      const exp = doc.experienceYears ?? 0

      // Legacy fallback for `photo` only — that string is a public asset
      // URL and works in any locale. Text fields (biography, qualifications,
      // specializations, languagesSpoken, isDepartmentHead) used to fall
      // back to `src/lib/data.ts` for legacy seed doctors, but that file is
      // Georgian-only — the fallback leaked Georgian onto /en and /ru. Now
      // text fields show whatever Payload has in the requested locale (or
      // nothing if the admin hasn't filled it).
      return {
        id: String(doc.id),
        slug: doc.slug,
        name: doc.name,
        specialty: doc.specialty,
        // A doctor whose only image is the shared `doctor-placeholder` stock
        // photo (a generic face that mismatches most names) is treated as
        // photoless — components then render their clean person-icon fallback
        // instead of a misleading stock portrait. Real headshots are untouched.
        photo: (() => {
          const u = (typeof doc.photo === 'object' && doc.photo !== null ? doc.photo.url : null) || legacy?.photo || ''
          return u && /doctor-placeholder/i.test(u) ? '' : u
        })(),
        biography: bio,
        // Raw richText passed through alongside the flattened `bio` string —
        // DoctorProfileClient renders this via LexicalContent for full
        // formatting; `bio` above stays as the plain-text projection other
        // consumers (metaDescription slicing, search) already rely on.
        biographyRichText: doc.biography ?? null,
        qualifications: quals,
        specializations: specs,
        experienceYears: exp,
        languagesSpoken: langs,
        isDepartmentHead: doc.isDepartmentHead ?? false,
        lastUpdated: (doc as { lastUpdated?: string | null }).lastUpdated ?? null,
        // Payload's built-in updatedAt — used as fallback for the
        // "Last updated" line on the profile when admin hasn't filled
        // in the manual `lastUpdated` date.
        updatedAt: (doc as { updatedAt?: string | null }).updatedAt ?? null,
        // Pass through Doctra link fields so DoctorProfileClient can decide
        // whether to render the booking widget (isBookable check). Without
        // these the page silently hid the booking CTA + widget on every
        // doctor profile even though all 146 local doctors are bookable.
        doctraId: (doc as { doctraId?: string | null }).doctraId ?? null,
        doctraBranchId: (doc as { doctraBranchId?: string | null }).doctraBranchId ?? null,
        // Admin-controlled booking switch — defaults to true. Older rows
        // without the field default to true via the `?? true` so the CTA
        // appears for all existing doctors until admin curates.
        bookingEnabled: (doc as { bookingEnabled?: boolean | null }).bookingEnabled ?? true,
        // Defaults to true (visible) for older rows without the field, so no
        // doctor is accidentally hidden from the list after this rolls out.
        showOnDoctorsPage: (doc as { showOnDoctorsPage?: boolean | null }).showOnDoctorsPage ?? true,
        seo: normalizeSeo((doc as { seo?: RawSeo }).seo),
      }
    })
  } catch {
    // DB unavailable — use locale-aware seed data
    return getLocalizedDoctors(locale, limit)
  }
}

async function _getCheckupPackages(locale: Locale): Promise<CheckupPackage[]> {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'checkup-packages',
      locale,
      limit: 100,
      // depth: 1 populates the `service` relationship on each
      // includedServices row so we can read the service's localized name.
      depth: 1,
    })

    return result.docs.map((doc) => ({
      id: String(doc.id),
      name: doc.name,
      description: doc.description,
      price: doc.price,
      currency: doc.currency,
      // `service` is now a populated Service relationship — extract its
      // localized name. (Old shape was a plain text field; the cast tolerates
      // legacy rows that still have a string until they're re-saved.)
      includedServices: (doc.includedServices ?? [])
        .map((s: { service?: { name?: string } | string | null }) => {
          if (typeof s?.service === 'object' && s.service !== null && typeof s.service.name === 'string') {
            return s.service.name
          }
          if (typeof s?.service === 'string') return s.service
          return ''
        })
        .filter((name: string) => name.length > 0),
      isFeatured: doc.isFeatured ?? false,
      phone: doc.phone ?? null,
      audience: (doc.audience as 'woman' | 'man' | 'child' | null) ?? null,
      tier: (doc.tier as string | null) ?? null,
      includedTests: (doc.includedTests ?? [])
        .map((r: { test?: string | null }) => r?.test)
        .filter((t: unknown): t is string => typeof t === 'string' && t.length > 0),
    }))
  } catch {
    // DB unavailable — use locale-aware seed data
    return getLocalizedCheckupPackages(locale)
  }
}

async function _getReviews(locale: Locale): Promise<Review[]> {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'reviews',
      where: { published: { equals: true } } as never,
      locale,
      limit: 100,
      depth: 0,
      sort: '-date',
    })

    return result.docs.map((doc) => ({
      id: String(doc.id),
      author: doc.author,
      rating: doc.rating,
      text: doc.text,
      date: doc.date,
      source: doc.source as 'google' | 'internal',
    }))
  } catch {
    // DB unavailable — use locale-aware seed data
    return getLocalizedReviews(locale)
  }
}

async function _getStats() {
  try {
    const payload = await getPayloadClient()
    // Stats moved out of SiteSettings into HomePage (Path B cleanup). Read
    // HomePage first; if it isn't filled yet (early in migration), fall back
    // to the legacy SiteSettings location so the public site never shows
    // zeros. Once admin has saved HomePage.stats, the fallback never fires.
    type StatGroup = { patients?: number | null; satisfiedPatients?: number | null; doctors?: number | null; operations?: number | null; experience?: number | null }
    const [home, settings] = await Promise.all([
      payload.findGlobal({ slug: 'home-page', depth: 0 }) as Promise<{ stats?: StatGroup }>,
      payload.findGlobal({ slug: 'site-settings', depth: 0 }) as Promise<{ stats?: StatGroup }>,
    ])
    const pick = (key: 'patients' | 'satisfiedPatients' | 'doctors' | 'operations' | 'experience', fallback: number) =>
      home.stats?.[key] ?? settings.stats?.[key] ?? fallback
    return {
      patients: pick('patients', 15000),
      satisfiedPatients: pick('satisfiedPatients', 14000),
      doctors: pick('doctors', 54),
      operations: pick('operations', 5000),
      experience: pick('experience', 9),
    }
  } catch {
    // DB unavailable — use seed data
    return legacyStats
  }
}

/**
 * Homepage hero carousel slides, sourced from the `HomePage` global.
 * Returns `null` if the global hasn't been initialized OR has no slides —
 * the component then falls back to the static `/images/gallery/...` list
 * so the page never renders an empty carousel.
 */
/** A resolved hero-carousel slide. Each slide is a self-contained unit —
 *  image + headline + subheadline + an optional CTA button — that cross-fades
 *  together on the homepage hero. All fields are admin-editable per slide. */
export type HeroSlide = {
  image: string
  headline?: string | null
  subheadline?: string | null
  buttonLabel?: string | null
  buttonHref?: string | null
}

// Shape of a raw heroSlides row after findGlobal(depth: 2). Relationships are
// populated to their docs; uploads to media objects with a `url`.
type MediaLike = { url?: string | null } | string | null | undefined
type RelatedDoc = {
  slug?: string | null
  title?: string | null
  name?: string | null
  featuredImage?: MediaLike
  photo?: MediaLike
  image?: MediaLike
} | string | number | null | undefined

const mediaUrl = (m: MediaLike): string => (typeof m === 'object' && m !== null ? m.url ?? '' : '')

async function _getHeroSlides(locale: Locale): Promise<HeroSlide[] | null> {
  try {
    const payload = await getPayloadClient()
    const global = (await payload.findGlobal({ slug: 'home-page', locale, depth: 2 })) as {
      heroSlides?: Array<{
        image?: MediaLike
        headline?: string | null
        subheadline?: string | null
        buttonLabel?: string | null
        buttonHref?: string | null
        // legacy (hidden in admin, kept for back-compat with old rows)
        type?: 'image' | 'news' | 'doctor' | 'service' | null
        newsItem?: RelatedDoc
        doctor?: RelatedDoc
        service?: RelatedDoc
        label?: string | null
      }>
    }
    const raw = global?.heroSlides ?? []
    const slides = raw
      .map((s): HeroSlide | null => {
        // Image: manual upload first. Fall back to a legacy relationship's
        // image so old slides keep rendering after the schema change.
        let url = mediaUrl(s?.image)
        if (!url && s?.type && s.type !== 'image') {
          const rel = s.type === 'news' ? s.newsItem : s.type === 'doctor' ? s.doctor : s.service
          if (typeof rel === 'object' && rel !== null) {
            url =
              s.type === 'news' ? mediaUrl(rel.featuredImage)
              : s.type === 'doctor' ? mediaUrl(rel.photo)
              : mediaUrl(rel.image)
          }
        }
        // Drop only rows that are COMPLETELY empty. A slide with text but no
        // image must still render (an admin who forgets the photo shouldn't
        // lose the slide) — HeroSection substitutes a clinic photo for ''.
        const hasText =
          s?.headline?.trim() || s?.label?.trim() || s?.subheadline?.trim() || s?.buttonLabel?.trim()
        if (!url && !hasText) return null

        return {
          image: url,
          headline: s?.headline?.trim() || s?.label?.trim() || null,
          subheadline: s?.subheadline?.trim() || null,
          buttonLabel: s?.buttonLabel?.trim() || null,
          buttonHref: s?.buttonHref?.trim() || null,
        }
      })
      .filter((s): s is HeroSlide => s !== null)
    return slides.length > 0 ? slides : null
  } catch {
    return null
  }
}

// Shape of News.categoryRef after find(depth: 1) — populated to its doc, or
// left as a raw id if the relationship is empty/unpopulated.
type NewsCategoryLike = { name?: string | null } | string | number | null | undefined

const newsCategoryLabel = (c: NewsCategoryLike): string => (typeof c === 'object' && c !== null ? c.name ?? '' : '')

// Real scheduled-publishing gate: an article marked `status: published` still
// must not be visible until its `publishedDate` has actually arrived. Before
// this, `publishedDate` was display/sort-only — nothing filtered on it, so a
// future-dated "published" article would appear immediately. Reused by all
// three News read paths below so the gate can't be bypassed via any one of
// them.
const publishedNewsWhere = () => ({
  status: { equals: 'published' as const },
  publishedDate: { less_than_equal: new Date().toISOString() },
})

// Recursively collects every string leaf out of an arbitrary JSON-ish value
// (Lexical's SerializedEditorState, or the Puck builder's component-prop
// tree). Used only to estimate reading time — not rendered — so it's fine
// that it also sweeps up incidental non-prose strings (ids, urls): those are
// a small fraction of total word count and don't meaningfully skew a rough
// "N წუთი" estimate the same way Medium/most CMSs compute one.
function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    out.push(value)
  } else if (Array.isArray(value)) {
    for (const v of value) collectStrings(v, out)
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) collectStrings(v, out)
  }
}

const WORDS_PER_MINUTE = 200

function estimateReadingTimeMinutes(content: unknown): number {
  const strings: string[] = []
  collectStrings(content, strings)
  const words = strings.join(' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

function newsGalleryUrls(gallery: unknown): { url: string; alt: string }[] {
  if (!Array.isArray(gallery)) return []
  return gallery
    .filter((g): g is { url?: string; alt?: string } => typeof g === 'object' && g !== null)
    .map((g) => ({ url: g.url ?? '', alt: g.alt ?? '' }))
    .filter((g) => g.url)
}

async function _getHomepageNews(locale: Locale) {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'news',
      locale,
      depth: 1,
      where: {
        showOnHomepage: { equals: true },
        ...publishedNewsWhere(),
      },
      sort: 'homepageOrder',
      limit: 6,
    })

    return result.docs.map((doc) => ({
      id: String(doc.id),
      slug: doc.slug,
      title: doc.title,
      excerpt: doc.excerpt,
      category: newsCategoryLabel(doc.categoryRef),
      publishedDate: doc.publishedDate,
      featuredImage: typeof doc.featuredImage === 'object' && doc.featuredImage !== null
        ? { url: doc.featuredImage.url ?? '', alt: doc.featuredImage.alt ?? '' }
        : { url: '', alt: '' },
    }))
  } catch {
    // DB unavailable — no news to show
    return []
  }
}

async function _getNewsCategories(locale: Locale) {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'news-categories',
      locale,
      depth: 0,
      where: { hidden: { not_equals: true } },
      sort: 'sortOrder',
      limit: 100,
    })
    return result.docs.map((doc) => ({ slug: doc.slug, name: doc.name }))
  } catch {
    return []
  }
}

async function _getAllNews(locale: Locale, page = 1, limit = 60, categorySlug?: string) {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'news',
      locale,
      depth: 1,
      where: {
        ...publishedNewsWhere(),
        ...(categorySlug ? { 'categoryRef.slug': { equals: categorySlug } } : {}),
      },
      // Pinned articles first, then newest. `-pinned` puts `true` ahead of
      // `false`; ties broken by publish date descending. (`as never` mirrors
      // the multi-field sort elsewhere — new field not yet in generated types.)
      sort: ['-pinned', '-publishedDate'] as never,
      page,
      limit,
    })

    return {
      docs: result.docs.map((doc) => ({
        id: String(doc.id),
        slug: doc.slug,
        title: doc.title,
        excerpt: doc.excerpt,
        category: newsCategoryLabel(doc.categoryRef),
        publishedDate: doc.publishedDate,
        featured: Boolean((doc as unknown as { featured?: boolean }).featured),
        tags: Array.isArray((doc as unknown as { tags?: unknown }).tags)
          ? ((doc as unknown as { tags: string[] }).tags)
          : [],
        readingTimeMinutes: estimateReadingTimeMinutes(doc.puckData ?? doc.body),
        featuredImage: typeof doc.featuredImage === 'object' && doc.featuredImage !== null
          ? { url: doc.featuredImage.url ?? '', alt: doc.featuredImage.alt ?? '' }
          : { url: '', alt: '' },
      })),
      totalPages: result.totalPages,
      page: result.page,
    }
  } catch (err) {
    console.error('[DEBUG _getAllNews]', err)
    return { docs: [], totalPages: 0, page: 1 }
  }
}

async function _getNewsBySlug(slug: string, locale: Locale) {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'news',
      locale,
      depth: 2,
      where: {
        slug: { equals: slug },
        ...publishedNewsWhere(),
      },
      limit: 1,
    })

    const doc = result.docs[0]
    if (!doc) return null
    // Surface puckData with an explicit type so callers can discriminate
    // between a Puck layout and the fallback Lexical body without casting.
    const puckData: Record<string, unknown> | null = (doc.puckData as Record<string, unknown> | null) ?? null
    const docWithFields = doc as unknown as { featured?: boolean; tags?: string[]; gallery?: unknown }
    return Object.assign(doc, {
      puckData,
      featured: Boolean(docWithFields.featured),
      tags: Array.isArray(docWithFields.tags) ? docWithFields.tags : [],
      gallery: newsGalleryUrls(docWithFields.gallery),
      readingTimeMinutes: estimateReadingTimeMinutes(puckData ?? doc.body),
    })
  } catch {
    // DB unavailable
    return null
  }
}

/** Fetch a Payload doctor by Doctra doctor ID. Returns null if no match. */
async function _getDoctorByDoctraId(doctraId: string): Promise<Doctor | null> {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'doctors',
      where: { doctraId: { equals: doctraId } } as never,
      limit: 1,
      depth: 1,
    })

    const doc = result.docs[0]
    if (!doc) return null

    const bio = typeof doc.biography === 'string' ? doc.biography : ''
    const quals = (doc.qualifications ?? [])
      .map((q: { qualification?: string | null }) => q?.qualification)
      .filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)
    const specs = (doc.specializations ?? [])
      .map((s: { specialization?: string | null }) => s?.specialization)
      .filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)
    const langs = (doc.languagesSpoken ?? [])
      .map((l: { language?: string | null }) => l?.language)
      .filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)

    return {
      id: String(doc.id),
      slug: doc.slug,
      name: doc.name,
      specialty: doc.specialty,
      photo: (typeof doc.photo === 'object' && doc.photo !== null ? doc.photo.url : null) || '',
      biography: bio,
      qualifications: quals,
      specializations: specs,
      experienceYears: doc.experienceYears ?? 0,
      languagesSpoken: langs,
      isDepartmentHead: doc.isDepartmentHead ?? false,
      lastUpdated: (doc as { lastUpdated?: string | null }).lastUpdated ?? null,
      updatedAt: (doc as { updatedAt?: string | null }).updatedAt ?? null,
      // Pass through Doctra link fields — mirrors the fix in getDoctors().
      // Without these, any caller that hands the result to DoctorProfileClient
      // would silently render in non-bookable mode regardless of DB state.
      doctraId: (doc as { doctraId?: string | null }).doctraId ?? null,
      doctraBranchId: (doc as { doctraBranchId?: string | null }).doctraBranchId ?? null,
      bookingEnabled: (doc as { bookingEnabled?: boolean | null }).bookingEnabled ?? true,
      seo: normalizeSeo((doc as { seo?: RawSeo }).seo),
    }
  } catch {
    return null
  }
}

/** Fetch a Payload service by Doctra branch ID. Returns null if no match. */
async function _getServiceByDoctraBranchId(doctraBranchId: string): Promise<Service | null> {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'services',
      where: { doctraBranchId: { equals: doctraBranchId } } as never,
      limit: 1,
      depth: 1,
    })

    const doc = result.docs[0]
    if (!doc) return null

    const legacyImageMap = new Map(legacyServices.map((s) => [s.slug, s.image]))

    return {
      id: String(doc.id),
      slug: doc.slug,
      name: doc.name,
      description: extractLexicalText(doc.description),
      descriptionRichText: doc.description ?? null,
      shortDescription: doc.shortDescription,
      icon: doc.icon,
      image: (typeof doc.image === 'object' && doc.image !== null ? doc.image.url : null) || legacyImageMap.get(doc.slug) || '',
      seo: normalizeSeo((doc as { seo?: RawSeo }).seo),
    }
  } catch {
    return null
  }
}

/**
 * Booking service catalogue, sourced from Payload.
 *
 * Replaces the old Doctra-fanout-then-overlay model. Admin imports doctors
 * and services from Doctra into Payload (via /api/import-doctra) and edits
 * the editorial fields there. This function returns only services that have
 * a Doctra link (`doctraBranchId`) — those are the ones a patient can
 * actually book. Postgres query, ~50ms.
 */
export async function getBookingServicesFromPayload(): Promise<BookingService[]> {
  try {
    const payload = await getPayloadClient()
    type ServiceDoc = {
      id: string | number
      doctraBranchId?: string | null
      category?: string | null
      name: { ge?: string; en?: string; ru?: string } | string
    }
    const result = await payload.find({
      collection: 'services',
      where: { doctraBranchId: { exists: true } } as never,
      locale: 'all' as never,
      limit: 200,
      depth: 0,
    })
    const docs = result.docs as unknown as ServiceDoc[]
    return docs
      .filter((d) => typeof d.doctraBranchId === 'string' && d.doctraBranchId.length > 0)
      .map((d) => {
        const name = typeof d.name === 'object' && d.name !== null
          ? d.name
          : { ge: String(d.name ?? ''), en: String(d.name ?? ''), ru: String(d.name ?? '') }
        return {
          id: d.doctraBranchId as string,
          name: {
            ge: name.ge || name.en || name.ru || '',
            en: name.en || name.ge || name.ru || '',
            ru: name.ru || name.en || name.ge || '',
          },
          category: ((d.category as BookingService['category']) || 'other') as BookingService['category'],
        }
      })
  } catch (err) {
    console.error('getBookingServicesFromPayload failed:', err)
    return []
  }
}

// ---------------------------------------------------------------------------
// Lab Tests
//
// Content library — read-only fetch. Returns published rows in current
// locale; admin-side filtering (drafts, etc.) handled by Payload's own
// `versions: { drafts: true }`. Returns the raw Lexical body objects so the
// detail page can hand them to <LexicalContent />.
// ---------------------------------------------------------------------------

export type LabTestCategory =
  | 'hematology'
  | 'biochemistry'
  | 'hormones'
  | 'infections'
  | 'immunology'
  | 'genetics'
  | 'prenatal'
  | 'urinalysis'
  | 'cardiology'
  | 'oncology'
  | 'other'

export type LabTestListItem = {
  id: string
  slug: string
  title: string
  summary: string
  category: LabTestCategory
  active: boolean
  price: number | null
  currency: string | null
}

export type LabTestDetail = LabTestListItem & {
  aliases: string[]
  overview: unknown
  whyDone: unknown
  preparation: unknown
  whatToExpect: unknown
  interpretation: unknown
  relatedTests: LabTestListItem[]
  relatedServiceSlugs: string[]
  relatedDoctorSlugs: string[]
  reviewedBy: { name: string; slug: string } | null
  lastReviewed: string | null
  pdfUrl: string | null
  seo?: SeoOverrides
}

type LabTestDoc = {
  id: string | number
  slug?: string | null
  title?: string | null
  summary?: string | null
  category?: string | null
  aliases?: Array<{ alias?: string | null }> | null
  overview?: unknown
  whyDone?: unknown
  preparation?: unknown
  whatToExpect?: unknown
  interpretation?: unknown
  relatedTests?: Array<LabTestDoc | string | number> | null
  relatedServices?: Array<{ slug?: string | null } | string | number> | null
  relatedDoctors?: Array<{ slug?: string | null } | string | number> | null
  reviewedBy?: { name?: string | null; slug?: string | null } | string | number | null
  lastReviewed?: string | null
  published?: boolean | null
  active?: boolean | null
  price?: number | null
  currency?: string | null
  pdfAttachment?: { url?: string | null } | string | number | null
  seo?: RawSeo
}

function toListItem(doc: LabTestDoc): LabTestListItem | null {
  if (!doc.slug || !doc.title) return null
  return {
    id: String(doc.id),
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary ?? '',
    category: (doc.category as LabTestCategory) ?? 'other',
    // Defaults to true for older docs saved before this field existed.
    active: doc.active !== false,
    price: typeof doc.price === 'number' ? doc.price : null,
    currency: doc.currency ?? null,
  }
}

async function _getLabTests(locale: Locale): Promise<LabTestListItem[]> {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'lab-tests',
      locale,
      depth: 0,
      where: { published: { equals: true } } as never,
      limit: 500,
      sort: 'title' as never,
    })
    return (result.docs as unknown as LabTestDoc[])
      .map(toListItem)
      .filter((r): r is LabTestListItem => r !== null)
  } catch {
    return []
  }
}

/**
 * Lab tests that reference a service by slug — powers the "Lab tests
 * commonly used in this specialty" widget on /services/[slug].
 *
 * Fetches all published tests with depth: 1 (relatedServices populated as
 * objects with slug) and filters in JS. The catalog is small (<50 rows in
 * realistic clinic scenarios), so this is cheaper than resolving the
 * service ID first and querying by `where.relatedServices.in`.
 */
async function _getLabTestsForService(serviceSlug: string, locale: Locale): Promise<LabTestListItem[]> {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'lab-tests',
      locale,
      depth: 1,
      where: { published: { equals: true } } as never,
      limit: 500,
      sort: 'title' as never,
    })
    return (result.docs as unknown as LabTestDoc[])
      .filter((doc) =>
        (doc.relatedServices ?? []).some(
          (r) => typeof r === 'object' && r !== null && r.slug === serviceSlug,
        ),
      )
      .map(toListItem)
      .filter((r): r is LabTestListItem => r !== null)
  } catch {
    return []
  }
}

async function _getLabTestBySlug(slug: string, locale: Locale): Promise<LabTestDetail | null> {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'lab-tests',
      locale,
      // depth: 2 populates relatedTests one level deep so we can render the
      // related-tests block without a second round-trip per row.
      depth: 2,
      where: {
        slug: { equals: slug },
        published: { equals: true },
      } as never,
      limit: 1,
    })
    const doc = result.docs[0] as unknown as LabTestDoc | undefined
    if (!doc) return null
    const base = toListItem(doc)
    if (!base) return null

    const aliases = (doc.aliases ?? [])
      .map((a) => (typeof a?.alias === 'string' ? a.alias.trim() : ''))
      .filter((a) => a.length > 0)

    const relatedTests = (doc.relatedTests ?? [])
      .map((r): LabTestListItem | null => (typeof r === 'object' && r !== null ? toListItem(r as LabTestDoc) : null))
      .filter((r): r is LabTestListItem => r !== null)

    const relatedServiceSlugs = (doc.relatedServices ?? [])
      .map((r) => (typeof r === 'object' && r !== null && typeof r.slug === 'string' ? r.slug : null))
      .filter((s): s is string => typeof s === 'string')

    const relatedDoctorSlugs = (doc.relatedDoctors ?? [])
      .map((r) => (typeof r === 'object' && r !== null && typeof r.slug === 'string' ? r.slug : null))
      .filter((s): s is string => typeof s === 'string')

    const reviewedByRaw = doc.reviewedBy
    const reviewedBy =
      typeof reviewedByRaw === 'object' && reviewedByRaw !== null && typeof reviewedByRaw.name === 'string' && typeof reviewedByRaw.slug === 'string'
        ? { name: reviewedByRaw.name, slug: reviewedByRaw.slug }
        : null

    const pdfUrl =
      typeof doc.pdfAttachment === 'object' && doc.pdfAttachment !== null && typeof doc.pdfAttachment.url === 'string'
        ? doc.pdfAttachment.url
        : null

    return {
      ...base,
      aliases,
      overview: doc.overview,
      whyDone: doc.whyDone,
      preparation: doc.preparation,
      whatToExpect: doc.whatToExpect,
      interpretation: doc.interpretation,
      relatedTests,
      relatedServiceSlugs,
      relatedDoctorSlugs,
      reviewedBy,
      lastReviewed: doc.lastReviewed ?? null,
      pdfUrl,
      seo: normalizeSeo(doc.seo),
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Global content helpers
//
// Every helper returns the raw Payload global (or null on DB error / missing
// global). Consumer components own the "render CMS value or fall back to
// next-intl messages" decision per field — that way an empty CMS field never
// blanks out the live site, but a filled CMS field always wins.
// ---------------------------------------------------------------------------

export type ContactPageCms = {
  title?: string | null
  address?: {
    label?: string | null
    value?: string | null
    mapLatitude?: number | null
    mapLongitude?: number | null
  } | null
  phone?: { label?: string | null; value?: string | null; display?: string | null } | null
  phones?: Array<{ label?: string | null; value?: string | null; display?: string | null } | null> | null
  email?: { label?: string | null; value?: string | null } | null
  workingHours?: { label?: string | null; weekdays?: string | null; weekends?: string | null } | null
  contactFormTitle?: string | null
} | null

async function _getContactPage(locale: Locale): Promise<ContactPageCms> {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'contact-page', locale, depth: 0 })) as ContactPageCms
  } catch {
    return null
  }
}

export type FooterCms = {
  description?: string | null
  quickLinks?: Array<{ label?: string | null; href?: string | null }> | null
  socialLinks?: Array<{ platform?: string | null; url?: string | null }> | null
  copyright?: string | null
  whatsappNumber?: string | null
} | null

async function _getFooter(locale: Locale): Promise<FooterCms> {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'footer', locale, depth: 0 })) as FooterCms
  } catch {
    return null
  }
}

export type SiteSettingsCms = {
  defaultMetaDescription?: string | null
  defaultOgImage?: { url?: string | null } | string | null
  twitterHandle?: string | null
  googleSiteVerification?: string | null
  bingSiteVerification?: string | null
  yandexVerification?: string | null
  aiCrawlers?: {
    gptBot?: boolean | null
    chatGptUser?: boolean | null
    googleExtended?: boolean | null
    claudeBot?: boolean | null
    perplexityBot?: boolean | null
    ccBot?: boolean | null
    applebotExtended?: boolean | null
    bytespider?: boolean | null
  } | null
  extraRobotsRules?: string | null
  enableLlmsTxt?: boolean | null
  llmsTxtContent?: string | null
  topGeEnabled?: boolean | null
  topGeScript?: string | null
} | null

async function _getSiteSettings(locale: Locale): Promise<SiteSettingsCms> {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'site-settings', locale, depth: 1 })) as SiteSettingsCms
  } catch {
    return null
  }
}

// Site-wide feature kill-switches (src/globals/FeatureToggles.ts). Booleans
// aren't localized, so this getter takes no locale arg. A `null`/`undefined`
// field (e.g. the global row predates this feature, or the DB is briefly
// unreachable) is treated as "enabled" via `isFeatureEnabled` below — matches
// each field's own `defaultValue: true` so nothing goes dark by accident.
export type FeatureTogglesCms = {
  labTests?: boolean | null
  healthLibrary?: boolean | null
  blog?: boolean | null
  doctors?: boolean | null
  services?: boolean | null
  booking?: boolean | null
  faq?: boolean | null
  testimonials?: boolean | null
  googleReviewsSync?: boolean | null
  promotions?: boolean | null
  contactForm?: boolean | null
} | null

async function _getFeatureToggles(): Promise<FeatureTogglesCms> {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'feature-toggles', depth: 0 })) as FeatureTogglesCms
  } catch {
    return null
  }
}

export function isFeatureEnabled(
  toggles: FeatureTogglesCms,
  key: keyof NonNullable<FeatureTogglesCms>,
): boolean {
  return toggles?.[key] !== false
}

// Legal pages (Terms & Privacy) — edited in the visible „Policies" global.
// `terms`/`privacy` are localized richText (Lexical JSON); null when the editor
// hasn't filled that locale.
export type PoliciesCms = {
  terms?: unknown
  privacy?: unknown
} | null

async function _getPolicies(locale: Locale): Promise<PoliciesCms> {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'policies', locale, depth: 0 })) as PoliciesCms
  } catch {
    return null
  }
}

// True when a Lexical richText value has at least one non-whitespace character —
// used to decide whether a policy page/link exists for the current locale.
export function richTextHasContent(rt: unknown): boolean {
  if (!rt || typeof rt !== 'object') return false
  let found = false
  const walk = (n: unknown): void => {
    if (found || !n || typeof n !== 'object') return
    const node = n as { text?: unknown; children?: unknown }
    if (typeof node.text === 'string' && node.text.trim().length > 0) {
      found = true
      return
    }
    if (Array.isArray(node.children)) for (const c of node.children) walk(c)
  }
  walk((rt as { root?: unknown }).root ?? rt)
  return found
}

export type NavSubLink = { label: string; href: string }

export type NavigationCms = {
  mainMenu?: Array<{
    label?: string | null
    href?: string | null
    isHighlighted?: boolean | null
    subLinks?: NavSubLink[] | null
  }> | null
  ctaButton?: { enabled?: boolean | null; label?: string | null; href?: string | null } | null
} | null

// Standard routes hardcoded into the site (one route file per key under
// src/app/(frontend)/[locale]/). The Navigation global stores one group per
// key — see src/globals/Navigation.ts. When the admin leaves a route's
// `label` empty we fall back to the corresponding next-intl translation
// (Navigation.* in src/messages/{ge,en,ru}.json) so the menu is never blank.
const STANDARD_ROUTES = [
  { key: 'home', group: 'homeRoute', href: '/', i18nKey: 'home' },
  { key: 'about', group: 'aboutRoute', href: '/about', i18nKey: 'about' },
  { key: 'services', group: 'servicesRoute', href: '/services', i18nKey: 'services' },
  { key: 'doctors', group: 'doctorsRoute', href: '/doctors', i18nKey: 'doctors' },
  { key: 'checkups', group: 'checkupsRoute', href: '/checkups', i18nKey: 'checkups' },
  // DISABLED 2026-05-30 per client request — Health Library dropped from nav.
  // The healthLibraryRoute group still exists in Navigation.ts (admin toggle is
  // inert while this line is commented). Restore this line to re-enable.
  // { key: 'healthLibrary', group: 'healthLibraryRoute', href: '/health-library', i18nKey: 'healthLibrary' },
  { key: 'blog', group: 'blogRoute', href: '/blog', i18nKey: 'blog' },
  { key: 'contact', group: 'contactRoute', href: '/contact', i18nKey: 'contact' },
  { key: 'labTests', group: 'labTestsRoute', href: '/lab-tests', i18nKey: 'labTests' },
] as const

type RouteGroup = {
  enabled?: boolean | null
  label?: string | null
  order?: number | null
  hasDropdown?: boolean | null
  subLinks?: Array<{ label?: string | null; href?: string | null }> | null
} | null | undefined

// Resolve a route group's dropdown entries (already locale-resolved by the
// findGlobal call). Returns [] when the dropdown is off or every row is blank,
// so the header simply renders a plain link in that case.
function resolveSubLinks(route: RouteGroup): NavSubLink[] {
  if (!route?.hasDropdown || !Array.isArray(route.subLinks)) return []
  return route.subLinks
    .map((s) => ({
      label: typeof s?.label === 'string' ? s.label.trim() : '',
      href: typeof s?.href === 'string' ? s.href.trim() : '',
    }))
    .filter((s): s is NavSubLink => s.label.length > 0 && s.href.length > 0)
}

async function readNavTranslation(locale: Locale, i18nKey: string): Promise<string> {
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default as { Navigation?: Record<string, string> }
    return messages.Navigation?.[i18nKey] ?? ''
  } catch {
    return ''
  }
}

async function _getNavigation(locale: Locale): Promise<NavigationCms> {
  try {
    const payload = await getPayloadClient()
    // Pull the Navigation global + auto-included Pages in parallel. The
    // global gives us per-route toggles/labels/order for the 7 standard
    // routes; the pages query yields any Page that's flagged showInNav AND
    // published. Both feeds get merged into a single `mainMenu` array (with
    // the legacy field shape that Header.tsx already consumes) so the
    // frontend doesn't need to know about the schema rework.
    const [navRaw, pages, toggles] = await Promise.all([
      payload.findGlobal({ slug: 'navigation', locale, depth: 0 }) as Promise<Record<string, unknown>>,
      payload.find({
        collection: 'pages',
        locale,
        depth: 0,
        where: {
          showInNav: { equals: true },
          status: { equals: 'published' },
        } as never,
        // Lower navOrder = appears first. Ties broken by title asc so order
        // stays deterministic when admin leaves the default 0 on multiple
        // rows.
        sort: ['navOrder', 'title'] as never,
        limit: 50,
      }),
      _getFeatureToggles(),
    ])

    // Feature Toggles (src/globals/FeatureToggles.ts) are a second, stronger
    // on/off switch layered on top of each route group's own `enabled` box —
    // when a whole feature is turned off site-wide, its nav entry must vanish
    // even if the Navigation global's per-route checkbox still says "on".
    // Only services/doctors/blog/labTests have a STANDARD_ROUTES entry at all
    // (booking/faq/etc. never had a fixed nav slot to begin with).
    const NAV_KEY_TO_TOGGLE: Partial<Record<(typeof STANDARD_ROUTES)[number]['key'], keyof NonNullable<FeatureTogglesCms>>> = {
      services: 'services',
      doctors: 'doctors',
      blog: 'blog',
      labTests: 'labTests',
    }

    type NavRow = NonNullable<NonNullable<NavigationCms>['mainMenu']>[number]

    // Build standard-route rows with translation fallback. Disabled groups
    // are dropped entirely. Empty admin label → translation file.
    const standardRowsWithOrder = await Promise.all(
      STANDARD_ROUTES.map(async ({ key, group, href, i18nKey }) => {
        const route = navRaw?.[group] as RouteGroup
        if (route?.enabled === false) return null
        const toggleKey = NAV_KEY_TO_TOGGLE[key]
        if (toggleKey && !isFeatureEnabled(toggles, toggleKey)) return null
        const customLabel = typeof route?.label === 'string' ? route.label.trim() : ''
        const label = customLabel.length > 0 ? customLabel : await readNavTranslation(locale, i18nKey)
        if (!label) return null
        const order = typeof route?.order === 'number' ? route.order : 0
        const subLinks = resolveSubLinks(route)
        return { row: { label, href, isHighlighted: false, subLinks } as NavRow, order }
      }),
    )
    const standardRows: NavRow[] = standardRowsWithOrder
      .filter((r): r is { row: NavRow; order: number } => r !== null)
      .sort((a, b) => a.order - b.order)
      .map((r) => r.row)

    // Admin-managed free-form links (Navigation.customLinks) — array order is
    // display order (drag to reorder in the admin UI), unlike standardRows
    // which use an explicit `order` number field.
    const customLinksRaw = navRaw?.customLinks as
      | Array<{ enabled?: boolean | null; label?: string | null; href?: string | null }>
      | null
      | undefined
    const customRows: NavRow[] = Array.isArray(customLinksRaw)
      ? customLinksRaw
          .filter((c) => c?.enabled !== false)
          .map((c) => ({
            label: typeof c?.label === 'string' ? c.label.trim() : '',
            href: typeof c?.href === 'string' ? c.href.trim() : '',
            isHighlighted: false,
          }))
          .filter((row) => row.label.length > 0 && row.href.length > 0)
      : []

    // Auto-included Pages — sorted by navOrder server-side already.
    const autoRows: NavRow[] = pages.docs.map((doc) => {
      const d = doc as { slug?: string | null; title?: string | null; navLabel?: string | null }
      const slug = typeof d.slug === 'string' ? d.slug : ''
      const label =
        typeof d.navLabel === 'string' && d.navLabel.trim().length > 0
          ? d.navLabel.trim()
          : typeof d.title === 'string'
            ? d.title
            : ''
      return { label, href: `/pages/${slug}`, isHighlighted: false }
    })

    const ctaButton = (navRaw?.ctaButton ?? null) as NavigationCms extends infer N ? (N extends { ctaButton?: infer C } ? C : null) : null

    return {
      mainMenu: [...standardRows, ...customRows, ...autoRows],
      ctaButton,
    } as NavigationCms
  } catch {
    return null
  }
}

export type AboutPageCms = {
  title?: string | null
  subtitle?: string | null
  description?: unknown // Lexical richText
  heroImage?: { url?: string | null; alt?: string | null } | string | null
  ceo?: {
    name?: string | null
    role?: string | null
    photo?: { url?: string | null; alt?: string | null } | string | null
    message?: unknown // Lexical richText
  } | null
  highlights?: Array<{ title?: string | null; text?: string | null; icon?: string | null }> | null
  stats?: Array<{ label?: string | null; value?: string | null; description?: string | null }> | null
} | null

async function _getAboutPage(locale: Locale): Promise<AboutPageCms> {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'about-page', locale, depth: 1 })) as AboutPageCms
  } catch {
    return null
  }
}

// Landing-page hero copy for /services and /doctors. Simple title+subtitle
// globals so editors can change those headings (previously i18n-only).
export type SimplePageCms = { title?: string | null; subtitle?: string | null } | null

async function _getServicesPage(locale: Locale): Promise<SimplePageCms> {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'services-page', locale, depth: 0 })) as SimplePageCms
  } catch {
    return null
  }
}

export type DoctorsPageCms = (SimplePageCms & { showLanguages?: boolean | null }) | null

async function _getDoctorsPage(locale: Locale): Promise<DoctorsPageCms> {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'doctors-page', locale, depth: 0 })) as DoctorsPageCms
  } catch {
    return null
  }
}

export type BookingPageCms = {
  title?: string | null
  subtitle?: string | null
  steps?: {
    selectService?: string | null
    selectDoctor?: string | null
    selectDate?: string | null
    selectTime?: string | null
    yourInfo?: string | null
    confirm?: string | null
  } | null
  form?: {
    fullName?: string | null
    phoneNumber?: string | null
    confirmButton?: string | null
    successMessage?: string | null
  } | null
} | null

async function _getBookingPage(locale: Locale): Promise<BookingPageCms> {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'booking-page', locale, depth: 0 })) as BookingPageCms
  } catch {
    return null
  }
}

export type HomePageCms = {
  showDoctorCard?: boolean | null
  // depth:0 returns these as relationship IDs; we match them against the
  // normalized doctor list in page.tsx. Objects tolerated in case depth rises.
  heroDoctors?: (number | string | { id: number | string })[] | null
  // Homepage "Our doctors" section controls — the eligible pool (allow-list),
  // how many to show, and whether to pick them at random each load (page.tsx).
  featuredDoctors?: (number | string | { id: number | string })[] | null
  featuredDoctorCount?: number | null
  randomizeFeaturedDoctors?: boolean | null
  hero?: {
    headline?: string | null
    subheadline?: string | null
    bookButtonText?: string | null
    consultButtonText?: string | null
    badgeText?: string | null
  } | null
  trustStrip?: {
    rating?: string | null
    doctorCount?: string | null
    patientCount?: string | null
  } | null
  symptomNavigator?: {
    title?: string | null
    subtitle?: string | null
    placeholder?: string | null
  } | null
  faqs?: ({ question?: string | null; answer?: string | null } | null)[] | null
  statsList?: ({ value?: number | null; suffix?: string | null; label?: string | null } | null)[] | null
  // Per-section, per-language visibility — each key is localized in Payload,
  // so this object already reflects the value for the locale getHomePage(locale)
  // was called with. Undefined/null (field never saved for this locale) means
  // "visible" — callers should treat a missing key as true, not false.
  sectionVisibility?: {
    hero?: boolean | null
    symptomNavigator?: boolean | null
    stats?: boolean | null
    servicesGrid?: boolean | null
    doctorsPreview?: boolean | null
    checkupCards?: boolean | null
    news?: boolean | null
    reviews?: boolean | null
    faq?: boolean | null
    contactMap?: boolean | null
  } | null
} | null

/** Fetch HomePage *text* groups (not the heroSlides — those have their own helper). */
async function _getHomePage(locale: Locale): Promise<HomePageCms> {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'home-page', locale, depth: 0 })) as HomePageCms
  } catch {
    return null
  }
}

// ── Booking availability sweep ──────────────────────────────────────────────
// "Which doctors can actually be booked right now?" Doctra `get_time_slots`
// returns an ENTIRE department's slots (all its doctors) in a single call, so we
// check availability per-department, not per-doctor. This is what lets the
// booking picker hide a surgeon with no appointment schedule WITHOUT touching
// their website profile (that's the separate, manual `inactive` flag).
//
// - Cached in-memory for 15 min — slots don't change minute-to-minute, and the
//   booking page is SSR'd, so an uncached sweep on every load would be slow.
// - Per-department calls are batched to avoid hammering Doctra.
// - FAIL OPEN: a department we can't reach is recorded as `errored`; its doctors
//   stay visible. A Doctra blip must never empty the whole booking list.
const AVAILABILITY_WINDOW_DAYS = 30
const AVAILABILITY_TTL_MS = 15 * 60 * 1000
let _availCache: { key: string; at: number; available: Set<string>; errored: Set<string> } | null = null

async function getBookableDoctorIds(
  branchIds: string[],
): Promise<{ available: Set<string>; errored: Set<string> }> {
  const key = [...branchIds].sort().join(',')
  if (_availCache && _availCache.key === key && Date.now() - _availCache.at < AVAILABILITY_TTL_MS) {
    return _availCache
  }
  const today = new Date()
  const begin = today.toISOString().split('T')[0]
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + AVAILABILITY_WINDOW_DAYS)
  const end = endDate.toISOString().split('T')[0]

  const available = new Set<string>()
  const errored = new Set<string>()
  const BATCH = 8
  for (let i = 0; i < branchIds.length; i += BATCH) {
    await Promise.all(
      branchIds.slice(i, i + BATCH).map(async (branchId) => {
        try {
          const slots = await getTimeSlots(branchId, begin, end)
          for (const s of slots) if (s.slot_type === 'available') available.add(s.doctor_id)
        } catch {
          errored.add(branchId)
        }
      }),
    )
  }
  _availCache = { key, at: Date.now(), available, errored }
  return _availCache
}

/**
 * Booking doctor catalogue, sourced from Payload.
 *
 * Returns only doctors with a Doctra link (`doctraId`) and not flagged
 * inactive, and sets `hasAvailability` from a live (cached) Doctra slot sweep so
 * the wizard's existing filter hides doctors with no open appointments.
 * Pre-shaped to the `{ serviceId, operator }` row format the booking wizard
 * already expects from /api/booking/all-doctors.
 */
export async function getBookingDoctorsFromPayload(
  locale: Locale,
): Promise<{ serviceId: string; operator: BookingOperator }[]> {
  try {
    const payload = await getPayloadClient()
    type DoctorDoc = {
      id: string | number
      doctraId?: string | null
      doctraBranchId?: string | null
      inactive?: boolean | null
      slug?: string | null
      name?: string
      specialty?: string
      photo?: { url?: string | null } | string | null
    }
    const result = await payload.find({
      collection: 'doctors',
      where: {
        doctraId: { exists: true },
        inactive: { not_equals: true },
      } as never,
      locale,
      limit: 500,
      depth: 1,
    })
    const docs = result.docs as unknown as DoctorDoc[]
    const linked = docs.filter((d) => !!d.doctraId && !!d.doctraBranchId)

    // Live availability sweep over the unique departments these doctors belong
    // to (cached + batched + fail-open). `hasAvailability === false` is what the
    // booking wizard (CombinedSelectionStep / DateTimeStep) uses to hide a row.
    const branchIds = [...new Set(linked.map((d) => d.doctraBranchId as string))]
    const { available, errored } = await getBookableDoctorIds(branchIds)

    return linked.map((d) => {
      const rawPhoto =
        typeof d.photo === 'object' && d.photo !== null && 'url' in d.photo
          ? d.photo.url ?? null
          : null
      // Most doctors share the generic `doctor-placeholder` upload. Treat that
      // as photoless so the booking card's initials fallback fires — a grid of
      // colored initials reads far cleaner than ~100 identical grey silhouettes.
      // Real headshots are untouched. (Booking picker only; profile pages still
      // get the placeholder image where they want a face-shaped slot.)
      const photo = rawPhoto && /doctor-placeholder/i.test(rawPhoto) ? null : rawPhoto
      return {
        serviceId: d.doctraBranchId as string,
        operator: {
          id: d.doctraId as string,
          name: d.name ?? '',
          photo,
          slug: d.slug ?? null,
          specialty: d.specialty ?? null,
          hasProfile: true,
          // Hidden from the booking picker when Doctra shows no open slots in
          // the next 30 days — EXCEPT when we couldn't reach that doctor's
          // department (errored → fail open, keep them bookable). Their website
          // profile is unaffected; this only drives the booking list.
          hasAvailability:
            available.has(d.doctraId as string) || errored.has(d.doctraBranchId as string),
        },
      }
    })
  } catch (err) {
    console.error('getBookingDoctorsFromPayload failed:', err)
    return []
  }
}

// ---------------------------------------------------------------------------
// Cached public exports
//
// The `_get*` impls above are re-exported here under their public names,
// wrapped in the data cache. Tag === Payload slug; an edit in the admin busts
// the tag (payload.config.ts hooks) and the next request re-renders fresh.
// Callers import these names exactly as before — the cache is transparent.
//
// `getNavigation` also reads the `pages` collection (showInNav pages), so it's
// tagged with both `navigation` and `pages`. `getStats` reads both the
// `home-page` and `site-settings` globals, so it carries both tags.
// ---------------------------------------------------------------------------
export const getServices = cached(_getServices, 'getServices', ['services'])
export const getDoctors = cached(_getDoctors, 'getDoctors', ['doctors'])
export const getCheckupPackages = cached(_getCheckupPackages, 'getCheckupPackages', ['checkup-packages'])
export const getReviews = cached(_getReviews, 'getReviews', ['reviews'])
export const getStats = cached(_getStats, 'getStats', ['home-page', 'site-settings'])
export const getSiteSettings = cached(_getSiteSettings, 'getSiteSettings', ['site-settings'])
export const getFeatureToggles = cached(_getFeatureToggles, 'getFeatureToggles', ['feature-toggles'])
export const getHeroSlides = cached(_getHeroSlides, 'getHeroSlides', ['home-page'])
export const getHomepageNews = cached(_getHomepageNews, 'getHomepageNews', ['news'])
export const getNewsCategories = cached(_getNewsCategories, 'getNewsCategories', ['news'])
export const getAllNews = cached(_getAllNews, 'getAllNews', ['news'])
export const getNewsBySlug = cached(_getNewsBySlug, 'getNewsBySlug', ['news'])
export const getDoctorByDoctraId = cached(_getDoctorByDoctraId, 'getDoctorByDoctraId', ['doctors'])
export const getServiceByDoctraBranchId = cached(_getServiceByDoctraBranchId, 'getServiceByDoctraBranchId', ['services'])
export const getLabTests = cached(_getLabTests, 'getLabTests', ['lab-tests'])
export const getLabTestsForService = cached(_getLabTestsForService, 'getLabTestsForService', ['lab-tests'])
export const getLabTestBySlug = cached(_getLabTestBySlug, 'getLabTestBySlug', ['lab-tests'])
export const getContactPage = cached(_getContactPage, 'getContactPage', ['contact-page'])
export const getFooter = cached(_getFooter, 'getFooter', ['footer'])
export const getPolicies = cached(_getPolicies, 'getPolicies', ['policies'])
export const getNavigation = cached(_getNavigation, 'getNavigation', ['navigation', 'pages', 'feature-toggles'])
export const getAboutPage = cached(_getAboutPage, 'getAboutPage', ['about-page'])
export const getServicesPage = cached(_getServicesPage, 'getServicesPage', ['services-page'])
export const getDoctorsPage = cached(_getDoctorsPage, 'getDoctorsPage', ['doctors-page'])
export const getBookingPage = cached(_getBookingPage, 'getBookingPage', ['booking-page'])
export const getHomePage = cached(_getHomePage, 'getHomePage', ['home-page'])

