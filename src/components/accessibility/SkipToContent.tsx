"use client";

import { useTranslations } from "next-intl";

export default function SkipToContent() {
  const t = useTranslations("Accessibility");

  return (
    <a href="#main-content" className="skip-to-content">
      {t("skipToContent")}
    </a>
  );
}
