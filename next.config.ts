import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withPayload } from "@payloadcms/next/withPayload";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // WebP only — no AVIF. On the self-hosted cPanel node box there is no CDN
    // and sharp's AVIF encoding is CPU-bound and effectively serialized, so
    // images appear one-by-one. WebP encodes far faster and is universally
    // supported. next/image negotiates per Accept header; originals are the
    // last resort.
    formats: ["image/webp"],
    // Once an image is optimized it stays cached on disk (31 days), so only the
    // first visitor pays the encode cost.
    minimumCacheTTL: 2678400,
    // Narrowed width sets: fewer widths = fewer per-image encodes on this
    // CPU-bound host. These cover the `sizes` props actually used in the app
    // (hero full-width, ~280px doctor cards, ~768px service cards).
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [96, 160, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "khozrevanidze.ge",
      },
      {
        protocol: "https",
        hostname: "www.khozrevanidze.ge",
      },
      // On the Vercel deploy, CMS media is served from Vercel Blob, so
      // next/image must be allowed to fetch it — without this, /_next/image
      // returns 400 for every CMS image.
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  // Baseline security headers applied to every route. These are the
  // universally-safe ones (no risk of breaking page rendering).
  // NOTE: a Content-Security-Policy is intentionally NOT set here yet — a
  // strict CSP needs testing against the live deploy (Google Maps iframe,
  // Vercel Blob images, the beforeInteractive a11y inline script all need
  // allow-listing/nonces) and a wrong policy silently breaks the site.
  // Add it as a report-only policy first once there's a staging URL.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // SAMEORIGIN (not DENY) so the Payload admin live-preview /
          // Puck builder can still frame same-origin pages.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withPayload(withNextIntl(nextConfig));
