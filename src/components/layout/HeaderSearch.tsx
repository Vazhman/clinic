"use client";

/**
 * Sitewide search — icon button in the header opens a centered command-palette
 * style modal (full-bleed sheet on mobile, floating card on desktop). Backed
 * by /api/search, which fans out across pages/news/services/doctors.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { SiteSearchResult } from "@/lib/payload-data";

const TYPE_LABEL_KEYS: Record<SiteSearchResult["type"], string> = {
  page: "typePage",
  news: "typeNews",
  service: "typeService",
  doctor: "typeDoctor",
};

const TYPE_ICON_PATHS: Record<SiteSearchResult["type"], string> = {
  page: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  news: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m-6 9h6m-6-4h6m2-9H9a2 2 0 00-2 2v14l3-2 3 2 3-2 3 2V6a2 2 0 00-2-2z",
  service: "M9 3v2m6-2v2M4 8h16M5 8h14v11a2 2 0 01-2 2H7a2 2 0 01-2-2V8z",
  doctor: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
};

/** Wraps the first case-insensitive match of `query` inside `text` with a highlight span. */
function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-pink font-bold">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function HeaderSearch() {
  const t = useTranslations("HeaderSearch");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SiteSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
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
        .then((j: { results?: SiteSearchResult[] }) => {
          setResults(j.results ?? []);
          setActiveIndex(-1);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, locale]);

  // Keyboard: Esc closes, Up/Down move through the flattened result list, Enter opens it.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => {
          const next = Math.min(i + 1, results.length - 1);
          itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => {
          const next = Math.max(i - 1, 0);
          itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (e.key === "Enter" && activeIndex >= 0) {
        const item = results[activeIndex];
        if (item) {
          setOpen(false);
          router.push(item.url);
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, results, activeIndex, router]);

  const grouped = (["page", "news", "service", "doctor"] as const)
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);

  let flatIndex = -1;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-grey/60 hover:text-blackberry hover:bg-pink-light/40 transition-colors shrink-0"
        aria-label={t("openLabel")}
      >
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[110] flex justify-center items-start sm:pt-[12vh] px-0 sm:px-4">
          <div
            className="absolute inset-0 bg-blackberry/30 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full sm:max-w-xl bg-white sm:rounded-3xl shadow-2xl shadow-black/20 border-b sm:border border-grey-lighter/70 overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[min(80vh,640px)] animate-[modalIn_0.18s_cubic-bezier(0.16,1,0.3,1)]">
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-grey-lighter/70 shrink-0">
              <svg className="w-5 h-5 text-blackberry/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("placeholder")}
                className="flex-1 min-w-0 text-[15px] sm:text-base text-grey outline-none placeholder:text-grey-light/70 bg-transparent"
                autoComplete="off"
                inputMode="search"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-grey-light hover:text-blackberry hover:bg-pink-light/40 transition-colors shrink-0"
                  aria-label={t("closeLabel")}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-grey-light hover:text-blackberry hover:bg-pink-light/40 transition-colors shrink-0"
                aria-label={t("closeLabel")}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
              {query.trim().length < 2 && !loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-pink-light/40 flex items-center justify-center">
                    <svg className="w-6 h-6 text-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <p className="text-[13px] text-grey-light">{t("typeHint")}</p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-14">
                  <svg className="w-6 h-6 text-pink animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                  </svg>
                  <p className="text-[13px] text-grey-light">{t("loading")}</p>
                </div>
              )}

              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-grey-lighter/60 flex items-center justify-center">
                    <svg className="w-6 h-6 text-grey-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-[13px] text-grey-light">{t("noResults")}</p>
                </div>
              )}

              {!loading &&
                grouped.map((group) => (
                  <div key={group.type} className="py-1.5">
                    <p className="px-3.5 pt-2 pb-1.5 text-[10px] font-bold text-grey-light tracking-[0.15em] uppercase">
                      {t(TYPE_LABEL_KEYS[group.type])}
                    </p>
                    {group.items.map((item) => {
                      flatIndex += 1;
                      const idx = flatIndex;
                      const isActive = idx === activeIndex;
                      return (
                        <Link
                          key={`${item.type}-${item.url}`}
                          ref={(el) => {
                            itemRefs.current[idx] = el;
                          }}
                          href={item.url}
                          onClick={() => setOpen(false)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex items-center gap-3 mx-1.5 px-3 py-2.5 rounded-xl text-[13.5px] transition-colors ${
                            isActive ? "bg-pink-light/50 text-blackberry" : "text-grey hover:bg-pink-light/30 hover:text-blackberry"
                          }`}
                        >
                          <svg className="w-4 h-4 text-pink/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={TYPE_ICON_PATHS[item.type]} />
                          </svg>
                          <span className="truncate flex-1">{highlightMatch(item.title, query)}</span>
                          <svg className="w-3.5 h-3.5 text-grey-light shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </Link>
                      );
                    })}
                  </div>
                ))}
            </div>

            {/* Keyboard hint footer — desktop only, hidden once no results/pointer-driven mobile */}
            {results.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-5 py-2.5 border-t border-grey-lighter/70 text-[11px] text-grey-light shrink-0">
                <kbd className="px-1.5 py-0.5 rounded bg-grey-lighter/70 font-mono text-[10px]">↑↓</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-grey-lighter/70 font-mono text-[10px]">Enter</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-grey-lighter/70 font-mono text-[10px]">Esc</kbd>
                <span>{t("resultsHint")}</span>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
