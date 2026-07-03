export const locales = ["ge", "en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ge";

export const localeNames: Record<Locale, string> = {
  ge: "ქართული",
  en: "English",
  ru: "Русский",
};

export function getPatientRoomUrl(locale: Locale | string): string {
  // Native, locale-routed patient portal. The page renders the React login
  // (PatientRoomLogin) when there's no session and the dashboard once the
  // Doctra OTP flow completes — all server-side via /api/patient-room/*.
  return `/${locale}/patient-room`;
}
