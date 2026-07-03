"use client";

import { useState, useMemo, useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { type BookingService, type BookingOperator } from "@/lib/booking-data";
import type { Locale } from "@/i18n/config";

interface DoctorEntry {
  doctor: BookingOperator;
  service: BookingService;
}

interface CombinedSelectionStepProps {
  services: BookingService[];
  allDoctorsRows: { serviceId: string; operator: BookingOperator }[];
  loading: boolean;
  selectedService: BookingService | null;
  selectedDoctor: BookingOperator | null;
  onSelectService: (service: BookingService) => void;
  onSelectDoctor: (service: BookingService, doctor: BookingOperator) => void;
}

const CATEGORY_KEYS: Record<string, string> = {
  all: "categoryAll",
  cardiology: "categoryCardiology",
  neurology: "categoryNeurology",
  surgery: "categorySurgery",
  pediatric: "categoryPediatric",
  diagnostics: "categoryDiagnostics",
  other: "categoryOther",
};

// Compact glyphs for the quick-filter chip strip. Picked to read clearly at
// 14px next to the label — heart for cardio, brain for neuro, scalpel for
// surgery, child for pediatric, scope for diagnostics, plus for "other", grid
// for "all". Strokes are inherited so the active/inactive color swap is free.
const CATEGORY_GLYPHS: Record<string, ReactNode> = {
  all: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  ),
  cardiology: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11h3l2-4 3 8 2-5 2 3h6" />
    </svg>
  ),
  neurology: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4.5a3 3 0 00-3 3v.5a2.5 2.5 0 00-1.5 4.4A2.5 2.5 0 006 17a3 3 0 003 3V4.5z" />
      <path d="M15 4.5a3 3 0 013 3v.5a2.5 2.5 0 011.5 4.4A2.5 2.5 0 0118 17a3 3 0 01-3 3V4.5z" />
      <path d="M9 12h2M15 12h-2M12 7v10" />
    </svg>
  ),
  surgery: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 4l-8 8M14.5 4H20v5.5M4 20l5-5M9 15l4 4-1.5 1.5L7 16z" />
    </svg>
  ),
  pediatric: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M6 21c0-3.6 2.7-6.5 6-6.5s6 2.9 6 6.5" />
      <path d="M9.5 8h.01M14.5 8h.01" />
    </svg>
  ),
  diagnostics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </svg>
  ),
  other: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </svg>
  ),
};

// Mobile cap for the doctor grid before progressive disclosure kicks in.
// Desktop renders the full list — see grid CSS variants below.
const MOBILE_DOCTOR_LIMIT = 12;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function CombinedSelectionStep({
  services,
  allDoctorsRows,
  loading,
  selectedService,
  selectedDoctor,
  onSelectService,
  onSelectDoctor,
}: CombinedSelectionStepProps) {
  const t = useTranslations("Booking");
  const locale = useLocale() as Locale;

  // ── Service-filter dropdown state ───────────────────────────────────────
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  // activeCategory is shared between the dropdown's category chips AND the
  // top-level mobile-prominent quick-filter strip below. A single source of
  // truth keeps the two filter affordances in sync.
  const [activeCategory, setActiveCategory] = useState("all");
  // Mobile-only progressive disclosure for the doctor grid. Tapping a
  // category filter (or starting a search) auto-resets to the capped state
  // so the user lands at the top of a curated subset.
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  // Local filter — separate from the parent's selectedService so the user
  // can clear the filter ("All services") without losing the doctor they
  // already picked. Initialized from selectedService so deep links and
  // back-navigation start with the right filter applied.
  const [serviceFilter, setServiceFilter] = useState<BookingService | null>(selectedService);

  // Keep the local filter in sync if the parent reassigns selectedService
  // (e.g. URL prefill resolves after the first paint).
  useEffect(() => {
    setServiceFilter(selectedService);
  }, [selectedService]);

  // ── Doctor name search ─────────────────────────────────────────────────
  const [doctorSearch, setDoctorSearch] = useState("");

  // Refs
  const serviceWrapperRef = useRef<HTMLDivElement>(null);
  const serviceSearchInputRef = useRef<HTMLInputElement>(null);

  const categories = ["all", "cardiology", "neurology", "surgery", "pediatric", "diagnostics", "other"];

  // Click-outside closes the service dropdown
  useEffect(() => {
    if (!serviceOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!serviceWrapperRef.current?.contains(e.target as Node)) {
        setServiceOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [serviceOpen]);

  // Auto-focus the search input when the dropdown opens
  useEffect(() => {
    if (!serviceOpen) return;
    const id = window.setTimeout(() => serviceSearchInputRef.current?.focus(), 10);
    return () => window.clearTimeout(id);
  }, [serviceOpen]);

  // Build the flat list of bookable doctors. Filters out doctors with zero
  // availability in the cached aggregate — typically retired physicians,
  // equipment slots, or duplicates across departments.
  const allDoctors = useMemo<DoctorEntry[]>(() => {
    if (services.length === 0 || allDoctorsRows.length === 0) return [];
    const serviceById = new Map(services.map((s) => [s.id, s]));
    const flat: DoctorEntry[] = [];
    for (const row of allDoctorsRows) {
      const service = serviceById.get(row.serviceId);
      if (!service) continue;
      if (row.operator.hasAvailability === false) continue;
      flat.push({ doctor: row.operator, service });
    }
    return flat;
  }, [services, allDoctorsRows]);

  // Filter the service list (search + category) for the dropdown
  const filteredServices = useMemo(() => {
    let list = services;
    if (activeCategory !== "all") {
      list = list.filter((s) => s.category === activeCategory);
    }
    const q = serviceSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.ge.toLowerCase().includes(q) ||
          s.name.en.toLowerCase().includes(q) ||
          s.name.ru.toLowerCase().includes(q),
      );
    }
    return list;
  }, [services, serviceSearch, activeCategory]);

  // Filter the flat doctor list by service filter + category + name query.
  // Service filter wins over category — if a specific service is picked, the
  // category strip becomes a no-op (the chosen service already constrains the
  // list more narrowly than its parent category).
  const visibleDoctors = useMemo(() => {
    let list = allDoctors;
    if (serviceFilter) {
      list = list.filter((e) => e.service.id === serviceFilter.id);
    } else if (activeCategory !== "all") {
      list = list.filter((e) => e.service.category === activeCategory);
    }
    const q = doctorSearch.trim().toLowerCase();
    if (q.length >= 1) {
      list = list.filter((e) => e.doctor.name.toLowerCase().includes(q));
    }
    return list;
  }, [allDoctors, serviceFilter, activeCategory, doctorSearch]);

  // Reset progressive-disclosure cap whenever filters change so the user
  // lands at the top of the newly-curated list instead of mid-scroll.
  useEffect(() => {
    setShowAllDoctors(false);
  }, [serviceFilter, activeCategory, doctorSearch]);

  // Handlers
  const handleSelectService = (service: BookingService) => {
    setServiceFilter(service);
    onSelectService(service);
    setServiceOpen(false);
    setServiceSearch("");
  };

  const handleClearServiceFilter = () => {
    setServiceFilter(null);
    setServiceOpen(false);
    setServiceSearch("");
    // We deliberately don't propagate this clear up to the parent — the
    // parent's selectedService stays valid for whichever doctor the user
    // already picked. Picking a different doctor below will overwrite it.
  };

  const handleSelectDoctor = (entry: DoctorEntry) => {
    onSelectDoctor(entry.service, entry.doctor);
  };

  // When "All services" is active, show the doctor's department under the
  // name so users still see what specialty each doctor is in.
  const showServiceLabelOnCard = !serviceFilter;

  // Trigger button label
  const serviceLabel = serviceFilter ? serviceFilter.name[locale] : t("allServices");

  // Mobile progressive-disclosure for the doctor grid. Don't cap when an
  // active name search is narrowing the list — the user is already drilling
  // down on their own. Cap is mobile-only (CSS variant); desktop always sees
  // the full multi-column grid.
  const hasDoctorSearch = doctorSearch.trim().length >= 1;
  const mobileDoctorCapActive =
    !hasDoctorSearch && !showAllDoctors && visibleDoctors.length > MOBILE_DOCTOR_LIMIT;
  const hiddenDoctorCount = Math.max(0, visibleDoctors.length - MOBILE_DOCTOR_LIMIT);

  return (
    <div className="fade-in-content flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="mb-4 sm:mb-5 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blackberry to-pink flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blackberry break-words">
              {t("selectDoctor")}
            </h2>
          </div>
        </div>
        <p className="text-grey-light text-sm ml-11 break-words">{t("doctorHint")}</p>
      </div>

      {/* Category quick-filter strip.
          Horizontal-scroll on mobile so all categories are one-tap reachable
          without opening the service dropdown. Drives the top-level
          activeCategory state shared with the dropdown — single source of
          truth, two surfaces. When a service is explicitly chosen below, the
          strip stays interactive but visibly demoted (the service filter wins
          the doctor-filter contest). */}
      <div className="relative mb-3 shrink-0 -mx-1">
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1.5 px-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={t("quickFilter")}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            // When a service is selected, the strip is demoted — it's still
            // interactive, but visually muted so it doesn't compete with the
            // active service chip in the filter bar.
            const demoted = serviceFilter && cat !== "all";
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveCategory(cat);
                  // Tapping a category chip clears any specific-service filter
                  // — they're mutually exclusive intents.
                  if (cat !== "all" && serviceFilter) {
                    setServiceFilter(null);
                  }
                }}
                className={`group relative shrink-0 snap-start inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? "bg-blackberry text-white border-blackberry shadow-md shadow-blackberry/20"
                    : demoted
                    ? "bg-white text-grey-light border-grey-lighter hover:text-blackberry hover:border-blackberry/30"
                    : "bg-white text-blackberry border-blackberry/15 hover:bg-pink-light hover:border-blackberry/40"
                }`}
              >
                <span
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-pink-light" : demoted ? "text-grey-light" : "text-pink"
                  }`}
                  aria-hidden
                >
                  {CATEGORY_GLYPHS[cat]}
                </span>
                <span>{t(CATEGORY_KEYS[cat])}</span>
              </button>
            );
          })}
        </div>
        {/* Fade edges hint there's more horizontal content on narrow screens. */}
        <div aria-hidden className="absolute right-0 top-0 bottom-1.5 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden" />
      </div>

      {/* Compact filter bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 shrink-0">
        {/* Service filter dropdown */}
        <div ref={serviceWrapperRef} className="relative">
          <button
            type="button"
            onClick={() => setServiceOpen((o) => !o)}
            aria-expanded={serviceOpen}
            aria-haspopup="listbox"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border-2 text-xs font-semibold transition-colors duration-200 cursor-pointer max-w-[220px] sm:max-w-[260px] ${
              serviceFilter
                ? "bg-blackberry text-white border-blackberry shadow-md shadow-blackberry/15"
                : "bg-white text-blackberry border-blackberry/20 hover:bg-pink-light hover:border-blackberry"
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h13.5m-13.5 6h13.5m-13.5 6h13.5M3 4.5l4 4-4 4m4-4h11" />
            </svg>
            <span className="truncate min-w-0">{serviceLabel}</span>
            <svg className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${serviceOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {serviceOpen && (
            <div className="absolute z-30 left-0 top-full mt-2 w-[min(360px,calc(100vw-2rem))] rounded-2xl border-2 border-blackberry/15 bg-white shadow-xl shadow-blackberry/10 overflow-hidden">
              <div className="p-3 border-b border-grey-lighter/70 relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-grey-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <input
                  ref={serviceSearchInputRef}
                  type="text"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder={t("searchServices")}
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-blackberry/15 bg-cream/30 text-sm focus:border-blackberry focus:ring-2 focus:ring-blackberry/10 outline-none transition-colors duration-200 placeholder:text-grey-light"
                />
                {serviceSearch && (
                  <button
                    type="button"
                    onClick={() => setServiceSearch("")}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-grey-lighter transition-colors cursor-pointer"
                    aria-label="clear"
                  >
                    <svg className="w-3.5 h-3.5 text-grey-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="px-3 pt-3 pb-1 flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors duration-200 cursor-pointer ${
                      activeCategory === cat
                        ? "bg-blackberry text-white border border-blackberry"
                        : "bg-white text-blackberry border border-blackberry/15 hover:bg-pink-light hover:border-blackberry/40"
                    }`}
                  >
                    {t(CATEGORY_KEYS[cat])}
                  </button>
                ))}
              </div>

              <div className="max-h-72 overflow-y-auto custom-scrollbar p-3">
                {loading && services.length === 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-[40px] rounded-xl bg-cream/60 border border-grey-lighter/50 animate-pulse" style={{ animationDelay: `${i * 0.05}s` }} />
                    ))}
                  </div>
                ) : !loading && services.length === 0 ? (
                  <p className="text-center py-6 text-xs font-medium text-grey-light break-words">{t("errorLoading")}</p>
                ) : filteredServices.length === 0 ? (
                  <p className="text-center py-6 text-xs font-medium text-grey-light break-words">{t("noResults")}</p>
                ) : (
                  <ul className="grid grid-cols-1 gap-1.5">
                    <li>
                      <button
                        type="button"
                        onClick={handleClearServiceFilter}
                        className="group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors duration-200 cursor-pointer border border-transparent hover:bg-pink-50/60"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${serviceFilter ? "bg-grey-lighter" : "bg-pink"} group-hover:bg-pink/50`} />
                        <span className="text-sm font-medium break-words min-w-0 flex-1 text-grey group-hover:text-blackberry">
                          {t("allServices")}
                        </span>
                      </button>
                    </li>
                    {filteredServices.map((service) => {
                      const isSelected = serviceFilter?.id === service.id;
                      return (
                        <li key={service.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectService(service)}
                            className={`group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors duration-200 cursor-pointer ${
                              isSelected
                                ? "bg-gradient-to-r from-blackberry/[0.06] to-pink/[0.05] border border-blackberry/25"
                                : "border border-transparent hover:bg-pink-50/60"
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${isSelected ? "bg-pink" : "bg-grey-lighter group-hover:bg-pink/50"}`} />
                            <span className={`text-sm font-medium break-words min-w-0 flex-1 ${isSelected ? "text-blackberry" : "text-grey group-hover:text-blackberry"}`}>
                              {service.name[locale]}
                            </span>
                            {isSelected && (
                              <svg className="w-4 h-4 text-blackberry shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Doctor name search */}
        <div className="relative flex-1 min-w-[180px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-grey-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            value={doctorSearch}
            onChange={(e) => setDoctorSearch(e.target.value)}
            placeholder={t("searchDoctors")}
            className="w-full pl-9 pr-8 py-2 rounded-full border-2 border-blackberry/20 bg-white text-xs focus:border-blackberry focus:ring-2 focus:ring-blackberry/10 outline-none transition-colors duration-200 placeholder:text-grey-light"
          />
          {doctorSearch && (
            <button
              type="button"
              onClick={() => setDoctorSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-grey-lighter transition-colors cursor-pointer"
              aria-label="clear"
            >
              <svg className="w-3 h-3 text-grey-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {!loading && allDoctors.length > 0 && (
          <span className="text-[11px] text-grey-light shrink-0 break-words">
            <span className="font-semibold text-blackberry">{visibleDoctors.length}</span> {t("doctorsFound")}
          </span>
        )}
      </div>

      {/* Doctor list — compact horizontal rows, multi-column grid */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-1">
        {loading && allDoctors.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl border border-grey-lighter/60 bg-cream/40 animate-pulse"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="w-11 h-11 rounded-full bg-grey-lighter/60 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-grey-lighter/60 rounded w-3/4" />
                  <div className="h-2.5 bg-grey-lighter/40 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !loading && allDoctors.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-sm font-medium text-grey break-words">{t("errorLoading")}</p>
          </div>
        ) : visibleDoctors.length === 0 ? (
          <div className="text-center py-12 text-grey-light px-4">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-grey-lighter/60 flex items-center justify-center">
              <svg className="w-6 h-6 text-grey-light/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-grey break-words">
              {selectedService ? t("noDoctorsForService") : t("noResults")}
            </p>
          </div>
        ) : (
          <>
          {/* mobileDoctorCapActive hides children #13+ via a max-sm CSS variant
              so SSR/CSR match (no hydration flash) and desktop is byte-for-byte
              unchanged. */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 ${
              mobileDoctorCapActive ? "max-sm:[&>*:nth-child(n+13)]:hidden" : ""
            }`}
          >
            {visibleDoctors.map(({ doctor, service }) => {
              const isSelected =
                selectedDoctor?.id === doctor.id && selectedService?.id === service.id;
              const photoUrl = doctor.photo || null;
              const initials = getInitials(doctor.name);
              return (
                <button
                  key={`${service.id}-${doctor.id}`}
                  type="button"
                  onClick={() => handleSelectDoctor({ doctor, service })}
                  className={`group flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer min-w-0 ${
                    isSelected
                      ? "border-blackberry bg-gradient-to-r from-blackberry/[0.04] to-pink/[0.03] shadow-md shadow-blackberry/10"
                      : "border-grey-lighter/70 bg-white hover:border-pink/30 hover:shadow-sm"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {photoUrl ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={photoUrl}
                          alt={doctor.name}
                          fill
                          sizes="40px"
                          className="object-cover object-top"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[11px] font-bold tracking-wide"
                        style={{ background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)" }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[13px] font-semibold break-words leading-snug ${
                        isSelected ? "text-blackberry" : "text-grey group-hover:text-blackberry"
                      }`}
                    >
                      {doctor.name}
                    </p>
                    <p className="text-[10px] text-grey-light break-words leading-snug mt-0.5">
                      {showServiceLabelOnCard
                        ? service.name[locale]
                        : (doctor.specialty || service.name[locale])}
                    </p>
                  </div>
                  {/* Selected check */}
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blackberry text-white flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile-only progressive disclosure for the doctor list.
              Hidden on sm+ since the multi-column grid already keeps things
              compact. Reset happens via the filter-change effect above. */}
          {visibleDoctors.length > MOBILE_DOCTOR_LIMIT && (
            <div className="sm:hidden mt-4 pb-1">
              {mobileDoctorCapActive ? (
                <button
                  type="button"
                  onClick={() => setShowAllDoctors(true)}
                  className="group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 border-dashed border-blackberry/20 bg-cream/40 hover:border-blackberry hover:bg-white transition-all duration-300 cursor-pointer"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-blackberry to-pink flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                      +{hiddenDoctorCount}
                    </span>
                    <span className="flex flex-col items-start min-w-0">
                      <span className="text-[13px] font-semibold text-blackberry break-words leading-tight">
                        {t("showAllDoctors", { count: visibleDoctors.length })}
                      </span>
                      <span className="text-[10px] text-grey-light/90 tracking-wide leading-tight mt-0.5">
                        {t("doctorsHidden", { count: hiddenDoctorCount })}
                      </span>
                    </span>
                  </span>
                  <svg
                    className="w-4 h-4 text-blackberry shrink-0 group-hover:translate-y-0.5 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              ) : (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllDoctors(false)}
                    className="group inline-flex items-center gap-2 text-blackberry font-semibold text-[12px] px-4 py-2 rounded-full border border-blackberry/15 hover:border-blackberry hover:bg-cream transition-all duration-300 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                    <span className="break-words">{t("showLessDoctors")}</span>
                  </button>
                </div>
              )}
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
