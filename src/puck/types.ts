// Locale map: one value per site language. `ge` is the source-of-truth
// fallback (matches the rest of the codebase).
export type BuilderLocale = 'ge' | 'en' | 'ru'
export const BUILDER_LOCALES: BuilderLocale[] = ['ge', 'en', 'ru']

export type Loc<T> = Partial<Record<BuilderLocale, T>>

// Resolve a locale map to a concrete value, falling back to ge then ''.
export function pickLocale<T>(map: Loc<T> | undefined, locale: BuilderLocale): T | undefined {
  if (!map) return undefined
  return map[locale] ?? map.ge
}

export function pickText(map: Loc<string> | undefined, locale: BuilderLocale): string {
  return pickLocale(map, locale) ?? ''
}

// A media reference stored by the external Media field.
export type MediaRef = {
  id: string | number
  url: string
  alt?: string | null
  width?: number | null
  height?: number | null
}
