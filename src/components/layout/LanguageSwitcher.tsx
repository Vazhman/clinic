"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  // next-intl returns the route *template* from usePathname (e.g. "/blog/[slug]"),
  // so router.replace needs the resolved params to substitute tokens back in.
  // Without this it throws on any dynamic localized route.
  const rawParams = useParams();
  const { locale: _ignored, ...routeParams } = (rawParams ?? {}) as Record<string, string | string[]>;

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {locales.map((l) => (
        <button
          key={l}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick={() => router.replace({ pathname, params: routeParams } as any, { locale: l })}
          className={`px-2 py-1 text-[11px] font-semibold tracking-wider uppercase rounded transition-all cursor-pointer whitespace-nowrap ${
            locale === l ? "bg-pink/15 text-pink" : "text-grey/30 hover:text-grey/60"
          }`}>
          {l === "ge" ? "GE" : l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
