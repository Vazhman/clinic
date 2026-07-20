"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Doctor } from "@/types";
import AnimateIn from "@/components/shared/AnimateIn";
import SnapCarousel from "@/components/shared/SnapCarousel";

export default function DoctorsPreview({ doctors }: { doctors: Doctor[] }) {
  const t = useTranslations("Doctors");

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-blackberry relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-pink/[0.04] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-pink/[0.03] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        <AnimateIn className="flex items-end justify-between flex-wrap gap-4 sm:gap-6 mb-10 sm:mb-12">
          <div className="min-w-0">
            <p className="text-pink/60 text-[12px] font-semibold tracking-[0.2em] uppercase mb-3 break-words">{t("subtitle")}</p>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-bold tracking-tight text-white break-words">{t("title")}</h2>
          </div>
          <Link href="/doctors" className="group text-[13px] font-semibold text-white/50 hover:text-pink transition-colors flex items-center gap-2 shrink-0">
            {t("viewAll")}
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </AnimateIn>

        {/* Mobile: centered snap carousel (active card front-and-center,
            neighbours peek + recede). sm+: unchanged responsive grid. */}
        <SnapCarousel
          ariaLabel={t("title")}
          tone="dark"
          cardWidth="74vw"
          gapClassName="gap-5"
          className="sm:grid sm:grid-cols-2 lg:grid-cols-3 stagger"
        >
          {doctors.map((doctor) => (
            <Link key={doctor.id} href={{ pathname: '/doctors/[slug]', params: { slug: doctor.slug } }} className="block group">
              {/* No backdrop-blur here: the `.stagger` parent animates `transform`
                  on entrance, and a blur child re-rasterizes when that animation's
                  compositor layer is demoted at the end — a one-frame flicker. The
                  5% white fill reads the same over the solid blackberry section. */}
              <div className="bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.06] hover:border-pink/20 hover:bg-white/[0.08] transition-all duration-400 min-w-0">
                <div className="relative aspect-[4/5] overflow-hidden bg-white/[0.05]">
                  {doctor.photo ? (
                    <Image
                      src={doctor.photo}
                      alt={doctor.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink/10 to-blackberry-light/20 flex items-center justify-center">
                      <svg className="w-16 h-16 text-pink/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-blackberry via-blackberry/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 min-w-0">
                    <h3 className="text-[15px] font-bold text-white mb-1 drop-shadow-md break-words">{doctor.name}</h3>
                    <p className="text-[12px] text-pink font-medium drop-shadow-md break-words">{doctor.specialty}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </SnapCarousel>
      </div>
    </section>
  );
}
