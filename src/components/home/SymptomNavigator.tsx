"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Link } from "@/i18n/navigation";
import type { Service } from "@/types";
import ServiceIcon from "@/components/shared/ServiceIcon";
import AnimateIn from "@/components/shared/AnimateIn";

const symptomMap: Record<string, string[]> = {
  cardiology: ["გული", "გულისცემა", "ტკივილი გულში", "heart", "chest pain", "heartbeat", "palpitation", "сердце", "боль в груди", "сердцебиение"],
  neurology: ["თავი", "თავბრუსხვევა", "თავის ტკივილი", "headache", "dizziness", "migraine", "головная боль", "головокружение", "мигрень"],
  gynecology: ["გინეკოლოგი", "მენსტრუაცია", "ორსულობა", "gynecology", "pregnancy", "menstruation", "гинекология", "беременность", "менструация"],
  psychiatry: ["სტრესი", "შფოთვა", "ძილი", "უძილობა", "stress", "anxiety", "sleep", "insomnia", "depression", "стресс", "тревога", "сон", "бессонница", "депрессия"],
  laboratory: ["ანალიზი", "სისხლი", "blood test", "analysis", "анализ", "кровь"],
  otolaryngology: ["ყელი", "ყური", "ცხვირი", "throat", "ear", "nose", "горло", "ухо", "нос"],
  "general-surgery": ["ოპერაცია", "ქირურგია", "surgery", "operation", "хирургия", "операция"],
  endocrinology: ["ფარისებრი", "შაქარი", "ჰორმონი", "thyroid", "diabetes", "hormone", "щитовидная", "диабет", "гормон"],
};

type SymptomNavCms = {
  title?: string | null;
  subtitle?: string | null;
  placeholder?: string | null;
} | null;

export default function SymptomNavigator({
  services = [],
  symptomNav,
}: {
  services?: Service[];
  symptomNav?: SymptomNavCms;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  // Editorial copy comes straight from the CMS (localized, with Payload
  // fallback). Empty strings render as empty.
  const title = symptomNav?.title?.trim() ?? "";
  const subtitle = symptomNav?.subtitle?.trim() ?? "";
  const placeholder = symptomNav?.placeholder?.trim() ?? "";

  const matched = query.length >= 2
    ? services.filter((s: Service) => {
        const kw = symptomMap[s.slug] || [];
        return kw.some((k) => k.toLowerCase().includes(query.toLowerCase()))
          || s.name.toLowerCase().includes(query.toLowerCase());
      })
    : [];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-blackberry relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-pink/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 md:px-10 text-center">
        <AnimateIn>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold tracking-tight text-pink mb-3 break-words">{title}</h2>
          <p className="text-white/50 text-[14px] mb-10 break-words">{subtitle}</p>
        </AnimateIn>

        <AnimateIn delay={100} className="relative">
          <div className={`flex items-center bg-white rounded-2xl overflow-hidden transition-shadow duration-400 ${focused ? "shadow-2xl shadow-pink/15 ring-2 ring-pink/20" : "shadow-xl shadow-black/10"}`}>
            <div className="pl-4 sm:pl-5 pr-2 shrink-0">
              <svg className={`w-5 h-5 transition-colors ${focused ? "text-pink" : "text-grey-light"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </div>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 200)} placeholder={placeholder} className="w-full min-w-0 px-3 py-4 sm:py-5 text-[15px] text-grey outline-none bg-transparent placeholder:text-grey-light/40 focus-visible:outline-none" />
          </div>

          <AnimatePresence>
            {matched.length > 0 && focused && (
              <m.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl shadow-black/10 overflow-hidden z-20 max-h-[60vh] overflow-y-auto">
                <div className="p-2">
                  {matched.map((s) => (
                    <Link key={s.id} href={{ pathname: '/services/[slug]', params: { slug: s.slug } }} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl hover:bg-pink-light transition-colors">
                      <div className="w-10 h-10 bg-pink-light rounded-xl flex items-center justify-center shrink-0"><div className="text-blackberry"><ServiceIcon icon={s.icon} className="w-4 h-4" /></div></div>
                      <div className="flex-1 min-w-0 text-left"><p className="text-[14px] font-bold text-blackberry break-words">{s.name}</p><p className="text-[12px] text-grey-light break-words">{s.shortDescription}</p></div>
                      <svg className="w-4 h-4 text-pink shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    </Link>
                  ))}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </AnimateIn>
      </div>
    </section>
  );
}
