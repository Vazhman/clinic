import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getServices, getDoctors, getFeatureToggles } from "@/lib/payload-data";
import Card from "@/components/shared/Card";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import ServiceIcon from "@/components/shared/ServiceIcon";
import AnatomyExplorer from "@/components/health-library/AnatomyExplorer";
import StructuredData from "@/components/shared/StructuredData";
import { generateBreadcrumbSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HealthLibrary" });

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  return {
    title: `${t("title")} | ${clinicName[locale] || clinicName.ge}`,
    description: t("subtitle"),
    alternates: buildLocalizedAlternates(locale as Locale, "/health-library"),
  };
}

export default async function HealthLibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Gated by FeatureToggles.healthLibrary (src/globals/FeatureToggles.ts),
  // defaulting to OFF — matches the 2026-05-30 client request that hid this
  // page — so the CMS admin can flip it back on without a code change.
  // Nav/footer links stay hidden separately (their own 2026-05-30 decision).
  const toggles = await getFeatureToggles();
  if (toggles?.healthLibrary !== true) notFound();

  const { locale } = await params;
  const t = await getTranslations("HealthLibrary");
  const nav = await getTranslations("Navigation");
  const localeKey = locale as "ge" | "en" | "ru";
  const [services, doctors] = await Promise.all([
    getServices(localeKey),
    getDoctors(localeKey),
  ]);

  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: t("title"), url: `/${locale}/health-library` },
        ])}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { label: nav("home"), href: "/" },
            { label: t("title") },
          ]}
        />
      </div>

      {/* Hero — solid blackberry editorial, matches other landing pages */}
      <section className="relative bg-blackberry py-16 sm:py-20 lg:py-24 overflow-hidden">
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] right-[-10%] w-[620px] h-[620px] bg-pink/[0.10] rounded-full blur-[140px] animate-float" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[420px] h-[420px] bg-pink/[0.05] rounded-full blur-[120px] animate-float" style={{ animationDelay: "-3s" }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 md:px-10">
          <p className="text-pink/70 text-[12px] font-semibold tracking-[0.22em] uppercase mb-5 break-words">{t("subtitle")}</p>
          <h1 className="text-[clamp(2.2rem,5vw,4rem)] font-bold text-white tracking-[-0.02em] leading-[1.05] mb-8 break-words">
            {t("title")}
          </h1>

          <div className="max-w-xl">
            <div className="flex items-center bg-white rounded-full shadow-xl shadow-black/15 overflow-hidden">
              <svg className="w-5 h-5 text-grey-light ml-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="w-full px-4 py-4 text-[15px] text-grey outline-none bg-transparent placeholder:text-grey-light/50"
                readOnly
              />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 3D Anatomy Explorer */}
      <section className="py-10 sm:py-14 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-10">
          <AnatomyExplorer doctors={doctors} />
        </div>
      </section>

      {/* Lab Tests cross-link — Health Library and Lab Tests are sibling
          educational hubs; surface the catalog prominently here since it
          isn't in the main navbar. */}
      <section className="py-10 sm:py-14 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <Link
            href="/lab-tests"
            className="group block rounded-2xl bg-blackberry text-white p-6 sm:p-8 lg:p-10 hover:shadow-xl hover:shadow-blackberry/20 transition-all duration-400 overflow-hidden relative"
          >
            <div aria-hidden className="absolute -right-16 -top-16 w-64 h-64 bg-pink/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="min-w-0 flex-1">
                <p className="text-pink/80 text-[11px] font-semibold tracking-[0.22em] uppercase mb-3 break-words">
                  {nav("healthLibrary")}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 break-words">
                  {t("labTestsCardTitle")}
                </h2>
                <p className="text-white/60 text-[14px] sm:text-[15px] max-w-2xl break-words">
                  {t("labTestsCardDescription")}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 bg-pink text-white text-[13px] font-bold px-6 py-3 rounded-full shrink-0 group-hover:gap-3 transition-all">
                {t("labTestsCardCta")}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Categories grid */}
      <section className="py-10 sm:py-14 lg:py-16 bg-grey-lighter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex items-center gap-4 mb-8 sm:mb-10 min-w-0">
            <div className="w-1.5 h-8 bg-pink rounded-full shrink-0" />
            <h2 className="text-2xl font-bold text-blackberry break-words min-w-0 flex-1">{t("categories")}</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map((service) => (
              <Link key={service.id} href={{ pathname: '/services/[slug]', params: { slug: service.slug } }}>
                <Card variant="bordered" hover className="p-5 text-center group h-full">
                  <div className="w-12 h-12 bg-pink-light rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blackberry transition-colors duration-300">
                    <div className="text-pink group-hover:text-white transition-colors duration-300">
                      <ServiceIcon icon={service.icon} className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="font-bold text-[14px] text-grey group-hover:text-blackberry transition-colors break-words">
                    {service.name}
                  </h3>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
