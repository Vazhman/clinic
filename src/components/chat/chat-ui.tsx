"use client";

/**
 * Shared rendering pieces between the floating <ChatAssistant /> widget and
 * the full-page /ai-assistant experience — both talk to the same /api/chat
 * route and must render the same message shapes identically.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link as IntlLink } from "@/i18n/navigation";
import { localizeName } from "@/lib/translit-ka";
import type { UIMessage } from "ai";

export function messageText(message: UIMessage): string {
  return (message.parts ?? [])
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function DoctorCard({ slug, locale }: { slug: string; locale: string }) {
  const [doc, setDoc] = useState<{ name: string; specialty?: string; photo?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/doctors?where[slug][equals]=${encodeURIComponent(slug)}&depth=1&limit=1&locale=${locale}`,
      { credentials: "include" },
    )
      .then((r) => r.json())
      .then((j: { docs?: Array<{ name?: string; specialty?: string; photo?: { url?: string } | null }> }) => {
        const d = j.docs?.[0];
        if (!d || cancelled) return;
        setDoc({
          name: localizeName(String(d.name ?? ""), locale),
          specialty: d.specialty ? localizeName(String(d.specialty), locale) : undefined,
          photo: typeof d.photo === "object" && d.photo ? d.photo.url ?? undefined : undefined,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug, locale]);

  if (!doc) return null;

  return (
    <IntlLink
      href={{ pathname: "/doctors/[slug]", params: { slug } }}
      className="my-1.5 flex items-center gap-3 bg-white border border-pink/20 hover:border-pink rounded-2xl p-2.5 transition-colors no-underline shadow-sm"
    >
      {doc.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={doc.photo} alt={doc.name} className="w-12 h-12 rounded-xl object-cover object-top shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-pink-light shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-blackberry truncate">{doc.name}</p>
        {doc.specialty && <p className="text-[11px] text-pink font-medium truncate">{doc.specialty}</p>}
      </div>
      <svg className="w-4 h-4 text-grey-light ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </IntlLink>
  );
}

/**
 * Render a single line of assistant text. If the line looks like a relative
 * booking URL (/[locale]/booking?...) or a doctor-profile URL, render it as
 * a styled CTA/card. Anything else → plain text.
 *
 * Only paths starting with /ge|en|ru/booking or /doctors/ are ever rendered
 * as styled buttons/cards, so the model can't trick us into rendering
 * arbitrary external links that way.
 */
export function renderLine(line: string, locale: string, bookCta: string, key: string) {
  const trimmed = line.trim();
  const safe = new RegExp(`^/(ge|en|ru)/booking($|\\?)`).test(trimmed);
  if (safe) {
    return (
      <Link
        key={key}
        href={trimmed}
        className="my-1 inline-flex items-center gap-1.5 bg-pink hover:bg-pink/90 text-white text-[13px] font-bold px-4 py-2 rounded-full transition-colors shadow-sm"
      >
        {bookCta}
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    );
  }
  const doctorMatch = trimmed.match(/^\/(?:ge|en|ru)\/doctors\/([\w-]+)(?:\?.*)?$/);
  if (doctorMatch) {
    return <DoctorCard key={key} slug={doctorMatch[1]} locale={locale} />;
  }
  return (
    <span key={key} className="block">
      {line || " "}
    </span>
  );
}

export function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
