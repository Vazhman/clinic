import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import SymptomNavigator from "@/components/home/SymptomNavigator";
import StatsCounter from "@/components/home/StatsCounter";
import ServicesGrid from "@/components/home/ServicesGrid";
import DoctorsPreview from "@/components/home/DoctorsPreview";
import CheckupCards from "@/components/home/CheckupCards";
import NewsSection from "@/components/blog/NewsSection";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import FAQSection from "@/components/home/FAQSection";
import ContactMap from "@/components/home/ContactMap";
import StructuredData from "@/components/shared/StructuredData";
import { generateClinicSchema, generateWebSiteSchema, generateFAQSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, localizedUrl, type Locale } from "@/lib/seo-helpers";
import type { Doctor } from "@/types";
import {
  getServices,
  getDoctors,
  getCheckupPackages,
  getReviews,
  getStats,
  getHomepageNews,
  getHeroSlides,
  getHomePage,
  getContactPage,
  getFeatureToggles,
  isFeatureEnabled,
} from "@/lib/payload-data";

// Render the homepage fresh on every request so CMS edits (hero slides,
// featured doctors, stats, FAQs…) appear instantly — no cache to wait out.
// Every other public page is already dynamic; this matches them. The target
// host is a persistent Node runtime (cPanel), where per-request rendering is
// cheap, so there's no real cost to dropping the ISR cache.
export const dynamic = "force-dynamic";

// Random subset for the homepage "Our doctors" section (when the admin turns on
// `randomizeFeaturedDoctors`). With force-dynamic the pick is recomputed on
// every request, so the featured doctors reshuffle per visit.
function pickRandomDoctors<T>(list: T[], count: number): T[] {
  return [...list]
    .map((item) => ({ item, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(({ item }) => item)
    .slice(0, count);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა | მრავალპროფილური კლინიკა ბათუმში",
    en: "Khozrevanidze Clinic | Multi-Profile Clinic in Batumi",
    ru: "Клиника Хозреванидзе | Многопрофильная клиника в Батуми",
  };

  const descriptions: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა — მრავალპროფილური სამედიცინო ცენტრი ბათუმში. კარდიოლოგია, ნევროლოგია, გინეკოლოგია, ოტორინოლარინგოლოგია და სხვა. დაჯავშნეთ ვიზიტი ონლაინ.",
    en: "Khozrevanidze Clinic — Multi-profile medical center in Batumi, Georgia. Cardiology, neurology, gynecology, otolaryngology and more. Book your visit online.",
    ru: "Клиника Хозреванидзе — Многопрофильный медицинский центр в Батуми, Грузия. Кардиология, неврология, гинекология, отоларингология и другие. Запишитесь на прием онлайн.",
  };

  return {
    title: titles[locale] || titles.ge,
    description: descriptions[locale] || descriptions.ge,
    openGraph: {
      title: titles[locale] || titles.ge,
      description: descriptions[locale] || descriptions.ge,
      url: localizedUrl(locale as Locale, "/"),
      siteName: "Khozrevanidze Clinic",
      type: "website",
      images: [
        {
          url: "/images/gallery/khozrevanidzis-klinika-0001.jpg",
          width: 1200,
          height: 630,
          alt: titles[locale] || titles.ge,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titles[locale] || titles.ge,
      description: descriptions[locale] || descriptions.ge,
      images: ["/images/gallery/khozrevanidzis-klinika-0001.jpg"],
    },
    alternates: buildLocalizedAlternates(locale as Locale, "/"),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as "ge" | "en" | "ru";

  const [services, checkupPackages, reviews, stats, news, heroSlides, homeCms, contactCms, toggles] =
    await Promise.all([
      getServices(loc),
      getCheckupPackages(loc),
      getReviews(loc),
      getStats(),
      getHomepageNews(loc),
      getHeroSlides(loc),
      getHomePage(loc),
      getContactPage(loc),
      getFeatureToggles(),
    ]);

  // "Our doctors" home section — driven by HomePage.featuredDoctors (the admin's
  // explicit selection of WHO is eligible), with count + randomize. We fetch
  // ONLY those doctors by id (not all ~147), because the grid shows just a few —
  // this is the big perf win on the homepage. Empty selection → a light fallback
  // of a handful of visible doctors (still not the full list).
  // Fixed at 3 — the "Our doctors" grid is designed for exactly three cards.
  // (The editable count field was hidden in the CMS; see HomePage.ts.)
  const featuredCount = 3;
  const featuredPoolIds = (homeCms?.featuredDoctors ?? []).map((d) =>
    String(typeof d === "object" && d !== null ? d.id : d),
  );
  let doctors: Doctor[];
  if (featuredPoolIds.length > 0) {
    // includeHidden: the admin explicitly chose these for the home page, so the
    // `showOnDoctorsPage` switch (a /doctors-list control) shouldn't hide them
    // here; only `inactive` excludes a doctor everywhere.
    const pool = await getDoctors(loc, undefined, { ids: featuredPoolIds, includeHidden: true });
    const ordered = featuredPoolIds
      .map((id) => pool.find((doc) => doc.id === id))
      .filter((doc): doc is Doctor => Boolean(doc));
    doctors = homeCms?.randomizeFeaturedDoctors
      ? pickRandomDoctors(ordered, featuredCount)
      : ordered.slice(0, featuredCount);
  } else {
    const fallback = await getDoctors(loc, Math.max(featuredCount * 3, 9));
    doctors = homeCms?.randomizeFeaturedDoctors
      ? pickRandomDoctors(fallback, featuredCount)
      : [...fallback]
          .sort((a, b) => Number(b.isDepartmentHead) - Number(a.isDepartmentHead))
          .slice(0, featuredCount);
  }

  // Phone for the checkup teaser's details modal (phone-booking CTA), read the
  // same way the /checkups page reads it.
  const phone = (contactCms as { phone?: { value?: string } | null } | null)?.phone?.value ?? "";

  // FAQ — admin-managed (HomePage global). Only complete Q&A pairs are kept;
  // the section and its FAQPage schema render only when at least one exists.
  const faqs = (homeCms?.faqs ?? [])
    .map((f) => ({ question: f?.question?.trim() ?? "", answer: f?.answer?.trim() ?? "" }))
    .filter((f) => f.question && f.answer);

  // Per-locale section on/off switches (HomePage.sectionVisibility, each
  // field localized in Payload — see globals/HomePage.ts). A key that was
  // never saved for this locale comes back undefined, which must read as
  // "visible" so existing content doesn't disappear the first time this
  // shipped; only an explicit `false` hides a section.
  const sv = homeCms?.sectionVisibility;
  const show = (key: keyof NonNullable<typeof sv>) => sv?.[key] !== false;

  // Feature Toggles (src/globals/FeatureToggles.ts) are a stronger, site-wide
  // switch layered on top of the per-locale `sectionVisibility` above — when
  // a whole feature is off, its homepage teaser must hide too, otherwise the
  // teaser would link straight into a route that now 404s.
  const showDoctorsPreview = show("doctorsPreview") && isFeatureEnabled(toggles, "doctors");
  const showServicesGrid = show("servicesGrid") && isFeatureEnabled(toggles, "services");
  const showNews = news.length > 0 && show("news") && isFeatureEnabled(toggles, "blog");
  const showReviews = show("reviews") && isFeatureEnabled(toggles, "testimonials");
  const showFaq = show("faq") && isFeatureEnabled(toggles, "faq");

  return (
    <>
      <StructuredData data={generateClinicSchema(locale, reviews)} />
      <StructuredData data={generateWebSiteSchema()} />
      {faqs.length > 0 && showFaq && <StructuredData data={generateFAQSchema(faqs)} />}
      {show("hero") && (
        <HeroSection doctors={doctors} slides={heroSlides} hero={homeCms?.hero ?? null} trustStrip={homeCms?.trustStrip ?? null} showDoctorCard={showDoctorsPreview} />
      )}
      {show("symptomNavigator") && <SymptomNavigator services={services} symptomNav={homeCms?.symptomNavigator ?? null} />}
      {show("stats") && (
        <StatsCounter
          stats={stats}
          // Admin-edited stats rows (number + suffix + label, localized) win
          // over the legacy fixed five inside the component.
          custom={(homeCms?.statsList ?? [])
            .map((s) => ({ value: s?.value ?? 0, suffix: s?.suffix ?? "", label: s?.label?.trim() ?? "" }))
            .filter((s) => s.value > 0 && s.label)}
        />
      )}
      {showServicesGrid && <ServicesGrid services={services.slice(0, 8)} totalCount={services.length} />}
      {showDoctorsPreview && <DoctorsPreview doctors={doctors} />}
      {/* Full packages: the teaser cards now open the same /checkups details
          modal (package list ⇄ details) in place, so they need the package
          names/descriptions/tests too. */}
      {show("checkupCards") && <CheckupCards checkupPackages={checkupPackages} phone={phone} locale={loc} />}
      {/* phone is needed by the shared checkup modal (phone-booking CTA). */}
      {showNews && <NewsSection news={news} />}
      {showReviews && <ReviewsCarousel reviews={reviews} />}
      {showFaq && <FAQSection faqs={faqs} />}
      {show("contactMap") && <ContactMap contact={contactCms} />}
    </>
  );
}
