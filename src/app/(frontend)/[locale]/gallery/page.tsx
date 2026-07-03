import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StructuredData from "@/components/shared/StructuredData";
import { generateBreadcrumbSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";

// Read the clinic photo set from /public/images/gallery at request time so new
// photos dropped into that folder appear automatically (no code change).
function getGalleryImages(): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "images", "gallery");
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort()
      .map((f) => `/images/gallery/${f}`);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Gallery" });

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  return {
    title: `${t("title")} | ${clinicName[locale] || clinicName.ge}`,
    description: t("subtitle"),
    alternates: buildLocalizedAlternates(locale as Locale, "/gallery"),
  };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const nav = await getTranslations("Navigation");
  const t = await getTranslations("Gallery");
  const images = getGalleryImages();

  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: t("title"), url: `/${locale}/gallery` },
        ])}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: nav("home"), href: "/" }, { label: t("title") }]} />
      </div>

      {/* Hero — solid blackberry editorial, matches About/Blog */}
      <section className="relative bg-blackberry py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] right-[-10%] w-[620px] h-[620px] bg-pink/[0.10] rounded-full blur-[140px] animate-float" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[420px] h-[420px] bg-pink/[0.05] rounded-full blur-[120px] animate-float" style={{ animationDelay: "-3s" }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 md:px-10">
          <p className="text-pink/70 text-[12px] font-semibold tracking-[0.22em] uppercase mb-5 break-words">{t("title")}</p>
          <h1 className="text-[clamp(2.2rem,5vw,4rem)] font-bold text-white tracking-[-0.02em] leading-[1.05] mb-6 break-words">
            {t("heading")}
          </h1>
          <p className="text-white/70 text-[17px] leading-[1.6] max-w-[60ch] break-words">{t("subtitle")}</p>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          {images.length === 0 ? (
            <p className="text-center text-grey-light">{t("empty")}</p>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:balance]">
              {images.map((src, i) => (
                <div
                  key={src}
                  className="mb-4 overflow-hidden rounded-2xl bg-grey-lighter break-inside-avoid"
                >
                  {/* Plain img keeps the masonry columns intact and lazy-loads
                      everything below the fold; alt is generic clinic context. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${t("title")} — ${i + 1}`}
                    loading={i < 4 ? "eager" : "lazy"}
                    className="w-full h-auto object-cover transition-transform duration-500 hover:scale-[1.03]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
