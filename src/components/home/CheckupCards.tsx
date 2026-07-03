"use client";

import { useState, type FC } from "react";
import { useTranslations } from "next-intl";
import AnimateIn from "@/components/shared/AnimateIn";
import SnapCarousel from "@/components/shared/SnapCarousel";
import CheckupPackageModal, { type AudienceChoice } from "@/components/checkups/CheckupPackageModal";
import type { CheckupPackage } from "@/types";

type Tier = "economy" | "standard" | "premium";
type Audience = "woman" | "man" | "child";

// Persona chooser copy + icons — mirrors the /checkups page persona gateway so
// the home tier → gender/kid → details flow reads the same. Icons match
// CheckupsExplorer's line icons.
const AUDIENCE_ORDER: Audience[] = ["woman", "man", "child"];
const AUDIENCE_LABEL: Record<string, Record<Audience, string>> = {
  ge: { woman: "ქალი", man: "კაცი", child: "ბავშვი" },
  en: { woman: "Women", man: "Men", child: "Children" },
  ru: { woman: "Женщины", man: "Мужчины", child: "Дети" },
};
const AUDIENCE_DESC: Record<string, Record<Audience, string>> = {
  ge: {
    woman: "ქალის ჯანმრთელობაზე მორგებული პაკეტი",
    man: "კაცის ჯანმრთელობაზე მორგებული პაკეტი",
    child: "ბავშვის ჯანმრთელობაზე მორგებული პაკეტი",
  },
  en: {
    woman: "Tailored to women's health",
    man: "Tailored to men's health",
    child: "Tailored to children's health",
  },
  ru: {
    woman: "Подобран для женского здоровья",
    man: "Подобран для мужского здоровья",
    child: "Подобран для детского здоровья",
  },
};
const AUDIENCE_PROMPT: Record<string, string> = {
  ge: "ვისთვის არის ჩექაფი?",
  en: "Who is the check-up for?",
  ru: "Для кого чек-ап?",
};

const personaIconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function WomanIcon() {
  return (<svg {...personaIconProps} aria-hidden><circle cx="12" cy="6" r="3.1" /><path d="M12 9.2 7.6 19.5h8.8L12 9.2Z" /><path d="M9.6 15h4.8" /></svg>);
}
function ManIcon() {
  return (<svg {...personaIconProps} aria-hidden><circle cx="12" cy="6" r="3.1" /><path d="M6.8 20v-5.4a5.2 5.2 0 0 1 10.4 0V20" /></svg>);
}
function ChildIcon() {
  return (<svg {...personaIconProps} aria-hidden><circle cx="12" cy="7.2" r="2.6" /><path d="M8.4 20v-4.4a3.6 3.6 0 0 1 7.2 0V20" /></svg>);
}
const AUDIENCE_ICON: Record<Audience, FC> = { woman: WomanIcon, man: ManIcon, child: ChildIcon };

// Tier enum (CMS) -> badge text, mirroring CheckupsExplorer.
const TIER_LABEL: Record<Tier, string> = { economy: "GENERAL", standard: "ADVANCED", premium: "PREMIUM" };
const TIERS: Tier[] = ["economy", "standard", "premium"];

// "from" price label + the per-tier overview copy, localized. Premium/Advanced
// reference the tier below by its (untranslated) badge name on purpose — the
// badges read GENERAL/ADVANCED/PREMIUM in every locale.
const FROM: Record<string, string> = { ge: "ფასი", en: "from", ru: "от" };

const TIER_COPY: Record<string, Record<Tier, { desc: string; points: string[] }>> = {
  ge: {
    economy: {
      desc: "ყოველწლიური საბაზისო შემოწმება: სპეციალისტის კონსულტაცია სისხლისა და შარდის ძირითადი ანალიზებით.",
      points: ["სპეციალისტის კონსულტაცია", "სისხლისა და შარდის ძირითადი ანალიზები", "ჯანმრთელობის საბაზისო სკრინინგი"],
    },
    standard: {
      desc: "ყველაფერი GENERAL-დან და ღრმა დიაგნოსტიკა — ჰორმონებისა და ვიტამინების პანელები, მიზნობრივი ექოსკოპია.",
      points: ["ყველაფერი GENERAL-დან", "ჰორმონებისა და ვიტამინების პანელები", "მიზნობრივი ექოსკოპია"],
    },
    premium: {
      desc: "ჩვენი ყველაზე სრული შემოწმება: სრული ვიზუალიზაცია, გულისა და მრავალსისტემური გამოკვლევები სპეციალისტის შეფასებით.",
      points: ["ყველაფერი ADVANCED-დან", "სრული ვიზუალიზაცია და გულის გამოკვლევა", "მრავალპროფილიანი შეფასება"],
    },
  },
  en: {
    economy: {
      desc: "The essential annual check: a specialist consultation with core blood and urine screening.",
      points: ["Specialist consultation", "Core blood & urine labs", "Foundational health screening"],
    },
    standard: {
      desc: "Everything in General, plus deeper diagnostics — hormone and vitamin panels and targeted ultrasound.",
      points: ["Everything in General", "Hormone & vitamin panels", "Targeted ultrasound"],
    },
    premium: {
      desc: "Our most complete screen: full imaging, cardiac and multi-system work-ups with specialist review.",
      points: ["Everything in Advanced", "Full imaging & cardiac work-up", "Multi-specialist review"],
    },
  },
  ru: {
    economy: {
      desc: "Базовое ежегодное обследование: консультация специалиста с основными анализами крови и мочи.",
      points: ["Консультация специалиста", "Основные анализы крови и мочи", "Базовый скрининг здоровья"],
    },
    standard: {
      desc: "Всё из GENERAL плюс углублённая диагностика — гормональные и витаминные панели и прицельное УЗИ.",
      points: ["Всё из GENERAL", "Гормональные и витаминные панели", "Прицельное УЗИ"],
    },
    premium: {
      desc: "Наше самое полное обследование: полная визуализация, кардиологические и мультисистемные исследования с заключением специалиста.",
      points: ["Всё из ADVANCED", "Полная визуализация и кардиообследование", "Заключение специалистов"],
    },
  },
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// Signature element: an ascending 3-bar meter that encodes tier depth — General
// fills 1 bar, Advanced 2, Premium 3 — making the cumulative ladder readable at
// a glance. Decorative (the tier name carries the same meaning as text).
function LevelMeter({ level, featured }: { level: number; featured: boolean }) {
  const onColor = "bg-pink";
  const offColor = featured ? "bg-white/20" : "bg-blackberry/12";
  return (
    <span className="flex items-end gap-[3px] h-[18px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-[5px] rounded-full ${i < level ? onColor : offColor}`}
          style={{ height: `${8 + i * 5}px` }}
        />
      ))}
    </span>
  );
}

const CheckupCards: FC<{
  checkupPackages: CheckupPackage[];
  phone: string;
  locale: "ge" | "en" | "ru";
}> = ({ checkupPackages, phone, locale }) => {
  const t = useTranslations("Checkups");
  const copy = TIER_COPY[locale] ?? TIER_COPY.ge;
  const fromLabel = FROM[locale] ?? FROM.ge;

  // Which tier is open in the shared modal. null → closed. The modal first
  // shows a gender/kid (audience) chooser for that tier, then drills into the
  // chosen tier×audience package's details — the same details view the
  // /checkups persona modal uses.
  const [openTier, setOpenTier] = useState<Tier | null>(null);
  const audienceLabels = AUDIENCE_LABEL[locale] ?? AUDIENCE_LABEL.ge;
  const audienceDescs = AUDIENCE_DESC[locale] ?? AUDIENCE_DESC.ge;
  const audienceChoices: AudienceChoice[] | undefined = openTier
    ? AUDIENCE_ORDER.map((aud) => {
        const Icon = AUDIENCE_ICON[aud];
        return {
          value: aud,
          label: audienceLabels[aud],
          description: audienceDescs[aud],
          icon: <Icon />,
          pkg: checkupPackages.find((p) => p.tier === openTier && p.audience === aud) ?? null,
        };
      })
    : undefined;

  return (
    <>
    <section className="py-16 sm:py-20 lg:py-24 bg-cream relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        <AnimateIn className="text-center mb-10 sm:mb-14">
          <p className="text-pink text-[12px] font-medium tracking-[0.2em] uppercase mb-3 break-words">{t("subtitle")}</p>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-bold tracking-tight text-blackberry break-words">{t("title")}</h2>
        </AnimateIn>

        {/* Mobile: centered snap carousel; sm+: centered 3-col grid. Three tier
            highlights — General / Advanced / Premium — as an overview; the
            middle (Advanced) keeps the dark "featured" treatment + Popular flag. */}
        <SnapCarousel
          ariaLabel={t("title")}
          cardWidth="82vw"
          gapClassName="gap-5"
          className="sm:gap-6 sm:mx-auto sm:grid sm:grid-cols-1 md:grid-cols-3 sm:max-w-5xl items-stretch"
        >
          {TIERS.map((tier, index) => {
            const featured = index === 1;
            const c = copy[tier];
            const prices = checkupPackages.filter((p) => p.tier === tier).map((p) => p.price).filter((n) => n > 0);
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const currency = checkupPackages.find((p) => p.tier === tier && p.price > 0)?.currency ?? "";
            return (
              <AnimateIn key={tier} delay={index * 100} className={`h-full ${featured ? "lg:-mt-4 lg:mb-4" : ""}`}>
                <div
                  className={`group/card relative rounded-3xl p-6 sm:p-8 h-full flex flex-col transition-all duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] min-w-0 hover:-translate-y-1.5 ${
                    featured
                      ? "bg-blackberry text-white shadow-2xl shadow-blackberry/25 ring-1 ring-pink/10 hover:ring-pink/40 hover:shadow-[0_34px_70px_-22px_rgba(104,33,73,0.6)]"
                      : "bg-white border border-grey-lighter hover:border-pink/25 hover:shadow-xl hover:shadow-blackberry/[0.08]"
                  }`}
                >
                  {featured && (
                    <span className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-[0.14em] text-white bg-pink px-2.5 py-1 rounded-full">
                      {t("popular")}
                    </span>
                  )}

                  <div className="mb-5">
                    <LevelMeter level={index + 1} featured={featured} />
                  </div>

                  <h3 className={`text-[22px] font-bold tracking-[0.04em] mb-2 break-words ${featured ? "text-pink" : "text-blackberry"}`}>
                    {TIER_LABEL[tier]}
                  </h3>
                  <p className={`text-[14px] leading-relaxed mb-6 break-words ${featured ? "text-white/65" : "text-grey-light"}`}>
                    {c.desc}
                  </p>

                  {minPrice > 0 && (
                    <div className="mb-6 flex flex-wrap items-baseline gap-x-1.5">
                      <span className={`text-[13px] break-words ${featured ? "text-white/40" : "text-grey-light"}`}>{fromLabel}</span>
                      <span className={`text-[clamp(2rem,8vw,40px)] font-bold tracking-tight leading-none break-words ${featured ? "text-white" : "text-blackberry"}`}>{minPrice}</span>
                      <span className={`text-[14px] break-words ${featured ? "text-white/40" : "text-grey-light"}`}>{currency}</span>
                    </div>
                  )}

                  <div className="flex-1 mb-8">
                    <ul className="space-y-3">
                      {c.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 min-w-0">
                          <CheckIcon className={`w-4 h-4 mt-0.5 shrink-0 ${featured ? "text-pink" : "text-pink"}`} />
                          <span className={`text-[13px] leading-snug min-w-0 break-words ${featured ? "text-white/80" : "text-grey"}`}>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenTier(tier)}
                    aria-haspopup="dialog"
                    className={`block w-full text-center text-[14px] font-bold py-3.5 rounded-xl transition-colors duration-300 break-words cursor-pointer ${
                      featured ? "bg-pink text-white hover:bg-pink-dark" : "bg-blackberry text-white hover:bg-blackberry-light"
                    }`}
                  >
                    {t("details")}
                  </button>
                </div>
              </AnimateIn>
            );
          })}
        </SnapCarousel>
      </div>
    </section>

    {/* Same modal the /checkups page opens — in audience-chooser mode: pick
        gender / kid for the chosen tier, then drill into that tier×audience
        package's details (price + included tests + phone-booking CTA). */}
    <CheckupPackageModal
      open={openTier !== null}
      onClose={() => setOpenTier(null)}
      packages={[]}
      audienceChoices={audienceChoices}
      audiencePrompt={AUDIENCE_PROMPT[locale] ?? AUDIENCE_PROMPT.ge}
      phone={phone}
      locale={locale}
      heading={openTier ? TIER_LABEL[openTier] : ""}
      ariaLabel={openTier ? TIER_LABEL[openTier] : undefined}
    />
    </>
  );
};

export default CheckupCards;
