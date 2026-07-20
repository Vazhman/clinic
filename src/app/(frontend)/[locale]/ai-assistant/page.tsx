import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFeatureToggles } from "@/lib/payload-data";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StructuredData from "@/components/shared/StructuredData";
import { generateBreadcrumbSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";
import AiAssistantFullPage from "@/components/chat/AiAssistantFullPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AiAssistantPage" });

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  return {
    title: `${t("title")} | ${clinicName[locale] || clinicName.ge}`,
    description: t("subtitle"),
    alternates: buildLocalizedAlternates(locale as Locale, "/ai-assistant"),
  };
}

export default async function AiAssistantPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Gated by FeatureToggles.aiAssistant (src/globals/FeatureToggles.ts),
  // default OFF — same convention as health-library's toggle gate.
  const toggles = await getFeatureToggles();
  if (toggles?.aiAssistant !== true) notFound();

  const { locale } = await params;
  const t = await getTranslations("AiAssistantPage");
  const nav = await getTranslations("Navigation");

  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: t("title"), url: `/${locale}/ai-assistant` },
        ])}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: nav("home"), href: "/" }, { label: t("title") }]} />
      </div>

      {/* Hero — solid blackberry editorial, matches other landing pages */}
      <section className="relative bg-blackberry py-14 sm:py-20 overflow-hidden">
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] right-[-10%] w-[620px] h-[620px] bg-pink/[0.10] rounded-full blur-[140px] animate-float" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[420px] h-[420px] bg-pink/[0.05] rounded-full blur-[120px] animate-float" style={{ animationDelay: "-3s" }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 md:px-10 text-center">
          <h1 className="text-[clamp(2rem,4.5vw,3.5rem)] font-bold text-white tracking-[-0.02em] leading-[1.05] mb-5 break-words">
            {t("title")}
          </h1>
          <p className="text-white/70 text-[15px] sm:text-[16px] max-w-2xl mx-auto break-words">
            {t("subtitle")}
          </p>
        </div>
      </section>

      <section className="py-8 sm:py-12 lg:py-16 bg-grey-lighter">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-10">
          <AiAssistantFullPage />
        </div>
      </section>
    </>
  );
}
