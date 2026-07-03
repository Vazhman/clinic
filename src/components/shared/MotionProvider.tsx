"use client";

import { LazyMotion, domAnimation } from "framer-motion";

/**
 * Site-wide Framer Motion feature provider. Components animate via the
 * lightweight `m` component (instead of `motion`), which pulls its features
 * from this provider — only the ~15KB domAnimation set (animate / exit /
 * hover / tap / inView) ships in the shared bundle instead of the full
 * ~34KB `motion` import.
 *
 * Exceptions: DoctorsListClient and ServicesListClient keep the full
 * `motion` import because they use layout animations (LayoutGroup /
 * `layout` prop), which need the domMax feature set — that cost is paid
 * only inside those routes' chunks, not on every page.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
