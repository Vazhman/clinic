"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import NewsCard from "./NewsCard";
import AnimateIn from "@/components/shared/AnimateIn";
import SnapCarousel from "@/components/shared/SnapCarousel";

type NewsItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedDate: string;
  featuredImage: { url: string; alt: string };
};

export default function NewsSection({ news }: { news: NewsItem[] }) {
  const t = useTranslations("Blog");

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-cream">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        <AnimateIn className="flex items-end justify-between flex-wrap gap-4 sm:gap-6 mb-10 sm:mb-14">
          <div className="min-w-0">
            <p className="text-pink text-[12px] font-medium tracking-[0.2em] uppercase mb-3 break-words">
              {t("subtitle")}
            </p>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-bold tracking-tight text-blackberry break-words">
              {t("title")}
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-[13px] font-medium text-blackberry hover:text-pink transition-colors flex items-center gap-2 shrink-0"
          >
            {t("viewAll")}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </AnimateIn>

        {/* Mobile: centered snap carousel (active card front-and-center,
            neighbours peek + recede). sm+: unchanged grid. */}
        <SnapCarousel
          ariaLabel={t("title")}
          cardWidth="80vw"
          gapClassName="gap-5"
          className="sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6"
        >
          {news.map((item) => (
            <NewsCard key={item.id} {...item} />
          ))}
        </SnapCarousel>
      </div>
    </section>
  );
}
