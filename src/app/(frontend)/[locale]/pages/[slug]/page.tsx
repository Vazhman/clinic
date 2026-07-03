import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import LexicalContent from "@/components/blog/LexicalContent";
import { getPageBySlug } from "@/lib/payload-pages";
import StructuredData from "@/components/shared/StructuredData";
import { generateBreadcrumbSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getPageBySlug(slug, locale as "ge" | "en" | "ru");

  if (!page) {
    const common = await getTranslations({ locale, namespace: "Common" });
    return { title: common("notFound") };
  }

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  const seo = page.seo as {
    metaTitle?: string;
    metaDescription?: string;
    noIndex?: boolean;
    ogImage?: { url?: string | null } | string | null;
  } | undefined;
  const ogImageUrl =
    seo?.ogImage && typeof seo.ogImage === "object" ? seo.ogImage.url ?? "" : "";

  return {
    title: seo?.metaTitle || `${page.title} | ${clinicName[locale] || clinicName.ge}`,
    ...(seo?.metaDescription ? { description: seo.metaDescription } : {}),
    ...(seo?.noIndex ? { robots: { index: false, follow: true } } : {}),
    ...(ogImageUrl
      ? {
          openGraph: {
            type: "article",
            title: seo?.metaTitle || page.title,
            ...(seo?.metaDescription ? { description: seo.metaDescription } : {}),
            images: [{ url: ogImageUrl }],
          },
        }
      : {}),
    alternates: buildLocalizedAlternates(locale as Locale, "/pages/[slug]", { slug }),
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const nav = await getTranslations("Navigation");
  const page = await getPageBySlug(slug, locale as "ge" | "en" | "ru");

  if (!page) notFound();

  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: page.title, url: `/${locale}/pages/${slug}` },
        ])}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { label: nav("home"), href: "/" },
            { label: page.title },
          ]}
        />
      </div>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-blackberry mb-6 break-words">{page.title}</h1>
        {page.body && <LexicalContent data={page.body as never} />}
      </article>
    </>
  );
}
