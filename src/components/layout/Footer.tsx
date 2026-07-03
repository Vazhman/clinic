import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { FooterCms, ContactPageCms, SiteSettingsCms } from "@/lib/payload-data";
import RawEmbedScript from "@/components/shared/RawEmbedScript";

const SOCIAL_ICON_PATHS: Record<string, string> = {
  facebook: "M18.77,7.46H14.5v-1.9c0-.9.6-1.1,1-1.1h3V.5h-4.33C10.24.5,9.5,3.44,9.5,5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z",
  instagram: "M12,2.16c3.2,0,3.58.01,4.85.07,3.25.15,4.77,1.69,4.92,4.92.06,1.27.07,1.65.07,4.85s-.01,3.58-.07,4.85c-.15,3.23-1.66,4.77-4.92,4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38,3.92,3.9,2.38,7.15,2.23,8.42,2.18,8.8,2.16,12,2.16ZM12,0C8.74,0,8.33.01,7.05.07c-4.27.2-6.78,2.71-6.98,6.98C.01,8.33,0,8.74,0,12s.01,3.67.07,4.95c.2,4.27,2.71,6.78,6.98,6.98,1.28.06,1.69.07,4.95.07s3.67-.01,4.95-.07c4.27-.2,6.78-2.71,6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.27-2.71-6.78-6.98-6.98C15.67.01,15.26,0,12,0Zm0,5.84A6.16,6.16,0,1,0,18.16,12,6.16,6.16,0,0,0,12,5.84ZM12,16a4,4,0,1,1,4-4A4,4,0,0,1,12,16ZM18.41,4.15a1.44,1.44,0,1,0,1.44,1.44A1.44,1.44,0,0,0,18.41,4.15Z",
  youtube: "M23.5,6.2c-.3-1-1.1-1.8-2.1-2.1C19.5,3.6,12,3.6,12,3.6S4.5,3.6,2.6,4.1C1.6,4.4.8,5.2.5,6.2,0,8.1,0,12,0,12s0,3.9.5,5.8c.3,1,1.1,1.8,2.1,2.1,1.9.5,9.4.5,9.4.5s7.5,0,9.4-.5c1-.3,1.8-1.1,2.1-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6,15.6V8.4l6.2,3.6-6.2,3.6Z",
  linkedin: "M20.45,20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04s-2.14,1.45-2.14,2.94v5.67h-3.55V9h3.41v1.56h.05c.47-.9,1.64-1.85,3.37-1.85,3.6,0,4.27,2.37,4.27,5.46v6.28ZM5.34,7.43c-1.14,0-2.06-.93-2.06-2.06s.92-2.06,2.06-2.06,2.06.92,2.06,2.06-.92,2.06-2.06,2.06ZM7.12,20.45h-3.56V9h3.56v11.45ZM22.22,0H1.77C.79,0,0,.78,0,1.74v20.52c0,.96.79,1.74,1.77,1.74h20.45c.98,0,1.78-.78,1.78-1.74V1.74C24,.78,23.2,0,22.22,0Z",
  tiktok: "M19.59,6.69a4.83,4.83,0,0,1-3.77-4.25V2h-3.45V13.67a2.89,2.89,0,0,1-5.2,1.74,2.89,2.89,0,0,1,2.31-4.64,2.93,2.93,0,0,1,.88.13V7.4a6.84,6.84,0,0,0-1-.05A6.33,6.33,0,0,0,5.8,18.87a6.34,6.34,0,0,0,10.86-4.43V8.16a8.16,8.16,0,0,0,4.77,1.52V6.23A4.85,4.85,0,0,1,19.59,6.69Z",
};

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

export default function Footer({
  footer,
  contact: contactCms,
  siteSettings,
  legal,
}: {
  footer?: FooterCms;
  contact?: ContactPageCms;
  siteSettings?: SiteSettingsCms;
  // Which legal pages are published in the CMS. A link renders only when its
  // page actually exists — no placeholder, no dead link. Undefined → hide both.
  legal?: { terms?: boolean; privacy?: boolean };
} = {}) {
  const t = useTranslations("Footer");
  const nav = useTranslations("Navigation");
  const contact = useTranslations("Contact");
  const locale = useLocale();
  const y = new Date().getFullYear();
  const footerLogo = locale === "ge" ? "/images/logo-footer-ge.svg" : "/images/logo-footer-en.svg";
  // Note: We use the English logo as a fallback for Russian since logo-footer-ru.png is currently missing.

  // CMS-only resolution per field. Empty strings count as missing.
  const description = footer?.description?.trim() ?? "";
  const copyright = footer?.copyright?.trim() || `© ${y} ${t("clinicName")}. ${t("rights")}.`;

  const addressValue = contactCms?.address?.value?.trim() ?? "";
  const phoneHrefRaw = contactCms?.phone?.value?.trim() ?? "";
  // Strip whitespace + parens for the tel: link so the OS dialer doesn't break.
  const phoneHref = `tel:${phoneHrefRaw.replace(/[^+\d]/g, "")}`;
  const phoneDisplay = contactCms?.phone?.display?.trim() || contactCms?.phone?.value?.trim() || "";
  const emailValue = contactCms?.email?.value?.trim() ?? "";
  const emailDisplay = contactCms?.email?.value?.trim() ?? "";
  const weekdays = contactCms?.workingHours?.weekdays?.trim() ?? "";
  const weekends = contactCms?.workingHours?.weekends?.trim() ?? "";

  // Social links — CMS now holds the canonical links.
  const cmsSocials = (footer?.socialLinks ?? []).filter(
    (s): s is { platform: string; url: string } =>
      typeof s?.platform === "string" && typeof s?.url === "string" && s.url.length > 0,
  );
  const socials = cmsSocials;

  // Quick links — CMS wins if admin defined them, else canonical hardcoded.
  const cmsLinks = (footer?.quickLinks ?? []).filter(
    (l): l is { label: string; href: string } =>
      typeof l?.label === "string" && l.label.length > 0 && typeof l?.href === "string" && l.href.length > 0,
  );

  return (
    <footer className="bg-blackberry-dark">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-6">
              <Image src={footerLogo} alt={t("clinicName")} width={1921} height={1081} className="h-20 sm:h-24 w-auto" />
            </Link>
            <p className="text-[14px] text-white/60 leading-relaxed max-w-xs break-words">{description}</p>
            <div className="flex gap-2.5 mt-8">
              {socials.map((s) => {
                const iconPath = SOCIAL_ICON_PATHS[s.platform];
                const label = PLATFORM_LABELS[s.platform] ?? s.platform;
                return (
                  <a key={s.platform + s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/60 hover:text-pink hover:bg-white/10 transition-all" aria-label={label}>
                    {iconPath ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={iconPath} /></svg>
                    ) : (
                      <span className="text-[10px] font-bold uppercase">{label.slice(0, 2)}</span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
          <div className="lg:col-span-2">
            <h3 className="text-[11px] text-white/55 font-bold tracking-[0.2em] uppercase mb-6">{t("quickLinks")}</h3>
            <nav className="space-y-3.5">
              {cmsLinks.length > 0 ? (
                cmsLinks.map((link) => (
                  <Link key={link.href + link.label} href={link.href as never} className="block text-[14px] text-white/65 hover:text-pink transition-colors">
                    {link.label}
                  </Link>
                ))
              ) : (
                ([
                  { href: "/about", key: "about" },
                  { href: "/services", key: "services" },
                  { href: "/doctors", key: "doctors" },
                  { href: "/checkups", key: "checkups" },
                  { href: "/lab-tests", key: "labTests" },
                  { href: "/blog", key: "blog" },
                  // Gallery is intentionally footer-only (per client request) —
                  // kept out of the main nav but crawlable for SEO.
                  { href: "/gallery", key: "gallery" },
                  // DISABLED 2026-05-30 per client request — Health Library hidden.
                  // { href: "/health-library", key: "healthLibrary" },
                ] as const).map(({ href, key }) => (
                  <Link key={href} href={href} className="block text-[14px] text-white/65 hover:text-pink transition-colors">
                    {nav(key)}
                  </Link>
                ))
              )}
              {/* Legal links — CMS-driven: each renders only when the „Policies"
                  global has content for this locale (see layout.tsx). Empty → no
                  link, and /policies/[type] 404s. */}
              {legal?.terms && (
                <Link href={{ pathname: "/policies/[type]", params: { type: "terms" } }} className="block text-[14px] text-white/65 hover:text-pink transition-colors">
                  {nav("terms")}
                </Link>
              )}
              {legal?.privacy && (
                <Link href={{ pathname: "/policies/[type]", params: { type: "privacy" } }} className="block text-[14px] text-white/65 hover:text-pink transition-colors">
                  {nav("privacy")}
                </Link>
              )}
            </nav>
          </div>
          <div className="lg:col-span-3">
            <h3 className="text-[11px] text-white/55 font-bold tracking-[0.2em] uppercase mb-6">{t("contactInfo")}</h3>
            <div className="space-y-4 text-[14px] text-white/65 break-words">
              <p className="break-words">{addressValue}</p>
              <a href={phoneHref} className="block hover:text-pink transition-colors break-words">{phoneDisplay}</a>
              <a href={`mailto:${emailValue}`} className="block hover:text-pink transition-colors break-words">{emailDisplay}</a>
            </div>
          </div>
          <div className="lg:col-span-3">
            <h3 className="text-[11px] text-white/55 font-bold tracking-[0.2em] uppercase mb-6">{contact("workingHours")}</h3>
            <div className="space-y-3 text-[13px]">
              <div className="flex flex-wrap justify-between gap-1 py-2.5 border-b border-white/[0.04]"><span className="text-white/55">{t("weekdaysShort")}</span><span className="text-white/65 font-medium">{weekdays}</span></div>
              <div className="flex flex-wrap justify-between gap-1 py-2.5 border-b border-white/[0.04]"><span className="text-white/55">{t("weekendsShort")}</span><span className="text-white/65 font-medium">{weekends}</span></div>
            </div>
            <div className="mt-8">
              <Link href="/booking" className="inline-flex items-center gap-2 bg-white/5 text-white/60 text-[13px] font-medium px-5 py-2.5 rounded-xl hover:text-pink hover:bg-white/10 transition-all border border-white/[0.06]">
                {t("bookVisit")}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-[11px] text-white/45 break-words">{copyright}</p>
        </div>
      </div>
      <RawEmbedScript html={siteSettings?.topGeEnabled ? siteSettings?.topGeScript : undefined} />
    </footer>
  );
}
