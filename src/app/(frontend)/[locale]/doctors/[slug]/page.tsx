import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDoctorBySlug, getDoctors, getDoctorsPage, getContactPage, getFeatureToggles, isFeatureEnabled } from "@/lib/payload-data";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StructuredData from "@/components/shared/StructuredData";
import { generatePhysicianSchema, generateBreadcrumbSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";
import DoctorProfileClient from "@/components/doctors/DoctorProfileClient";

// Serve this profile from the Full Route Cache and refresh at most hourly, so
// the box renders it once instead of per request. Editor saves still show
// instantly: Payload's afterChange hook busts the `doctors` cache tag, which
// getDoctorBySlug/getDoctors carry.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale as "ge" | "en" | "ru";
  // includeHidden: a doctor hidden from the /doctors list must still have a
  // resolvable profile (direct link / booking), so its metadata must resolve too.
  const doctor = await getDoctorBySlug(slug, loc, { includeHidden: true });
  if (!doctor) return {};

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  const seo = doctor.seo;
  const ogImageUrl = seo?.ogImage || doctor.photo;

  return {
    title: seo?.metaTitle || `${doctor.name} — ${doctor.specialty} | ${clinicName[locale] || clinicName.ge}`,
    description: seo?.metaDescription || doctor.biography?.slice(0, 160) || `${doctor.name} — ${doctor.specialty}`,
    ...(seo?.noIndex ? { robots: { index: false, follow: true } } : {}),
    ...(ogImageUrl ? { openGraph: { images: [{ url: ogImageUrl }] } } : {}),
    alternates: buildLocalizedAlternates(locale as Locale, "/doctors/[slug]", { slug }),
  };
}

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const toggles = await getFeatureToggles();
  if (!isFeatureEnabled(toggles, "doctors")) notFound();
  const loc = locale as "ge" | "en" | "ru";
  const [doctor, doctorsPage, contactPage, relatedPool] = await Promise.all([
    // includeHidden so a doctor hidden from the list still has a working profile.
    getDoctorBySlug(slug, loc, { includeHidden: true }),
    getDoctorsPage(loc),
    getContactPage(loc),
    // Full list, for the "related doctors" strip only. Uses the shared, already-
    // warm `getDoctors` cache (no includeHidden → hidden/inactive already
    // excluded); the MAIN doctor above is a single-row fetch.
    getDoctors(loc),
  ]);

  if (!doctor) notFound();

  const nav = await getTranslations("Navigation");
  const doctorsTitle = doctorsPage?.title ?? "";
  const showLanguages = doctorsPage?.showLanguages !== false;
  const contactPhone = contactPage?.phone?.value?.trim() ?? "";

  // Related doctors: same specialty, excluding current AND excluding any hidden
  // from the list (they shouldn't surface in the "related" strip either).
  const relatedDoctors = relatedPool
    .filter((d) => d.specialty === doctor.specialty && d.id !== doctor.id && d.showOnDoctorsPage !== false)
    .slice(0, 4);

  return (
    <>
      <StructuredData data={generatePhysicianSchema(doctor)} />
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: doctorsTitle, url: `/${locale}/doctors` },
          { name: doctor.name, url: `/${locale}/doctors/${doctor.slug}` },
        ])}
      />

      {/* Breadcrumbs */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-6">
        <Breadcrumbs
          items={[
            { label: nav("home"), href: "/" },
            { label: doctorsTitle, href: "/doctors" },
            { label: doctor.name },
          ]}
        />
      </div>

      <DoctorProfileClient doctor={doctor} relatedDoctors={relatedDoctors} contactPhone={contactPhone} showLanguages={showLanguages} />
    </>
  );
}
