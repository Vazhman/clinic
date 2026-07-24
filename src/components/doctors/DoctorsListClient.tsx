"use client";

import Image from "next/image";

import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { getLanguage } from "@/lib/languages";
import type { Doctor } from "@/types";

// Color palette for specialty bars (brand-aligned warm tones)
const SPECIALTY_COLORS = [
  { bg: "linear-gradient(135deg, #682149 0%, #8A3A6B 100%)", text: "#fff" },  // blackberry
  { bg: "linear-gradient(135deg, #DD64A6 0%, #C44D8F 100%)", text: "#fff" },  // pink
  { bg: "linear-gradient(135deg, #8A3A6B 0%, #DD64A6 100%)", text: "#fff" },  // blackberry-pink
  { bg: "linear-gradient(135deg, #4E1836 0%, #682149 100%)", text: "#fff" },  // dark blackberry
  { bg: "linear-gradient(135deg, #C44D8F 0%, #682149 100%)", text: "#fff" },  // pink-dark
  { bg: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)", text: "#fff" },  // blackberry → pink
  { bg: "linear-gradient(135deg, #8A3A6B 0%, #C44D8F 100%)", text: "#fff" },
  { bg: "linear-gradient(135deg, #DD64A6 0%, #8A3A6B 100%)", text: "#fff" },
];

function getSpecialtyColor(specialty: string) {
  // Stable hash from specialty name → index
  let hash = 0;
  for (let i = 0; i < specialty.length; i++) {
    hash = ((hash << 5) - hash) + specialty.charCodeAt(i);
    hash |= 0;
  }
  return SPECIALTY_COLORS[Math.abs(hash) % SPECIALTY_COLORS.length];
}

interface DoctorsListClientProps {
  doctors: Doctor[];
  specialties: string[];
  showLanguages?: boolean;
}

export default function DoctorsListClient({ doctors, specialties, showLanguages = true }: DoctorsListClientProps) {
  const t = useTranslations("Doctors");
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch =
        search.length < 2 ||
        doctor.name.toLowerCase().includes(search.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(search.toLowerCase());
      const matchesSpecialty =
        !selectedSpecialty || doctor.specialty === selectedSpecialty;
      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, search, selectedSpecialty]);

  return (
    <div>
      {/* ── Search + Specialty pills ── */}
      <div className="space-y-4 mb-6 sm:mb-8">
        {/* Search bar */}
        <div className="relative w-full max-w-lg">
          <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
            <svg
              className="w-[18px] h-[18px] text-blackberry/60"
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
            className="w-full pl-12 pr-10 py-3.5 rounded-xl border-2 border-blackberry/20 bg-white text-[14px] text-grey outline-none focus:border-blackberry transition-colors duration-200 placeholder:text-grey-light"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-pink-light transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-blackberry" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Specialty filter — single compact dropdown with search-within-list */}
        <SpecialtyDropdown
          specialties={specialties}
          doctors={doctors}
          selected={selectedSpecialty}
          onSelect={setSelectedSpecialty}
          allLabel={t("allSpecialties")}
          searchPlaceholder={t("searchPlaceholder")}
        />
      </div>

      {/* Screen-reader live region for filter results */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {filtered.length} {t("doctorsFound")}
      </div>

      {/* Results count bar */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <p className="text-[13px] text-grey-light break-words min-w-0">
          <span className="font-semibold text-blackberry">{filtered.length}</span>{" "}
          {t("doctorsFound")}
        </p>
        {(search || selectedSpecialty) && (
          <button
            onClick={() => { setSearch(""); setSelectedSpecialty(null); }}
            className="flex items-center gap-1 text-xs text-pink hover:text-pink-dark font-medium transition-colors cursor-pointer break-words shrink-0"
          >
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t("clearFilters")}
          </button>
        )}
      </div>

      {/* ── Flat grid — FLIP layout animation, GPU-accelerated ── */}
      <LayoutGroup>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((doctor, i) => (
              <motion.div
                key={doctor.id}
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  // Tween (not spring) so every card glides to its new spot over
                  // the same eased duration — reads as a smooth rearrangement
                  // rather than a snappy spring with a faint overshoot. Fades are
                  // a touch longer so cards ease in/out instead of popping.
                  layout: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.3, ease: "easeOut" },
                }}
              >
                <DoctorCard doctor={doctor} index={i} showLanguages={showLanguages} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="text-center py-12 sm:py-20 px-4">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-cream flex items-center justify-center">
            <svg className="w-7 h-7 text-grey-light/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="text-grey font-medium mb-1 break-words">{t("noResults")}</p>
          <p className="text-grey-light text-sm mb-4 break-words">{t("noResultsHint")}</p>
          <button
            onClick={() => { setSearch(""); setSelectedSpecialty(null); }}
            className="text-pink text-sm font-semibold hover:text-pink-dark cursor-pointer transition-colors"
          >
            {t("clearFilters")}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Doctor card component ── */
function DoctorCard({
  doctor,
  index,
  showLanguages = true,
}: {
  doctor: Doctor;
  index: number;
  showLanguages?: boolean;
}) {
  const t = useTranslations("Doctors");
  const locale = useLocale();
  const hasExperience = doctor.experienceYears > 0;
  const hasLanguages = showLanguages && doctor.languagesSpoken.length > 0;

  return (
    <Link href={{ pathname: '/doctors/[slug]', params: { slug: doctor.slug } }} className="block group">
      <div className="relative bg-white rounded-2xl overflow-hidden border border-grey-lighter/80 hover:border-pink/20 hover:shadow-xl hover:shadow-blackberry/[0.06] transition-all duration-400 hover:-translate-y-1">
        {/* Specialty color bar */}
        <div
          className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-center break-words"
          style={{ background: getSpecialtyColor(doctor.specialty).bg, color: getSpecialtyColor(doctor.specialty).text }}
        >
          {doctor.specialty}
        </div>
        {/* Photo section */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-pink-light/30 to-grey-lighter">
          {doctor.photo ? (
            <Image
              src={doctor.photo}
              alt={doctor.name}
              fill
              priority={index < 4}
              sizes="(min-width: 1280px) 280px, (min-width: 640px) 33vw, 100vw"
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-pink/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

          {/* Department head badge */}
          {doctor.isDepartmentHead && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-lg"
              style={{ background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)" }}
            >
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-white">{t("departmentHead")}</span>
            </div>
          )}

          {/* Experience badge */}
          {hasExperience && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 text-[10px] font-bold text-blackberry shadow-sm max-w-[calc(100%-1.5rem)]">
              <svg className="w-3 h-3 text-pink shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="break-words min-w-0">
                {t("experienceYearsBadge", { years: doctor.experienceYears })}
              </span>
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="p-4 min-w-0">
          <h3 className="text-[14px] font-bold text-blackberry group-hover:text-pink transition-colors leading-tight mb-1.5 break-words lg:truncate">
            {doctor.name}
          </h3>

          {/* Meta row */}
          <div className="flex items-center gap-3 pt-2.5 border-t border-grey-lighter/60 flex-wrap">
            {doctor.specializations.length > 0 && (
              <span className="text-[10px] text-grey-light flex items-center gap-1">
                <svg className="w-3 h-3 text-pink/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                {doctor.specializations.length}
              </span>
            )}
            {doctor.qualifications.length > 0 && (
              <span className="text-[10px] text-grey-light flex items-center gap-1">
                <svg className="w-3 h-3 text-pink/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
                {doctor.qualifications.length}
              </span>
            )}
          </div>

          {hasLanguages && (
            <div className="flex items-center gap-1 flex-wrap mt-2">
              {doctor.languagesSpoken.map((code) => {
                const lang = getLanguage(code);
                return (
                  <span
                    key={code}
                    title={lang?.name[locale as "ge" | "en" | "ru"] ?? code}
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-grey-lighter text-[11px] leading-none"
                  >
                    {lang?.flag ?? code.slice(0, 2).toUpperCase()}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Specialty filter dropdown ────────────────────────────────────────────
 * Replaces a flex-wrapped pill row that, after the Doctra import seeded
 * department names as specialties, would consume most of the viewport on
 * mobile and add 4–6 rows of vertical noise on desktop. The dropdown is a
 * single-line trigger that opens a panel with an internal search box and
 * a scrollable list — fits the aesthetic of the search bar above and
 * scales to any number of specialties.
 *
 * Styling choices: rounded-xl + 2px border to match the search input;
 * blackberry/pink palette for the active state. No external dropdown
 * library — single useEffect for click-outside, single state for query.
 */
interface SpecialtyDropdownProps {
  specialties: string[];
  doctors: Doctor[];
  selected: string | null;
  onSelect: (s: string | null) => void;
  allLabel: string;
  searchPlaceholder: string;
}

function SpecialtyDropdown({
  specialties,
  doctors,
  selected,
  onSelect,
  allLabel,
  searchPlaceholder,
}: SpecialtyDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Auto-focus search field when panel opens
  useEffect(() => {
    if (open) {
      // next tick so the panel's element exists
      requestAnimationFrame(() => searchRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [open]);

  // Specialty rows derived from the current query, with per-specialty doctor
  // counts. Keep memoized so typing in the search field doesn't reflow all
  // doctors.length comparisons unnecessarily.
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of doctors) map.set(d.specialty, (map.get(d.specialty) ?? 0) + 1);
    return map;
  }, [doctors]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return specialties
      .map((s) => ({ name: s, count: counts.get(s) ?? 0 }))
      .filter((s) => !q || s.name.toLowerCase().includes(q));
  }, [specialties, counts, query]);

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border-2 bg-white text-[14px] cursor-pointer outline-none transition-colors duration-200 ${
          open
            ? "border-blackberry"
            : "border-blackberry/20 hover:border-blackberry/40 focus:border-blackberry"
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <svg className="w-[18px] h-[18px] text-blackberry/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M6 12h12m-9 7.5h6" />
          </svg>
          <span className={`truncate ${selected ? "text-blackberry font-semibold" : "text-grey"}`}>
            {selected ?? allLabel}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blackberry/10 text-blackberry shrink-0">
            {selected ? (counts.get(selected) ?? 0) : doctors.length}
          </span>
        </span>
        <svg
          className={`w-4 h-4 text-blackberry/60 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 bg-white border-2 border-blackberry/15 rounded-xl shadow-xl shadow-blackberry/10 overflow-hidden"
          role="listbox"
        >
          {/* In-panel search */}
          <div className="p-2 border-b border-grey-lighter/60">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 rounded-lg bg-cream/60 text-[13px] text-grey placeholder:text-grey-light outline-none focus:bg-cream border border-transparent focus:border-blackberry/30 transition-colors"
            />
          </div>

            {/* "All specialties" */}
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-[13px] transition-colors cursor-pointer ${
                !selected
                  ? "bg-pink-light/50 text-blackberry font-semibold"
                  : "hover:bg-cream/60 text-grey"
              }`}
              role="option"
              aria-selected={!selected}
            >
              <span>{allLabel}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blackberry/10 text-blackberry">
                {doctors.length}
              </span>
            </button>

            {/* Scrollable specialty list */}
            <div className="max-h-[340px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12px] text-grey-light">—</div>
              ) : (
                items.map(({ name, count }) => {
                  const active = selected === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        onSelect(active ? null : name);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-[13px] transition-colors cursor-pointer ${
                        active
                          ? "bg-pink-light/60 text-blackberry font-semibold"
                          : "hover:bg-cream/60 text-grey"
                      }`}
                      role="option"
                      aria-selected={active}
                    >
                      <span className="break-words min-w-0">{name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        active ? "bg-blackberry text-white" : "bg-blackberry/10 text-blackberry"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })
              )}
          </div>
        </div>
      )}
    </div>
  );
}
