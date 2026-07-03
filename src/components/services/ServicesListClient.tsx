"use client";

import Image from "next/image";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ServiceIcon from "@/components/shared/ServiceIcon";
import type { Service } from "@/types";

interface ServicesListClientProps {
  services: Service[];
}

// How many cards to render before the mobile "Show all" curtain.
// Cap is mobile-only — desktop always shows everything via CSS variants.
const MOBILE_LIMIT = 8;

export default function ServicesListClient({ services }: ServicesListClientProps) {
  const t = useTranslations("Services");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const collapseAnchorRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (search.length < 2) return services;
    const q = search.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.shortDescription?.toLowerCase().includes(q),
    );
  }, [services, search]);

  const hasSearch = search.length >= 2;
  // Active cap is mobile-only AND only when no search AND user hasn't tapped "Show all".
  // Implemented purely via CSS so SSR/CSR render identically — no hydration flash.
  const mobileCapActive = !hasSearch && !showAll && filtered.length > MOBILE_LIMIT;

  const handleCollapse = () => {
    setShowAll(false);
    collapseAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <div ref={collapseAnchorRef} className="scroll-mt-24" aria-hidden />
      {/* Search */}
      <div className="relative w-full max-w-lg mx-auto mb-8 sm:mb-12">
        <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
          <svg
            className="w-[18px] h-[18px] text-grey-light"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-grey-light/30 bg-white shadow-sm text-[14px] text-grey outline-none focus:border-blackberry focus:ring-2 focus:ring-blackberry/8 focus:bg-white transition-all duration-300 placeholder:text-grey-light/70"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-grey-lighter transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-grey-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Services bento grid.
          mobileCapActive applies a mobile-only CSS clip so children #9+ are
          hidden below sm breakpoint. Desktop layout is byte-for-byte identical
          to before. */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${
          mobileCapActive ? "max-sm:[&>*:nth-child(n+9)]:hidden" : ""
        }`}
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((service, index) => {
            // First card is featured (spans 2 cols on md+)
            const isFeatured = index === 0 && !search;

            return (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  // Entrance fade staggers by index for the nice cascade…
                  opacity: { duration: 0.3, delay: index * 0.04 },
                  y: { duration: 0.3, delay: index * 0.04 },
                  scale: { duration: 0.2 },
                  // …but repositioning must NOT be delayed, or cards get
                  // stuck mid-grid when the list grows (e.g. deleting letters).
                  layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0 },
                }}
                className={isFeatured ? "md:col-span-2 lg:col-span-2" : ""}
              >
                <Link href={{ pathname: '/services/[slug]', params: { slug: service.slug } }} className="block group h-full">
                  <div
                    className={`relative h-full overflow-hidden rounded-2xl border border-grey-lighter/80 transition-all duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:shadow-xl hover:shadow-blackberry/[0.08] hover:-translate-y-1 ${
                      isFeatured ? "bg-blackberry border-blackberry" : "bg-white hover:border-pink/20"
                    }`}
                  >
                    {/* Featured card layout */}
                    {isFeatured ? (
                      <div className="flex flex-col md:flex-row h-full">
                        {/* Left content */}
                        <div className="flex-1 min-w-0 p-5 sm:p-7 md:p-9 flex flex-col justify-between relative z-10">
                          {/* Decorative */}
                          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-pink/[0.06] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                          <div className="min-w-0">
                            {/* Service number */}
                            <span className="text-[11px] font-bold text-pink/60 tracking-widest uppercase mb-4 block break-words">
                              01 — {t("featured") || service.name}
                            </span>

                            {/* Icon */}
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5 group-hover:bg-white/15 transition-colors">
                              <div className="text-pink">
                                <ServiceIcon icon={service.icon} className="w-7 h-7" />
                              </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-pink-light transition-colors break-words">
                              {service.name}
                            </h2>

                            {/* Description */}
                            <p className="text-white/50 text-sm leading-relaxed max-w-md break-words">
                              {service.shortDescription}
                            </p>
                          </div>

                          {/* CTA */}
                          <div className="mt-6 flex items-center gap-2 text-pink text-sm font-semibold group-hover:gap-3 transition-all">
                            {t("learnMore")}
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </div>
                        </div>

                        {/* Right image */}
                        {service.image && (
                          <div className="hidden md:block w-[280px] shrink-0 relative overflow-hidden">
                            <Image
                              src={service.image}
                              alt={service.name}
                              fill
                              sizes="280px"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-blackberry via-blackberry/60 to-transparent" />
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Standard card layout.
                         Mobile is intentionally denser than sm+: smaller index
                         number + icon, tighter padding/margins, 2-line clamp,
                         and the divider+arrow CTA row is hidden (the whole card
                         is a tap target). This roughly halves card height on
                         phones so 8 services don't become a long scroll. */
                      <div className="p-4 sm:p-6 flex flex-col h-full min-w-0">
                        {/* Top row: number + icon */}
                        <div className="flex items-start justify-between mb-2.5 sm:mb-5 gap-3">
                          <span className="text-[24px] sm:text-[32px] font-bold text-grey-lighter/60 leading-none tabular-nums group-hover:text-pink-light transition-colors duration-300 shrink-0">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-pink-light/70 flex items-center justify-center transition-all duration-400 group-hover:scale-110 group-hover:bg-blackberry shrink-0">
                            <div className="text-pink group-hover:text-white transition-colors duration-300">
                              <ServiceIcon icon={service.icon} className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-[16px] sm:text-[17px] font-bold text-blackberry group-hover:text-pink transition-colors mb-1.5 sm:mb-2 leading-tight break-words">
                          {service.name}
                        </h2>

                        {/* Description */}
                        <p className="text-[13px] text-grey-light leading-relaxed line-clamp-2 sm:line-clamp-3 flex-1 break-words">
                          {service.shortDescription}
                        </p>

                        {/* Bottom CTA — hidden on mobile (card itself is tappable) */}
                        <div className="mt-5 pt-4 border-t border-grey-lighter/60 hidden sm:flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-pink opacity-0 group-hover:opacity-100 transition-opacity duration-300 break-words min-w-0">
                            {t("learnMore")}
                          </span>
                          <div className="w-8 h-8 rounded-lg bg-cream group-hover:bg-blackberry flex items-center justify-center transition-all duration-300 shrink-0">
                            <svg className="w-3.5 h-3.5 text-grey-light group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mobile-only progressive disclosure control.
          - When capped: bold "Show all (N)" pill with editorial pre-label
            ("Showing X of Y") so users know exactly what's hidden.
          - When expanded: smaller "Show less" pill that scrolls back to grid top.
          - Hidden on sm+ because desktop already shows the full grid. */}
      {!hasSearch && filtered.length > MOBILE_LIMIT && (
        <div className="sm:hidden mt-8">
          {mobileCapActive ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-[11px] text-grey-light/80 tracking-[0.18em] uppercase font-semibold">
                {t("showingFirst", { shown: MOBILE_LIMIT, total: filtered.length })}
              </p>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="group relative inline-flex items-center justify-center gap-2.5 bg-blackberry text-white font-bold text-[14px] tracking-tight pl-6 pr-3 py-3 rounded-full overflow-hidden transition-all duration-300 hover:bg-pink hover:shadow-xl hover:shadow-pink/25 active:scale-[0.98] cursor-pointer"
              >
                <span className="break-words">{t("showAllCount", { count: filtered.length })}</span>
                <span className="w-8 h-8 rounded-full bg-pink/90 group-hover:bg-white/15 flex items-center justify-center shrink-0 transition-colors">
                  <svg className="w-4 h-4 text-white group-hover:translate-y-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </span>
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleCollapse}
                className="group inline-flex items-center gap-2 text-blackberry font-semibold text-[13px] px-5 py-3 rounded-full border-2 border-blackberry/15 hover:border-blackberry hover:bg-cream transition-all duration-300 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
                <span className="break-words">{t("showLess")}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {filtered.length === 0 && (
        <div className="text-center py-12 sm:py-20 px-4">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-cream flex items-center justify-center">
            <svg className="w-7 h-7 text-grey-light/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-grey font-medium mb-4 break-words">{t("noResults") || "No services found"}</p>
          <button
            onClick={() => setSearch("")}
            className="text-pink text-sm font-semibold hover:text-pink-dark cursor-pointer transition-colors"
          >
            {t("clearSearch") || "Clear search"}
          </button>
        </div>
      )}
    </div>
  );
}
