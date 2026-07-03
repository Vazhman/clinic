"use client";

import { useMemo, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/navigation";

type Locale = "ge" | "en" | "ru";

export type RoomData = {
  profile: {
    fullName: string;
    name: string;
    surname: string;
    personalId: string;
    phone: string;
    email: string;
    sex: string; // "male" | "female" | other/empty
    dob: string; // YYYY-MM-DD or ""
    bloodGroup: string;
    rhesus: string; // "positive" | "negative" | ""
  };
  orders: { id: string; date: string; name: string }[];
};

const T: Record<Locale, Record<string, string>> = {
  ge: {
    portal: "პაციენტის პორტალი", hi: "გამარჯობა", subtitle: "თქვენი ლაბორატორიული კვლევები ერთ სივრცეში.",
    book: "ვიზიტის დაჯავშნა", logout: "გასვლა", healthCard: "ჯანმრთელობის ბარათი",
    pid: "პ/ნ", sex: "სქესი", female: "ქალი", male: "კაცი", age: "ასაკი", yrs: "წ", blood: "სისხლი",
    phone: "ტელეფონი", email: "ელ. ფოსტა", dob: "დაბადების თარიღი",
    statResults: "კვლევა", statLast: "ბოლო პასუხი", statNext: "შემდეგი ვიზიტი", none: "—",
    docs: "ლაბორატორიული კვლევები", results: "კვლევა",
    searchPh: "მოძებნე კვლევა…", sortNew: "ჯერ ახალი", sortOld: "ჯერ ძველი", sortName: "სახელით",
    download: "გადმოწერა", downloading: "მუშავდება…",
    emptyT: "ჯერ არ არის კვლევები", emptyP: "თქვენი ლაბორატორიული პასუხები აქ გამოჩნდება, როგორც კი მზად იქნება.",
    noResT: "ვერ მოიძებნა", noResP: "სცადეთ სხვა საძიებო სიტყვა.",
    secure: "თქვენი მონაცემები დაცულია და ხელმისაწვდომია მხოლოდ თქვენთვის.",
    notReady: "ფაილი ჯერ არ არის მზად, გთხოვთ სცადოთ ცოტა ხანში.", dlError: "ჩამოტვირთვის შეცდომა.",
    dateLocale: "ka-GE",
  },
  en: {
    portal: "Patient Portal", hi: "Hello", subtitle: "Your laboratory results in one place.",
    book: "Book appointment", logout: "Sign out", healthCard: "Health card",
    pid: "ID", sex: "Sex", female: "Female", male: "Male", age: "Age", yrs: "yrs", blood: "Blood",
    phone: "Phone", email: "Email", dob: "Date of birth",
    statResults: "results", statLast: "Last result", statNext: "Next visit", none: "—",
    docs: "Laboratory results", results: "results",
    searchPh: "Search results…", sortNew: "Newest first", sortOld: "Oldest first", sortName: "By name",
    download: "Download", downloading: "Working…",
    emptyT: "No results yet", emptyP: "Your lab results will appear here as soon as they are ready.",
    noResT: "Nothing found", noResP: "Try a different search term.",
    secure: "Your data is encrypted and visible only to you.",
    notReady: "The file isn't ready yet — please try again shortly.", dlError: "Download failed.",
    dateLocale: "en-GB",
  },
  ru: {
    portal: "Кабинет пациента", hi: "Здравствуйте", subtitle: "Ваши лабораторные результаты в одном месте.",
    book: "Записаться на приём", logout: "Выйти", healthCard: "Карта здоровья",
    pid: "№", sex: "Пол", female: "Женский", male: "Мужской", age: "Возраст", yrs: "лет", blood: "Кровь",
    phone: "Телефон", email: "Эл. почта", dob: "Дата рождения",
    statResults: "анализов", statLast: "Последний результат", statNext: "Следующий визит", none: "—",
    docs: "Лабораторные результаты", results: "анализов",
    searchPh: "Поиск анализов…", sortNew: "Сначала новые", sortOld: "Сначала старые", sortName: "По названию",
    download: "Скачать", downloading: "Обработка…",
    emptyT: "Пока нет результатов", emptyP: "Ваши результаты появятся здесь, как только будут готовы.",
    noResT: "Ничего не найдено", noResP: "Попробуйте другой запрос.",
    secure: "Ваши данные защищены и доступны только вам.",
    notReady: "Файл ещё не готов — попробуйте чуть позже.", dlError: "Ошибка загрузки.",
    dateLocale: "ru-RU",
  },
};

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
function ageFrom(iso: string) {
  if (!iso) return null;
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - dob.getFullYear();
  const md = now.getMonth() - dob.getMonth() || now.getDate() - dob.getDate();
  if (md < 0) a -= 1;
  return a;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const I = {
  search: <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  dl: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  cal: <><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  calPlus: <><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  lab: <><path d="M9 3h6v5l4 9a2 2 0 0 1-1.8 3H6.8A2 2 0 0 1 5 17l4-9V3z" /><path d="M9 3h6M7.5 13h9" /></>,
  spin: <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
};
function Svg({ children, className = "w-5 h-5", spin = false }: { children: React.ReactNode; className?: string; spin?: boolean }) {
  return <svg className={`${className}${spin ? " animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

export default function PatientRoomClient({ locale, data }: { locale: Locale; data: RoomData }) {
  const t = T[locale];
  const { profile, orders } = data;
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "old" | "name">("new");
  const [dl, setDl] = useState<string | null>(null); // order id currently downloading
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3200);
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders
      .filter((o) => !needle || o.name.toLowerCase().includes(needle))
      .sort((a, b) =>
        sort === "name" ? a.name.localeCompare(b.name) : sort === "old" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date),
      );
  }, [q, sort, orders]);

  const lastResult = useMemo(() => [...orders].sort((a, b) => b.date.localeCompare(a.date))[0]?.date, [orders]);
  const age = ageFrom(profile.dob);
  const bloodLabel = profile.bloodGroup
    ? `${profile.bloodGroup}${profile.rhesus === "positive" ? "+" : profile.rhesus === "negative" ? "−" : ""}`
    : null;

  async function download(order: { id: string; name: string }) {
    if (dl) return;
    setDl(order.id);
    try {
      for (let i = 0; i < 12; i++) {
        const res = await fetch(`/api/patient-room/file?orderId=${encodeURIComponent(order.id)}`, { cache: "no-store" });
        if (res.status === 202) {
          await sleep(1500);
          continue;
        }
        if (res.status === 401) {
          window.location.href = `/${locale}/patient-room`;
          return;
        }
        if (!res.ok) {
          showToast(t.dlError);
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${order.name || "lab-result"}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        return;
      }
      showToast(t.notReady);
    } catch {
      showToast(t.dlError);
    } finally {
      setDl(null);
    }
  }

  const fadeUp = (d = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: d, ease: "easeOut" as const },
  });

  const vitals = [
    { k: t.sex, v: profile.sex === "female" ? t.female : profile.sex === "male" ? t.male : profile.sex || t.none },
    { k: t.age, v: age != null ? `${age} ${t.yrs}` : t.none },
    ...(bloodLabel ? [{ k: t.blood, v: bloodLabel, hero: true }] : []),
  ];
  const initials = (profile.name?.[0] || profile.fullName?.[0] || "") + (profile.surname?.[0] || "");

  return (
    <div className="bg-cream min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-blackberry text-white">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-[30%] right-[-8%] w-[560px] h-[560px] rounded-full bg-pink/20 blur-[130px]" />
          <div className="absolute bottom-[-40%] left-[-6%] w-[420px] h-[420px] rounded-full bg-pink/10 blur-[120px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-10 pt-10 sm:pt-14 pb-12 sm:pb-16">
          <div className="flex items-center justify-between gap-4 mb-7">
            <div className="flex items-center gap-3 min-w-0">
              <a href={`/${locale}`} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/85 hover:text-white transition-colors shrink-0">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                {({ ge: 'მთავარ გვერდზე', en: 'Back to site', ru: 'На сайт' } as Record<string, string>)[locale] ?? 'Back to site'}
              </a>
              <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-pink/80">{t.portal}</span>
            </div>
            <a href="/api/patient-room/logout" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/85 hover:text-white bg-white/10 border border-white/20 rounded-full px-3 py-1.5 transition-colors">
              <Svg className="w-3.5 h-3.5">{I.logout}</Svg>{t.logout}
            </a>
          </div>

          <m.h1 {...fadeUp(0)} className="font-bold text-[clamp(1.9rem,4vw,3rem)] leading-[1.08] tracking-[-0.02em]">
            {t.hi}, {profile.name || profile.fullName}
          </m.h1>
          <m.p {...fadeUp(0.06)} className="mt-3 text-white/70 text-[15px] max-w-xl">{t.subtitle}</m.p>

          <m.div {...fadeUp(0.12)} className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { k: t.statResults, v: String(orders.length) },
              { k: t.statLast, v: lastResult ? fmtDate(lastResult) : t.none },
              { k: t.blood, v: bloodLabel || t.none },
              { k: t.statNext, v: t.none },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl bg-white/8 border border-white/15 px-4 py-3.5 backdrop-blur-sm">
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/55">{s.k}</div>
                <div className="mt-1 text-[18px] font-bold tabular-nums">{s.v}</div>
              </div>
            ))}
          </m.div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8 sm:py-12 grid lg:grid-cols-[340px_1fr] gap-6 lg:gap-8 items-start">
        {/* Profile card */}
        <m.aside {...fadeUp(0.05)} className="lg:sticky lg:top-24">
          <div className="rounded-3xl bg-white border border-grey-lighter shadow-[0_20px_50px_-30px_rgba(74,23,53,0.5)] overflow-hidden">
            <div className="relative overflow-hidden bg-gradient-to-br from-blackberry to-blackberry-dark text-white p-6">
              <div aria-hidden className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-pink/25 blur-2xl" />
              <div className="relative">
                <div className="text-[10px] tracking-[0.2em] uppercase text-white/60 mb-4">{t.healthCard}</div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl grid place-items-center text-xl font-bold bg-white/15 border border-white/25 uppercase">{initials || "•"}</div>
                  <div className="min-w-0">
                    <div className="text-[1.2rem] font-bold leading-tight break-words">{profile.fullName}</div>
                    <div className="text-[13px] text-white/75 mt-0.5 tabular-nums tracking-wide">{t.pid} {profile.personalId}</div>
                  </div>
                </div>
                {vitals.length > 0 && (
                  <div className={`mt-5 grid gap-2 ${vitals.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                    {vitals.map((v) => (
                      <div key={v.k} className={`rounded-xl px-2 py-2.5 text-center border ${"hero" in v && v.hero ? "bg-pink/25 border-pink-soft/40" : "bg-white/10 border-white/15"}`}>
                        <div className="text-[9px] tracking-wider uppercase text-white/65">{v.k}</div>
                        <div className={`font-bold mt-1 ${"hero" in v && v.hero ? "text-[1.25rem]" : "text-[1rem]"}`}>{v.v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5">
              {[
                profile.phone && { ic: I.phone, k: t.phone, v: profile.phone, href: `tel:${profile.phone.replace(/[^+\d]/g, "")}` },
                profile.email && { ic: I.mail, k: t.email, v: profile.email, href: `mailto:${profile.email}` },
                profile.dob && { ic: I.cal, k: t.dob, v: fmtDate(profile.dob) },
              ]
                .filter(Boolean)
                .map((r, i) => {
                  const row = r as { ic: React.ReactNode; k: string; v: string; href?: string };
                  return (
                    <div key={row.k} className={`flex items-center gap-3.5 py-3 ${i > 0 ? "border-t border-grey-lighter" : ""}`}>
                      <span className="shrink-0 w-9 h-9 rounded-[10px] grid place-items-center bg-cream text-blackberry border border-grey-lighter"><Svg className="w-[17px] h-[17px]">{row.ic}</Svg></span>
                      <div className="min-w-0">
                        <div className="text-[11px] text-grey-light tracking-wide">{row.k}</div>
                        {row.href ? (
                          <a href={row.href} dir="ltr" className="font-semibold text-[14px] text-grey hover:text-pink break-words transition-colors">{row.v}</a>
                        ) : (
                          <div dir="ltr" className="font-semibold text-[14px] text-grey tabular-nums">{row.v}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <Link href="/booking" className="mt-4 w-full inline-flex items-center justify-center gap-2 text-[14px] font-bold text-white rounded-full py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink/20"
            style={{ background: "linear-gradient(135deg, #682149 0%, #8A3A6B 50%, #DD64A6 100%)" }}>
            <Svg className="w-4 h-4">{I.calPlus}</Svg>{t.book}
          </Link>
        </m.aside>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-[1.35rem] font-bold text-blackberry">{t.docs}</h2>
            <span className="text-[12px] font-bold text-blackberry bg-pink-light rounded-full px-3 py-1 tabular-nums">{filtered.length} {t.results}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-light"><Svg className="w-[18px] h-[18px]">{I.search}</Svg></span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchPh} aria-label={t.searchPh} autoComplete="off"
                className="w-full h-12 pl-11 pr-10 rounded-full bg-white border-[1.5px] border-grey-lighter text-[15px] text-grey outline-none transition focus:border-pink focus:shadow-[0_0_0_4px_rgba(221,100,166,0.16)] placeholder:text-grey-light/70" />
              {q && (
                <button type="button" onClick={() => setQ("")} aria-label="clear" className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-full text-grey-light hover:text-blackberry hover:bg-cream transition">
                  <Svg className="w-[15px] h-[15px]">{I.x}</Svg>
                </button>
              )}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as "new" | "old" | "name")} aria-label="sort"
              className="h-12 px-3.5 rounded-xl bg-white border-[1.5px] border-grey-lighter text-[13px] font-semibold text-grey cursor-pointer outline-none focus:border-pink">
              <option value="new">{t.sortNew}</option>
              <option value="old">{t.sortOld}</option>
              <option value="name">{t.sortName}</option>
            </select>
          </div>

          {filtered.length > 0 ? (
            <ul className="grid gap-2.5">
              {filtered.map((o) => (
                <li key={o.id} className="fade-in-content">
                  <article className="group flex items-center gap-4 p-3.5 sm:px-4 bg-white border border-grey-lighter rounded-2xl shadow-[0_10px_30px_-24px_rgba(74,23,53,0.5)] transition-[transform,box-shadow,border-color] duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-pink/30 hover:shadow-[0_16px_34px_-24px_rgba(74,23,53,0.5)]">
                    <span className="shrink-0 w-12 h-12 rounded-xl grid place-items-center border text-blackberry bg-pink-light/60 border-pink/20"><Svg className="w-[22px] h-[22px]">{I.lab}</Svg></span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[15px] text-grey leading-snug break-words">{o.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-grey-light">
                        <span className="text-blackberry font-semibold">{t.results.charAt(0).toUpperCase() + t.results.slice(1)}</span>
                        {o.date && <><span className="w-[3px] h-[3px] rounded-full bg-grey-light/50" /><time className="tabular-nums" dateTime={o.date}>{fmtDate(o.date)}</time></>}
                      </div>
                    </div>
                    <button type="button" onClick={() => download(o)} disabled={dl === o.id} aria-label={t.download}
                      className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-[11px] text-white text-[13px] font-bold transition hover:brightness-110 disabled:opacity-70 disabled:cursor-wait" style={{ background: "linear-gradient(135deg,#682149,#7c2a59)" }}>
                      <Svg className="w-[17px] h-[17px]" spin={dl === o.id}>{dl === o.id ? I.spin : I.dl}</Svg>
                      <span className="hidden sm:inline">{dl === o.id ? t.downloading : t.download}</span>
                    </button>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl bg-white border border-grey-lighter text-center py-14 px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl grid place-items-center bg-cream border border-grey-lighter text-blackberry"><Svg className="w-7 h-7">{I.lab}</Svg></div>
              <h3 className="font-bold text-blackberry text-[1.05rem]">{q ? t.noResT : t.emptyT}</h3>
              <p className="mt-1.5 text-[14px] text-grey-light max-w-sm mx-auto">{q ? t.noResP : t.emptyP}</p>
            </div>
          )}

          <div className="mt-8 flex items-center gap-2 text-[12.5px] text-grey-light">
            <Svg className="w-[15px] h-[15px] text-[#2f8f5b]">{I.lock}</Svg>{t.secure}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <m.div initial={{ opacity: 0, y: 18, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 18, x: "-50%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed left-1/2 bottom-6 z-50 bg-blackberry text-white text-[13.5px] font-semibold px-5 py-2.5 rounded-full shadow-[0_18px_40px_-18px_rgba(74,23,53,0.8)] max-w-[90vw] text-center">
            {toast}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
