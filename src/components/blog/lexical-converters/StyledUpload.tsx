import Image from 'next/image'
import type { SerializedUploadNode } from '@payloadcms/richtext-lexical'
import { mediaDerivativeUrl, type MediaSizeName } from '@/lib/media-url'

// `fields` on the upload node = the extra metadata we declared on UploadFeature
// (alignment, borderStyle, shadow, radius, caption) in src/payload.config.ts.
// `value` is the populated Media doc (Payload depth >= 1 hydrates it).
type MediaValue = {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<Record<MediaSizeName, { url?: string | null } | null>> | null
}

type Fields = {
  alignment?: 'left' | 'center' | 'right' | 'fullWidth'
  size?: 'small' | 'medium' | 'large' | 'full'
  borderStyle?: 'none' | 'pink' | 'blackberry' | 'grey'
  shadow?: 'none' | 'soft' | 'strong'
  radius?: 'none' | 'lg' | 'full'
  caption?: string
  widthPercent?: number
}

// Alignment controls *positioning* (float-left wraps text right; center sits
// alone in the column; full-width breaks out). Size controls the *width* of
// the figure. They compose: a small float-left image wraps text differently
// than a large one. `max-w-full` on every variant is belt-and-suspenders so
// the figure never exceeds its parent column even when that column ends up
// narrower than the variant's max-width (e.g. inside Payload's live-preview
// iframe at tablet breakpoints).
const alignmentClass: Record<NonNullable<Fields['alignment']>, string> = {
  left: 'md:float-left md:mr-8 mb-4 max-w-full',
  center: 'mx-auto max-w-full',
  right: 'md:float-right md:ml-8 mb-4 max-w-full',
  fullWidth: 'w-full max-w-full',
}

// Width tiers chosen against an ~880px article column (the blog post layout
// in this project). Small ≈ a third, medium ≈ a half, large ≈ three quarters,
// full ≈ the entire column. Tailwind's max-w-* tokens map cleanly onto those
// proportions without us needing inline widths.
const sizeClass: Record<NonNullable<Fields['size']>, string> = {
  small: 'md:max-w-[33%]',
  medium: 'md:max-w-[50%]',
  large: 'md:max-w-[75%]',
  full: 'md:max-w-full',
}

const borderClass: Record<NonNullable<Fields['borderStyle']>, string> = {
  none: '',
  pink: 'ring-2 ring-pink ring-offset-2 ring-offset-cream',
  blackberry: 'ring-2 ring-blackberry ring-offset-2 ring-offset-cream',
  grey: 'ring-2 ring-grey/30 ring-offset-2 ring-offset-cream',
}

const shadowClass: Record<NonNullable<Fields['shadow']>, string> = {
  none: '',
  soft: 'shadow-md shadow-blackberry/10',
  strong: 'shadow-xl shadow-blackberry/20',
}

const radiusClass: Record<NonNullable<Fields['radius']>, string> = {
  none: 'rounded-none',
  lg: 'rounded-xl sm:rounded-2xl',
  full: 'rounded-full aspect-square object-cover',
}

export function StyledUpload({ node }: { node: SerializedUploadNode }) {
  const value = node.value
  if (!value || typeof value !== 'object') return null

  const media = value as MediaValue
  const fields = (node.fields ?? {}) as Fields

  const alignment = fields.alignment ?? 'center'
  // fullWidth alignment ignores size — full means full. Otherwise size kicks
  // in and constrains the figure to the chosen width tier.
  const size = alignment === 'fullWidth' ? 'full' : (fields.size ?? 'large')
  const border = fields.borderStyle ?? 'none'
  const shadow = fields.shadow ?? 'none'
  const radius = fields.radius ?? 'lg'

  // Drag-resize takes precedence over the size preset. widthPercent is set by
  // the editor canvas (drag handles + floating toolbar) and lives inside the
  // Lexical JSON blob, so legacy posts that never used the new editor still
  // fall back to the size preset cleanly. fullWidth alignment wins over both:
  // it ignores every width control because "full" means full-bleed.
  const widthPercent = alignment === 'fullWidth' ? undefined : fields.widthPercent
  const inlineStyle = widthPercent ? { width: `${widthPercent}%`, maxWidth: '100%' } : undefined
  const sizeClassValue = alignment === 'fullWidth' || widthPercent ? '' : sizeClass[size]

  // `hero` (aspect-preserving, no fixed-box crop) — content images can be any
  // aspect ratio, and this figure never crops via CSS, so a hard-cropped
  // derivative would distort/cut the image. See src/lib/media-url.ts.
  const src = mediaDerivativeUrl(media, 'hero')
  if (!src) return null
  const imgClassName = `block w-full max-w-full h-auto ${radiusClass[radius]} ${borderClass[border]} ${shadowClass[shadow]}`

  return (
    <figure className={`my-6 sm:my-8 ${alignmentClass[alignment]} ${sizeClassValue}`} style={inlineStyle}>
      {media.width && media.height ? (
        <Image
          src={src}
          alt={media.alt ?? ''}
          width={media.width}
          height={media.height}
          sizes="(min-width: 768px) 880px, 100vw"
          className={imgClassName}
        />
      ) : (
        // Legacy/edge-case media without stored dimensions (next/image
        // requires width+height unless using `fill`) — same visual result,
        // just without Next's optimization pipeline.
        <img src={src} alt={media.alt ?? ''} loading="lazy" className={imgClassName} />
      )}
      {fields.caption && (
        <figcaption className="text-[13px] text-grey-light text-center mt-3 italic break-words">
          {fields.caption}
        </figcaption>
      )}
    </figure>
  )
}
