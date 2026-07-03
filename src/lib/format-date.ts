// toLocaleDateString(locale, {month:"long",...}) renders differently between
// the server's Node/ICU build and the browser's Intl data for non-English
// locales (ka-GE especially), causing hydration mismatches. These static
// tables sidestep Intl entirely so server and client always agree.
const MONTHS: Record<string, string[]> = {
  ge: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
};

export function formatLongDate(date: string | Date, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const months = MONTHS[locale] || MONTHS.en;
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  if (locale === "en") return `${month} ${day}, ${year}`;
  if (locale === "ru") return `${day} ${month} ${year} г.`;
  return `${day} ${month}, ${year}`;
}
