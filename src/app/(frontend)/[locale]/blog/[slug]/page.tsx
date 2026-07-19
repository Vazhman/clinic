import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import LexicalContent from "@/components/blog/LexicalContent";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import PuckArticle from "@/components/blog/PuckArticle";
import type { Data } from "@puckeditor/core";
import StructuredData from "@/components/shared/StructuredData";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";
import { getNewsBySlug, getFeatureToggles, isFeatureEnabled } from "@/lib/payload-data";
import { formatLongDate } from "@/lib/format-date";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale as "ge" | "en" | "ru";
  const article = await getNewsBySlug(slug, loc);

  if (!article) {
    const common = await getTranslations({ locale, namespace: "Common" });
    return { title: common("notFound") };
  }

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  const seo = article.seo as { metaTitle?: string; metaDescription?: string; ogImage?: { url?: string } | number | null; noIndex?: boolean } | undefined;

  return {
    title: seo?.metaTitle || `${article.title} | ${clinicName[locale] || clinicName.ge}`,
    description: seo?.metaDescription || article.excerpt,
    ...(seo?.noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: seo?.metaTitle || article.title,
      description: seo?.metaDescription || article.excerpt,
      type: "article",
      publishedTime: article.publishedDate,
      images: seo?.ogImage && typeof seo.ogImage === 'object' && seo.ogImage
        ? [{ url: seo.ogImage.url ?? "" }]
        : typeof article.featuredImage === "object" && article.featuredImage
          ? [{ url: article.featuredImage.url ?? "" }]
          : [],
    },
    alternates: buildLocalizedAlternates(locale as Locale, "/blog/[slug]", { slug }),
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const toggles = await getFeatureToggles();
  if (!isFeatureEnabled(toggles, "blog")) notFound();
  const nav = await getTranslations("Navigation");
  const blogT = await getTranslations("Blog");
  const loc = locale as "ge" | "en" | "ru";

  const article = await getNewsBySlug(slug, loc);

  if (!article) {
    notFound();
  }

  const featuredImageUrl =
    typeof article.featuredImage === "object" && article.featuredImage
      ? article.featuredImage.url
      : "";

  const categoryLabel =
    typeof article.categoryRef === "object" && article.categoryRef !== null
      ? (article.categoryRef as { name?: string }).name || ""
      : "";

  const tags = Array.isArray((article as { tags?: unknown }).tags)
    ? ((article as { tags: string[] }).tags)
    : [];
  const isFeatured = Boolean((article as { featured?: boolean }).featured);
  const readingTimeMinutes = (article as { readingTimeMinutes?: number }).readingTimeMinutes;
  const gallery = Array.isArray((article as { gallery?: unknown }).gallery)
    ? ((article as { gallery: { url: string; alt: string }[] }).gallery)
    : [];

  return (
    <>
      <StructuredData
        data={generateArticleSchema({
          title: article.title,
          excerpt: article.excerpt,
          publishedDate: article.publishedDate,
          modifiedDate: (article as { updatedAt?: string }).updatedAt || undefined,
          author: article.author || undefined,
          featuredImage: featuredImageUrl || undefined,
          slug,
          locale,
        })}
      />
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: nav("blog"), url: `/${locale}/blog` },
          { name: article.title, url: `/${locale}/blog/${slug}` },
        ])}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { label: nav("home"), href: "/" },
            { label: nav("blog"), href: "/blog" },
            { label: article.title },
          ]}
        />
      </div>

      <article className="py-8 sm:py-10 lg:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-8 sm:mb-10">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
              {isFeatured && (
                <span className="bg-blackberry text-white text-[10px] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full break-words">
                  {blogT("featured")}
                </span>
              )}
              <span className="bg-pink text-white text-[10px] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full break-words">
                {categoryLabel}
              </span>
              <span className="text-[13px] text-grey-light break-words">
                {formatLongDate(article.publishedDate, locale)}
              </span>
              {typeof readingTimeMinutes === "number" && (
                <span className="text-[13px] text-grey-light break-words">
                  {blogT("readingTime", { minutes: readingTimeMinutes })}
                </span>
              )}
            </div>
            <h1 className="text-[clamp(1.5rem,4vw,3rem)] sm:text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight text-blackberry leading-tight break-words">
              {article.title}
            </h1>
            {article.author && (
              <p className="text-[14px] text-grey-light mt-4 break-words">
                {article.author}
              </p>
            )}
          </div>

          {featuredImageUrl && (
            <div className="mb-8 sm:mb-10 rounded-xl sm:rounded-2xl overflow-hidden aspect-[16/9] bg-grey-lighter">
              <img
                src={featuredImageUrl}
                alt={
                  typeof article.featuredImage === "object"
                    ? article.featuredImage?.alt || article.title
                    : article.title
                }
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {article.puckData && typeof article.puckData === 'object' && 'content' in article.puckData ? (
            <PuckArticle data={article.puckData as Data} locale={loc} />
          ) : (
            article.body && typeof article.body === 'object' && 'root' in article.body && (
              <LexicalContent data={article.body as SerializedEditorState} />
            )
          )}

          {gallery.length > 0 && (
            <div className="mt-10 sm:mt-12 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {gallery.map((image, i) => (
                <div
                  key={`${image.url}-${i}`}
                  className="rounded-lg sm:rounded-xl overflow-hidden aspect-[4/3] bg-grey-lighter"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt || article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-8 sm:mt-10 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[12px] text-grey bg-grey-lighter px-3 py-1 rounded-full break-words"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </>
  );
}
