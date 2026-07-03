import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, getFormatter } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import Button from "@/components/shared/Button";
import SnapCarousel from "@/components/shared/SnapCarousel";
import StructuredData from "@/components/shared/StructuredData";
import LexicalContent from "@/components/blog/LexicalContent";
import { generateBreadcrumbSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";
import { SITE_URL } from "@/lib/site";
import { getLabTestBySlug } from "@/lib/payload-data";

// Lexical bodies arrive as `unknown` from the data layer (the Payload type is
// open-ended). Casting to `never` lets the typed RichText component accept it
// without a structural shape declaration here — the runtime renderer in
// LexicalContent has its own narrowing.
function hasContent(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const root = (data as { root?: { children?: unknown[] } }).root;
  return Array.isArray(root?.children) && root.children.length > 0;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const test = await getLabTestBySlug(slug, locale as Locale);

  if (!test) {
    const common = await getTranslations({ locale, namespace: "Common" });
    return { title: common("notFound") };
  }

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  return {
    title: test.seo?.metaTitle || `${test.title} | ${clinicName[locale] || clinicName.ge}`,
    description: test.seo?.metaDescription || test.summary,
    ...(test.seo?.noIndex ? { robots: { index: false, follow: true } } : {}),
    ...(test.seo?.ogImage ? { openGraph: { images: [{ url: test.seo.ogImage }] } } : {}),
    alternates: buildLocalizedAlternates(locale as Locale, "/lab-tests/[slug]", { slug }),
  };
}

export default async function LabTestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const test = await getLabTestBySlug(slug, locale as Locale);

  if (!test) notFound();

  const t = await getTranslations("LabTests");
  const nav = await getTranslations("Navigation");
  const formatter = await getFormatter();

  const sections: Array<{ key: "overview" | "whyDone" | "preparation" | "whatToExpect" | "interpretation"; data: unknown }> = [
    { key: "overview", data: test.overview },
    { key: "whyDone", data: test.whyDone },
    { key: "preparation", data: test.preparation },
    { key: "whatToExpect", data: test.whatToExpect },
    { key: "interpretation", data: test.interpretation },
  ];

  const visibleSections = sections.filter((s) => hasContent(s.data));

  const breadcrumbItems = [
    { name: nav("home"), url: `/${locale}` },
    { name: t("title"), url: `/${locale}/lab-tests` },
    { name: test.title, url: `/${locale}/lab-tests/${slug}` },
  ];

  const medicalTestSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalTest",
    name: test.title,
    description: test.summary,
    url: `${SITE_URL}/${locale}/lab-tests/${slug}`,
    ...(test.aliases.length > 0 ? { alternateName: test.aliases } : {}),
    ...(test.reviewedBy
      ? {
          reviewedBy: {
            "@type": "Person",
            name: test.reviewedBy.name,
            url: `${SITE_URL}/${locale}/doctors/${test.reviewedBy.slug}`,
          },
        }
      : {}),
    ...(test.lastReviewed ? { dateModified: test.lastReviewed } : {}),
    provider: {
      "@type": "MedicalClinic",
      name: "Khozrevanidze Clinic",
      url: SITE_URL,
    },
  };

  return (
    <>
      <StructuredData data={generateBreadcrumbSchema(breadcrumbItems)} />
      <StructuredData data={medicalTestSchema} />

      {/* Hero */}
      <section className="bg-blackberry py-10 sm:py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <Breadcrumbs
            items={[
              { label: nav("home"), href: "/" },
              { label: t("title"), href: "/lab-tests" },
              { label: test.title },
            ]}
          />
          <p className="text-pink/70 text-[12px] font-semibold tracking-[0.22em] uppercase mt-4 mb-3 break-words">
            {t(`categories.${test.category}`)}
          </p>
          <h1 className="text-[clamp(1.6rem,4vw,3rem)] font-bold text-pink mb-4 tracking-tight break-words">
            {test.title}
          </h1>
          {test.summary && (
            <p className="text-base sm:text-lg text-white/70 max-w-2xl break-words">
              {test.summary}
            </p>
          )}
          {test.aliases.length > 0 && (
            <p className="mt-5 text-white/50 text-[13px] break-words">
              <span className="text-white/70 font-semibold">{t("alsoKnownAs")}:</span>{" "}
              {test.aliases.join(", ")}
            </p>
          )}
          {(test.reviewedBy || test.lastReviewed) && (
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-white/50">
              {test.reviewedBy && (
                <Link
                  href={{ pathname: "/doctors/[slug]", params: { slug: test.reviewedBy.slug } }}
                  className="hover:text-pink transition-colors break-words"
                >
                  {t("reviewedBy", { name: test.reviewedBy.name })}
                </Link>
              )}
              {test.lastReviewed && (
                <span className="break-words">
                  {t("lastReviewed", {
                    date: formatter.dateTime(new Date(test.lastReviewed), { year: "numeric", month: "long", day: "numeric" }),
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Six Mayo-style content sections */}
      <article className="py-10 sm:py-14 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
          {visibleSections.map(({ key, data }) => (
            <section key={key}>
              <h2 className="text-2xl sm:text-3xl font-bold text-blackberry mb-4 sm:mb-5 break-words">
                {t(`sections.${key}`)}
              </h2>
              <LexicalContent data={data as never} />
            </section>
          ))}
        </div>
      </article>

      {/* Related tests */}
      {test.relatedTests.length > 0 && (
        <section className="py-10 sm:py-14 lg:py-16 bg-grey-lighter">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-blackberry mb-5 sm:mb-6 break-words">
              {t("relatedTests")}
            </h2>
            <SnapCarousel
              ariaLabel={t("relatedTests")}
              cardWidth="78vw"
              gapClassName="gap-3"
              className="sm:gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3"
            >
              {test.relatedTests.map((item) => (
                  <Link
                    key={item.id}
                    href={{ pathname: "/lab-tests/[slug]", params: { slug: item.slug } }}
                    className="group block h-full rounded-xl border border-grey-lighter bg-white p-4 sm:p-5 hover:border-pink/40 hover:shadow-md transition-all duration-300"
                  >
                    <h3 className="font-bold text-blackberry text-[15px] sm:text-base group-hover:text-pink transition-colors mb-1.5 break-words">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="text-sm text-grey-light line-clamp-2 break-words">{item.summary}</p>
                    )}
                  </Link>
              ))}
            </SnapCarousel>
          </div>
        </section>
      )}

      {/* Booking CTA */}
      <section className="py-12 sm:py-16 lg:py-20 bg-blackberry text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 break-words">
            {t("bookConsultation")}
          </h2>
          {test.summary && (
            <p className="text-white/70 mb-6 sm:mb-8 break-words">{test.summary}</p>
          )}
          <Button href="/booking" variant="secondary" size="lg">
            {t("bookConsultation")}
          </Button>
        </div>
      </section>
    </>
  );
}
