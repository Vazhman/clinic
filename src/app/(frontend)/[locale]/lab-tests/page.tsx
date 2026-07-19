import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StructuredData from "@/components/shared/StructuredData";
import { generateBreadcrumbSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";
import {
  getLabTests,
  getFeatureToggles,
  isFeatureEnabled,
  type LabTestCategory,
  type LabTestListItem,
} from "@/lib/payload-data";

// Order in which categories are rendered. Anything returned by the API but
// not listed here lands at the bottom under 'other'. Ordering chosen to put
// the high-volume groups (hematology, biochemistry, hormones) above the fold.
const CATEGORY_ORDER: LabTestCategory[] = [
  "hematology",
  "biochemistry",
  "hormones",
  "infections",
  "immunology",
  "cardiology",
  "oncology",
  "prenatal",
  "urinalysis",
  "genetics",
  "other",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "LabTests" });

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  return {
    title: `${t("title")} | ${clinicName[locale] || clinicName.ge}`,
    description: t("subtitle"),
    alternates: buildLocalizedAlternates(locale as Locale, "/lab-tests"),
  };
}

export default async function LabTestsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const toggles = await getFeatureToggles();
  if (!isFeatureEnabled(toggles, "labTests")) notFound();
  const tests = await getLabTests(locale as Locale);
  const t = await getTranslations("LabTests");
  const nav = await getTranslations("Navigation");

  // Group by category, preserving CATEGORY_ORDER and dropping empty groups.
  const grouped: Array<{ category: LabTestCategory; items: LabTestListItem[] }> = [];
  for (const cat of CATEGORY_ORDER) {
    const items = tests.filter((t) => t.category === cat);
    if (items.length > 0) grouped.push({ category: cat, items });
  }

  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: t("title"), url: `/${locale}/lab-tests` },
        ])}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
        <Breadcrumbs
          items={[
            { label: nav("home"), href: "/" },
            { label: t("title") },
          ]}
        />
      </div>

      {/* Hero */}
      <section className="relative bg-blackberry py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] right-[-10%] w-[620px] h-[620px] bg-pink/[0.10] rounded-full blur-[140px] animate-float" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[420px] h-[420px] bg-pink/[0.05] rounded-full blur-[120px] animate-float" style={{ animationDelay: "-3s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="max-w-3xl min-w-0">
            <p className="text-pink/70 text-[12px] font-semibold tracking-[0.22em] uppercase mb-5 break-words">{t("subtitle")}</p>
            <h1 className="text-[clamp(2.2rem,5vw,4rem)] font-bold text-white tracking-[-0.02em] leading-[1.05] mb-6 break-words">
              {t("title")}
            </h1>
            {tests.length > 0 && (
              <div className="flex items-baseline gap-4">
                <span className="text-[clamp(2rem,4vw,3rem)] font-bold text-white tabular-nums leading-none">{tests.length}</span>
                <span className="text-white/50 text-[13px] tracking-[0.15em] uppercase break-words">{t("subtitle")}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          {grouped.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-grey text-base sm:text-lg">{t("empty")}</p>
            </div>
          ) : (
            <div className="space-y-12 sm:space-y-16">
              {grouped.map(({ category, items }) => (
                <div key={category}>
                  <h2 className="text-xl sm:text-2xl font-bold text-blackberry mb-5 sm:mb-6 break-words border-b border-pink/20 pb-3">
                    {t(`categories.${category}`)}
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={{ pathname: "/lab-tests/[slug]", params: { slug: item.slug } }}
                          className="group block rounded-xl border border-grey-lighter bg-white p-4 sm:p-5 hover:border-pink/40 hover:shadow-md transition-all duration-300"
                        >
                          <h3 className="font-bold text-blackberry text-[15px] sm:text-base group-hover:text-pink transition-colors mb-1.5 break-words">
                            {item.title}
                          </h3>
                          {item.summary && (
                            <p className="text-sm text-grey-light line-clamp-2 break-words whitespace-pre-wrap">{item.summary}</p>
                          )}
                          {(item.price !== null || !item.active) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {item.price !== null && (
                                <span className="inline-flex items-center rounded-full bg-pink/10 px-2.5 py-0.5 text-[11px] font-semibold text-pink">
                                  {item.price} {item.currency ?? "GEL"}
                                </span>
                              )}
                              {!item.active && (
                                <span className="inline-flex items-center rounded-full bg-grey-lighter px-2.5 py-0.5 text-[11px] font-semibold text-grey">
                                  {t("notCurrentlyAvailable")}
                                </span>
                              )}
                            </div>
                          )}
                          <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-pink group-hover:gap-2 transition-all">
                            {t("viewTest")}
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
