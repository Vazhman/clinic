import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getServices, getServicesPage } from "@/lib/payload-data";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import ServicesListClient from "@/components/services/ServicesListClient";
import StructuredData from "@/components/shared/StructuredData";
import { generateBreadcrumbSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const cms = await getServicesPage(locale as Locale);

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  return {
    title: `${cms?.title ?? ""} | ${clinicName[locale] || clinicName.ge}`,
    description: cms?.subtitle ?? "",
    alternates: buildLocalizedAlternates(locale as Locale, "/services"),
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [services, cms] = await Promise.all([
    getServices(locale as "ge" | "en" | "ru"),
    getServicesPage(locale as Locale),
  ]);
  const t = await getTranslations("Services");
  const nav = await getTranslations("Navigation");
  const pageTitle = cms?.title ?? "";
  const pageSubtitle = cms?.subtitle ?? "";

  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: pageTitle, url: `/${locale}/services` },
        ])}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
        <Breadcrumbs
          items={[
            { label: nav("home"), href: "/" },
            { label: pageTitle },
          ]}
        />
      </div>

      {/* Hero — solid blackberry, two drifting blobs, editorial type */}
      <section className="relative bg-blackberry py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] right-[-10%] w-[620px] h-[620px] bg-pink/[0.10] rounded-full blur-[140px] animate-float" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[420px] h-[420px] bg-pink/[0.05] rounded-full blur-[120px] animate-float" style={{ animationDelay: "-3s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="max-w-3xl min-w-0">
            <p className="text-pink/70 text-[12px] font-semibold tracking-[0.22em] uppercase mb-5 break-words">{pageSubtitle}</p>
            <h1 className="text-[clamp(2.2rem,5vw,4rem)] font-bold text-white tracking-[-0.02em] leading-[1.05] mb-6 break-words">
              {pageTitle}
            </h1>
            <div className="flex items-baseline gap-4">
              <span className="text-[clamp(2rem,4vw,3rem)] font-bold text-white tabular-nums leading-none">{services.length}</span>
              <span className="text-white/50 text-[13px] tracking-[0.15em] uppercase break-words">{pageSubtitle}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <ServicesListClient services={services} />
        </div>
      </section>

      {/* CTA — quieter, no gradient, typographic */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-blackberry text-center">
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-pink/70 text-[11px] font-semibold tracking-[0.22em] uppercase mb-5">{pageSubtitle}</p>
          <h2 className="text-[clamp(1.6rem,3.2vw,2.6rem)] font-bold text-white mb-4 tracking-[-0.02em] leading-[1.15] break-words">
            {t("cantFindService")}
          </h2>
          <p className="text-white/55 mb-9 text-[15px] leading-[1.6] max-w-[52ch] mx-auto break-words">
            {t("cantFindServiceDesc")}
          </p>
          <Link
            href="/contact"
            className="group inline-flex items-center justify-center gap-3 bg-pink text-white text-[15px] font-bold px-8 sm:px-10 py-4 rounded-full hover:bg-pink-dark hover:shadow-xl hover:shadow-pink/25 hover:-translate-y-0.5 transition-all duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
          >
            <span className="break-words">{t("contactUs")}</span>
            <svg className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
