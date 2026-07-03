import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import BlogList from "@/components/blog/BlogList";
import StructuredData from "@/components/shared/StructuredData";
import { generateBreadcrumbSchema } from "@/lib/structured-data";
import { getAllNews } from "@/lib/payload-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  const nav = await getTranslations({ locale, namespace: "Navigation" });

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  return {
    title: `${nav("blog")} | ${clinicName[locale] || clinicName.ge}`,
    description: t("subtitle"),
    alternates: buildLocalizedAlternates(locale as Locale, "/blog"),
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const nav = await getTranslations("Navigation");
  const t = await getTranslations("Blog");
  const tBook = await getTranslations("Hero");
  const loc = locale as "ge" | "en" | "ru";

  const { docs: news } = await getAllNews(loc);

  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: nav("blog"), url: `/${locale}/blog` },
        ])}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: nav("home"), href: "/" }, { label: nav("blog") }]} />
      </div>

      {/* Hero — solid blackberry editorial */}
      <section className="relative bg-blackberry py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] right-[-10%] w-[620px] h-[620px] bg-pink/[0.10] rounded-full blur-[140px] animate-float" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[420px] h-[420px] bg-pink/[0.05] rounded-full blur-[120px] animate-float" style={{ animationDelay: "-3s" }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 md:px-10">
          <p className="text-pink/70 text-[12px] font-semibold tracking-[0.22em] uppercase mb-5 break-words">{nav("blog")}</p>
          <h1 className="text-[clamp(2.2rem,5vw,4rem)] font-bold text-white tracking-[-0.02em] leading-[1.05] mb-6 break-words">
            {t("title")}
          </h1>
          <p className="text-white/70 text-[17px] leading-[1.6] max-w-[60ch] break-words">
            {t("subtitle")}
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          {news.length === 0 ? (
            <div className="text-center max-w-2xl mx-auto">
              <span aria-hidden className="block h-[3px] w-[72px] bg-pink rounded-full mx-auto mb-8" />
              <p className="text-[clamp(1.15rem,2vw,1.5rem)] text-blackberry leading-[1.55] font-medium mb-10 break-words">
                {t("noArticles")}
              </p>
              <Link
                href="/booking"
                className="group inline-flex items-center gap-3 bg-blackberry text-white text-[15px] font-bold px-8 sm:px-10 py-4 rounded-full hover:bg-blackberry-light hover:shadow-xl hover:shadow-blackberry/15 hover:-translate-y-0.5 transition-all duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
              >
                {tBook("bookVisit")}
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          ) : (
            <BlogList news={news} />
          )}
        </div>
      </section>
    </>
  );
}
