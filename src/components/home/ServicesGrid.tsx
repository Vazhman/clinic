"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Service } from "@/types";
import ServiceIcon from "@/components/shared/ServiceIcon";
import AnimateIn from "@/components/shared/AnimateIn";
import SnapCarousel from "@/components/shared/SnapCarousel";

export default function ServicesGrid({
  services,
  totalCount,
}: {
  services: Service[];
  totalCount?: number;
}) {
  const t = useTranslations("Services");
  const count = totalCount ?? services.length;

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-cream relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        <AnimateIn className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <p className="text-pink text-[11px] font-semibold tracking-[0.22em] uppercase mb-4 break-words">{t("subtitle")}</p>
          <h2 className="text-[clamp(1.8rem,3.8vw,3rem)] font-bold tracking-[-0.02em] text-blackberry leading-[1.1] break-words">{t("title")}</h2>
        </AnimateIn>

        {/* Mobile: centered snap carousel (active card front-and-center,
            neighbours peek + recede). sm+: unchanged responsive grid. */}
        <SnapCarousel
          ariaLabel={t("title")}
          cardWidth="76vw"
          gapClassName="gap-4"
          className="sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 stagger"
        >
          {services.map((service) => (
            <Link
              key={service.id}
              href={{ pathname: '/services/[slug]', params: { slug: service.slug } }}
              className="group relative block h-full bg-white rounded-2xl p-6 sm:p-7 border border-blackberry/[0.06] hover:border-pink/30 hover:shadow-xl hover:shadow-blackberry/[0.08] hover:-translate-y-1 transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
            >
              {/* Animated pink wash that wipes in from the corner on hover */}
              <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-pink/10 blur-2xl opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]" />

              {/* Icon — scales and rotates a touch on hover */}
              <div className="relative w-12 h-12 rounded-xl bg-pink-light/70 flex items-center justify-center mb-5 group-hover:bg-blackberry group-hover:scale-110 group-hover:rotate-[-4deg] transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]">
                <div className="text-pink group-hover:text-white transition-colors duration-500">
                  <ServiceIcon icon={service.icon} className="w-5 h-5" />
                </div>
              </div>

              <h3 className="relative text-[15px] font-bold text-blackberry mb-1.5 group-hover:text-pink transition-colors duration-300 break-words leading-snug">
                {service.name}
              </h3>
              <p className="relative text-[13px] text-grey-light leading-[1.55] break-words whitespace-pre-wrap mb-4">
                {service.shortDescription}
              </p>

              {/* Magnetic arrow — slides in from left, gains opacity on hover */}
              <span className="relative inline-flex items-center gap-1.5 text-pink text-[12px] font-semibold tracking-wide opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]">
                {t("learnMore")}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
          ))}
        </SnapCarousel>

        {/* Prominent CTA — solid pill button, not a corner text link */}
        <AnimateIn className="flex justify-center mt-12 sm:mt-14">
          <Link
            href="/services"
            className="group inline-flex items-center gap-3 bg-blackberry text-white text-[14px] sm:text-[15px] font-bold px-7 sm:px-9 py-4 rounded-full hover:bg-blackberry-light hover:shadow-xl hover:shadow-blackberry/20 hover:-translate-y-0.5 transition-all duration-400"
          >
            <span>
              {t("viewAll")}
              {count > services.length ? ` (${count})` : ""}
            </span>
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </AnimateIn>
      </div>
    </section>
  );
}
