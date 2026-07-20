import { NextResponse } from 'next/server'
import { SITE_URL, SITE_NOINDEX } from '@/lib/site'
import { getSiteSettings, getFeatureToggles, isFeatureEnabled, type FeatureTogglesCms } from '@/lib/payload-data'
import { LOCALES, resolveLocalizedPath } from '@/lib/seo-helpers'

// Feature Toggles → the route(s) each one gates, keyed by the same pathKey
// used elsewhere for buildLocalizedAlternates (so the localized slug per
// locale — e.g. /ge/analizebi for lab tests — resolves correctly). Toggles
// with no dedicated route (faq, testimonials, googleReviewsSync, promotions,
// contactForm) have nothing to add here — 404ing a route is what actually
// keeps a page out of the index; this list only covers the ones that DO
// map onto a real path.
const TOGGLE_ROUTES: Partial<Record<keyof NonNullable<FeatureTogglesCms>, string>> = {
  labTests: '/lab-tests',
  blog: '/blog',
  doctors: '/doctors',
  services: '/services',
  booking: '/booking',
}

// Route Handler instead of the `robots.ts` metadata convention — needed so the
// CMS-managed per-bot Allow blocks and the raw `extraRobotsRules` text can be
// appended verbatim, which Next's typed MetadataRoute.Robots shape doesn't support.
const AI_BOT_USER_AGENTS: Record<string, string[]> = {
  gptBot: ['GPTBot'],
  chatGptUser: ['ChatGPT-User'],
  googleExtended: ['Google-Extended'],
  claudeBot: ['ClaudeBot', 'anthropic-ai'],
  perplexityBot: ['PerplexityBot'],
  ccBot: ['CCBot'],
  applebotExtended: ['Applebot-Extended'],
  bytespider: ['Bytespider'],
}

export async function GET() {
  if (SITE_NOINDEX) {
    return new NextResponse('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const [settings, toggles] = await Promise.all([getSiteSettings('ge'), getFeatureToggles()])
  const crawlers = settings?.aiCrawlers

  const lines: string[] = ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /admin', '']

  // Explicit Disallow for every route a Feature Toggle has switched off, in
  // every locale's actual (possibly translated) slug — belt-and-braces on
  // top of the route itself 404ing, so crawlers get an immediate signal
  // instead of waiting to notice the 404.
  for (const [key, pathKey] of Object.entries(TOGGLE_ROUTES)) {
    if (isFeatureEnabled(toggles, key as keyof NonNullable<FeatureTogglesCms>)) continue
    for (const locale of LOCALES) {
      lines.push(`Disallow: /${locale}${resolveLocalizedPath(locale, pathKey)}`)
    }
  }
  if (!isFeatureEnabled(toggles, 'googleReviewsSync')) {
    lines.push('Disallow: /api/sync-google-reviews')
  }
  // healthLibrary defaults OFF (opposite of every other toggle above) — only
  // allowed once the CMS admin explicitly flips it on.
  if (toggles?.healthLibrary !== true) {
    for (const locale of LOCALES) {
      lines.push(`Disallow: /${locale}${resolveLocalizedPath(locale, '/health-library')}`)
    }
  }
  // aiAssistant also defaults OFF — same reasoning as healthLibrary above.
  if (toggles?.aiAssistant !== true) {
    for (const locale of LOCALES) {
      lines.push(`Disallow: /${locale}${resolveLocalizedPath(locale, '/ai-assistant')}`)
    }
  }
  lines.push('')

  for (const [key, userAgents] of Object.entries(AI_BOT_USER_AGENTS)) {
    if (crawlers?.[key as keyof typeof crawlers] === false) continue
    for (const ua of userAgents) {
      lines.push(`User-agent: ${ua}`, 'Allow: /', '')
    }
  }

  if (settings?.extraRobotsRules?.trim()) {
    lines.push(settings.extraRobotsRules.trim(), '')
  }

  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`, `Host: ${SITE_URL}`)

  return new NextResponse(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
