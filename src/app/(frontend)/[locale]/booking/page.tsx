import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import BookingWizard from "@/components/booking/BookingWizard";
import StructuredData from "@/components/shared/StructuredData";
import { generateBreadcrumbSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";
import {
  getBookingPage,
  getContactPage,
  getBookingServicesFromPayload,
  getBookingDoctorsFromPayload,
} from "@/lib/payload-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Booking" });

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  return {
    title: `${t("title")} | ${clinicName[locale] || clinicName.ge}`,
    description: t("metaDescription"),
    robots: { index: false, follow: true },
    alternates: buildLocalizedAlternates(locale as Locale, "/booking"),
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Booking");
  const nav = await getTranslations("Navigation");

  // Pre-load services + doctors from Payload at SSR so the wizard mounts
  // already populated, no client-side fetch required. (Note: only CHECKUPS are
  // phone-only — doctor appointments book online through this wizard.)
  const [bookingCms, contact, initialServices, initialDoctors] = await Promise.all([
    getBookingPage(locale as Locale),
    getContactPage(locale as Locale),
    getBookingServicesFromPayload(),
    getBookingDoctorsFromPayload(locale as Locale),
  ]);

  // Editorial content reads straight from the CMS (BookingPage global).
  const pageTitle = bookingCms?.title?.trim() ?? "";
  const pageSubtitle = bookingCms?.subtitle?.trim() ?? "";

  // "Book by phone" CTA — number comes from ContactPage global.
  const phoneTel = (contact?.phone?.value?.trim() ?? "").replace(/[^+\d]/g, "");
  const phoneDisplay = contact?.phone?.display?.trim() || contact?.phone?.value?.trim() || "";

  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: pageTitle, url: `/${locale}/booking` },
        ])}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { label: nav("home"), href: "/" },
            { label: pageTitle },
          ]}
        />
      </div>

      <section className="relative py-8 sm:py-12 lg:py-16 overflow-hidden bg-cream">
        {/* One quiet warm wash; the white wizard card carries the eye */}
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] right-[-15%] w-[620px] h-[620px] bg-pink/[0.08] rounded-full blur-[140px] animate-float" />
          <div className="absolute bottom-[-15%] left-[-15%] w-[420px] h-[420px] bg-blackberry/[0.04] rounded-full blur-[120px] animate-float" style={{ animationDelay: "-3s" }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 md:px-10">
          {/* Header — typographic, no dot-and-rule pattern */}
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-pink text-[11px] font-semibold tracking-[0.22em] uppercase mb-3 break-words">
              {pageSubtitle}
            </p>
            <h1 className="text-[clamp(1.6rem,4vw,2.8rem)] font-bold text-blackberry tracking-[-0.02em] leading-[1.1] break-words">
              {pageTitle}
            </h1>
          </div>

          {/* Wizard card — doctor appointments book online. Checkups stay
              phone-only (no HIS support for checkup appointments). */}
          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl shadow-blackberry/15 border border-blackberry/10 p-4 sm:p-5 md:p-6 lg:p-7">
            <Suspense fallback={null}>
              <BookingWizard
                initialServices={initialServices}
                initialDoctors={initialDoctors}
                bookingCms={bookingCms}
              />
            </Suspense>
          </div>

          {/* Alternative contact — number from the ContactPage global */}
          <div className="mt-8 sm:mt-10 text-center">
            <p className="text-grey-light text-sm mb-3 sm:mb-4 break-words">{t("orCallUs")}</p>
            <a
              href={`tel:${phoneTel}`}
              className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-blackberry text-[15px] font-semibold border border-blackberry/15 bg-white hover:border-blackberry hover:bg-blackberry hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blackberry/10 transition-all duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              {phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
