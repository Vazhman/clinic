/**
 * Canonical production origin for the whole site.
 *
 * Override per-environment with NEXT_PUBLIC_SITE_URL (Vercel preview deploys,
 * staging, cPanel prod) — falls back to the production domain when unset, so
 * local builds and the live site both work without extra config.
 *
 * Trailing slashes are stripped so callers can always concatenate `${SITE_URL}/path`.
 * Used by canonical/hreflang generation, JSON-LD, robots.txt and the sitemap —
 * keep it the single source of truth for the origin.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.khozrevanidze.ge").replace(/\/+$/, "")

/**
 * When set (e.g. on the Vercel demo deployment), the whole site emits a global
 * noindex — robots.txt disallows everything and every page sends
 * `<meta name="robots" content="noindex">`. This keeps the staging/demo origin
 * (clinic-*.vercel.app) out of Google while its canonical/JSON-LD still point at
 * the real production domain. Leave UNSET on the real production deployment.
 */
export const SITE_NOINDEX =
  process.env.SITE_NOINDEX === "1" || process.env.SITE_NOINDEX === "true"
