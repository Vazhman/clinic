import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import ContactMap from "@/components/home/ContactMap";
import StructuredData from "@/components/shared/StructuredData";
import { generateClinicSchema, generateBreadcrumbSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";
import { getContactPage, getReviews } from "@/lib/payload-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  return {
    title: `${t("title")} | ${clinicName[locale] || clinicName.ge}`,
    description: `${t("addressValue")} | ${t("phoneValue")}`,
    alternates: buildLocalizedAlternates(locale as Locale, "/contact"),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const nav = await getTranslations("Navigation");
  const [contactCms, reviews] = await Promise.all([
    getContactPage(locale as Locale),
    getReviews(locale as Locale),
  ]);

  // Editorial content reads straight from the CMS (ContactPage global). Title
  // tracks ContactPage.title; the visible address strip tracks address.value.
  const pageTitle = contactCms?.title?.trim() ?? "";
  const pageAddress = contactCms?.address?.value?.trim() ?? "";

  return (
    <>
      <StructuredData data={generateClinicSchema(locale, reviews)} />
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: pageTitle, url: `/${locale}/contact` },
        ])}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: nav("home"), href: "/" }, { label: pageTitle }]} />
      </div>

      {/* Hero — solid blackberry editorial. ContactMap below already has its
         own blackberry section, but the page hero gives a clear title above
         it and matches the rhythm of other landing pages. */}
      <section className="relative bg-cream py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10">
          <p className="text-pink text-[11px] font-semibold tracking-[0.22em] uppercase mb-5">{pageTitle}</p>
          <h1 className="text-[clamp(2rem,4.5vw,3.6rem)] font-bold text-blackberry tracking-[-0.02em] leading-[1.05] mb-6 break-words">
            {pageTitle}
          </h1>
          <p className="text-grey-light text-[16px] sm:text-[17px] leading-[1.6] max-w-[55ch] break-words">
            {pageAddress}
          </p>
        </div>
      </section>

      <ContactMap contact={contactCms} />
    </>
  );
}
