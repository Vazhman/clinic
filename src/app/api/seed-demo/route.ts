import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import sharp from 'sharp'
import { newsSeed } from '@/lib/demo-seed/news-data'
import { labTestsSeed } from '@/lib/demo-seed/lab-tests-data'
import { toLexical } from '@/lib/demo-seed/lexical'

// Demo content seeder — news (adapted from khozrevanidze.ge) + a lab-test
// library, all in ge / en / ru. Companion to /api/seed (which seeds
// services / doctors / checkups / reviews).
//
// HOW TO USE (see docs/DEMO_SEED.md): run the dev server pointed at the TARGET
// database, then POST here once. Running under `next dev` keeps NODE_ENV out of
// "production", so Payload's schema `push` runs and creates the new `lab_tests`
// tables on the target DB (Vercel/Neon disables push in serverless prod, which
// is why this is done from a local dev server rather than the deployed route).
//
// Auth: in production a matching `SEED_TOKEN` is required (header
// `x-seed-token` or `?token=`); in development it is open for convenience.
// Idempotent: existing slugs are skipped, so re-running is safe.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

type Locale = 'ge' | 'en' | 'ru'
const OTHER_LOCALES: Locale[] = ['en', 'ru']

type FetchedImage = { data: Buffer; mimetype: string; ext: string }

async function fetchImage(url: string): Promise<FetchedImage | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; demo-seed/1.0)' },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    const ct = (res.headers.get('content-type') || '').toLowerCase()
    if (!ct.startsWith('image/')) return null
    const data = Buffer.from(await res.arrayBuffer())
    if (data.length < 1024) return null
    const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : ct.includes('gif') ? 'gif' : 'jpg'
    return { data, mimetype: ct.split(';')[0], ext }
  } catch {
    return null
  }
}

// Branded 1400×800 PNG fallback in the clinic palette. ASCII-only label so it
// renders without a Georgian font. Generated on the fly — no binary asset.
async function placeholderImage(label: string): Promise<FetchedImage> {
  const safe = label.replace(/[<&>]/g, '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="800">
    <rect width="1400" height="800" fill="#682149"/>
    <rect x="0" y="640" width="1400" height="160" fill="#DD64A6"/>
    <circle cx="1180" cy="200" r="220" fill="#DD64A6" opacity="0.25"/>
    <text x="80" y="380" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#FAFAF8">Khozrevanidze Clinic</text>
    <text x="80" y="470" font-family="Arial, sans-serif" font-size="40" fill="#FAFAF8" opacity="0.85">${safe}</text>
  </svg>`
  const data = await sharp(Buffer.from(svg)).png().toBuffer()
  return { data, mimetype: 'image/png', ext: 'png' }
}

function authorized(req: Request): boolean {
  const expected = process.env.SEED_TOKEN
  if (process.env.NODE_ENV !== 'production') return true
  if (!expected) return false
  const url = new URL(req.url)
  const provided = req.headers.get('x-seed-token') || url.searchParams.get('token')
  return !!provided && provided === expected
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Set SEED_TOKEN and pass it via the x-seed-token header or ?token=.' },
      { status: 401 },
    )
  }

  try {
    const payload = await getPayload({ config })

    let newsCreated = 0
    let newsSkipped = 0
    let labCreated = 0
    let labSkipped = 0
    let placeholders = 0

    // ── News ────────────────────────────────────────────────────────────────
    for (const item of newsSeed) {
      const existing = await payload.find({
        collection: 'news',
        where: { slug: { equals: item.slug } },
        limit: 1,
        depth: 0,
      })
      if (existing.totalDocs > 0) {
        newsSkipped++
        continue
      }

      let img = await fetchImage(item.imageUrl)
      if (!img) {
        img = await placeholderImage(item.imageAlt.en)
        placeholders++
      }
      const media = await payload.create({
        collection: 'media',
        locale: 'ge',
        data: { alt: item.imageAlt.ge },
        file: { data: img.data, mimetype: img.mimetype, name: `${item.slug}.${img.ext}`, size: img.data.length },
      })
      for (const loc of OTHER_LOCALES) {
        await payload.update({ collection: 'media', id: media.id, locale: loc, data: { alt: item.imageAlt[loc] } })
      }

      const created = await payload.create({
        collection: 'news',
        locale: 'ge',
        data: {
          slug: item.slug,
          category: item.category,
          publishedDate: item.publishedDate,
          status: 'published',
          _status: 'published',
          showOnHomepage: !!item.showOnHomepage,
          homepageOrder: item.homepageOrder ?? 0,
          featuredImage: media.id,
          title: item.title.ge,
          excerpt: item.excerpt.ge,
          body: toLexical(item.body.ge),
          ...(item.author ? { author: item.author.ge } : {}),
        } as never,
      })
      for (const loc of OTHER_LOCALES) {
        await payload.update({
          collection: 'news',
          id: created.id,
          locale: loc,
          data: {
            _status: 'published',
            title: item.title[loc],
            excerpt: item.excerpt[loc],
            body: toLexical(item.body[loc]),
            ...(item.author ? { author: item.author[loc] } : {}),
          } as never,
        })
      }
      newsCreated++
    }

    // ── Lab tests (pass 1: create) ────────────────────────────────────────────
    const slugToId = new Map<string, number | string>()
    for (const t of labTestsSeed) {
      const existing = await payload.find({
        collection: 'lab-tests',
        where: { slug: { equals: t.slug } },
        limit: 1,
        depth: 0,
      })
      if (existing.totalDocs > 0) {
        slugToId.set(t.slug, existing.docs[0].id)
        labSkipped++
        continue
      }

      const aliasesGe = t.aliases ? t.aliases.ge.map((alias) => ({ alias })) : undefined
      const created = await payload.create({
        collection: 'lab-tests',
        locale: 'ge',
        data: {
          slug: t.slug,
          category: t.category,
          published: t.published,
          _status: 'published',
          lastReviewed: '2026-05-01',
          title: t.title.ge,
          summary: t.summary.ge,
          overview: toLexical(t.overview.ge),
          whyDone: toLexical(t.whyDone.ge),
          preparation: toLexical(t.preparation.ge),
          whatToExpect: toLexical(t.whatToExpect.ge),
          interpretation: toLexical(t.interpretation.ge),
          ...(aliasesGe ? { aliases: aliasesGe } : {}),
        } as never,
      })
      for (const loc of OTHER_LOCALES) {
        const aliasesLoc = t.aliases ? t.aliases[loc].map((alias) => ({ alias })) : undefined
        await payload.update({
          collection: 'lab-tests',
          id: created.id,
          locale: loc,
          data: {
            _status: 'published',
            title: t.title[loc],
            summary: t.summary[loc],
            overview: toLexical(t.overview[loc]),
            whyDone: toLexical(t.whyDone[loc]),
            preparation: toLexical(t.preparation[loc]),
            whatToExpect: toLexical(t.whatToExpect[loc]),
            interpretation: toLexical(t.interpretation[loc]),
            ...(aliasesLoc ? { aliases: aliasesLoc } : {}),
          } as never,
        })
      }
      slugToId.set(t.slug, created.id)
      labCreated++
    }

    // ── Lab tests (pass 2: cross-links) ───────────────────────────────────────
    for (const t of labTestsSeed) {
      const id = slugToId.get(t.slug)
      if (!id) continue

      const relatedTests = (t.relatedTestSlugs ?? [])
        .map((s) => slugToId.get(s))
        .filter((v): v is number | string => v !== undefined)

      let relatedServices: Array<number | string> = []
      if (t.relatedServiceSlugs?.length) {
        const svc = await payload.find({
          collection: 'services',
          where: { slug: { in: t.relatedServiceSlugs } },
          limit: 50,
          depth: 0,
        })
        relatedServices = svc.docs.map((d) => d.id)
      }

      if (relatedTests.length === 0 && relatedServices.length === 0) continue
      await payload.update({
        collection: 'lab-tests',
        id,
        locale: 'ge',
        data: {
          ...(relatedTests.length ? { relatedTests } : {}),
          ...(relatedServices.length ? { relatedServices } : {}),
        } as never,
      })
    }

    return NextResponse.json({
      message: 'Demo seed complete.',
      news: { created: newsCreated, skipped: newsSkipped },
      labTests: { created: labCreated, skipped: labSkipped },
      placeholderImages: placeholders,
    })
  } catch (error) {
    console.error('Demo seed error:', error)
    return NextResponse.json(
      { error: 'Demo seed failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
