// Georgian → Latin transliteration (national 2002 system, apostrophes dropped
// for readability). Used so the AI chat shows doctor names in Latin script for
// English/Russian users when the CMS only has the Georgian name (the
// Doctra-imported doctors have no localized English/Russian name, so Payload
// falls back to Georgian).

const KA_TO_LATIN: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i',
  კ: 'k', ლ: 'l', მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'zh', რ: 'r', ს: 's',
  ტ: 't', უ: 'u', ფ: 'p', ქ: 'k', ღ: 'gh', ყ: 'q', შ: 'sh', ჩ: 'ch', ც: 'ts',
  ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh', ჯ: 'j', ჰ: 'h',
}

export function hasGeorgian(s: string): boolean {
  return /[Ⴀ-ჿ]/.test(s)
}

export function transliterateKa(input: string): string {
  if (!input) return input
  let out = ''
  for (const ch of input) out += KA_TO_LATIN[ch] ?? ch
  // Capitalize the first letter of each word (proper-name casing).
  return out.replace(/(^|[\s-])([a-z])/g, (_m, sep: string, c: string) => sep + c.toUpperCase())
}

// Convenience: transliterate only when the target locale isn't Georgian AND
// the value actually contains Georgian characters. Otherwise pass through.
export function localizeName(value: string, locale: string): string {
  if (locale === 'ge') return value
  return hasGeorgian(value) ? transliterateKa(value) : value
}

// Filename sanitizer for uploads (Item 6 fix).
//
// Payload's own filename handling (generateFileData.js / getSafeFilename.js)
// uses the `sanitize-filename` package, which only strips illegal path
// characters — it does NOT transliterate or reject Unicode. The
// @vercel/blob SDK is even more permissive: it only disallows a literal
// "//" in the pathname. Net effect: a Georgian (or any non-ASCII) filename
// sailed straight through every layer of the pipeline and became the actual
// Vercel Blob storage key, which is what caused production 400s on doctor
// photos uploaded with Georgian filenames.
//
// This produces a guaranteed ASCII-safe, URL-safe filename: Georgian is
// transliterated to Latin (reusing the same map used for doctor names),
// other scripts have diacritics stripped via NFKD, and anything left over
// is slugified. If nothing usable survives (e.g. a CJK-only or emoji-only
// name) it falls back to a short random token so uploads never fail outright.
//
// Used from two places so both upload paths are covered end-to-end:
//   1. `beforeOperation` hook on the Media collection (direct/multipart
//      upload path — local disk adapter, API/curl uploads).
//   2. Patched inline into `VercelBlobClientUploadHandler.js` (the
//      `clientUploads: true` path actually used in production) — the
//      browser uploads straight to Vercel Blob using the pathname the
//      client computes, so a server-side hook alone cannot fix that path;
//      the vendor file must be patched with the same logic (see
//      patches/@payloadcms+storage-vercel-blob+3.83.0.patch).
export function sanitizeFilename(originalName: string): string {
  if (!originalName) return originalName

  const lastDot = originalName.lastIndexOf('.')
  const hasExt = lastDot > 0 && lastDot < originalName.length - 1
  const base = hasExt ? originalName.slice(0, lastDot) : originalName
  const ext = hasExt ? originalName.slice(lastDot + 1) : ''

  let safeBase = transliterateKa(base)
  // Strip combining diacritical marks left over from other Latin-adjacent
  // scripts (é, ñ, ü, etc.) after NFKD decomposition.
  safeBase = safeBase.normalize('NFKD').replace(/[̀-ͯ]/g, '')
  // Slugify: lowercase, collapse anything non-alphanumeric into a single
  // dash, trim leading/trailing dashes, cap length.
  safeBase = safeBase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)

  if (!safeBase) {
    safeBase = `file-${Math.random().toString(36).slice(2, 10)}`
  }

  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)
  return safeExt ? `${safeBase}.${safeExt}` : safeBase
}
