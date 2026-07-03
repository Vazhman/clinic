"use client";

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Mobile centered snap carousel — the shared scroller behind every card row
 * (services / doctors / checkups / news / reviews / related lists).
 *
 * < sm: full-bleed scroller. The active card snaps to CENTER with the
 *       neighbours peeking equally left and right; as you drag, the card
 *       approaching the middle smoothly scales/fades to the front (driven
 *       per scroll frame, so it tracks the finger — no jumpy keyframes).
 *       Brand dots underneath (pink pill = active) double as tap targets.
 * ≥ sm: renders children in whatever layout `className` describes (each
 *       section passes its existing responsive grid) — zero change there.
 *
 * Implementation notes:
 *  - `--card-w` (vw units) drives BOTH the item width and the scroller's
 *    edge padding `calc((100vw - var(--card-w)) / 2)`, so the first and
 *    last cards can reach the exact center.
 *  - Scale/opacity are written straight to the wrapper's style inside one
 *    rAF per scroll event; CSS scroll-snap owns the physics, we only paint.
 *  - prefers-reduced-motion: snap + dots keep working, the scale/fade is
 *    skipped (cards stay full-size).
 */
export default function SnapCarousel({
  children,
  className = "",
  itemClassName = "",
  cardWidth = "78vw",
  gapClassName = "gap-4",
  tone = "light",
  ariaLabel,
}: {
  children: ReactNode;
  /** ≥sm layout, e.g. "sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6" */
  className?: string;
  /** extra classes for each item wrapper (applied at every breakpoint) */
  itemClassName?: string;
  /** mobile card width in vw — keep 70–85vw so neighbours peek */
  cardWidth?: string;
  /** mobile gap utility (also applies ≥sm unless className overrides) */
  gapClassName?: string;
  /** dot styling for the section background ("dark" = on blackberry) */
  tone?: "light" | "dark";
  ariaLabel?: string;
}) {
  const items = Children.toArray(children);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);
  const [active, setActive] = useState(0);

  // Paint one frame: recede every card by its distance from the viewport
  // center; report the nearest card for the dots.
  const paint = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const center = scroller.scrollLeft + scroller.clientWidth / 2;

    let nearest = 0;
    let nearestDist = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      if (!isMobile) {
        // grid mode — clear any leftover mobile styling
        el.style.transform = "";
        el.style.opacity = "";
        return;
      }
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = elCenter - center;
      if (Math.abs(dist) < nearestDist) {
        nearestDist = Math.abs(dist);
        nearest = i;
      }
      if (reduce) {
        el.style.transform = "";
        el.style.opacity = "";
        return;
      }
      // 0 at center → 1 one card away; ease the recede so the hand-off
      // between cards feels continuous, not stepped.
      const t = Math.min(Math.abs(dist) / Math.max(el.offsetWidth, 1), 1);
      const scale = 1 - 0.08 * t;
      const opacity = 1 - 0.45 * t;
      el.style.transform = `scale(${scale})`;
      el.style.opacity = String(opacity);
    });
    setActive((prev) => (prev === nearest ? prev : nearest));
  }, []);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(paint);
  }, [paint]);

  useEffect(() => {
    paint(); // initial state (first card centered by scroll padding)
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => paint();
    mq.addEventListener("change", onChange);
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(rafRef.current);
      mq.removeEventListener("change", onChange);
      window.removeEventListener("resize", onScroll);
    };
  }, [paint, onScroll]);

  const scrollToIndex = useCallback((i: number) => {
    const scroller = scrollerRef.current;
    const el = itemRefs.current[i];
    if (!scroller || !el) return;
    scroller.scrollTo({
      left: el.offsetLeft + el.offsetWidth / 2 - scroller.clientWidth / 2,
      behavior: "smooth",
    });
  }, []);

  return (
    <div role="region" aria-roledescription="carousel" aria-label={ariaLabel}>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        style={{ "--card-w": cardWidth } as React.CSSProperties}
        className={`flex ${gapClassName} max-sm:overflow-x-auto max-sm:snap-x max-sm:snap-mandatory scrollbar-hide max-sm:pt-2.5 max-sm:pb-2.5 max-sm:-mx-4 max-sm:px-[calc((100vw-var(--card-w))/2)] ${className}`}
      >
        {items.map((child, i) => (
          <div
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            role="group"
            aria-label={`${i + 1} / ${items.length}`}
            className={`max-sm:w-[var(--card-w)] max-sm:shrink-0 max-sm:snap-center max-sm:will-change-transform min-w-0 ${itemClassName}`}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Dots — mobile only; the active dot stretches into a pink pill. */}
      {items.length > 1 && items.length <= 12 && (
        <div className="sm:hidden flex justify-center items-center gap-1.5 mt-4">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1} / ${items.length}`}
              aria-current={active === i ? "true" : undefined}
              onClick={() => scrollToIndex(i)}
              className="p-1.5 cursor-pointer"
            >
              <span
                className={`block rounded-full transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
                  active === i
                    ? "w-6 h-1.5 bg-pink"
                    : `w-1.5 h-1.5 ${tone === "dark" ? "bg-white/25" : "bg-blackberry/20"}`
                }`}
              />
            </button>
          ))}
        </div>
      )}
      {items.length > 12 && (
        <p aria-live="polite" className={`sm:hidden text-center text-[12px] font-semibold tabular-nums mt-4 ${tone === "dark" ? "text-white/40" : "text-blackberry/40"}`}>
          {active + 1} / {items.length}
        </p>
      )}
    </div>
  );
}
