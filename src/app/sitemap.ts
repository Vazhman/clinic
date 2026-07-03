import type { MetadataRoute } from "next";
import { LOCALES, localizedUrl, hreflangLanguages } from "@/lib/seo-helpers";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages (always available, no DB needed)
  const staticPages = [
    { path: "/", priority: 1, freq: "daily" as const },
    { path: "/about", priority: 0.8, freq: "monthly" as const },
    { path: "/services", priority: 0.9, freq: "weekly" as const },
    { path: "/doctors", priority: 0.9, freq: "weekly" as const },
    { path: "/checkups", priority: 0.8, freq: "monthly" as const },
    // DISABLED 2026-05-30 per client request — Health Library excluded from sitemap (route now 404s).
    // { path: "/health-library", priority: 0.7, freq: "weekly" as const },
    { path: "/blog", priority: 0.8, freq: "daily" as const },
    { path: "/lab-tests", priority: 0.7, freq: "weekly" as const },
    { path: "/gallery", priority: 0.6, freq: "monthly" as const },
    { path: "/contact", priority: 0.7, freq: "monthly" as const },
  ];

  for (const page of staticPages) {
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl(locale, page.path),
        changeFrequency: page.freq,
        priority: page.priority,
        alternates: { languages: hreflangLanguages(page.path) },
      });
    }
  }

  // Dynamic content from Payload — wrapped in try/catch for build time
  // (DB may not exist during Vercel build, sitemap regenerates at runtime)
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });

    // All five collection queries are independent — run them in parallel so
    // a sitemap request costs one DB round-trip of latency, not five.
    const [services, doctors, news, labTests, pages, policies] = await Promise.all([
      payload.find({ collection: "services", limit: 100, depth: 0 }),
      payload.find({ collection: "doctors", limit: 200, depth: 0 }),
      payload.find({
        collection: "news",
        limit: 200,
        depth: 0,
        where: { status: { equals: "published" } },
      }),
      payload.find({
        collection: "lab-tests",
        limit: 500,
        depth: 0,
        where: { published: { equals: true } },
      }),
      payload.find({
        collection: "pages",
        limit: 200,
        depth: 0,
        where: { status: { equals: "published" } },
      }),
      payload.find({
        collection: "policies",
        limit: 200,
        depth: 0,
        where: { status: { equals: "published" } },
      }),
    ]);

    // Services
    for (const service of services.docs) {
      for (const locale of LOCALES) {
        entries.push({
          url: localizedUrl(locale, "/services/[slug]", { slug: service.slug }),
          lastModified: service.updatedAt ? new Date(service.updatedAt) : undefined,
          changeFrequency: "monthly",
          priority: 0.7,
          alternates: { languages: hreflangLanguages("/services/[slug]", { slug: service.slug }) },
        });
      }
    }

    // Doctors
    for (const doctor of doctors.docs) {
      for (const locale of LOCALES) {
        entries.push({
          url: localizedUrl(locale, "/doctors/[slug]", { slug: doctor.slug }),
          lastModified: doctor.updatedAt ? new Date(doctor.updatedAt) : undefined,
          changeFrequency: "monthly",
          priority: 0.7,
          alternates: { languages: hreflangLanguages("/doctors/[slug]", { slug: doctor.slug }) },
        });
      }
    }

    // News
    for (const post of news.docs) {
      for (const locale of LOCALES) {
        entries.push({
          url: localizedUrl(locale, "/blog/[slug]", { slug: post.slug }),
          lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(post.publishedDate),
          changeFrequency: "weekly",
          priority: 0.6,
          alternates: { languages: hreflangLanguages("/blog/[slug]", { slug: post.slug }) },
        });
      }
    }

    // Lab tests (published only — the public list filters on `published`)
    for (const test of labTests.docs) {
      for (const locale of LOCALES) {
        entries.push({
          url: localizedUrl(locale, "/lab-tests/[slug]", { slug: test.slug }),
          lastModified: test.updatedAt ? new Date(test.updatedAt) : undefined,
          changeFrequency: "monthly",
          priority: 0.6,
          alternates: { languages: hreflangLanguages("/lab-tests/[slug]", { slug: test.slug }) },
        });
      }
    }

    // Pages
    for (const page of [...pages.docs, ...policies.docs]) {
      for (const locale of LOCALES) {
        entries.push({
          url: localizedUrl(locale, "/pages/[slug]", { slug: page.slug }),
          lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
          changeFrequency: "weekly",
          priority: 0.6,
          alternates: { languages: hreflangLanguages("/pages/[slug]", { slug: page.slug }) },
        });
      }
    }
  } catch {
    // DB not available during build — static pages only, dynamic entries added at runtime
  }

  return entries;
}
