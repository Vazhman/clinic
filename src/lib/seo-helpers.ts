import { routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site'

const BASE_URL = SITE_URL
export const LOCALES = ["ge","en","ru"] as const
export type Locale = typeof LOCALES[number]

/** ISO 639-1 mapping. Note: "ka" for Georgian; "ge" is the URL slug only. */
const ISO_LANG: Record<Locale, string> = { ge: "ka", en: "en", ru: "ru" }

export function isoLang(locale: Locale): string { return ISO_LANG[locale] }

/** Resolve a localized URL path from `routing.pathnames`. */
export function resolveLocalizedPath(locale: Locale, pathKey: string, params?: Record<string,string>): string {
  const config = (routing.pathnames as Record<string, string | Record<string,string>>)[pathKey]
  let template: string
  if (!config) template = pathKey
  else if (typeof config === "string") template = config
  else template = config[locale] || pathKey
  if (params) for (const [k,v] of Object.entries(params)) template = template.replace(`[${k}]`, v)
  return template
}

/** Full canonical URL for a given locale + pathKey. */
export function localizedUrl(locale: Locale, pathKey: string, params?: Record<string,string>): string {
  return `${BASE_URL}/${locale}${resolveLocalizedPath(locale, pathKey, params)}`
}

/**
 * Build the Metadata.alternates object with correct localized canonical and
 * hreflang values. Uses ISO 639-1 codes for hreflang (ka not ge), with each
 * value pointing to that locale's actual URL.
 */
export function buildLocalizedAlternates(currentLocale: Locale, pathKey: string, params?: Record<string,string>) {
  return {
    canonical: localizedUrl(currentLocale, pathKey, params),
    languages: hreflangLanguages(pathKey, params),
  }
}

/**
 * hreflang `languages` map (ka/en/ru + x-default → Georgian) for a given path.
 * Shared by page metadata (buildLocalizedAlternates) and the sitemap so both
 * emit identical, x-default-complete alternates.
 */
export function hreflangLanguages(pathKey: string, params?: Record<string,string>) {
  return {
    ...Object.fromEntries(
      LOCALES.map((l) => [isoLang(l), localizedUrl(l, pathKey, params)])
    ),
    "x-default": localizedUrl("ge", pathKey, params),
  }
}
