"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Branded, localized error boundary for the public site. Catches render/data
// errors in the locale segment and offers a retry instead of Next's default
// unstyled error screen.
const T = {
  ge: {
    title: "სამწუხაროდ, რაღაც შეცდომა მოხდა",
    desc: "გვერდის ჩატვირთვისას მოხდა შეფერხება. სცადეთ თავიდან ან დაბრუნდით მთავარ გვერდზე.",
    retry: "თავიდან ცდა",
    home: "მთავარი გვერდი",
  },
  en: {
    title: "Something went wrong",
    desc: "We hit a problem loading this page. Please try again or return to the homepage.",
    retry: "Try again",
    home: "Homepage",
  },
  ru: {
    title: "Что-то пошло не так",
    desc: "При загрузке страницы произошла ошибка. Попробуйте ещё раз или вернитесь на главную.",
    retry: "Повторить",
    home: "На главную",
  },
} as const;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error server-side via the platform's log drain.
    console.error(error);
  }, [error]);

  const pathname = usePathname();
  const seg = pathname?.split("/").filter(Boolean)[0];
  const locale = seg === "en" || seg === "ru" ? seg : "ge";
  const t = T[locale];

  return (
    <section className="relative bg-cream min-h-[60vh] flex items-center justify-center overflow-hidden px-4 py-20">
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] right-[-15%] w-[620px] h-[620px] bg-pink/[0.07] rounded-full blur-[140px]" />
      </div>
      <div className="relative text-center max-w-md mx-auto">
        <h1 className="text-[clamp(1.4rem,3vw,2rem)] font-bold text-blackberry tracking-[-0.02em] break-words">
          {t.title}
        </h1>
        <p className="mt-4 text-grey-light text-[15px] leading-relaxed break-words">{t.desc}</p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blackberry px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-300 hover:bg-blackberry-dark hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blackberry/20 cursor-pointer w-full sm:w-auto"
          >
            {t.retry}
          </button>
          <a
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-blackberry/15 bg-white px-7 py-3.5 text-[15px] font-semibold text-blackberry transition-all duration-300 hover:border-blackberry hover:-translate-y-0.5 w-full sm:w-auto"
          >
            {t.home}
          </a>
        </div>
      </div>
    </section>
  );
}
