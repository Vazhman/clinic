"use client";

import Image from "next/image";

import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { Doctor } from "@/types";
import DoctorMiniBooking from "@/components/booking/DoctorMiniBooking";
import AnimateIn from "@/components/shared/AnimateIn";
import SnapCarousel from "@/components/shared/SnapCarousel";
import { SERVICES } from "@/lib/booking-data";
import { formatLongDate } from "@/lib/format-date";
import LexicalContent from "@/components/blog/LexicalContent";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { getLanguage } from "@/lib/languages";

interface DoctorProfileClientProps {
  doctor: Doctor;
  relatedDoctors: Doctor[];
  // Dialer number from the ContactPage global (single source of truth).
  contactPhone?: string;
  // DoctorsPage.showLanguages — admin kill-switch for the languages section.
  showLanguages?: boolean;
}

export default function DoctorProfileClient({
  doctor,
  relatedDoctors,
  contactPhone = "",
  showLanguages = true,
}: DoctorProfileClientProps) {
  const t = useTranslations("Doctors");
  const locale = useLocale();
  const [mobileTab, setMobileTab] = useState<"about" | "booking">("about");
  const bookingRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Prefer the manual `lastUpdated` date (admin's curated value), then fall
  // back to Payload's auto-tracked `updatedAt`. Either way, the booking
  // section gets a "Last updated" line — it no longer silently disappears
  // when admin hasn't set the manual date.
  const lastUpdatedRaw = doctor.lastUpdated || doctor.updatedAt;
  const lastUpdatedFormatted = lastUpdatedRaw
    ? formatLongDate(lastUpdatedRaw, locale)
    : null;

  const branchId = (() => {
    const specLower = doctor.specialty.toLowerCase();
    const parts = specLower
      .split(/[,/\-–—]+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 2);
    const isPediatric = specLower.includes("ბავშვთა");

    const matches: { id: string; score: number }[] = [];

    for (const svc of SERVICES) {
      const names = [svc.name.ge, svc.name.en, svc.name.ru].map((n) => n.toLowerCase());
      const svcParts = names.flatMap((n) =>
        n.split(/[,/\-–—]+/).map((p) => p.trim()).filter((p) => p.length > 2),
      );
      const svcIsPediatric = names.some((n) => n.includes("ბავშვთა") || n.includes("pediatric") || n.includes("детск"));

      let matched = false;
      for (const part of parts) {
        if (matched) break;
        for (const name of names) {
          if (name.includes(part) || part.includes(name)) { matched = true; break; }
        }
        if (!matched) {
          for (const sp of svcParts) {
            if (sp.includes(part) || part.includes(sp)) { matched = true; break; }
          }
        }
      }

      if (matched) {
        const pediatricBonus = isPediatric === svcIsPediatric ? 10 : 0;
        matches.push({ id: svc.id, score: pediatricBonus });
      }
    }

    if (matches.length === 0) return null;
    matches.sort((a, b) => b.score - a.score);
    return matches[0].id;
  })();

  const hasPhoto = !!doctor.photo;
  const hasBio = !!doctor.biography?.trim();
  const hasQualifications = doctor.qualifications.length > 0;
  const hasSpecializations = doctor.specializations.length > 0;
  const hasExperience = doctor.experienceYears > 0;
  const hasLanguages = showLanguages && doctor.languagesSpoken.length > 0;
  const hasRelated = relatedDoctors.length > 0;
  // A doctor is bookable only when:
  //   1. Both Doctra link fields are populated (wizard needs them to find
  //      the doctor — see getBookingDoctorsFromPayload filter)
  //   2. Admin has the `bookingEnabled` checkbox ticked in Payload
  // Admin toggles bookingEnabled for doctors with no Doctra slots, on
  // leave, or temporarily not accepting bookings — beats calling Doctra
  // on every page render. Defaults to true so new doctors show up
  // bookable unless explicitly disabled.
  const isBookable = !!doctor.doctraId && !!doctor.doctraBranchId && doctor.bookingEnabled !== false;

  const stats = [
    hasExperience && {
      value: doctor.experienceYears,
      suffix: "+",
      label: t("yearsExperience"),
    },
    hasSpecializations && {
      value: doctor.specializations.length,
      suffix: "",
      label: t("specializations"),
    },
  ].filter(Boolean) as { value: number; suffix: string; label: string }[];

  // On desktop: navigate to /booking with branch + doctor pre-selected.
  // On mobile: switch to booking tab so the mini-booking widget is in view.
  const handleBookClick = () => {
    if (window.innerWidth < 1024) {
      // Mobile: switch tab, scroll to it
      setMobileTab("booking");
      window.scrollTo({ top: 300, behavior: "smooth" });
    } else {
      // Desktop: jump straight to /booking with branch + doctor pre-selected
      if (branchId) {
        router.push({
          pathname: '/booking',
          query: { branch: branchId, doctorName: doctor.name },
        });
      } else {
        router.push("/booking");
      }
    }
  };

  return (
    <>
      {/* ─── SINGLE UNIFIED LAYOUT ─── */}
      <section className="relative bg-white overflow-hidden">
        {/* Subtle decorative blob */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-light/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-6 pb-10 sm:pb-14 lg:pb-16">
          <div className="grid lg:grid-cols-[300px_1fr] gap-6 sm:gap-8 lg:gap-12">

            {/* ── LEFT COLUMN: Photo + Mini Booking (sticky on desktop) ── */}
            <div className="lg:sticky lg:top-24 lg:self-start space-y-6 min-w-0">
              {/* Photo */}
              <div className="hero-animate hero-animate-1">
                <div className="relative max-w-[260px] sm:max-w-[280px] mx-auto lg:max-w-none">
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-grey-lighter shadow-lg shadow-blackberry/[0.06]">
                    {hasPhoto ? (
                      <Image
                        src={doctor.photo}
                        alt={doctor.name}
                        fill
                        priority
                        sizes="(min-width: 1024px) 300px, (min-width: 640px) 280px, 260px"
                        className="object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-pink-light/40">
                        <svg className="w-20 h-20 text-pink/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Department head badge */}
                  {doctor.isDepartmentHead && (
                    <div className="absolute -top-2 -right-2 max-w-[70%] text-right bg-pink text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg shadow-pink/30 break-words">
                      {t("departmentHead")}
                    </div>
                  )}
                </div>
              </div>

              {/* Mini Booking — desktop only. Hidden for doctors without a
                  Doctra ID since the wizard can't book them anyway. */}
              {isBookable && (
                <div ref={bookingRef} className="hidden lg:block hero-animate hero-animate-3">
                  <div className="bg-white rounded-2xl shadow-lg shadow-blackberry/5 border border-grey-lighter/60 p-5">
                    <DoctorMiniBooking
                      doctorSpecialty={doctor.specialty}
                      doctorName={doctor.name}
                      doctraDoctorId={doctor.doctraId ?? null}
                      doctraBranchId={doctor.doctraBranchId ?? null}
                      contactPhone={contactPhone}
                    />
                  </div>
                  {lastUpdatedFormatted && (
                    <p className="text-[11px] text-grey-light/70 mt-2 text-center">
                      {t("lastUpdated")}: {lastUpdatedFormatted}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: All content flows here ── */}
            <div className="min-w-0">
              {/* Header: name, specialty, stats, CTAs */}
              <div className="mb-6 sm:mb-8">
                <p className="hero-animate hero-animate-1 text-pink text-[11px] font-semibold tracking-[0.2em] uppercase mb-1.5 break-words">
                  {doctor.specialty}
                </p>

                <h1 className="hero-animate hero-animate-2 text-[clamp(1.4rem,3.5vw,2.5rem)] font-bold text-blackberry leading-tight tracking-tight mb-4 break-words">
                  {doctor.name}
                </h1>

                {/* Stats inline */}
                {stats.length > 0 && (
                  <div className="hero-animate hero-animate-3 flex flex-wrap gap-2.5 mb-5">
                    {stats.map((stat, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-pink-50 rounded-lg px-3 py-2 border border-pink-light/40 min-w-0"
                      >
                        <span className="text-sm font-bold text-blackberry shrink-0">
                          {stat.value}{stat.suffix}
                        </span>
                        <span className="text-[10px] text-grey-light break-words min-w-0">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Qualification pills */}
                {hasQualifications && (
                  <div className="hero-animate hero-animate-3 flex flex-wrap gap-1.5 mb-5">
                    {doctor.qualifications.map((q) => (
                      <span
                        key={q}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-grey-lighter text-grey break-words max-w-full"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTA buttons — Book CTA only for Doctra-bookable doctors.
                    "Call us" is always available so patients can reach the
                    clinic about any doctor regardless of booking status. */}
                <div className="hero-animate hero-animate-4 flex flex-col sm:flex-row flex-wrap gap-3">
                  {isBookable && (
                    <button
                      onClick={handleBookClick}
                      className="group inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-xl font-medium text-sm text-white shadow-lg shadow-blackberry/15 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer w-full sm:w-auto"
                      style={{ background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)" }}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="break-words">{t("checkAvailability") || t("bookAppointment")}</span>
                      <svg className="w-3.5 h-3.5 shrink-0 group-hover:translate-y-0.5 transition-transform lg:group-hover:translate-y-0 lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  )}
                  <a
                    href={`tel:${contactPhone.replace(/[^+\d]/g, "")}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl font-medium text-sm text-grey border border-grey-lighter hover:border-pink/30 hover:text-pink transition-all duration-300 w-full sm:w-auto"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <span className="break-words">{t("callUs")}</span>
                  </a>
                </div>
              </div>

              {/* ── Mobile tabs: About / Booking ── only when bookable */}
              {isBookable && (
                <div className="lg:hidden mb-6">
                  <div className="flex gap-1 p-1 bg-grey-lighter rounded-xl">
                    {(["about", "booking"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setMobileTab(tab)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                          mobileTab === tab
                            ? "bg-white text-blackberry shadow-sm"
                            : "text-grey-light hover:text-grey"
                        }`}
                      >
                        {tab === "about" ? t("biography") : t("bookAppointment")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Mobile: Booking tab content ── */}
              {isBookable && mobileTab === "booking" && (
                <div className="lg:hidden mb-8">
                  <div className="bg-white rounded-2xl shadow-lg shadow-blackberry/5 border border-grey-lighter/60 p-4 sm:p-5">
                    <DoctorMiniBooking
                      doctorSpecialty={doctor.specialty}
                      doctorName={doctor.name}
                      doctraDoctorId={doctor.doctraId ?? null}
                      doctraBranchId={doctor.doctraBranchId ?? null}
                      contactPhone={contactPhone}
                    />
                  </div>
                  {lastUpdatedFormatted && (
                    <p className="text-[11px] text-grey-light/70 mt-2 text-center">
                      {t("lastUpdated")}: {lastUpdatedFormatted}
                    </p>
                  )}
                </div>
              )}

              {/* ── Content sections. When not bookable, no tabs exist so
                  always show the about content on mobile too. */}
              <div className={`space-y-6 sm:space-y-8 ${isBookable && mobileTab !== "about" ? "hidden lg:block" : ""}`}>
                {/* Divider */}
                <div className="h-px bg-grey-lighter" />

                {/* Biography */}
                {hasBio && (
                  <AnimateIn>
                    <SectionTitle>{t("biography")}</SectionTitle>
                    {doctor.biographyRichText ? (
                      // Full formatting (bold/lists/links/etc.) via the shared
                      // Lexical renderer. Falls back to the flattened plain-text
                      // projection below for legacy/seed doctors that never had
                      // a Payload richText value.
                      <div className="text-grey leading-[1.8] text-[14px] break-words">
                        <LexicalContent data={doctor.biographyRichText as SerializedEditorState} />
                      </div>
                    ) : (
                      <p className="text-grey leading-[1.8] text-[14px] break-words whitespace-pre-wrap">{doctor.biography}</p>
                    )}
                  </AnimateIn>
                )}

                {/* Specializations */}
                {hasSpecializations && (
                  <AnimateIn delay={50}>
                    <SectionTitle>{t("specializations")}</SectionTitle>
                    <div className="flex flex-wrap gap-2">
                      {doctor.specializations.map((spec) => (
                        <div
                          key={spec}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-pink-50 border border-pink-light/40 text-[13px] font-medium text-blackberry break-words max-w-full min-w-0"
                        >
                          <svg className="w-3 h-3 text-pink shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                          <span className="break-words min-w-0">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </AnimateIn>
                )}

                {/* Qualifications */}
                {hasQualifications && (
                  <AnimateIn delay={100}>
                    <SectionTitle>{t("qualificationsLabel")}</SectionTitle>
                    <div className="space-y-2">
                      {doctor.qualifications.map((q) => (
                        <div
                          key={q}
                          className="flex items-center gap-3 p-3 rounded-xl bg-grey-lighter/40 border border-grey-lighter min-w-0"
                        >
                          <div className="w-5 h-5 rounded-full bg-blackberry/5 flex items-center justify-center shrink-0">
                            <svg className="w-2.5 h-2.5 text-blackberry" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-[13px] text-grey break-words min-w-0">{q}</span>
                        </div>
                      ))}
                    </div>
                  </AnimateIn>
                )}

                {hasLanguages && (
                  <AnimateIn delay={150}>
                    <SectionTitle>{t("languages")}</SectionTitle>
                    <div className="flex flex-wrap gap-2">
                      {doctor.languagesSpoken.map((code) => {
                        const lang = getLanguage(code);
                        return (
                          <span
                            key={code}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium bg-grey-lighter text-grey break-words max-w-full"
                          >
                            <span className="text-[15px] leading-none">{lang?.flag ?? ""}</span>
                            {lang?.name[locale as "ge" | "en" | "ru"] ?? code}
                          </span>
                        );
                      })}
                    </div>
                  </AnimateIn>
                )}

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RELATED DOCTORS ─── */}
      {hasRelated && (
        <section className="py-10 sm:py-14 bg-grey-lighter/40 border-t border-grey-lighter">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
            <AnimateIn className="flex items-end justify-between gap-3 mb-6 sm:mb-8 flex-wrap">
              <div className="min-w-0">
                <p className="text-pink text-[10px] font-semibold tracking-[0.2em] uppercase mb-1.5 break-words">
                  {doctor.specialty}
                </p>
                <h2 className="text-lg sm:text-xl font-bold text-blackberry break-words">{t("colleagues")}</h2>
              </div>
              <Link
                href="/doctors"
                className="text-[12px] font-medium text-blackberry hover:text-pink transition-colors flex items-center gap-1.5 shrink-0"
              >
                {t("viewAll")}
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </AnimateIn>

            <SnapCarousel
              ariaLabel={t("colleagues")}
              cardWidth="58vw"
              gapClassName="gap-4"
              className="sm:grid sm:grid-cols-2 lg:grid-cols-4"
            >
              {relatedDoctors.slice(0, 4).map((rd, i) => (
                <AnimateIn
                  key={rd.id}
                  delay={i * 60}
                  className="min-w-0 h-full"
                >
                  <Link href={{ pathname: '/doctors/[slug]', params: { slug: rd.slug } }} className="block group">
                    <div className="bg-white rounded-2xl overflow-hidden border border-grey-lighter hover:border-pink/20 hover:shadow-md transition-all duration-300">
                      <div className="aspect-[4/5] bg-gradient-to-br from-pink-light/30 to-grey-lighter relative overflow-hidden">
                        {rd.photo ? (
                          <Image
                            src={rd.photo}
                            alt={rd.name}
                            fill
                            sizes="(min-width: 768px) 200px, 40vw"
                            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-14 h-14 text-grey-lighter" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-3.5 min-w-0">
                        <h3 className="text-[13px] font-bold text-blackberry group-hover:text-pink transition-colors mb-0.5 break-words lg:truncate">
                          {rd.name}
                        </h3>
                        <p className="text-[11px] text-grey-light break-words lg:truncate">{rd.specialty}</p>
                      </div>
                    </div>
                  </Link>
                </AnimateIn>
              ))}
            </SnapCarousel>
          </div>
        </section>
      )}
    </>
  );
}

/* ─── Section title ─── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-1 h-5 rounded-full bg-pink" />
      <h2 className="text-base font-bold text-blackberry">{children}</h2>
    </div>
  );
}
