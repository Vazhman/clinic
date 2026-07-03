"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { BookingService, BookingOperator, TimeSlot } from "@/lib/booking-data";
import type { Locale } from "@/i18n/config";

interface DateTimeStepProps {
  service: BookingService;
  doctor: BookingOperator;
  allDoctorsRows: { serviceId: string; operator: BookingOperator }[];
  selectedDate: string;
  selectedTime: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  onSwitchDoctor?: (doctor: BookingOperator) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const DAY_NAMES: Record<string, string[]> = {
  ge: ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვ"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
};

const MONTH_NAMES: Record<string, string[]> = {
  ge: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
};

// Long-form day names for the selected-date header (matches what the API
// route used to return server-side, just rebuilt locally now that we have
// the date string in hand).
const HEADER_DAY_NAMES: Record<string, string[]> = {
  ge: ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ru: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
};

const HEADER_PREFIX: Record<string, string> = {
  ge: "ჩაწერის დრო",
  en: "Appointment time",
  ru: "Время записи",
};

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DateTimeStep({
  service,
  doctor,
  allDoctorsRows,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  onSwitchDoctor,
}: DateTimeStepProps) {
  const t = useTranslations("Booking");
  const locale = useLocale() as Locale;

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatDateStr(today), [today]);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const autoSelectedRef = useRef(false);

  // Availability summary for the picked doctor — fetched on-demand via
  // /api/booking/timeslots?summary=1. ONE Doctra call for ONE doctor for a
  // 180-day window; typically ~500ms-1s. Replaces the old per-page fan-out
  // for every doctor across every department.
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingAvailability(true);
    setAvailableDates(new Set());

    const begin = todayStr;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 180);
    const end = formatDateStr(endDate);

    fetch(
      `/api/booking/timeslots?branchId=${service.id}&operatorId=${doctor.id}&dateBegin=${begin}&dateEnd=${end}&summary=1`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const dates: string[] = Array.isArray(data?.availableDates) ? data.availableDates : [];
        setAvailableDates(new Set(dates));
        setLoadingAvailability(false);
      })
      .catch(() => {
        if (cancelled) return;
        setAvailableDates(new Set());
        setLoadingAvailability(false);
      });

    return () => {
      cancelled = true;
    };
  }, [service.id, doctor.id, today, todayStr]);

  // Reset the auto-select guard whenever the doctor changes — switching to
  // a colleague should jump the calendar to that doctor's first opening.
  useEffect(() => {
    autoSelectedRef.current = false;
  }, [doctor.id]);

  // Auto-select the first available date on mount/doctor-change. If the
  // user has already hand-picked a date (or the prefill set one), leave it
  // alone.
  useEffect(() => {
    if (selectedDate || autoSelectedRef.current) return;
    if (loadingAvailability) return;
    autoSelectedRef.current = true;
    if (availableDates.size > 0) {
      const sorted = Array.from(availableDates).sort();
      const firstAvailable = sorted.find((d) => d >= todayStr) ?? sorted[0];
      if (firstAvailable) {
        onSelectDate(firstAvailable);
        const [yyyy, mm] = firstAvailable.split("-");
        const y = Number(yyyy);
        const m = Number(mm) - 1;
        if (!Number.isNaN(y) && !Number.isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
        }
      } else {
        onSelectDate(todayStr);
      }
    } else {
      // No availability anywhere in 6 months — keep the calendar visible
      // (user can still browse months manually). The slots panel will show
      // the standard "no slots" state for whichever date they tap.
      onSelectDate(todayStr);
    }
  }, [selectedDate, todayStr, availableDates, loadingAvailability, onSelectDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(viewYear, viewMonth, i));
    while (days.length % 7 !== 0) days.push(null);

    return days;
  }, [viewMonth, viewYear]);

  const isPastDate = useCallback(
    (d: Date) => {
      const dStr = formatDateStr(d);
      return dStr < todayStr;
    },
    [todayStr],
  );

  // Per-date slot list. Fetched on-demand from /api/booking/timeslots
  // whenever the selected date changes. ONE doctor + ONE date = single small
  // Doctra round-trip, typically <500ms.
  const [rawSlots, setRawSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!selectedDate) {
      setRawSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    fetch(
      `/api/booking/timeslots?branchId=${service.id}&operatorId=${doctor.id}&date=${selectedDate}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list: TimeSlot[] = Array.isArray(data?.slots) ? data.slots : [];
        setRawSlots(list);
        setLoadingSlots(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRawSlots([]);
        setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [service.id, doctor.id, selectedDate]);

  // Localized header (e.g. "Appointment time: Wednesday - 22 April"). Built
  // client-side so the timeslots route doesn't need a `lang` round-trip.
  const slotsHeader = useMemo(() => {
    if (!selectedDate) return "";
    const dateObj = new Date(selectedDate + "T00:00:00");
    if (Number.isNaN(dateObj.getTime())) return "";
    const dayNames = HEADER_DAY_NAMES[locale] || HEADER_DAY_NAMES.en;
    const monthNames = MONTH_NAMES[locale] || MONTH_NAMES.en;
    const prefix = HEADER_PREFIX[locale] || HEADER_PREFIX.en;
    return `${prefix}: ${dayNames[dateObj.getDay()]} - ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`;
  }, [selectedDate, locale]);

  const displaySlots = useMemo(() => {
    if (!selectedDate) return null;
    // For today, mark already-passed slots as unavailable.
    if (selectedDate === todayStr) {
      const now = new Date();
      return {
        header: slotsHeader,
        slots: rawSlots.map((slot) =>
          new Date(slot.value) <= now ? { ...slot, available: false } : slot,
        ),
      };
    }
    return { header: slotsHeader, slots: rawSlots };
  }, [selectedDate, rawSlots, slotsHeader, todayStr]);

  // Colleague doctors (same service, different doctor) — read straight from
  // the lifted aggregate, no extra fetch.
  const colleagues = useMemo<BookingOperator[]>(() => {
    if (!onSwitchDoctor) return [];
    return allDoctorsRows
      .filter((r) => r.serviceId === service.id && r.operator.id !== doctor.id)
      .filter((r) => r.operator.hasAvailability !== false)
      .map((r) => r.operator);
  }, [allDoctorsRows, service.id, doctor.id, onSwitchDoctor]);
  const loadingColleagues = false;

  const canGoPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth();

  return (
    <div className="fade-in-content h-full overflow-y-auto custom-scrollbar pr-3">
      {/* Header */}
      <div className="mb-4 sm:mb-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blackberry to-pink flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blackberry break-words">{t("selectDate")}</h2>
          </div>
        </div>
        <p className="text-grey-light text-sm ml-11 break-words">
          {doctor.name} — {t("dateHint")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-grey-lighter/80 p-3 sm:p-5 shadow-sm min-w-0 relative">
          {/* Empty-180-day inline hint — only after the scan finishes */}
          {!loadingAvailability && availableDates.size === 0 && (
            <div className="flex items-center gap-2 mb-3 px-1">
              <svg className="w-3.5 h-3.5 text-pink/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span className="text-[11px] font-medium text-grey-light/90 break-words">
                {t("noAvailabilitySixMonths")}
              </span>
            </div>
          )}

          {/* Calendar contents — dimmed and non-interactive while we scan
              Doctra for the picked doctor's availability, so the user can't
              click days that are about to grey out. The overlay below sits
              on top with a centered spinner. */}
          <div className={loadingAvailability ? "opacity-30 pointer-events-none select-none transition-opacity duration-200" : "transition-opacity duration-200"} aria-busy={loadingAvailability}>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => {
                if (viewMonth === 0) {
                  setViewMonth(11);
                  setViewYear(viewYear - 1);
                } else {
                  setViewMonth(viewMonth - 1);
                }
              }}
              disabled={!canGoPrev}
              className="w-8 h-8 rounded-lg hover:bg-pink-light flex items-center justify-center transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className="w-4 h-4 text-blackberry" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div className="text-center">
              <span className="font-bold text-blackberry text-sm">
                {MONTH_NAMES[locale]?.[viewMonth]}
              </span>
              <span className="text-blackberry/50 text-sm ml-1.5">{viewYear}</span>
            </div>
            <button
              onClick={() => {
                if (viewMonth === 11) {
                  setViewMonth(0);
                  setViewYear(viewYear + 1);
                } else {
                  setViewMonth(viewMonth + 1);
                }
              }}
              className="w-8 h-8 rounded-lg hover:bg-pink-light flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-blackberry" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
            {(DAY_NAMES[locale] || DAY_NAMES.en).map((name, i) => (
              <div
                key={name}
                className={`text-center text-[10px] sm:text-[11px] font-semibold py-1 sm:py-1.5 break-words ${
                  i >= 5 ? "text-pink/70" : "text-grey-light/80"
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="aspect-square" />;
              const dateStr = formatDateStr(day);
              const past = isPastDate(day);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              // Until the availability summary loads, treat every non-past date
              // as potentially available so the calendar isn't entirely greyed.
              const hasAvailability = availableDates.has(dateStr);
              const unavailable = !past && !loadingAvailability && !hasAvailability;
              const disabled = past || unavailable;
              // A confirmed-open day (availability has loaded) that isn't the
              // picked one. It gets a tinted fill + pink ring so "bookable"
              // reads at a glance through fill, border AND weight — not the
              // small dot alone. Clearer for low-vision users.
              const availableRest = hasAvailability && !isSelected && !past;

              return (
                <button
                  key={dateStr}
                  disabled={disabled}
                  onClick={() => {
                    onSelectDate(dateStr);
                    onSelectTime("");
                  }}
                  aria-disabled={disabled}
                  title={unavailable ? t("noSlots") : undefined}
                  className={`relative aspect-square flex items-center justify-center rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all duration-200
                    ${past ? "text-grey-light/50 cursor-not-allowed" : ""}
                    ${unavailable ? "opacity-30 cursor-not-allowed bg-grey-lighter/30 line-through decoration-grey-light/40" : ""}
                    ${!disabled ? "cursor-pointer" : ""}
                    ${isSelected ? "text-white font-bold" : ""}
                    ${availableRest ? "bg-pink-light/50 ring-1 ring-inset ring-pink/40 text-blackberry font-semibold hover:bg-pink-light hover:ring-pink/60" : ""}
                    ${!isSelected && !disabled && !availableRest ? "hover:bg-pink-light/60 text-grey" : ""}
                    ${isToday && !isSelected ? "font-bold text-blackberry" : ""}
                    ${isWeekend && !isSelected && !disabled && !availableRest ? "text-pink/60" : ""}
                  `}
                >
                  {/* Selected background */}
                  {isSelected && (
                    <div
                      className="absolute inset-0.5 rounded-xl"
                      style={{
                        background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)",
                      }}
                    />
                  )}

                  <span className="relative z-10">{day.getDate()}</span>

                  {/* Availability marker: a small pink dot for days that have
                      open slots. Hidden when the date is selected (the gradient
                      bg is enough) or when it's today (today already has its
                      own dot below). */}
                  {hasAvailability && !isSelected && !isToday && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink" />
                  )}

                  {/* Today indicator */}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink" />
                  )}
                </button>
              );
            })}
          </div>
          </div>
          {/* Centered loading overlay — sits over the dimmed calendar */}
          {loadingAvailability && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-2.5 bg-white/95 px-5 py-4 rounded-2xl shadow-md border border-grey-lighter/60 backdrop-blur-sm">
                <div className="w-7 h-7 border-[3px] border-pink border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] font-medium text-blackberry/70 break-words text-center max-w-[180px]">
                  {t("searchingAvailability")}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Time slots */}
        <div className="min-w-0">
          {!selectedDate && (
            <div className="h-full min-h-[200px] sm:min-h-[280px] flex items-center justify-center px-4">
              <div className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-cream flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-grey-light/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-grey-light text-sm font-medium break-words">{t("pickDateFirst")}</p>
                <p className="text-grey-light/50 text-xs mt-1 break-words">{t("selectDateToSeeTimes")}</p>
              </div>
            </div>
          )}

          {selectedDate && loadingSlots && (
            <div className="space-y-2.5">
              <div className="h-3 bg-grey-lighter/60 rounded w-1/3 mb-4 animate-pulse" />
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 sm:h-11 rounded-xl bg-grey-lighter/40 animate-pulse" style={{ animationDelay: `${i * 0.05}s` }} />
                ))}
              </div>
            </div>
          )}

          {selectedDate && !loadingSlots && displaySlots && (
            <div>
              {displaySlots.header && (
                <div className="flex items-center gap-2 mb-3 sm:mb-4 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink shrink-0" />
                  <p className="text-xs font-semibold text-blackberry/60 uppercase tracking-wider break-words min-w-0">
                    {displaySlots.header}
                  </p>
                </div>
              )}

              {displaySlots.slots.length === 0 ? (
                <div className="text-center py-8 sm:py-10 px-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-pink-50 flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <p className="text-grey font-medium text-sm break-words">{t("noSlots")}</p>
                  <p className="text-grey-light/60 text-xs mt-1 break-words">{t("tryDifferentDate")}</p>

                  {/* Colleague suggestions */}
                  {onSwitchDoctor && <ColleagueSuggestions
                    colleagues={colleagues}
                    loading={loadingColleagues}
                    onSelect={onSwitchDoctor}
                    t={t}
                    locale={locale}
                    service={service}
                  />}
                </div>
              ) : displaySlots.slots.every((s: TimeSlot) => !s.available) && selectedDate === todayStr ? (
                <div className="text-center py-8 sm:py-10 px-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-pink-50 flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-grey font-medium text-sm break-words">{t("noPastSlots")}</p>
                  <p className="text-grey-light/60 text-xs mt-1 break-words">{t("tryDifferentDate")}</p>

                  {/* Colleague suggestions */}
                  {onSwitchDoctor && <ColleagueSuggestions
                    colleagues={colleagues}
                    loading={loadingColleagues}
                    onSelect={onSwitchDoctor}
                    t={t}
                    locale={locale}
                    service={service}
                  />}
                </div>
              ) : (
                <div key={selectedDate} className="fade-in-content grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 gap-1.5 sm:gap-2 max-h-[300px] sm:max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {displaySlots.slots.map((slot: TimeSlot) => {
                    const isSelected = slot.value === selectedTime;
                    return (
                      <button
                        key={slot.value}
                        disabled={!slot.available}
                        onClick={() => onSelectTime(slot.value)}
                        className={`relative py-2.5 px-3 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer overflow-hidden
                          ${!slot.available ? "bg-grey-lighter/60 text-grey-light/50 cursor-not-allowed line-through border border-grey-lighter/40" : ""}
                          ${isSelected ? "text-white font-semibold shadow-lg shadow-blackberry/15" : ""}
                          ${slot.available && !isSelected ? "bg-white border border-grey-lighter/80 text-grey hover:border-pink/40 hover:bg-pink-50/50 hover:text-blackberry" : ""}
                        `}
                        style={isSelected ? { background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)" } : undefined}
                      >
                        <span className="relative z-10">{slot.time}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Colleague suggestions component (shown when no slots available) --

interface ColleagueSuggestionsProps {
  colleagues: BookingOperator[];
  loading: boolean;
  onSelect: (doctor: BookingOperator) => void;
  t: (key: string) => string;
  locale: Locale;
  service: BookingService;
}

function ColleagueSuggestions({ colleagues, loading, onSelect, t, locale, service }: ColleagueSuggestionsProps) {
  if (loading) {
    return (
      <div className="mt-6 pt-5 border-t border-grey-lighter/50">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-pink border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-grey-light">{t("loadingColleagues")}</span>
        </div>
      </div>
    );
  }

  if (colleagues.length === 0) return null;

  return (
    <div className="mt-6 pt-5 border-t border-grey-lighter/50 text-left">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-pink shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
        <p className="text-xs font-semibold text-blackberry/70 break-words">
          {t("tryColleague")}
        </p>
      </div>

      <div className="space-y-1.5">
        {colleagues.map((colleague) => (
          <button
            key={colleague.id}
            onClick={() => onSelect(colleague)}
            className="w-full group flex items-center gap-3 p-2.5 rounded-xl border border-grey-lighter/70 bg-white hover:border-pink/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-blackberry group-hover:text-white bg-pink-light group-hover:bg-gradient-to-br group-hover:from-blackberry group-hover:to-pink transition-all duration-300"
            >
              <span className="text-[10px] font-bold tracking-wide">
                {getInitials(colleague.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-grey group-hover:text-blackberry transition-colors break-words">
                {colleague.name}
              </p>
              <p className="text-[11px] text-grey-light break-words min-w-0">
                {service.name[locale]}
              </p>
            </div>
            <svg
              className="w-3.5 h-3.5 text-pink shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
