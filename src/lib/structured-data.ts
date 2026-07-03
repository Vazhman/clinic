import type { Doctor, Service } from "@/types";
import { SITE_URL } from "@/lib/site";

export function generateClinicSchema(
  locale: string,
  reviews?: Array<{ rating: number; author?: string; text?: string; date?: string }>,
) {
  const aggregateRating = reviews ? generateAggregateRating(reviews) : undefined;
  // Individual Review nodes nested on the SAME MedicalClinic entity that carries
  // aggregateRating — Google wants review + aggregateRating on one entity. Cap at
  // 20 and require author+text so we never emit empty/anonymous review markup.
  const reviewItems =
    reviews
      ?.filter((r) => r.author?.trim() && r.text?.trim())
      .slice(0, 20)
      .map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.author },
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: r.text,
        ...(r.date ? { datePublished: r.date } : {}),
      })) ?? [];
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name:
      locale === "ge"
        ? "ხოზრევანიძის კლინიკა"
        : locale === "ru"
          ? "Клиника Хозреванидзе"
          : "Khozrevanidze Clinic",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    image: [
      `${SITE_URL}/images/gallery/khozrevanidzis-klinika-0001.jpg`,
      `${SITE_URL}/images/gallery/khozrevanidzis-klinika-0003.jpg`,
      `${SITE_URL}/images/gallery/khozrevanidzis-klinika-0006.jpg`,
    ],
    telephone: "+995422227171",
    email: "info@khozrevanidze.ge",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Giorgi Brtskinvale Street, N81",
      addressLocality: "Batumi",
      addressRegion: "Adjara",
      postalCode: "6010",
      addressCountry: "GE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "41.64002",
      longitude: "41.63334",
    },
    priceRange: "$$",
    currenciesAccepted: "GEL",
    paymentAccepted: "Cash, Credit Card",
    // Languages spoken at the clinic — a local-search signal in multilingual
    // Batumi (also declared per-doctor via knowsLanguage on Physician schema).
    knowsLanguage: ["Georgian", "English", "Russian"],
    areaServed: [
      { "@type": "City", name: "Batumi" },
      { "@type": "AdministrativeArea", name: "Adjara" },
    ],
    isAcceptingNewPatients: true,
    additionalType: "https://www.wikidata.org/wiki/Q1775906",
    sameAs: [
      "https://www.facebook.com/khozrevanidze.ge/",
      "https://www.instagram.com/khozrevanidzes_clinic/",
    ],
    hasMap: "https://maps.app.goo.gl/biwowMnhgxrVCbhK7",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "09:30",
        closes: "17:00",
      },
    ],
    medicalSpecialty: [
      "Cardiology",
      "Neurology",
      "Gynecology",
      "Otolaryngology",
      "GeneralSurgery",
      "Endocrinology",
      "Psychiatry",
    ],
    availableService: {
      "@type": "MedicalProcedure",
      name: "Medical Consultation",
    },
    founder: {
      "@type": "Person",
      name: "Giorgi Khozrevanidze",
    },
    foundingDate: "2015",
    numberOfEmployees: {
      "@type": "QuantitativeValue",
      value: 45,
    },
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(reviewItems.length ? { review: reviewItems } : {}),
  };
}

export function generatePhysicianSchema(doctor: Doctor) {
  const photoUrl = doctor.photo
    ? (doctor.photo.startsWith("http") ? doctor.photo : `${SITE_URL}${doctor.photo}`)
    : "";
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    "@id": `${SITE_URL}/doctors/${doctor.slug}`,
    url: `${SITE_URL}/doctors/${doctor.slug}`,
    name: doctor.name,
    ...(photoUrl ? { image: photoUrl } : {}),
    medicalSpecialty: doctor.specialty,
    worksFor: {
      "@type": "MedicalClinic",
      name: "Khozrevanidze Clinic",
    },
    affiliation: {
      "@type": "MedicalClinic",
      name: "Khozrevanidze Clinic",
      url: SITE_URL,
    },
    memberOf: { "@type": "Organization", name: "Khozrevanidze Clinic" },
    description: doctor.biography,
    knowsLanguage: doctor.languagesSpoken,
    ...(doctor.qualifications?.length
      ? {
          hasCredential: doctor.qualifications.map((q) => ({
            "@type": "EducationalOccupationalCredential",
            name: q,
          })),
        }
      : {}),
    ...(doctor.experienceYears ? { knowsAbout: doctor.specializations } : {}),
  };
}

export function generateServiceSchema(service: Service) {
  const slug = (service as { slug?: string }).slug;
  return {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: service.name,
    description: service.description,
    ...(slug ? { url: `${SITE_URL}/services/${slug}` } : {}),
    provider: {
      "@type": "MedicalClinic",
      name: "Khozrevanidze Clinic",
      url: SITE_URL,
    },
  };
}

// ItemList of physicians for the doctors index page — gives the listing page its
// own structured data (no local competitor has this) and reinforces each
// doctor's Physician entity. URLs mirror generatePhysicianSchema (no locale
// prefix) for consistency with the rest of this module.
export function generateDoctorsItemListSchema(
  doctors: Array<{ name: string; slug: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: doctors.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/doctors/${d.slug}`,
      name: d.name,
    })),
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function generateArticleSchema(article: {
  title: string;
  excerpt: string;
  publishedDate: string;
  modifiedDate?: string;
  author?: string;
  featuredImage?: string;
  slug: string;
  locale: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedDate,
    // Real last-modified when the CMS provides it — a freshness signal for
    // YMYL/medical content. Falls back to the publish date.
    dateModified: article.modifiedDate || article.publishedDate,
    // Prefer a named (Person) author for E-E-A-T on medical content; fall back
    // to the clinic as the organizational author when no byline is set.
    author: article.author
      ? { "@type": "Person", name: article.author }
      : { "@type": "Organization", name: "Khozrevanidze Clinic" },
    publisher: {
      "@type": "Organization",
      name: "Khozrevanidze Clinic",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/${article.locale}/blog/${article.slug}`,
    },
    ...(article.featuredImage ? { image: article.featuredImage } : {}),
  };
}

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Khozrevanidze Clinic",
    alternateName: "ხოზრევანიძის კლინიკა",
    url: SITE_URL,
  };
}

export function generateAggregateRating(reviews: Array<{ rating: number }>) {
  if (!reviews.length) return undefined;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return {
    "@type": "AggregateRating",
    ratingValue: (sum / reviews.length).toFixed(1),
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1,
  };
}
