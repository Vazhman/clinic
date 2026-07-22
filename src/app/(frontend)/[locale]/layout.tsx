import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { isoLang, type Locale } from "@/lib/seo-helpers";
import { SITE_URL, SITE_NOINDEX } from "@/lib/site";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SiteChrome from "@/components/layout/SiteChrome";
import MotionProvider from "@/components/shared/MotionProvider";
import RawEmbedScript from "@/components/shared/RawEmbedScript";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import ChatAssistant from "@/components/chat/ChatAssistant";
import { getContactPage, getFeatureToggles, getFooter, getNavigation, getPolicies, getSiteSettings, richTextHasContent } from "@/lib/payload-data";
import AccessibilityButton from "@/components/accessibility/AccessibilityButton";
import AccessibilityProvider from "@/components/accessibility/AccessibilityProvider";
import SpeechProvider from "@/components/accessibility/SpeechProvider";
import SpeechMiniBar from "@/components/accessibility/SpeechMiniBar";
import SkipToContent from "@/components/accessibility/SkipToContent";
import A11yColorFilters from "@/components/accessibility/a11y-filters";
import "@/app/globals.css";

// Per-locale title template + description so child pages without their own
// generateMetadata don't inherit a Georgian-only suffix on /en and /ru.
const CLINIC_NAME: Record<string, string> = {
  ge: "ხოზრევანიძის კლინიკა",
  en: "Khozrevanidze Clinic",
  ru: "Клиника Хозреванидзе",
};

const DEFAULT_DESC: Record<string, string> = {
  ge: "ხოზრევანიძის კლინიკა — მრავალპროფილური სამედიცინო ცენტრი ბათუმში.",
  en: "Khozrevanidze Clinic — a multi-profile medical center in Batumi, Georgia.",
  ru: "Клиника Хозреванидзе — многопрофильный медицинский центр в Батуми.",
};

const OG_LOCALE: Record<string, string> = {
  ge: "ka_GE",
  en: "en_US",
  ru: "ru_RU",
};

// Explicit viewport (Next 16 wants this in its own export, not in metadata).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Allow zoom up to 5x — never disable user scaling (accessibility).
  maximumScale: 5,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const name = CLINIC_NAME[locale] || CLINIC_NAME.ge;
  const desc = DEFAULT_DESC[locale] || DEFAULT_DESC.ge;
  const otherLocales = (["ge", "en", "ru"] as const).filter((l) => l !== locale).map((l) => OG_LOCALE[l]);
  const settings = await getSiteSettings(locale as Locale);
  const ogImage = settings?.defaultOgImage && typeof settings.defaultOgImage === "object" ? settings.defaultOgImage.url : null;

  const verification: Metadata["verification"] = {};
  if (settings?.googleSiteVerification) verification.google = settings.googleSiteVerification;
  const other: Record<string, string> = {};
  if (settings?.bingSiteVerification) other["msvalidate.01"] = settings.bingSiteVerification;
  if (settings?.yandexVerification) other["yandex-verification"] = settings.yandexVerification;
  if (Object.keys(other).length) verification.other = other;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    description: settings?.defaultMetaDescription || desc,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.png", type: "image/png" },
      ],
      apple: "/apple-icon.png",
    },
    openGraph: {
      siteName: name,
      locale: OG_LOCALE[locale] || OG_LOCALE.ge,
      alternateLocale: otherLocales,
      type: "website",
      images: [{ url: ogImage || "/opengraph-image.png", width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogImage || "/twitter-image.png"],
      site: settings?.twitterHandle || undefined,
    },
    robots: SITE_NOINDEX
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    authors: [{ name: "Khozrevanidze Clinic" }],
    ...(Object.keys(verification).length ? { verification } : {}),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;

  // Fetch Payload globals once for the whole layout (Header / Footer /
  // WhatsApp button). Each helper returns null on DB error so the layout
  // still renders with next-intl fallbacks.
  const [navigationCms, footerCms, contactCms, siteSettingsCms, policiesCms, featureToggles] = await Promise.all([
    getNavigation(locale as Locale),
    getFooter(locale as Locale),
    getContactPage(locale as Locale),
    getSiteSettings(locale as Locale),
    getPolicies(locale as Locale),
    getFeatureToggles(),
  ]);
  const aiAssistantEnabled = featureToggles?.aiAssistant === true;

  // Legal footer links are CMS-driven: show Terms / Privacy ONLY when the
  // „Policies" global has real content for THIS locale. Empty → no link (and
  // /policies/[type] 404s). Editors fill these in admin → Policies.
  const legalLinks = {
    terms: richTextHasContent(policiesCms?.terms),
    privacy: richTextHasContent(policiesCms?.privacy),
  };

  // A11y init — runs early to apply saved font-size / contrast / dyslexia /
  // color-vision settings from localStorage so the page paints with the user's
  // settings already applied (no FOUC on reload).
  const a11yInitScript = `(function(){try{if(location.search.indexOf('a11y-reset')!==-1){localStorage.removeItem('a11y-settings');return}var s=JSON.parse(localStorage.getItem('a11y-settings')||'{}');var h=document.documentElement;var FONT_SIZES=['smaller','default','larger','largest'];var LINE_HEIGHTS=['default','medium','large','largest'];var LETTER_SPACINGS=['default','medium','large','largest'];var CONTRASTS=['normal','high','inverted'];var COLOR_VISIONS=['normal','protanopia','deuteranopia','tritanopia','monochromacy'];if(FONT_SIZES.indexOf(s.fontSize)!==-1&&s.fontSize!=='default'){var m={smaller:'0.9',larger:'1.15',largest:'1.35'};if(m[s.fontSize])h.style.setProperty('--a11y-font-scale',m[s.fontSize])}if(LINE_HEIGHTS.indexOf(s.lineHeight)!==-1&&s.lineHeight!=='default'){var l={medium:'1.75',large:'2',largest:'2.5'};if(l[s.lineHeight])h.style.setProperty('--a11y-line-height',l[s.lineHeight])}if(LETTER_SPACINGS.indexOf(s.letterSpacing)!==-1&&s.letterSpacing!=='default'){var ls={medium:'0.05em',large:'0.1em',largest:'0.15em'};if(ls[s.letterSpacing])h.style.setProperty('--a11y-letter-spacing',ls[s.letterSpacing])}if(CONTRASTS.indexOf(s.contrast)!==-1){if(s.contrast==='high')h.classList.add('a11y-high-contrast');if(s.contrast==='inverted')h.classList.add('a11y-inverted')}if(s.dyslexiaFont===true)h.classList.add('a11y-dyslexia');if(s.animations===false)h.classList.add('a11y-no-motion');if(s.highlightLinks===true)h.classList.add('a11y-links');if(COLOR_VISIONS.indexOf(s.colorVision)!==-1&&s.colorVision!=='normal')h.dataset.colorVision=s.colorVision;if(s.readMode===true)h.classList.add('a11y-read-mode')}catch(e){}})()`;

  return (
    <html lang={isoLang(locale as Locale)} className="scroll-smooth" suppressHydrationWarning>
      <body className="antialiased bg-white text-grey">
        {/* Pixel / Analytics — loaded as early as possible so page views are
            captured before any navigation. Each renders only when its own
            toggle is on in საიტის პარამეტრები → Pixel და Analytics. */}
        <RawEmbedScript html={siteSettingsCms?.pixelEnabled ? siteSettingsCms?.pixelCode : undefined} />
        <RawEmbedScript html={siteSettingsCms?.analyticsEnabled ? siteSettingsCms?.analyticsCode : undefined} />
        {/* Preload the primary body font (FiraGO-Regular) — it's on the
            critical render path; starting the fetch early shaves the FOUT
            gap and helps LCP. React hoists this <link> into <head>. */}
        <link
          rel="preload"
          href="/fonts/FiraGO-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Bold is equally render-critical: every h1/h2 on the site uses
            font-bold, including the hero headline (the LCP element). */}
        <link
          rel="preload"
          href="/fonts/FiraGO-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <Script id="a11y-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: a11yInitScript }} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* MotionProvider supplies the slim domAnimation feature set to all
              `m.*` components (LazyMotion) — see MotionProvider.tsx. */}
          <MotionProvider>
          <AccessibilityProvider>
            <SpeechProvider>
              <SkipToContent />
              {/* SiteChrome (client) hides the marketing header/footer/chat/
                  whatsapp on bare routes like /patient-room (its own portal
                  top bar). They're passed as server-rendered elements so the
                  wrapper only toggles visibility. Accessibility controls below
                  stay OUTSIDE so they're reachable everywhere (applying the
                  a11y filter to body/html broke their fixed positioning). */}
              <SiteChrome
                header={<Header navigation={navigationCms} contact={contactCms} />}
                footer={<Footer footer={footerCms} contact={contactCms} siteSettings={siteSettingsCms} legal={legalLinks} />}
                widgets={
                  <>
                    <WhatsAppButton whatsappNumber={footerCms?.whatsappNumber ?? null} />
                    {aiAssistantEnabled && <ChatAssistant />}
                  </>
                }
              >
                {children}
              </SiteChrome>
              <AccessibilityButton />
              <SpeechMiniBar />
              <A11yColorFilters />
            </SpeechProvider>
          </AccessibilityProvider>
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
