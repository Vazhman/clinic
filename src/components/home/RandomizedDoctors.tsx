"use client";

import { useEffect, useState } from "react";
import type { Doctor } from "@/types";
import DoctorsPreview from "@/components/home/DoctorsPreview";

// Client-side reshuffle for the homepage "Our doctors" section. The page itself
// is now statically cached (see page.tsx `revalidate`), so the per-visit random
// pick can't happen on the server anymore. Instead the server passes the full
// featured pool and this component:
//   1. renders the first `count` doctors deterministically on first paint, so
//      SSR and the initial client render match (no hydration mismatch), then
//   2. after mount, if `randomize` is on, shuffles the pool and swaps in a new
//      subset — matching the old force-dynamic "reshuffle per visit" behaviour.
// When `randomize` is off the pool order is rendered as-is (never shuffled),
// preserving the previous admin-toggle gating.
function shuffle<T>(list: T[]): T[] {
  return [...list]
    .map((item) => ({ item, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(({ item }) => item);
}

export default function RandomizedDoctors({
  doctors,
  count,
  randomize,
}: {
  doctors: Doctor[];
  count: number;
  randomize: boolean;
}) {
  const [shown, setShown] = useState<Doctor[]>(() => doctors.slice(0, count));

  useEffect(() => {
    if (!randomize) return;
    setShown(shuffle(doctors).slice(0, count));
  }, [doctors, count, randomize]);

  return <DoctorsPreview doctors={shown} />;
}
