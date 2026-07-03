import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withPayload } from "@payloadcms/next/withPayload";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // AVIF first (≈20-30% smaller than WebP), WebP fallback. next/image
    // negotiates per Accept header; originals are the last resort.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "khozrevanidze.ge",
      },
      {
        protocol: "https",
        hostname: "www.khozrevanidze.ge",
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
