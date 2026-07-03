"use client";

import Image from "next/image";
import { useState, lazy, Suspense } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Doctor } from "@/types";

const AnatomyViewer3D = lazy(() => import("./AnatomyViewer3D"));

interface BodyRegion {
  id: string;
  name: string;
  nameEn: string;
  nameRu: string;
  top: string;
  left: string;
  services: string[];
  conditions: string[];
  conditionsEn: string[];
  conditionsRu: string[];
  specialtyKeywords: string[];
  icon: React.ReactNode;
}

/* ── Organ SVG icons ── */
const BrainIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
    <path d="M9 21h6M10 17v4M14 17v4" />
  </svg>
);
const EyeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EarIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6.5-6 10a3.5 3.5 0 1 1-7 0" />
    <path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 0 0 4 0" />
  </svg>
);
const HeartIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0L12 5.34l-.77-.76a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
  </svg>
);
const LungsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v8" />
    <path d="M6.8 10C4.4 10 2 12.4 2 16s2 5 4 5c1.5 0 3-1 4-2.5L12 16" />
    <path d="M17.2 10C19.6 10 22 12.4 22 16s-2 5-4 5c-1.5 0-3-1-4-2.5L12 16" />
  </svg>
);
const ThyroidIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v4" />
    <path d="M7 12c-2 0-4 1.5-4 4s2 4.5 4 4c1.5 0 3.5-1 5-3" />
    <path d="M17 12c2 0 4 1.5 4 4s-2 4.5-4 4c-1.5 0-3.5-1-5-3" />
    <circle cx="12" cy="8" r="1" fill="currentColor" />
  </svg>
);
const StomachIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10c0-3.5 3-6 7-6h2c2.5 0 4 1 5 2.5s1.5 4 .5 6-3 3.5-5.5 3.5H10c-3 0-6 1-6 4.5S7 24 10 24" />
  </svg>
);
const SpineIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="3" rx="1" />
    <rect x="8" y="6" width="8" height="3" rx="1" />
    <rect x="8" y="10" width="8" height="3" rx="1" />
    <rect x="9" y="14" width="6" height="3" rx="1" />
    <rect x="10" y="18" width="4" height="3" rx="1" />
  </svg>
);
const KidneyIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3C5 3 3 6 3 9c0 2 .5 3.5 2 5s2.5 4 2.5 7h5c0-3 1-5.5 2.5-7s2-3 2-5c0-3-2-6-5-6" />
  </svg>
);
const bodyRegions: BodyRegion[] = [
  {
    id: "head", name: "თავი / ტვინი", nameEn: "Head / Brain", nameRu: "Голова / Мозг",
    top: "6%", left: "42%",
    services: ["neurology", "psychiatry"],
    conditions: ["თავის ტკივილი", "შაკიკი", "თავბრუსხვევა", "ძილის დარღვევა"],
    conditionsEn: ["Headache", "Migraine", "Dizziness", "Sleep disorders"],
    conditionsRu: ["Головная боль", "Мигрень", "Головокружение", "Нарушения сна"],
    specialtyKeywords: ["ნევროლოგ", "ფსიქიატრ", "ფსიქოლოგ"],
    icon: <BrainIcon />,
  },
  {
    id: "eyes", name: "თვალი", nameEn: "Eyes", nameRu: "Глаза",
    top: "9%", left: "55%",
    services: ["laboratory"],
    conditions: ["მხედველობის დაქვეითება", "კერატოკონუსი", "კონიუნქტივიტი"],
    conditionsEn: ["Vision loss", "Keratoconus", "Conjunctivitis"],
    conditionsRu: ["Ухудшение зрения", "Кератоконус", "Конъюнктивит"],
    specialtyKeywords: ["თვალ", "ოფთალმოლოგ"],
    icon: <EyeIcon />,
  },
  {
    id: "ent", name: "ყელი / ყური / ცხვირი", nameEn: "Ear / Nose / Throat", nameRu: "Ухо / Нос / Горло",
    top: "14%", left: "35%",
    services: ["otolaryngology"],
    conditions: ["ოტიტი", "ტინიტუსი", "ცხვირის ძგიდის გამრუდება", "სინუსიტი"],
    conditionsEn: ["Otitis", "Tinnitus", "Deviated septum", "Sinusitis"],
    conditionsRu: ["Отит", "Тиннитус", "Искривление перегородки", "Синусит"],
    specialtyKeywords: ["ოტორინოლარინგოლოგ", "ყელ"],
    icon: <EarIcon />,
  },
  {
    id: "thyroid", name: "ფარისებრი ჯირკვალი", nameEn: "Thyroid", nameRu: "Щитовидная железа",
    top: "21%", left: "50%",
    services: ["endocrinology"],
    conditions: ["ჰიპოთირეოზი", "ჰიპერთირეოზი", "თირეოიდიტი"],
    conditionsEn: ["Hypothyroidism", "Hyperthyroidism", "Thyroiditis"],
    conditionsRu: ["Гипотиреоз", "Гипертиреоз", "Тиреоидит"],
    specialtyKeywords: ["ენდოკრინოლოგ"],
    icon: <ThyroidIcon />,
  },
  {
    id: "heart", name: "გული", nameEn: "Heart", nameRu: "Сердце",
    top: "31%", left: "52%",
    services: ["cardiology"],
    conditions: ["ჰიპერტენზია", "არითმია", "გულის უკმარისობა", "ინფარქტი"],
    conditionsEn: ["Hypertension", "Arrhythmia", "Heart failure", "Infarction"],
    conditionsRu: ["Гипертензия", "Аритмия", "Сердечная недостаточность", "Инфаркт"],
    specialtyKeywords: ["კარდიოლოგ", "კარდიო"],
    icon: <HeartIcon />,
  },
  {
    id: "lungs", name: "ფილტვები", nameEn: "Lungs", nameRu: "Лёгкие",
    top: "28%", left: "38%",
    services: ["laboratory"],
    conditions: ["პნევმონია", "ასთმა", "ბრონქიტი"],
    conditionsEn: ["Pneumonia", "Asthma", "Bronchitis"],
    conditionsRu: ["Пневмония", "Астма", "Бронхит"],
    specialtyKeywords: ["პულმონოლოგ", "თერაპევტ"],
    icon: <LungsIcon />,
  },
  {
    id: "stomach", name: "კუჭი / ნაწლავი", nameEn: "Stomach / Intestines", nameRu: "Желудок / Кишечник",
    top: "42%", left: "55%",
    services: ["general-surgery", "laboratory"],
    conditions: ["გასტრიტი", "წყლულოვანი დაავადება", "გაღიზიანებული ნაწლავი"],
    conditionsEn: ["Gastritis", "Ulcer disease", "Irritable bowel"],
    conditionsRu: ["Гастрит", "Язвенная болезнь", "Синдром раздражённого кишечника"],
    specialtyKeywords: ["გასტროენტეროლოგ", "ქირურგ"],
    icon: <StomachIcon />,
  },
  {
    id: "spine", name: "ხერხემალი", nameEn: "Spine", nameRu: "Позвоночник",
    top: "37%", left: "44%",
    services: ["neurology"],
    conditions: ["დისკის თიაქარი", "ოსტეოქონდროზი", "სკოლიოზი"],
    conditionsEn: ["Disc herniation", "Osteochondrosis", "Scoliosis"],
    conditionsRu: ["Грыжа диска", "Остеохондроз", "Сколиоз"],
    specialtyKeywords: ["ნევროლოგ", "ორთოპედ", "ტრავმატოლოგ", "ნეიროქირურგ"],
    icon: <SpineIcon />,
  },
  {
    id: "kidneys", name: "თირკმელი / საშარდე სისტემა", nameEn: "Kidneys / Urinary", nameRu: "Почки / Мочевая система",
    top: "47%", left: "38%",
    services: ["laboratory"],
    conditions: ["ნეფრიტი", "თირკმლის კენჭები", "ცისტიტი"],
    conditionsEn: ["Nephritis", "Kidney stones", "Cystitis"],
    conditionsRu: ["Нефрит", "Камни в почках", "Цистит"],
    specialtyKeywords: ["უროლოგ", "ნეფროლოგ"],
    icon: <KidneyIcon />,
  },
];

export default function AnatomyExplorer({ doctors = [] }: { doctors?: Doctor[] }) {
  const [activeRegion, setActiveRegion] = useState<string>("heart");
  const locale = useLocale();
  const t = useTranslations("HealthLibrary");
  const dt = useTranslations("Doctors");

  const selected = bodyRegions.find((r) => r.id === activeRegion)!;

  const getRegionName = (region: BodyRegion) => {
    if (locale === "en") return region.nameEn;
    if (locale === "ru") return region.nameRu;
    return region.name;
  };

  const getConditions = (region: BodyRegion) => {
    if (locale === "en") return region.conditionsEn;
    if (locale === "ru") return region.conditionsRu;
    return region.conditions;
  };

  const relatedDoctors = doctors.filter((d) =>
    selected.specialtyKeywords.some((kw) => {
      const kwLower = kw.toLowerCase();
      const specialty = d.specialty ?? "";
      // Some Doctra-imported doctors have specializations as array of strings,
      // others as array of { specialization: string } objects, others null.
      // Coerce safely so a malformed row never crashes the page.
      const specs = Array.isArray(d.specializations) ? d.specializations : [];
      return (
        specialty.toLowerCase().includes(kwLower) ||
        specs.some((s) => {
          const text = typeof s === "string" ? s : (s as { specialization?: string })?.specialization;
          return typeof text === "string" && text.toLowerCase().includes(kwLower);
        })
      );
    })
  ).slice(0, 4);

  return (
    <div className="grid lg:grid-cols-12 gap-4 lg:gap-6 items-start">
      {/* ── Left: organ list with icons ── */}
      <div className="lg:col-span-3 order-2 lg:order-1 min-w-0">
        <div className="space-y-1">
          {bodyRegions.map((region) => {
            const isActive = activeRegion === region.id;
            return (
              <button
                key={region.id}
                onClick={() => setActiveRegion(region.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer group ${
                  isActive
                    ? "bg-blackberry shadow-lg shadow-blackberry/20"
                    : "hover:bg-pink-50"
                }`}
              >
                {/* Icon circle */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  isActive
                    ? "bg-pink text-white"
                    : "bg-pink-light text-blackberry group-hover:bg-pink group-hover:text-white"
                }`}>
                  {region.icon}
                </div>
                {/* Label */}
                <span className={`text-[13px] font-bold text-left transition-colors duration-300 min-w-0 flex-1 break-words ${
                  isActive ? "text-white" : "text-grey group-hover:text-blackberry"
                }`}>
                  {getRegionName(region)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Center: 3D anatomy viewer ── */}
      <div className="lg:col-span-5 order-1 lg:order-2 relative min-w-0">
        <Suspense fallback={
          <div className="w-full rounded-2xl bg-pink-50 border border-pink/10 flex items-center justify-center h-[420px] sm:h-[500px] lg:h-[600px]">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-pink border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[13px] text-grey-light">{t("modelLoading")}</p>
            </div>
          </div>
        }>
          <AnatomyViewer3D
            instructions={t("viewerInstructions")}
            onOrganClick={(meshName) => {
              const lower = meshName.toLowerCase();
              // Order matters: more specific keys (e.g. "thyroid gland") MUST
              // be tested before broader ones ("thyroid"), and the heart's
              // "left ventricle" / "right ventricle" must come before any
              // brain-ventricle match. "thyroid cartilage" is ENT, not the
              // endocrine gland — also distinguish by full phrase.
              const meshToRegion: Array<[string, string]> = [
                // Heart — cardiac side-specific ventricles only.
                ["left ventricle", "heart"], ["right ventricle", "heart"],
                ["atrium", "heart"], ["aorta", "heart"], ["cardiac", "heart"],
                ["valve", "heart"], ["papillary", "heart"], ["semilunar", "heart"],
                ["pulmonary trunk", "heart"], ["pulmonary vein", "heart"], ["coronary", "heart"],
                // Brain ventricles (must come before lung "bronch"/"pulmon")
                ["lateral ventricle", "head"], ["third ventricle", "head"], ["fourth ventricle", "head"],
                // Brain proper
                ["telencephalon", "head"], ["corpus callosum", "head"],
                ["septum pellucidum", "head"], ["fornix", "head"],
                ["hippocamp", "head"], ["hypothalam", "head"], ["thalamus", "head"],
                ["globus pallidus", "head"], ["caudate", "head"], ["lentiform", "head"],
                ["putamen", "head"], ["amygdala", "head"],
                ["pons", "head"], ["medulla oblongata", "head"], ["midbrain", "head"],
                ["brainstem", "head"], ["falx cerebri", "head"], ["choroid plexus", "head"],
                ["aqueduct of midbrain", "head"],
                ["gyrus", "head"], ["sulcus", "head"], ["lobule", "head"],
                ["vermis", "head"], ["culmen", "head"], ["declive", "head"], ["flocculus", "head"],
                ["biventral", "head"], ["quadrangular", "head"],
                ["frontal lobe", "head"], ["parietal lobe", "head"],
                ["temporal lobe", "head"], ["occipital lobe", "head"],
                ["optic tract", "head"], ["olfactory", "head"],
                ["peduncle", "head"], ["cerebellum", "head"], ["cerebr", "head"], ["brain", "head"],
                // Lungs
                ["lung", "lungs"], ["pulmon", "lungs"], ["bronch", "lungs"],
                ["diaphragm", "lungs"], ["pleura", "lungs"],
                // GI
                ["liver", "stomach"], ["hepat", "stomach"], ["stomach", "stomach"],
                ["intestin", "stomach"], ["colon", "stomach"], ["duoden", "stomach"],
                ["jejun", "stomach"], ["ileum", "stomach"], ["pancrea", "stomach"],
                ["gallbladder", "stomach"], ["esophag", "stomach"], ["spleen", "stomach"],
                ["cecum", "stomach"], ["appendix", "stomach"], ["gastric", "stomach"],
                ["meso-appendix", "stomach"], ["mesocolon", "stomach"],
                // Kidneys
                ["kidney", "kidneys"], ["renal", "kidneys"], ["ureter", "kidneys"],
                ["urinary bladder", "kidneys"], ["adrenal", "kidneys"], ["suprarenal", "kidneys"],
                // Thyroid (endocrine — distinguish thyroid gland from thyroid cartilage)
                ["thyroid gland", "thyroid"], ["parathyroid", "thyroid"],
                // ENT (thyroid cartilage falls under ENT, hence ordering)
                ["thyroid cartilage", "ent"], ["cricoid cartilage", "ent"],
                ["arytenoid cartilage", "ent"], ["trachea", "ent"],
                ["larynx", "ent"], ["laryngo", "ent"], ["pharynx", "ent"], ["pharyng", "ent"],
                ["epiglott", "ent"], ["cochlea", "ent"], ["stapes", "ent"], ["incus", "ent"],
                ["malleus", "ent"], ["tympan", "ent"], ["eustachian", "ent"],
                ["nasal bone", "ent"], ["nasal cartilage", "ent"], ["nasal septum", "ent"],
                ["tongue", "ent"], ["parotid gland", "ent"], ["submandibular gland", "ent"],
                ["vocal", "ent"],
                // Spine
                ["intervertebr", "spine"], ["vertebr", "spine"], ["spinal cord", "spine"],
                ["paravertebral", "spine"],
                // Eyes (after retinaculum is excluded upstream; retina match is safe here too)
                ["eyeball", "eyes"], ["sclera", "eyes"], ["cornea", "eyes"],
                ["lens.", "eyes"], ["iris.", "eyes"],
                ["retina.", "eyes"], ["optic disc", "eyes"], ["lacrimal", "eyes"],
              ];
              for (const [key, regionId] of meshToRegion) {
                if (lower.includes(key)) {
                  setActiveRegion(regionId);
                  return;
                }
              }
            }}
            activeRegion={activeRegion}
          />
        </Suspense>
      </div>

      {/* ── Right: region detail panel ── */}
      <div className="lg:col-span-4 order-3 min-w-0">
        <div className="bg-pink-50 rounded-2xl p-4 sm:p-6 border border-pink/10 space-y-5">
          {/* Region header */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-blackberry text-white flex items-center justify-center shrink-0">
              {selected.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-blackberry leading-tight break-words">
                {getRegionName(selected)}
              </h3>
              <div className="w-8 h-0.5 bg-pink rounded-full mt-1" />
            </div>
          </div>

          {/* Conditions */}
          <div>
            <h4 className="text-[10px] font-bold text-grey-light tracking-[0.15em] uppercase mb-2.5">
              {t("conditions")}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {getConditions(selected).map((c) => (
                <span key={c} className="bg-white text-blackberry text-[12px] font-medium px-2.5 py-1 rounded-lg border border-pink/15 break-words max-w-full">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Doctors */}
          {relatedDoctors.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-grey-light tracking-[0.15em] uppercase mb-2.5">
                {t("relatedDoctors")}
              </h4>
              <div className="space-y-1.5">
                {relatedDoctors.map((doc) => (
                  <Link
                    key={doc.id}
                    href={{ pathname: '/doctors/[slug]', params: { slug: doc.slug } }}
                    className="flex items-center gap-3 p-2 rounded-xl bg-white hover:bg-white/80 border border-transparent hover:border-pink/15 transition-all group min-w-0"
                  >
                    <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-pink/20">
                      <Image src={doc.photo} alt={doc.name} fill sizes="36px" className="object-cover object-top" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-blackberry group-hover:text-pink transition-colors truncate">{doc.name}</p>
                      <p className="text-[10px] text-grey-light truncate">{doc.specialty}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <Link
            href="/booking"
            className="flex items-center justify-center gap-2 w-full bg-blackberry text-white text-[13px] font-bold py-3 rounded-xl hover:bg-blackberry-light transition-colors"
          >
            {dt("bookAppointment")}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
