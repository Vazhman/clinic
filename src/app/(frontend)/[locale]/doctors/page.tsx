import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDoctors, getDoctorsPage, getFeatureToggles, isFeatureEnabled } from "@/lib/payload-data";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import DoctorsListClient from "@/components/doctors/DoctorsListClient";
import StructuredData from "@/components/shared/StructuredData";
import { generateBreadcrumbSchema, generateDoctorsItemListSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const cms = await getDoctorsPage(locale as Locale);

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  return {
    title: `${cms?.title ?? ""} | ${clinicName[locale] || clinicName.ge}`,
    description: cms?.subtitle ?? "",
    alternates: buildLocalizedAlternates(locale as Locale, "/doctors"),
  };
}

export default async function DoctorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const toggles = await getFeatureToggles();
  if (!isFeatureEnabled(toggles, "doctors")) notFound();
  const t = await getTranslations("Doctors");
  const nav = await getTranslations("Navigation");

  const [doctors, cms] = await Promise.all([
    getDoctors(locale as "ge" | "en" | "ru"),
    getDoctorsPage(locale as Locale),
  ]);
  const specialties = [...new Set(doctors.map((d) => d.specialty))].sort();
  const pageTitle = cms?.title ?? "";
  const pageSubtitle = cms?.subtitle ?? "";
  const showLanguages = cms?.showLanguages !== false;

  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: t("title"), url: `/${locale}/doctors` },
        ])}
      />
      <StructuredData
        data={generateDoctorsItemListSchema(
          doctors.map((d) => ({ name: d.name, slug: d.slug })),
        )}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
        <Breadcrumbs
          items={[
            { label: nav("home"), href: "/" },
            { label: t("title") },
          ]}
        />
      </div>

      <section className="relative pt-6 sm:pt-10 pb-10 sm:pb-14 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          {/* Header — editorial: big eyebrow + title, inline stats baseline-aligned */}
          <div className="mb-10 sm:mb-14 flex items-end justify-between flex-wrap gap-y-6 gap-x-10">
            <div className="min-w-0 max-w-2xl">
              <p className="text-pink text-[11px] font-semibold tracking-[0.22em] uppercase mb-5 break-words">
                {pageSubtitle}
              </p>
              <h1 className="text-[clamp(1.8rem,4vw,3.2rem)] font-bold text-blackberry tracking-[-0.02em] leading-[1.05] break-words">
                {pageTitle}
              </h1>
            </div>

            {/* Inline editorial stats — no cards, no icons */}
            <div className="flex items-baseline gap-10">
              <div>
                <p className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold text-blackberry tabular-nums leading-none">{doctors.length}</p>
                <p className="text-[10px] text-grey-light font-semibold tracking-[0.18em] uppercase mt-2">{pageTitle}</p>
              </div>
              <div>
                <p className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold text-blackberry tabular-nums leading-none">{specialties.length}</p>
                <p className="text-[10px] text-grey-light font-semibold tracking-[0.18em] uppercase mt-2">{t("specializations")}</p>
              </div>
            </div>
          </div>

          <DoctorsListClient doctors={doctors} specialties={specialties} showLanguages={showLanguages} />
        </div>
      </section>
    </>
  );
}
