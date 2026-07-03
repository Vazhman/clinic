import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// Branded, localized 404 — renders inside the locale layout (Header/Footer),
// so clients never see Next's unstyled default not-found page.
const T = {
  ge: {
    code: "404",
    title: "გვერდი ვერ მოიძებნა",
    desc: "სამწუხაროდ, თქვენ მიერ მოთხოვნილი გვერდი არ არსებობს ან გადატანილია.",
    home: "მთავარ გვერდზე დაბრუნება",
  },
  en: {
    code: "404",
    title: "Page not found",
    desc: "Sorry, the page you requested doesn't exist or has been moved.",
    home: "Back to home",
  },
  ru: {
    code: "404",
    title: "Страница не найдена",
    desc: "К сожалению, запрашиваемая страница не существует или была перемещена.",
    home: "Вернуться на главную",
  },
} as const;

export default async function NotFound() {
  let locale = "ge";
  try {
    locale = await getLocale();
  } catch {
    /* not-found can render outside a resolved locale — default to ge */
  }
  const t = T[locale as keyof typeof T] ?? T.ge;

  return (
    <section className="relative bg-cream min-h-[60vh] flex items-center justify-center overflow-hidden px-4 py-20">
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] right-[-15%] w-[620px] h-[620px] bg-pink/[0.07] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[420px] h-[420px] bg-blackberry/[0.04] rounded-full blur-[120px]" />
      </div>
      <div className="relative text-center max-w-md mx-auto">
        <p className="text-[clamp(4rem,14vw,7rem)] font-bold leading-none text-pink/90 tabular-nums tracking-tight">
          {t.code}
        </p>
        <h1 className="mt-2 text-[clamp(1.4rem,3vw,2rem)] font-bold text-blackberry tracking-[-0.02em] break-words">
          {t.title}
        </h1>
        <p className="mt-4 text-grey-light text-[15px] leading-relaxed break-words">{t.desc}</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-blackberry px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-300 hover:bg-blackberry-dark hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blackberry/20"
        >
          {t.home}
        </Link>
      </div>
    </section>
  );
}
