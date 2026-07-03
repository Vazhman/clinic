"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { SERVICES, type TimeSlot, type TimeSlotsResponse } from "@/lib/booking-data";
import type { Locale } from "@/i18n/config";

interface DoctorMiniBookingProps {
  doctorSpecialty: string;
  doctorName: string;
  doctraDoctorId?: string | null;
  doctraBranchId?: string | null;
  // Dialer number from the ContactPage global (single source of truth).
  contactPhone?: string;
}

const DAY_NAMES_SHORT: Record<string, string[]> = {
  ge: ["კვ", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
};

const MONTH_NAMES_SHORT: Record<string, string[]> = {
  ge: ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ru: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
};

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Splits a specialty/service string by separators for fuzzy matching.
 * "ალერგოლოგ-იმუნოლოგი" → ["ალერგოლოგ", "იმუნოლოგი"]
 * "თვალის ექიმი / ოფთალმოლოგი" → ["თვალის ექიმი", "ოფთალმოლოგი"]
 */
function splitParts(s: string): string[] {
  return s
    .split(/[,/\-–—]+/)
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length > 2);
}

function findMatchingBranchId(specialty: string): string | null {
  const specLower = specialty.toLowerCase();
  const parts = splitParts(specialty);
  const isPediatric = specLower.includes("ბავშვთა");

  // Collect all matching services with a score
  const matches: { id: string; score: number }[] = [];

  for (const svc of SERVICES) {
    const names = [svc.name.ge, svc.name.en, svc.name.ru].map((n) => n.toLowerCase());
    const svcParts = names.flatMap((n) => splitParts(n));
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
      // Prefer adult services for adult specialties, pediatric for pediatric
      const pediatricBonus = isPediatric === svcIsPediatric ? 10 : 0;
      matches.push({ id: svc.id, score: pediatricBonus });
    }
  }

  if (matches.length === 0) return null;
  // Return the best match
  matches.sort((a, b) => b.score - a.score);
  return matches[0].id;
}

export default function DoctorMiniBooking({ doctorSpecialty, doctorName, doctraDoctorId, doctraBranchId, contactPhone = "" }: DoctorMiniBookingProps) {
  const t = useTranslations("Doctors");
  const bt = useTranslations("Booking");
  const locale = useLocale() as Locale;
  const phoneTel = contactPhone.replace(/[^+\d]/g, "");

  const router = useRouter();
  const branchId = useMemo(
    () => doctraBranchId ?? findMatchingBranchId(doctorSpecialty),
    [doctraBranchId, doctorSpecialty],
  );

  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [loadingOperator, setLoadingOperator] = useState(true);

  const today = useMemo(() => new Date(), []);
  // Empty initial date — wait for the availability fetch to land before
  // selecting anything. Avoids the "today is selected → loading → jumps to
  // first available" visible bounce.
  const [selectedDate, setSelectedDate] = useState("");
  const [slotsData, setSlotsData] = useState<TimeSlotsResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const stripRef = useRef<HTMLDivElement>(null);

  // Days shown in the strip — only the ones with confirmed availability.
  // Built directly from `availableDates`, so a doctor whose first
  // opening is months out still surfaces. While the summary is loading
  // we render skeleton placeholders below.
  const dayStrip = useMemo(() => {
    if (loadingAvailability) return [];
    return Array.from(availableDates)
      .sort()
      .map((iso) => new Date(iso + "T00:00:00"));
  }, [availableDates, loadingAvailability]);

  // Resolve operator ID
  useEffect(() => {
    if (!branchId) {
      setLoadingOperator(false);
      return;
    }
    // If admin has set the doctra doctor ID explicitly, skip the fuzzy lookup
    if (doctraDoctorId) {
      setOperatorId(doctraDoctorId);
      setLoadingOperator(false);
      return;
    }
    // Fallback (admin hasn't linked a doctraId): fuzzy-match by name
    // against the cached all-doctors list, filtered to this branch.
    fetch(`/api/booking/all-doctors?lang=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        const rows: { serviceId: string; operator: { id: string; name: string } }[] =
          Array.isArray(data?.doctors) ? data.doctors : [];
        const ops = rows
          .filter((r) => r.serviceId === branchId)
          .map((r) => r.operator);
        const nameParts = doctorName.split(" ").filter(Boolean);
        const match = ops.find((op) =>
          nameParts.some((part) => op.name.includes(part) && part.length > 2),
        );
        setOperatorId(match?.id ?? ops[0]?.id ?? null);
        setLoadingOperator(false);
      })
      .catch(() => setLoadingOperator(false));
  }, [branchId, doctorName, locale, doctraDoctorId]);

  // Fetch availability summary, escalating from 30 to 180 days so a
  // doctor whose only openings are months out still shows slots in the
  // mini-widget instead of a dead-end "fully booked" CTA. Mirrors the
  // wizard's DateTimeStep behaviour.
  useEffect(() => {
    if (!branchId || !operatorId) {
      setAvailableDates(new Set());
      setLoadingAvailability(false);
      return;
    }
    let cancelled = false;
    setLoadingAvailability(true);

    (async () => {
      const windows = [30, 180];
      for (const days of windows) {
        const begin = formatDateStr(today);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + days);
        const end = formatDateStr(endDate);

        try {
          const r = await fetch(
            `/api/booking/timeslots?branchId=${branchId}&operatorId=${operatorId}&dateBegin=${begin}&dateEnd=${end}&summary=1`,
          );
          const data = await r.json();
          if (cancelled) return;
          const dates: string[] = Array.isArray(data?.availableDates) ? data.availableDates : [];
          if (dates.length > 0) {
            const set = new Set(dates);
            setAvailableDates(set);
            setLoadingAvailability(false);
            const sorted = Array.from(set).sort();
            setSelectedDate(sorted[0]);
            return;
          }
        } catch {
          // fall through
        }
      }
      // Truly nothing in 6 months — shows the existing fully-booked CTA
      if (!cancelled) {
        setAvailableDates(new Set());
        setLoadingAvailability(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, operatorId, today]);

  // Auto-fetch slots whenever the selected date / operator resolves
  useEffect(() => {
    if (!selectedDate || !branchId || !operatorId) {
      setSlotsData(null);
      return;
    }
    setLoadingSlots(true);
    setSelectedTime("");
    fetch(
      `/api/booking/timeslots?branchId=${branchId}&operatorId=${operatorId}&date=${selectedDate}&lang=${locale}`,
    )
      .then((r) => r.json())
      .then((data) => {
        const safe: TimeSlotsResponse = {
          header: data?.header || "",
          slots: Array.isArray(data?.slots) ? data.slots : [],
        };
        setSlotsData(safe);
        setLoadingSlots(false);
      })
      .catch(() => {
        setSlotsData({ header: "", slots: [] });
        setLoadingSlots(false);
      });
  }, [selectedDate, branchId, operatorId, locale]);

  const availableSlots = slotsData?.slots.filter((s) => s.available) ?? [];
  const isToday = selectedDate === formatDateStr(today);

  // Fallback CTA when specialty can't be matched
  if (!branchId || (!loadingOperator && !operatorId)) {
    return (
      <div className="space-y-4 min-w-0">
        <div className="flex items-center gap-3 mb-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blackberry to-pink flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-blackberry break-words min-w-0">{t("bookAppointment")}</h3>
        </div>
        <p className="text-sm text-grey-light leading-relaxed break-words">{t("bookWithDoctorDesc")}</p>
        <Link
          href="/booking"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 shadow-lg shadow-blackberry/15 hover:shadow-xl hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)" }}
        >
          <span className="break-words">{t("bookAppointment")}</span>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <div className="pt-3 border-t border-grey-lighter/60">
          <a href={`tel:${phoneTel}`} className="flex items-center gap-3 text-sm text-grey hover:text-blackberry transition-colors group min-w-0">
            <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center group-hover:bg-pink-light transition-colors shrink-0">
              <svg className="w-3.5 h-3.5 text-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
            <span className="break-words min-w-0">{contactPhone}</span>
          </a>
        </div>
      </div>
    );
  }

  // Fully-booked state: 30-day window has zero availability and the summary
  // call has finished. Surface two paths out — open the full booking page
  // (which has month navigation so the user can scan further into the future)
  // or call the clinic.
  const fullyBooked = !loadingAvailability && !loadingOperator && availableDates.size === 0;

  if (fullyBooked) {
    // No calendar — this doctor doesn't take bookings via Doctra. Show a
    // single CTA that takes the user to the global booking wizard where
    // they can pick a doctor who does, plus a phone fallback.
    return (
      <div className="space-y-2.5 min-w-0">
        <Link
          href="/booking"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 shadow-lg shadow-blackberry/15 hover:shadow-xl hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)" }}
        >
          <span className="break-words">{t("bookAppointment")}</span>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <a
          href={`tel:${phoneTel}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium text-sm bg-cream text-grey hover:bg-pink-light hover:text-blackberry transition-colors duration-200 border border-grey-lighter/60"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
          <span className="break-words">{contactPhone}</span>
        </a>
      </div>
    );
  }

  const todayDateStr = formatDateStr(today);

  return (
    <div className="space-y-4 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blackberry to-pink flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-blackberry leading-tight break-words">{t("availability")}</h3>
          </div>
        </div>
      </div>

      {/* Day strip — horizontal scrollable. Days with no availability are
          hidden (the strip is short enough that gaps would look broken). */}
      <div className="relative">
        {/* Prev arrow — desktop only */}
        <button
          type="button"
          onClick={() => stripRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
          className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-grey-lighter shadow-md items-center justify-center hover:bg-pink-light hover:text-pink transition-colors cursor-pointer"
          aria-label={bt("previousDays")}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div
          ref={stripRef}
          className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory sm:px-9"
        >
          {loadingAvailability && Array.from({ length: 7 }).map((_, i) => (
            <div
              key={`skel-${i}`}
              className="min-w-[46px] h-[68px] rounded-xl bg-grey-lighter/40 animate-pulse"
              style={{ animationDelay: `${i * 0.06}s` }}
            />
          ))}
          {!loadingAvailability && dayStrip.map((day) => {
            const ds = formatDateStr(day);
            const isSelected = ds === selectedDate;
            const dayOfWeek = (DAY_NAMES_SHORT[locale] || DAY_NAMES_SHORT.en)[day.getDay()];
            const dayIsToday = ds === todayDateStr;
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <button
                key={ds}
                onClick={() => setSelectedDate(ds)}
                className={`relative flex flex-col items-center min-w-[46px] py-2 px-1.5 rounded-xl transition-colors duration-200 cursor-pointer snap-start ${
                  isSelected
                    ? "text-white shadow-md shadow-blackberry/15"
                    : isWeekend
                      ? "bg-pink-50/50 text-pink/70 hover:bg-pink-light/60"
                      : "bg-cream/60 text-grey hover:bg-pink-light/40"
                }`}
              >
                {/* Selected background */}
                {isSelected && (
                  <div
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "linear-gradient(180deg, #682149 0%, #DD64A6 100%)" }}
                  />
                )}

                <span className={`relative z-10 text-[9px] font-semibold uppercase tracking-wider ${
                  isSelected ? "text-white/70" : ""
                }`}>
                  {dayIsToday ? bt("today") : dayOfWeek}
                </span>
                <span className={`relative z-10 text-base font-bold leading-tight mt-0.5 ${
                  isSelected ? "text-white" : ""
                }`}>
                  {day.getDate()}
                </span>
                <span className={`relative z-10 text-[8px] font-medium mt-0.5 ${
                  isSelected ? "text-white/60" : "text-grey-light/60"
                }`}>
                  {(MONTH_NAMES_SHORT[locale] || MONTH_NAMES_SHORT.en)[day.getMonth()]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Next arrow — desktop only */}
        <button
          type="button"
          onClick={() => stripRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
          className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-grey-lighter shadow-md items-center justify-center hover:bg-pink-light hover:text-pink transition-colors cursor-pointer"
          aria-label={bt("nextDays")}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Time slots */}
      <div className="min-h-[210px]">
        {(loadingOperator || loadingSlots || loadingAvailability) ? (
          <div className="space-y-2">
            <div className="h-3 bg-grey-lighter/50 rounded w-1/3 animate-pulse" />
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 rounded-lg bg-grey-lighter/30 animate-pulse" style={{ animationDelay: `${i * 0.06}s` }} />
              ))}
            </div>
          </div>
        ) : slotsData && (
          <div key={selectedDate} className="fade-in-content">
            {slotsData.slots.length === 0 ? (
              <div className="text-center py-6 px-4">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-pink-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <p className="text-xs text-grey-light font-medium break-words">{bt("noSlots")}</p>
                <p className="text-[10px] text-grey-light/50 mt-1 break-words">
                  {bt("tryAnotherDay")}
                </p>
              </div>
            ) : (
              <>
                {/* Status line */}
                <div className="flex items-center justify-between gap-2 mb-2.5 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink shrink-0" />
                    <span className="text-[10px] font-semibold text-blackberry/50 uppercase tracking-wider break-words min-w-0">
                      {slotsData.header || (isToday ? bt("availableToday") : bt("availableTimes"))}
                    </span>
                  </div>
                  {availableSlots.length > 0 && (
                    <span className="text-[10px] font-bold text-pink bg-pink-50 px-1.5 py-0.5 rounded-full shrink-0">
                      {availableSlots.length}
                    </span>
                  )}
                </div>

                {/* Time grid */}
                <div className="grid grid-cols-3 gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-0.5">
                  {slotsData.slots.map((slot: TimeSlot) => {
                    const isSel = slot.value === selectedTime;
                    return (
                      <button
                        key={slot.value}
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.value)}
                        className={`relative py-2 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer overflow-hidden
                          ${!slot.available ? "bg-grey-lighter/60 text-grey-light/50 line-through cursor-not-allowed border border-grey-lighter/40" : ""}
                          ${isSel ? "text-white font-semibold shadow-md shadow-blackberry/10" : ""}
                          ${slot.available && !isSel ? "bg-white border border-grey-lighter/70 text-grey hover:border-pink/40 hover:text-blackberry" : ""}
                        `}
                        style={isSel ? { background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)" } : undefined}
                      >
                        <span className="relative z-10">{slot.time}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* CTA button */}
      <div>
        {selectedTime ? (
          <button
            onClick={() => {
              const time = selectedTime.split("T")[1]?.substring(0, 5) || selectedTime;
              router.push({
                pathname: '/booking',
                query: {
                  date: selectedDate,
                  time,
                  branch: branchId ?? '',
                  operator: operatorId ?? '',
                },
              });
            }}
            className="group flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 shadow-lg shadow-blackberry/15 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)" }}
          >
            {bt("confirm")}
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        ) : (
          <Link
            href="/booking"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium text-sm bg-cream text-grey hover:bg-pink-light hover:text-blackberry transition-colors duration-200 border border-grey-lighter/60"
          >
            {t("bookAppointment")}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        )}
      </div>

      {/* Phone */}
      <div className="pt-3 border-t border-grey-lighter/50">
        <a href={`tel:${phoneTel}`} className="flex items-center gap-2.5 text-sm text-grey hover:text-blackberry transition-colors group min-w-0">
          <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center group-hover:bg-pink-light transition-colors shrink-0">
            <svg className="w-3.5 h-3.5 text-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>
          <span className="break-words min-w-0">{contactPhone}</span>
        </a>
      </div>
    </div>
  );
}
