"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

type NavSubLink = { label: string; href: string };

type NavigationCms = {
  mainMenu?: Array<{
    label?: string | null;
    href?: string | null;
    isHighlighted?: boolean | null;
    subLinks?: NavSubLink[] | null;
  }> | null;
  ctaButton?: { label?: string | null; href?: string | null } | null;
} | null;

type ContactCms = {
  phone?: { value?: string | null; display?: string | null } | null;
} | null;

const DEFAULT_MENU_KEYS = [
  { href: "/about", key: "about" },
  { href: "/services", key: "services" },
  { href: "/doctors", key: "doctors" },
  { href: "/checkups", key: "checkups" },
  { href: "/blog", key: "blog" },
  // DISABLED 2026-05-30 per client request — Health Library hidden from nav.
  // { href: "/health-library", key: "healthLibrary" },
  { href: "/contact", key: "contact" },
] as const;

export default function Header({
  navigation,
  contact,
}: {
  navigation?: NavigationCms;
  contact?: ContactCms;
} = {}) {
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Which mobile parent has its dropdown expanded (one at a time). Keyed by href.
  const [openMobileSub, setOpenMobileSub] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prefer CMS-defined menu when admin has added items, else fall back to the
  // canonical hardcoded list (rendered via typed @/i18n/navigation Link).
  const cmsMenu = (navigation?.mainMenu ?? []).filter(
    (m): m is { label: string; href: string; isHighlighted?: boolean | null; subLinks?: NavSubLink[] | null } =>
      typeof m?.label === "string" && m.label.length > 0 && typeof m?.href === "string" && m.href.length > 0,
  );
  const cleanSubLinks = (subs?: NavSubLink[] | null): NavSubLink[] =>
    (subs ?? []).filter((s) => s && typeof s.label === "string" && s.label.length > 0 && typeof s.href === "string" && s.href.length > 0);
  const navItems: Array<{ href: string; label: string; subLinks: NavSubLink[] }> = cmsMenu.length > 0
    ? cmsMenu.map((m) => ({ href: m.href, label: m.label, subLinks: cleanSubLinks(m.subLinks) }))
    : DEFAULT_MENU_KEYS.map((m) => ({ href: m.href as string, label: t(m.key), subLinks: [] }));

  const ctaLabel = navigation?.ctaButton?.label?.trim() ?? "";
  const ctaHref = navigation?.ctaButton?.href?.trim() || "/booking";

  // Mobile menu phone — CMS phone.display falls back to .value (both from CMS).
  const mobilePhoneDisplay = contact?.phone?.display?.trim() || contact?.phone?.value?.trim() || "";
  const mobilePhoneHref = `tel:${(contact?.phone?.value?.trim() ?? "").replace(/[^+\d]/g, "")}`;

  // Home ("/") must match exactly — otherwise startsWith("/") is true for
  // every route and the home link looks permanently active. Other links are
  // active on an exact match or a sub-path (e.g. /blog active on /blog/[slug]).
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  // Language-specific logo. Both assets are now tightly cropped wordmarks with
  // no surrounding padding (Georgian 800x321; English 1112x471, trimmed from
  // the original padded 1921x1081 footer PNG), so they share one size box and
  // render at the same visual height. Russian falls back to the English logo:
  // no logo-footer-ru asset exists yet.
  const isGeoLogo = locale === "ge";
  const headerLogo = isGeoLogo ? "/images/logo-geo.png" : "/images/logo-footer-en-trim.png";
  const headerLogoBox = "h-11 sm:h-12";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
      scrolled
        ? "bg-white/95 backdrop-blur-xl border-blackberry/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
        : "bg-white/80 backdrop-blur-md border-blackberry/[0.06]"
    }`}>
      {/* Top accent line */}
      <div className="h-[2px] bg-gradient-to-r from-blackberry via-pink to-blackberry" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        <div className="flex items-center justify-between h-[68px]">
          <Link href="/" className="shrink-0 group mr-4 xl:mr-8">
            <Image
              src={headerLogo}
              alt={t("logoAlt")}
              width={isGeoLogo ? 800 : 1112}
              height={isGeoLogo ? 321 : 471}
              priority
              className={`${headerLogoBox} w-auto transition-transform duration-300 group-hover:scale-[1.02] object-contain`}
            />
          </Link>

          <nav className="hidden xl:flex items-center gap-0.5">
            {navItems.map((item) =>
              item.subLinks.length > 0 ? (
                // Parent with a hover/focus dropdown. The wrapper is the hover
                // target; the `pt-2` bridge keeps the panel reachable while the
                // cursor travels from the pill down into it.
                <div key={item.href} className="relative group">
                  <Link href={item.href as never}
                    className={`nav-pill relative flex items-center gap-1 px-2 xl:px-3 py-2 text-[13px] leading-[1.45] font-semibold whitespace-nowrap transition-all duration-300 rounded-full ${
                      isActive(item.href)
                        ? "nav-active text-blackberry"
                        : "text-grey/75 hover:text-blackberry"
                    }`}>
                    {item.label}
                    <svg className="w-3 h-3 shrink-0 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </Link>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 z-50">
                    <div className="min-w-[220px] bg-white/95 backdrop-blur-xl rounded-2xl border border-blackberry/[0.08] shadow-[0_12px_40px_-8px_rgba(104,33,73,0.22)] p-2 overflow-hidden">
                      {item.subLinks.map((sub) => (
                        <Link key={sub.href} href={sub.href as never}
                          className={`block px-3.5 py-2.5 rounded-xl text-[13px] leading-snug font-medium transition-colors duration-200 ${
                            isActive(sub.href)
                              ? "text-blackberry bg-pink-light/50"
                              : "text-grey/80 hover:text-blackberry hover:bg-pink-light/40"
                          }`}>
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={item.href} href={item.href as never}
                  className={`nav-pill relative px-2 xl:px-3 py-2 text-[13px] leading-[1.45] font-semibold whitespace-nowrap transition-all duration-300 rounded-full ${
                    isActive(item.href)
                      ? "nav-active text-blackberry"
                      : "text-grey/75 hover:text-blackberry"
                  }`}>
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language switcher — always visible in the header bar, left of
                the burger button on mobile and alongside other controls on
                desktop. No longer duplicated inside the mobile menu panel. */}
            <LanguageSwitcher />
            {/* Patient Room — visible from sm: upward (640px+) so tablet and
                large-phone users see it without opening the burger. Always
                icon + text together for clarity (the icon alone reads as a
                generic profile silhouette). The mobile burger menu also
                contains the link for sub-sm screens. */}
            <Link
              href={"/patient-room" as never}
              title={t("patientRoom")}
              className="hidden sm:inline-flex items-center gap-1.5 text-[12px] leading-[1.45] font-semibold px-3.5 py-2.5 rounded-full text-blackberry border-2 border-blackberry/20 hover:border-blackberry hover:text-pink transition-colors duration-200"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="whitespace-nowrap">{t("patientRoom")}</span>
            </Link>
            <Link href={ctaHref as never} className="hidden sm:inline-flex items-center gap-2 text-[12px] leading-[1.45] font-bold px-5 py-2.5 rounded-full text-white transition-all duration-300 hover:shadow-lg hover:shadow-pink/20 hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #682149 0%, #8A3A6B 50%, #DD64A6 100%)" }}>
              <span className="whitespace-nowrap">{ctaLabel}</span>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
            {/* Mobile menu toggle — a labeled pill matching the site's pill/CTA
                language. Icon crossfades (no rotate-morph) and the pill fills
                blackberry when open, so it reads as an intentional control. */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`xl:hidden inline-flex items-center gap-2 h-10 pl-3 pr-3.5 rounded-full border-2 cursor-pointer transition-colors duration-300 ${mobileMenuOpen ? "bg-blackberry border-blackberry text-white" : "border-blackberry/20 text-blackberry hover:border-blackberry"}`}
              aria-label={mobileMenuOpen ? (locale === "en" ? "Close" : locale === "ru" ? "Закрыть" : "დახურვა") : (locale === "en" ? "Menu" : locale === "ru" ? "Меню" : "მენიუ")}
              aria-expanded={mobileMenuOpen}
            >
              <span className="relative w-5 h-5 shrink-0" aria-hidden>
                {/* menu glyph (two refined bars) */}
                <span className={`absolute inset-0 flex flex-col justify-center gap-[3px] transition-all duration-200 ${mobileMenuOpen ? "opacity-0 scale-50" : "opacity-100 scale-100"}`}>
                  <span className="h-[3px] w-3.5 rounded-full bg-current" />
                  <span className="h-[3px] w-5 rounded-full bg-current" />
                </span>
                {/* close glyph */}
                <svg className={`absolute inset-0 w-5 h-5 transition-all duration-200 ${mobileMenuOpen ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </span>
              <span className="text-[12px] font-bold leading-none">
                {mobileMenuOpen ? (locale === "en" ? "Close" : locale === "ru" ? "Закрыть" : "დახურვა") : (locale === "en" ? "Menu" : locale === "ru" ? "Меню" : "მენიუ")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {/* `overflow-hidden` clips a normal box-shadow, so the soft drop-shadow
          beneath the open menu is faked with a gradient strip sitting INSIDE
          the clipped bounds. max-h bumped a touch to include the strip. */}
      <div className={`xl:hidden overflow-hidden transition-all duration-500 ${mobileMenuOpen ? "max-h-[85vh]" : "max-h-0"}`}>
        <div className="bg-white/95 backdrop-blur-xl border-t border-pink/10 max-h-[85vh] overflow-y-auto">
          <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 py-6">
            {navItems.map((item) =>
              item.subLinks.length > 0 ? (
                <div key={item.href} className="border-b border-grey-lighter/60 last:border-0">
                  <div className="flex items-center">
                    <Link href={item.href as never} onClick={() => setMobileMenuOpen(false)}
                      className={`flex flex-1 items-center gap-3 py-3.5 text-[15px] font-semibold transition-colors break-words ${
                        isActive(item.href) ? "text-blackberry" : "text-grey/75 hover:text-blackberry"
                      }`}>
                      {isActive(item.href) && <span className="w-1.5 h-1.5 rounded-full bg-pink shrink-0" />}
                      {item.label}
                    </Link>
                    <button type="button" aria-label="Toggle submenu" aria-expanded={openMobileSub === item.href}
                      onClick={() => setOpenMobileSub(openMobileSub === item.href ? null : item.href)}
                      className="p-2 -mr-2 text-grey/60 hover:text-blackberry transition-colors">
                      <svg className={`w-4 h-4 transition-transform duration-300 ${openMobileSub === item.href ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${openMobileSub === item.href ? "max-h-96" : "max-h-0"}`}>
                    <div className="pl-4 pb-2 border-l-2 border-pink/20 ml-1 space-y-0.5">
                      {item.subLinks.map((sub) => (
                        <Link key={sub.href} href={sub.href as never} onClick={() => setMobileMenuOpen(false)}
                          className={`block py-2.5 text-[14px] font-medium transition-colors break-words ${
                            isActive(sub.href) ? "text-blackberry" : "text-grey/70 hover:text-blackberry"
                          }`}>
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={item.href} href={item.href as never} onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 py-3.5 text-[15px] font-semibold border-b border-grey-lighter/60 last:border-0 transition-colors break-words ${
                    isActive(item.href) ? "text-blackberry" : "text-grey/75 hover:text-blackberry"
                  }`}>
                  {isActive(item.href) && <span className="w-1.5 h-1.5 rounded-full bg-pink shrink-0" />}
                  {item.label}
                </Link>
              ),
            )}
            <div className="pt-5 space-y-3 border-t border-grey-lighter mt-2">
              <a href={mobilePhoneHref} className="flex items-center gap-3 text-[14px] text-grey break-words">
                <svg className="w-4 h-4 text-pink shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                {mobilePhoneDisplay}
              </a>
              <p className="flex items-start gap-3 flex-wrap break-words text-[12px] sm:text-[13px] text-grey-light">
                <svg className="w-4 h-4 text-pink shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="break-words">{t("workingHoursShort")}</span>
              </p>
            </div>
            <div className="pt-5 space-y-3">
              <Link href={ctaHref as never} onClick={() => setMobileMenuOpen(false)} className="block w-full text-center text-white text-[14px] font-bold py-3.5 rounded-2xl" style={{ background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)" }}>{ctaLabel}</Link>
              <Link
                href={"/patient-room" as never}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full text-center text-blackberry text-[14px] font-semibold py-3 rounded-2xl border-2 border-blackberry/20 hover:border-blackberry hover:text-pink transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {t("patientRoom")}
              </Link>
            </div>
          </nav>
        </div>
        <div aria-hidden className="h-3 bg-gradient-to-b from-black/10 to-transparent" />
      </div>
    </header>
  );
}
