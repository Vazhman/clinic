import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./config";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/about": {
      ge: "/shesakheb",
      en: "/about",
      ru: "/o-klinike",
    },
    "/services": {
      ge: "/servisebi",
      en: "/services",
      ru: "/uslugi",
    },
    "/services/[slug]": {
      ge: "/servisebi/[slug]",
      en: "/services/[slug]",
      ru: "/uslugi/[slug]",
    },
    "/doctors": {
      ge: "/eqimebi",
      en: "/doctors",
      ru: "/vrachi",
    },
    "/doctors/[slug]": {
      ge: "/eqimebi/[slug]",
      en: "/doctors/[slug]",
      ru: "/vrachi/[slug]",
    },
    "/blog": {
      ge: "/siaxleebi",
      en: "/blog",
      ru: "/novosti",
    },
    "/blog/[slug]": {
      ge: "/siakhlebi/[slug]",
      en: "/blog/[slug]",
      ru: "/novosti/[slug]",
    },
    "/booking": {
      ge: "/chawera",
      en: "/booking",
      ru: "/zapis",
    },
    "/checkups": {
      ge: "/cheqapi",
      en: "/checkups",
      ru: "/obsledovaniya",
    },
    "/contact": {
      ge: "/kontaqti",
      en: "/contact",
      ru: "/kontakty",
    },
    "/gallery": {
      ge: "/galerea",
      en: "/gallery",
      ru: "/galereya",
    },
    "/lab-tests": {
      ge: "/analizebi",
      en: "/lab-tests",
      ru: "/analizy",
    },
    "/lab-tests/[slug]": {
      ge: "/analizebi/[slug]",
      en: "/lab-tests/[slug]",
      ru: "/analizy/[slug]",
    },
    "/health-library": {
      ge: "/janmrtelobis-biblioteka",
      en: "/health-library",
      ru: "/biblioteka-zdorovya",
    },
    "/ai-assistant": {
      ge: "/ai-asistenti",
      en: "/ai-assistant",
      ru: "/ii-assistent",
    },
    "/pages/[slug]": {
      ge: "/gverdebi/[slug]",
      en: "/pages/[slug]",
      ru: "/stranitsy/[slug]",
    },
    "/policies/[type]": {
      ge: "/pirobebi/[type]",
      en: "/policies/[type]",
      ru: "/politika/[type]",
    },
  },
});
