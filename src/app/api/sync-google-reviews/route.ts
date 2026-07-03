import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import payloadConfig from '@payload-config'
import { fetchGoogleReviews } from '@/lib/google-reviews'

/**
 * Sync Google reviews into the Reviews collection.
 *
 * Idempotent: upserts by `googleReviewId`. New reviews land with
 * `published: false` so an admin curates them before they go live —
 * the customer asked specifically to "sync into DB and then pick which
 * to show on the site".
 *
 * Caller: src/components/admin/GoogleReviewsSyncCard.tsx (button on
 * the admin dashboard).
 */
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Auth-gate: this triggers a PAID Google Places API call + DB writes, and is
  // only meant to fire from the admin dashboard button. Reject anonymous calls.
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let fetched
  try {
    fetched = await fetchGoogleReviews()
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || 'Failed to fetch from Google' },
      { status: 502 },
    )
  }

  if (fetched.length === 0) {
    return NextResponse.json({
      ok: true,
      summary: {
        fetched: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        message: 'არცერთი შეფასება არ წამოვიდა — შეამოწმე GOOGLE_PLACES_API_KEY და GOOGLE_PLACE_ID env ცვლადები.',
      },
    })
  }

  let created = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const r of fetched) {
    try {
      const existing = await payload.find({
        collection: 'reviews',
        where: { googleReviewId: { equals: r.id } } as never,
        limit: 1,
        depth: 0,
      })

      if (existing.docs.length === 0) {
        // New review — store unpublished so admin curates first.
        await payload.create({
          collection: 'reviews',
          data: {
            author: r.authorName,
            rating: r.rating,
            text: r.text,
            date: r.date,
            source: 'google',
            published: false,
            googleReviewId: r.id,
            authorPhotoUrl: r.authorPhotoUrl ?? '',
          } as never,
          locale: 'ge',
        })
        created++
      } else {
        // Existing — only refresh rating/text in case Google's "most
        // relevant" view of the review changed. Don't touch `published`,
        // the admin owns that decision. Don't touch localized fields
        // for other locales — admin may have translated them.
        const doc = existing.docs[0] as { id: string | number; rating?: number; text?: string }
        const needsUpdate = doc.rating !== r.rating || doc.text !== r.text
        if (needsUpdate) {
          await payload.update({
            collection: 'reviews',
            id: doc.id,
            data: {
              rating: r.rating,
              text: r.text,
              authorPhotoUrl: r.authorPhotoUrl ?? '',
            } as never,
            locale: 'ge',
          })
          updated++
        } else {
          skipped++
        }
      }
    } catch (err) {
      errors.push(`${r.id}: ${(err as Error).message}`)
    }
  }

  return NextResponse.json({
    ok: true,
    summary: { fetched: fetched.length, created, updated, skipped, errors },
  })
}
