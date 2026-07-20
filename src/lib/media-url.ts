// Payload/Sharp generate `thumbnail`/`card`/`hero` derivatives for every
// image upload (src/collections/Media.ts) alongside the original file.
// Components across the app were reading `.url` directly, which is always
// the full-resolution original (can be MBs) even when a much smaller
// derivative already exists right next to it. This helper centralizes the
// "prefer a derivative, fall back to the original" logic so every call site
// benefits and nothing regresses for media without derivatives (SVGs,
// non-image uploads, legacy rows).

export type MediaSizeName = 'thumbnail' | 'card' | 'hero'

export type MediaLike =
  | {
      url?: string | null
      sizes?: Partial<Record<MediaSizeName, { url?: string | null } | null>> | null
    }
  | string
  | number
  | null
  | undefined

/**
 * `thumbnail`/`card` are hard-cropped to a fixed box (Sharp `fit: cover`,
 * 4:3 / 3:2) regardless of the source image's aspect ratio — safe for admin
 * preview swatches, but most of this site's photo displays (doctor cards,
 * profile hero, about/CEO photo) apply their OWN aspect-ratio crop via CSS
 * (`aspect-[4/5] object-cover`). Handing those a pre-cropped landscape
 * derivative would crop twice and can cut off faces on portrait photos.
 * `hero` has no fixed height — Sharp only downscales it, preserving the
 * original aspect ratio — so it's the safe default; opt into `card`/
 * `thumbnail` only where a spot is known to want that exact fixed ratio.
 */
export function mediaDerivativeUrl(media: MediaLike, preferred: MediaSizeName = 'hero'): string {
  if (typeof media !== 'object' || media === null) return ''
  return media.sizes?.[preferred]?.url || media.sizes?.hero?.url || media.url || ''
}
