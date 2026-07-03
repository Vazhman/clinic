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
