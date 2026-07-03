"use client";

import { m } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import NewsCard from "./NewsCard";
import { formatLongDate } from "@/lib/format-date";

type BlogItem = {
  id: string | number;
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

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function BlogList({ news }: { news: BlogItem[] }) {
  const t = useTranslations("Blog");
  const locale = useLocale();

  if (news.length === 0) return null;

  const fmt = (d: string) => formatLongDate(d, locale);
  const catLabel = (c: string) => (categoryKeyMap[c] ? t(categoryKeyMap[c]) : c);

  const [lead, ...rest] = news;

  return (
    <div>
      {/* ── Featured lead story ─────────────────────────────────────────── */}
      <m.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <Link href={{ pathname: "/blog/[slug]", params: { slug: lead.slug } }} className="group block">
          <article className="grid lg:grid-cols-2 bg-white rounded-3xl overflow-hidden border border-grey-lighter/70 transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:border-pink/25 group-hover:shadow-[0_36px_80px_-34px_rgba(104,33,73,0.32)]">
            <div className="relative aspect-[16/11] lg:aspect-auto lg:min-h-[380px] overflow-hidden bg-grey-lighter">
              {lead.featuredImage.url && (
                <img
                  src={lead.featuredImage.url}
                  alt={lead.featuredImage.alt || lead.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1000ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                />
              )}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-blackberry/55 via-blackberry/10 to-transparent" />
              <span className="absolute top-4 left-4 inline-flex items-center bg-white/92 backdrop-blur-sm text-blackberry text-[10px] font-bold tracking-[0.12em] uppercase px-3.5 py-2 rounded-full shadow-sm">
                {catLabel(lead.category)}
              </span>
            </div>
            <div className="p-6 sm:p-9 lg:p-11 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden className="h-px w-7 bg-pink" />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-pink tabular-nums">{fmt(lead.publishedDate)}</span>
              </div>
              <h2 className="text-[clamp(1.5rem,2.6vw,2.15rem)] font-bold text-blackberry leading-[1.13] mb-4 line-clamp-3 break-words transition-colors duration-300 group-hover:text-pink">
                {lead.title}
              </h2>
              <p className="text-[15px] text-grey-light leading-relaxed line-clamp-3 mb-7 break-words">{lead.excerpt}</p>
              <span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-blackberry">
                {t("readMore")}
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </div>
          </article>
        </Link>
      </m.div>

      {/* ── Rest of the grid ────────────────────────────────────────────── */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-6 sm:mt-8">
          {rest.map((item, i) => (
            <m.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.36), ease: EASE }}
            >
              <NewsCard
                slug={item.slug}
                title={item.title}
                excerpt={item.excerpt}
                category={item.category}
                publishedDate={item.publishedDate}
                featuredImage={item.featuredImage}
              />
            </m.div>
          ))}
        </div>
      )}
    </div>
  );
}
