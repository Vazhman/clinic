"use client";

/**
 * Collapsible sitewide search — sits between the desktop nav and
 * <LanguageSwitcher /> in Header.tsx. Icon-only when closed; opens into a
 * small input + results dropdown anchored to the button. Backed by
 * /api/search, which fans out across pages/news/services/doctors.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { SiteSearchResult } from "@/lib/payload-data";

const TYPE_LABEL_KEYS: Record<SiteSearchResult["type"], string> = {
  page: "typePage",
  news: "typeNews",
  service: "typeService",
  doctor: "typeDoctor",
};

export default function HeaderSearch() {
  const t = useTranslations("HeaderSearch");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SiteSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}&locale=${locale}`)
        .then((r) => r.json())
        .then((j: { results?: SiteSearchResult[] }) => setResults(j.results ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, locale]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const grouped = (["page", "news", "service", "doctor"] as const)
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-grey/60 hover:text-blackberry hover:bg-pink-light/40 transition-colors"
        aria-label={open ? t("closeLabel") : t("openLabel")}
        aria-expanded={open}
      >
        {open ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[280px] sm:w-[340px] bg-white rounded-2xl shadow-2xl shadow-black/15 border border-grey-lighter overflow-hidden z-50">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center gap-2 px-3.5 py-2.5 border-b border-grey-lighter"
          >
            <svg className="w-4 h-4 text-grey-light shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("placeholder")}
              className="flex-1 min-w-0 text-[13px] text-grey outline-none placeholder:text-grey-light/60 bg-transparent"
              autoComplete="off"
            />
          </form>

          <div className="max-h-[340px] overflow-y-auto">
            {loading && (
              <p className="px-3.5 py-3 text-[12px] text-grey-light text-center">{t("loading")}</p>
            )}

            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <p className="px-3.5 py-3 text-[12px] text-grey-light text-center">{t("noResults")}</p>
            )}

            {!loading &&
              grouped.map((group) => (
                <div key={group.type} className="py-1.5">
                  <p className="px-3.5 pt-1 pb-1 text-[10px] font-bold text-grey-light tracking-[0.15em] uppercase">
                    {t(TYPE_LABEL_KEYS[group.type])}
                  </p>
                  {group.items.map((item) => (
                    <Link
                      key={`${item.type}-${item.url}`}
                      href={item.url}
                      onClick={() => setOpen(false)}
                      className="block px-3.5 py-2 text-[13px] text-grey hover:text-blackberry hover:bg-pink-light/30 transition-colors truncate"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
