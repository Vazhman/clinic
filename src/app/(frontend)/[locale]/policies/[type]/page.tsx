import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import LexicalContent from "@/components/blog/LexicalContent";
import { getPolicies, richTextHasContent } from "@/lib/payload-data";
import StructuredData from "@/components/shared/StructuredData";
import { generateBreadcrumbSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";

// Legal pages (Terms & Conditions / Privacy Policy). Content lives in the
// „Policies" global and is edited from the admin sidebar. A policy renders ONLY
// when its richText has content for the requested locale — otherwise 404, so an
// empty/undefined policy is never shown as a blank page.
export const dynamic = "force-dynamic";

const TYPES = ["terms", "privacy"] as const;
type PolicyType = (typeof TYPES)[number];

function isPolicyType(t: string): t is PolicyType {
  return (TYPES as readonly string[]).includes(t);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}): Promise<Metadata> {
  const { locale, type } = await params;
  if (!isPolicyType(type)) return {};
  const nav = await getTranslations({ locale, namespace: "Navigation" });
  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };
  return {
    title: `${nav(type)} | ${clinicName[locale] || clinicName.ge}`,
    alternates: buildLocalizedAlternates(locale as Locale, "/policies/[type]", { type }),
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { locale, type } = await params;
  if (!isPolicyType(type)) notFound();

  const nav = await getTranslations("Navigation");
  const policies = await getPolicies(locale as "ge" | "en" | "ru");
  const body = policies?.[type];

  // No content for this locale → the page does not exist.
  if (!richTextHasContent(body)) notFound();

  const title = nav(type);

  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: title, url: `/${locale}/policies/${type}` },
        ])}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { label: nav("home"), href: "/" },
            { label: title },
          ]}
        />
      </div>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-blackberry mb-6 break-words">{title}</h1>
        <LexicalContent data={body as never} />
      </article>
    </>
  );
}
