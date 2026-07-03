/**
 * Google Reviews fetcher.
 *
 * Uses the Google Places API (new) to pull up to 5 of the place's most-relevant
 * reviews. The Places API requires only an API key (no OAuth dance), which
 * makes initial setup simple. The downside is the 5-review ceiling — for the
 * full review history the clinic would need to upgrade to the Business
 * Profile API with clinic-owner OAuth.
 *
 * Required env vars:
 *   GOOGLE_PLACES_API_KEY  — API key from Google Cloud Console (with Places
 *                            API enabled and restricted to your origins).
 *   GOOGLE_PLACE_ID        — the clinic's Google Place ID. Find via
 *                            https://developers.google.com/maps/documentation/places/web-service/place-id
 *
 * Setup (one-time, ~10 minutes):
 *   1. Go to https://console.cloud.google.com → create / select a project
 *   2. APIs & Services → Library → enable "Places API (New)"
 *   3. APIs & Services → Credentials → Create API Key
 *      → Restrict to "Places API (New)"
 *   4. Find the clinic's Place ID at the link above; paste both into Vercel
 *      env: GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID.
 */

export type GoogleReview = {
  /** Stable-ish ID for dedup: derived from review.name (the Place's review resource path). */
  id: string
  authorName: string
  authorPhotoUrl?: string
  rating: number
  text: string
  /** ISO date string. */
  date: string
}

const PLACE_URL = (placeId: string) => `https://places.googleapis.com/v1/places/${placeId}`

/**
 * Fetch up to 5 most-relevant reviews for the configured Place. Throws if env
 * vars are missing or the API rejects the request.
 */
export async function fetchGoogleReviews(): Promise<GoogleReview[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  const placeId = process.env.GOOGLE_PLACE_ID

  if (!apiKey || !placeId) {
    throw new Error(
      'GOOGLE_PLACES_API_KEY და/ან GOOGLE_PLACE_ID env ცვლადი არ არის დაყენებული. იხილე scripts/HANDOVER.md → "Google Reviews setup".',
    )
  }

  const res = await fetch(PLACE_URL(placeId), {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      // Only ask for the fields we use — saves billing per Google's
      // field-mask pricing.
      'X-Goog-FieldMask': 'reviews.name,reviews.rating,reviews.text,reviews.authorAttribution,reviews.publishTime',
    },
    // 60s cache; the underlying data only changes when a new review is left.
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Google Places API ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    reviews?: Array<{
      name?: string
      rating?: number
      text?: { text?: string; languageCode?: string }
      authorAttribution?: { displayName?: string; uri?: string; photoUri?: string }
      publishTime?: string
    }>
  }

  const reviews = data.reviews ?? []
  return reviews
    .filter((r) => typeof r.rating === 'number' && r.text?.text)
    .map((r): GoogleReview => ({
      id: r.name ?? `${r.publishTime ?? ''}_${r.authorAttribution?.displayName ?? ''}`,
      authorName: r.authorAttribution?.displayName ?? 'Google User',
      authorPhotoUrl: r.authorAttribution?.photoUri,
      rating: Math.max(1, Math.min(5, Math.round(r.rating ?? 0))),
      text: r.text?.text ?? '',
      date: r.publishTime ?? new Date().toISOString(),
    }))
}
