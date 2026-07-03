"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useEffect } from "react";
import AnimateIn from "@/components/shared/AnimateIn";

type Stats = { patients: number; satisfiedPatients: number; doctors: number; operations: number; experience: number };

function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const timer = setInterval(() => {
      start += Math.ceil(value / (duration / 30));
      if (start >= value) { setCount(value); clearInterval(timer); }
      else { setCount(start); }
    }, 30);
    return () => clearInterval(timer);
  }, [started, value, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

// Pink accent rule under the feature stat. Draws from 0 → 100% width when
// it scrolls into view, then sits as a quiet underline.
function AccentRule() {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <span
      ref={ref}
      aria-hidden
      className="block h-[3px] mt-2 mb-4 bg-pink rounded-full origin-left"
      style={{
        transform: `scaleX(${shown ? 1 : 0})`,
        transition: "transform 1.1s cubic-bezier(0.16, 1, 0.3, 1)",
        width: "min(72px, 100%)",
      }}
    />
  );
}

export type CustomStat = { value: number; suffix: string; label: string };

export default function StatsCounter({ stats, custom }: { stats: Stats; custom?: CustomStat[] | null }) {
  const t = useTranslations("Stats");
  // Editorial row: one feature stat carries weight, the others recede.
  // `custom` (HomePage.statsList — admin-edited number+suffix+label rows)
  // wins over the legacy fixed five, whose labels are hardcoded i18n keys.
  // A stat set to 0 simply doesn't render, and the layout stays balanced
  // for ANY visible count (1–6):
  //   - the feature stat owns its own column, so its oversized number never
  //     squeezes the secondary stats into mismatched cells;
  //   - secondary stats flow in a wrapping row (md+) / 2-col grid (mobile)
  //     instead of a fixed 5-column grid that orphans odd counts.
  const items = (
    custom && custom.length > 0
      ? custom
      : [
          { value: stats.patients, label: t("patients"), suffix: "+" },
          { value: stats.satisfiedPatients, label: t("satisfiedPatients"), suffix: "+" },
          { value: stats.doctors, label: t("doctors"), suffix: "+" },
          { value: stats.operations, label: t("operations"), suffix: "+" },
          { value: stats.experience, label: t("experience"), suffix: "" },
        ]
  ).filter((item) => item.value > 0);

  if (items.length === 0) return null;
  const [feature, ...rest] = items;

  return (
    <section className="py-14 sm:py-20 lg:py-24 bg-cream relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        <div className="md:grid md:grid-cols-[auto_1fr] md:gap-x-16 lg:gap-x-24 md:items-end">
          {/* Feature stat — full row on mobile, anchored left on md+ */}
          <AnimateIn>
            <div className="min-w-0">
              <p className="font-bold tracking-[-0.02em] leading-none mb-3 text-blackberry break-words tabular-nums text-[clamp(2.8rem,9vw,4.5rem)]">
                <AnimatedNumber value={feature.value} />
                <span className="text-pink">{feature.suffix}</span>
              </p>
              <AccentRule />
              <p className="text-[11px] sm:text-[12px] text-grey-light font-semibold tracking-[0.18em] uppercase break-words">
                {feature.label}
              </p>
            </div>
          </AnimateIn>

          {/* Secondary stats — 2-col grid on mobile, wrapping baseline row
              right-aligned on md+. Wrap handles 1–4 items without orphans. */}
          {rest.length > 0 && (
            <div className="mt-10 md:mt-0 grid grid-cols-2 gap-x-6 gap-y-9 md:flex md:flex-wrap md:items-baseline md:justify-end md:gap-x-12 lg:gap-x-16 md:gap-y-8">
              {rest.map((item, index) => (
                <AnimateIn key={item.label} delay={(index + 1) * 80}>
                  <div className="min-w-0">
                    <p className="font-bold tracking-[-0.02em] leading-none mb-2.5 text-blackberry/85 break-words tabular-nums text-[clamp(1.7rem,5.5vw,2.6rem)]">
                      <AnimatedNumber value={item.value} />
                      <span className="text-pink">{item.suffix}</span>
                    </p>
                    <p className="text-[11px] sm:text-[12px] text-grey-light font-semibold tracking-[0.18em] uppercase break-words">
                      {item.label}
                    </p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
