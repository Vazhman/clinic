import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServices, getDoctors, getLabTestsForService } from "@/lib/payload-data";
import { Link } from "@/i18n/navigation";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";
import SectionHeader from "@/components/shared/SectionHeader";
import SnapCarousel from "@/components/shared/SnapCarousel";
import StructuredData from "@/components/shared/StructuredData";
import { generateServiceSchema, generateBreadcrumbSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale as "ge" | "en" | "ru";
  const services = await getServices(loc);
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};

  const seo = service.seo;

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  const ogImageUrl = seo?.ogImage || service.image;

  return {
    title: seo?.metaTitle || `${service.name} | ${clinicName[locale] || clinicName.ge}`,
    description: seo?.metaDescription || service.shortDescription,
    ...(seo?.noIndex ? { robots: { index: false, follow: true } } : {}),
    ...(ogImageUrl ? { openGraph: { images: [{ url: ogImageUrl }] } } : {}),
    alternates: buildLocalizedAlternates(locale as Locale, "/services/[slug]", { slug }),
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = locale as "ge" | "en" | "ru";
  const services = await getServices(loc);
  const service = services.find((s) => s.slug === slug);

  if (!service) notFound();

  const t = await getTranslations("Services");
  const nav = await getTranslations("Navigation");
  const dt = await getTranslations("Doctors");
  const lt = await getTranslations("LabTests");
  const relatedLabTests = await getLabTestsForService(slug, loc);

  // Filter doctors whose specialty relates to this service.
  // Specialty and individual specialization entries can be undefined when a
  // doctor row hasn't been filled in for the current locale, so guard each
  // string before calling toLowerCase.
  const allDoctors = await getDoctors(loc);
  const serviceKeywords = (service.name ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const relatedDoctors = allDoctors.filter((d) => {
    const specialty = (d.specialty ?? "").toLowerCase();
    if (serviceKeywords.some((kw) => specialty.includes(kw))) return true;
    return (d.specializations ?? []).some((s) => {
      if (typeof s !== "string" || !s) return false;
      const lower = s.toLowerCase();
      return serviceKeywords.some((kw) => lower.includes(kw));
    });
  }).slice(0, 6);
  // Fallback: show first 4 if no keyword matches
  const displayDoctors = relatedDoctors.length > 0 ? relatedDoctors : allDoctors.slice(0, 4);

  return (
    <>
      <StructuredData data={generateServiceSchema(service)} />
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: t("title"), url: `/${locale}/services` },
          { name: service.name, url: `/${locale}/services/${service.slug}` },
        ])}
      />

      {/* Hero — Style #1 */}
      <section className="bg-blackberry py-10 sm:py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <Breadcrumbs
            items={[
              { label: nav("home"), href: "/" },
              { label: t("title"), href: "/services" },
              { label: service.name },
            ]}
          />
          <h1 className="text-[clamp(1.6rem,4vw,3rem)] font-bold text-pink mt-4 mb-4 tracking-tight break-words">
            {service.name}
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl break-words">
            {service.shortDescription}
          </p>
          <div className="mt-6 sm:mt-8">
            <Button href="/booking" variant="secondary" size="lg">
              {dt("bookAppointment")}
            </Button>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
              <p className="text-base sm:text-lg text-grey leading-relaxed break-words">
                {service.description}
              </p>
          </div>
        </div>
      </section>

      {/* Doctors in this department */}
      <section className="py-10 sm:py-14 lg:py-16 bg-grey-lighter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader title={t("doctorsInDepartment")} />

          <SnapCarousel
            ariaLabel={t("doctorsInDepartment")}
            cardWidth="78vw"
            gapClassName="gap-4"
            className="sm:gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3"
          >
            {displayDoctors.map((doctor) => (
              <Link key={doctor.id} href={{ pathname: '/doctors/[slug]', params: { slug: doctor.slug } }} className="block h-full">
                <Card variant="elevated" hover className="p-4 sm:p-5 group">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                      <Image src={doctor.photo} alt={doctor.name} fill sizes="56px" className="object-cover object-top" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-blackberry group-hover:text-pink transition-colors break-words">
                        {doctor.name}
                      </h3>
                      <p className="text-sm text-pink font-medium break-words">{doctor.specialty}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </SnapCarousel>
        </div>
      </section>

      {/* Lab tests commonly used in this specialty — auto-populated by the
          relatedServices relationship on each LabTest. Renders nothing when
          no tests reference this service, so the section gracefully
          disappears for departments without a connected catalog. */}
      {relatedLabTests.length > 0 && (
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader title={lt("commonlyUsedInDepartment")} />
            <SnapCarousel
              ariaLabel={lt("commonlyUsedInDepartment")}
              cardWidth="78vw"
              gapClassName="gap-3"
              className="sm:gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3"
            >
              {relatedLabTests.map((item) => (
                  <Link
                    key={item.id}
                    href={{ pathname: "/lab-tests/[slug]", params: { slug: item.slug } }}
                    className="group block h-full rounded-xl border border-grey-lighter bg-white p-4 sm:p-5 hover:border-pink/40 hover:shadow-md transition-all duration-300"
                  >
                    <h3 className="font-bold text-blackberry text-[15px] sm:text-base group-hover:text-pink transition-colors mb-1.5 break-words">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="text-sm text-grey-light line-clamp-2 break-words">{item.summary}</p>
                    )}
                  </Link>
              ))}
            </SnapCarousel>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-10 sm:py-14 lg:py-16 bg-blackberry text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 break-words">
            {dt("bookAppointment")}
          </h2>
          <p className="text-white/70 mb-6 sm:mb-8 break-words">
            {service.shortDescription}
          </p>
          <Button href="/booking" variant="secondary" size="lg">
            {dt("bookAppointment")}
          </Button>
        </div>
      </section>
    </>
  );
}
