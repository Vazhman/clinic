"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

const AccessibilityPanel = dynamic(
  () => import("./AccessibilityPanel"),
  { ssr: false }
);

export default function AccessibilityButton() {
  const t = useTranslations("Accessibility");
  const [panelOpen, setPanelOpen] = useState(false);
  const pathname = usePathname();

  // Hide on booking page (same as WhatsApp button)
  if (pathname && /\/(ge|en|ru)\/booking/.test(pathname)) return null;

  return (
    <>
      <button
        onClick={() => setPanelOpen(true)}
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 lg:bottom-7 lg:left-7 z-40 w-12 h-12 sm:w-[52px] sm:h-[52px] text-white rounded-2xl sm:rounded-[18px] flex items-center justify-center ring-2 ring-white/70 shadow-xl shadow-blackberry/30 hover:shadow-2xl hover:shadow-blackberry/40 hover:scale-105 active:scale-95 transition-all duration-300"
        style={{ background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)" }}
        aria-label={t("openPanel")}
        aria-expanded={panelOpen}
        title={t("openPanel")}
      >
        {/* Universal accessibility icon (ISO 7000 Symbol of Access) */}
        <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="4.5" r="2" />
          <path d="M19 9.5a1 1 0 0 0-1.32-.95l-4.18 1.39H10.5L6.32 8.55A1 1 0 1 0 5.68 10.45l4.32 1.44V14l-2.5 7a1 1 0 0 0 1.88.7l2.12-5.94L13.62 21.7a1 1 0 1 0 1.88-.7l-2.5-7v-2.11l4.32-1.44A1 1 0 0 0 19 9.5z" />
        </svg>
      </button>
      <AccessibilityPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}
