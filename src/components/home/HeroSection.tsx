"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import type { HeroSlide } from "@/lib/payload-data";

type HeroCms = {
  headline?: string | null;
  subheadline?: string | null;
  bookButtonText?: string | null;
  consultButtonText?: string | null;
  badgeText?: string | null;
} | null;

type TrustStripCms = {
  rating?: string | null;
  doctorCount?: string | null;
  patientCount?: string | null;
} | null;

type ResolvedSlide = {
  image: string;
  headline: string;
  subheadline: string;
  buttonLabel: string;
  buttonHref: string;
};

// Used only when the admin hasn't configured any hero slides yet — pairs a few
// clinic photos with the global hero text + a "Book a visit" button.
const FALLBACK_IMAGES = [
  "/images/gallery/khozrevanidzis-klinika-0001.jpg",
  "/images/gallery/khozrevanidzis-klinika-0010.jpg",
  "/images/gallery/khozrevanidzis-klinika-0020.jpg",
];

function isExternal(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

export default function HeroSection({
  slides,
  hero,
  trustStrip,
}: {
  // doctors / showDoctorCard are still passed by page.tsx but unused in this
  // split layout — kept in the type so the call site doesn't need editing.
  doctors?: { slug: string; name: string; specialty: string; photo: string }[];
  slides?: HeroSlide[] | null;
  hero?: HeroCms;
  trustStrip?: TrustStripCms;
  showDoctorCard?: boolean;
}) {
  const reduce = useReducedMotion();

  const fallbackHeadline = hero?.headline?.trim() ?? "";
  const fallbackSub = hero?.subheadline?.trim() ?? "";
  const fallbackButton = hero?.bookButtonText?.trim() ?? "";

  // Each slide resolves its own text+button, falling back to the global hero
  // copy for any field the admin left blank on that slide.
  const resolved: ResolvedSlide[] =
    slides && slides.length > 0
      ? slides.map((s, i) => ({
          // A CMS slide saved without a photo still renders — with one of the
          // clinic fallback images instead of disappearing from the carousel.
          image: s.image || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
          headline: s.headline?.trim() || fallbackHeadline,
          subheadline: s.subheadline?.trim() || fallbackSub,
          buttonLabel: s.buttonLabel?.trim() || "",
          buttonHref: s.buttonHref?.trim() || "",
        }))
      : FALLBACK_IMAGES.map((image) => ({
          image,
          headline: fallbackHeadline,
          subheadline: fallbackSub,
          buttonLabel: fallbackButton,
          buttonHref: "/booking",
        }));

  const count = resolved.length;
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState(0);

  const go = useCallback((n: number) => {
    setIndex((cur) => {
      if (n !== cur) setPrev(cur);
      return n;
    });
  }, []);
  const next = useCallback(() => {
    setIndex((cur) => {
      setPrev(cur);
      return (cur + 1) % count;
    });
  }, [count]);
  const back = useCallback(() => {
    setIndex((cur) => {
      setPrev(cur);
      return (cur - 1 + count) % count;
    });
  }, [count]);

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next, count]);

  const badge = hero?.badgeText?.trim() ?? "";
  const active = resolved[index];
  const rating = trustStrip?.rating?.trim() ?? "";
  const doctorCount = trustStrip?.doctorCount?.trim() ?? "";
  const patientCount = trustStrip?.patientCount?.trim() ?? "";

  // Slide-content reveal. The eyebrow stays put as an anchor; headline →
  // subheadline → button cascade in (one-time per slide). Exit is quick so the
  // next slide doesn't feel delayed. Reduced-motion drops the rise + stagger.
  const textContainer = {
    initial: {},
    enter: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: reduce ? 0 : 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as const } },
  };
  const textItem = {
    initial: { opacity: 0, y: reduce ? 0 : 18 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <section
      className="relative bg-white overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Clinic highlights"
    >
      {/* Faint warm wash on the text side so the white never reads as flat. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[8%] top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-pink/[0.05] blur-[140px]"
      />

      {/* ── IMAGE LAYER ──────────────────────────────────────────────────
          Mobile: a band on top (stacks above the text).
          Desktop: absolutely pinned to the right ~56%, full height. */}
      {/* hero-image-mask (globals.css) fades the IMAGE itself to transparent
          into the white section behind it — no white overlay, so there is no
          edge and no visible seam line. Mobile masks the bottom, desktop the
          left. */}
      <div className="hero-image-mask relative w-full h-[46vh] min-h-[300px] overflow-hidden lg:absolute lg:top-0 lg:right-0 lg:h-full lg:w-[70%] xl:w-[68%]">
        {resolved.map((s, i) => {
          const isActive = i === index;
          // Outgoing frame stays opaque beneath the incoming one so the white
          // background never flashes through mid cross-fade.
          const isPrev = i === prev && !isActive;
          return (
            <m.div
              key={`${s.image}-${i}`}
              initial={false}
              animate={{
                opacity: isActive || isPrev ? 1 : 0,
                // Incoming frame slides in a touch from the right as it fades.
                // A contained directional push (clipped by the box's
                // overflow-hidden) — no center-zoom, no edge poke-out, and it
                // reads clearly even on darker photos. The outgoing frame holds
                // opaque beneath so the white never flashes through.
                x: reduce ? "0%" : isActive || isPrev ? "0%" : "4%",
              }}
              transition={{
                opacity: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                x: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
              }}
              style={{ zIndex: isActive ? 2 : isPrev ? 1 : 0 }}
              className="absolute inset-0"
              aria-hidden={!isActive}
            >
              <Image
                src={s.image}
                alt={s.headline}
                fill
                priority={i === 0}
                sizes="(min-width: 1280px) 68vw, (min-width: 1024px) 70vw, 100vw"
                className="object-cover"
              />
            </m.div>
          );
        })}

        {/* The feather into white. Two separate elements because the fade goes
            a different DIRECTION per breakpoint (down on mobile, left on
            desktop) and a single gradient can't reverse its colour order.
            Wide, multi-stop feathers so there is no visible seam line. */}
        {/* Blend is handled by the mask on the wrapper above — no overlay,
            so there is no edge to see. */}
      </div>

      {/* ── TEXT LAYER ───────────────────────────────────────────────────
          Vertically centered; constrained to the left ~48% on desktop. */}
      <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-6 md:px-10 flex items-center min-h-[46vh] lg:min-h-[86vh] py-12 sm:py-16 lg:py-[96px]">
        <div className="w-full lg:w-[48%] xl:w-[46%] min-w-0">
          {/* Eyebrow — static, anchors the composition while slides change. */}
          <div className="inline-flex items-center gap-3 mb-6 sm:mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-pink animate-pulse" />
            <span className="text-blackberry/55 text-[11px] sm:text-[12px] font-semibold tracking-[0.24em] uppercase break-words">
              {badge}
            </span>
          </div>

          {/* Slide content — cross-fades as one unit. */}
          <AnimatePresence mode="wait">
            <m.div
              key={index}
              variants={textContainer}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <m.h1
                variants={textItem}
                className="text-[clamp(2rem,4.4vw,3.6rem)] font-bold leading-[1.06] tracking-[-0.02em] text-blackberry mb-5 text-balance"
                style={{ overflowWrap: "normal", wordBreak: "keep-all" }}
              >
                {active.headline}
              </m.h1>
              {active.subheadline && (
                <m.p
                  variants={textItem}
                  className="text-[16px] sm:text-[18px] text-grey-light leading-[1.6] max-w-[46ch] mb-8 break-words"
                >
                  {active.subheadline}
                </m.p>
              )}
              {active.buttonLabel && active.buttonHref && (
                <m.div variants={textItem}>
                  <HeroButton label={active.buttonLabel} href={active.buttonHref} />
                </m.div>
              )}
            </m.div>
          </AnimatePresence>

          {/* Controls — prev / dots / next. Hidden when there's a single slide. */}
          {count > 1 && (
            <div className="mt-9 sm:mt-12 flex items-center gap-3">
              <button
                onClick={back}
                aria-label="Previous slide"
                className="w-9 h-9 rounded-full border border-blackberry/15 flex items-center justify-center text-blackberry/70 hover:border-blackberry hover:text-blackberry transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <div className="flex gap-1.5" role="group" aria-label="Slide navigation">
                {resolved.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === index ? "true" : undefined}
                    className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                      i === index ? "w-6 bg-pink" : "w-1.5 bg-blackberry/20 hover:bg-blackberry/40"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                aria-label="Next slide"
                className="w-9 h-9 rounded-full border border-blackberry/15 flex items-center justify-center text-blackberry/70 hover:border-blackberry hover:text-blackberry transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          )}

          {/* Trust strip — quiet social proof on the white. */}
          <div className="mt-8 flex flex-wrap items-baseline gap-x-7 gap-y-2 text-[13px]">
            <span className="flex items-baseline gap-2 min-w-0">
              <span className="text-[20px] font-bold text-blackberry tabular-nums leading-none">{rating}</span>
              <span className="text-grey-light text-[12px] tracking-[0.04em] break-words">{doctorCount}</span>
            </span>
            <span className="hidden sm:block w-px h-3 bg-blackberry/15 self-center" />
            <span className="text-grey-light text-[13px] break-words">{patientCount}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Renders the per-slide CTA. Internal paths use the locale-aware Link (cast,
   like Footer's CMS links, since hrefs are free-text from the CMS); http/mailto/
   tel use a plain anchor. */
function HeroButton({ label, href }: { label: string; href: string }) {
  const className =
    "group inline-flex items-center justify-center gap-3 bg-blackberry text-white text-[15px] font-bold px-7 sm:px-8 py-4 rounded-full transition-all duration-400 hover:bg-pink hover:shadow-xl hover:shadow-pink/20 hover:-translate-y-0.5 whitespace-normal text-center";
  const arrow = (
    <svg
      className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );

  if (isExternal(href)) {
    const ext = href.startsWith("http");
    return (
      <a href={href} className={className} target={ext ? "_blank" : undefined} rel={ext ? "noopener noreferrer" : undefined}>
        {label}
        {arrow}
      </a>
    );
  }
  return (
    <Link href={href as never} className={className}>
      {label}
      {arrow}
    </Link>
  );
}
