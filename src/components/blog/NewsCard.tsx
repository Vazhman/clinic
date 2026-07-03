"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatLongDate } from "@/lib/format-date";

type NewsCardProps = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedDate: string;
  featuredImage: { url: string; alt: string };
};

const categoryKeyMap: Record<string, string> = {
  "health-tips": "categoryHealthTips",
  "clinic-news": "categoryClinicNews",
  "medical-info": "categoryMedicalInfo",
  announcements: "categoryAnnouncements",
};

export default function NewsCard({ slug, title, excerpt, category, publishedDate, featuredImage }: NewsCardProps) {
  const t = useTranslations("Blog");
  const locale = useLocale();

  const categoryLabel = categoryKeyMap[category] ? t(categoryKeyMap[category]) : category;

  return (
    <Link href={{ pathname: "/blog/[slug]", params: { slug } }} className="block group h-full">
      <article className="relative h-full flex flex-col bg-white rounded-2xl overflow-hidden border border-grey-lighter/70 transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 group-hover:border-pink/25 group-hover:shadow-[0_24px_50px_-26px_rgba(104,33,73,0.32)]">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-grey-lighter">
          {featuredImage.url && (
            <img
              src={featuredImage.url}
              alt={featuredImage.alt || title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
            />
          )}
          {/* scrim deepens on hover for a more editorial feel */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-blackberry/35 via-blackberry/0 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />
          <span className="absolute top-3 left-3 sm:top-4 sm:left-4 inline-flex items-center bg-white/92 backdrop-blur-sm text-blackberry text-[10px] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full shadow-sm max-w-[calc(100%-1.5rem)] break-words">
            {categoryLabel}
          </span>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 flex-1 flex flex-col min-w-0">
          <p className="text-[11px] text-grey-light font-semibold tracking-wide mb-2.5 tabular-nums">
            {formatLongDate(publishedDate, locale)}
          </p>
          <h3 className="text-[16.5px] font-bold text-blackberry leading-snug mb-2.5 line-clamp-2 break-words transition-colors duration-300 group-hover:text-pink">
            {title}
          </h3>
          <p className="text-[13px] text-grey-light leading-relaxed flex-1 line-clamp-2 break-words">
            {excerpt}
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-blackberry">
            {t("readMore")}
            <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>

        {/* Accent line grows across the bottom on hover */}
        <span aria-hidden className="absolute left-0 bottom-0 h-[3px] w-0 bg-gradient-to-r from-blackberry to-pink transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
      </article>
    </Link>
  );
}
