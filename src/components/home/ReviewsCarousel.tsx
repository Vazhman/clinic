"use client";

import { useTranslations } from "next-intl";
import type { Review } from "@/types";
import AnimateIn from "@/components/shared/AnimateIn";
import SnapCarousel from "@/components/shared/SnapCarousel";

export default function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const t = useTranslations("Reviews");

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-pink-50/40 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        <AnimateIn className="mb-10 sm:mb-14">
          <p className="text-pink text-[12px] font-medium tracking-[0.2em] uppercase mb-3 break-words">{t("subtitle")}</p>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-bold tracking-tight text-blackberry break-words">{t("title")}</h2>
        </AnimateIn>
        {/* Mobile: centered snap carousel (it's finally a real carousel).
            sm+: unchanged grid. */}
        <SnapCarousel
          ariaLabel={t("title")}
          cardWidth="80vw"
          gapClassName="gap-4"
          className="sm:grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 stagger"
        >
          {reviews.map((r) => (
            <div key={r.id} className="h-full bg-white rounded-2xl p-5 sm:p-6 flex flex-col hover:shadow-lg hover:shadow-blackberry/[0.04] transition-all duration-400 min-w-0">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: r.rating }, (_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
              <p className="text-[14px] text-grey leading-relaxed flex-1 mb-5 break-words">&ldquo;{r.text}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-grey-lighter min-w-0">
                <div className="w-8 h-8 rounded-full bg-blackberry flex items-center justify-center text-[11px] font-bold text-white shrink-0">{r.author.charAt(0)}</div>
                <span className="text-[13px] font-semibold text-blackberry min-w-0 break-words">{r.author}</span>
              </div>
            </div>
          ))}
        </SnapCarousel>
      </div>
    </section>
  );
}
