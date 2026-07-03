export interface LanguageInfo {
  code: string;          // ISO 639-1
  flag: string;          // Unicode flag emoji of the most-associated country
  name: { ge: string; en: string; ru: string };
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "ka", flag: "🇬🇪", name: { ge: "ქართული", en: "Georgian", ru: "Грузинский" } },
  { code: "en", flag: "🇬🇧", name: { ge: "ინგლისური", en: "English", ru: "Английский" } },
  { code: "ru", flag: "🇷🇺", name: { ge: "რუსული", en: "Russian", ru: "Русский" } },
  { code: "tr", flag: "🇹🇷", name: { ge: "თურქული", en: "Turkish", ru: "Турецкий" } },
  { code: "de", flag: "🇩🇪", name: { ge: "გერმანული", en: "German", ru: "Немецкий" } },
  { code: "fr", flag: "🇫🇷", name: { ge: "ფრანგული", en: "French", ru: "Французский" } },
  { code: "es", flag: "🇪🇸", name: { ge: "ესპანური", en: "Spanish", ru: "Испанский" } },
  { code: "it", flag: "🇮🇹", name: { ge: "იტალიური", en: "Italian", ru: "Итальянский" } },
  { code: "he", flag: "🇮🇱", name: { ge: "ებრაული", en: "Hebrew", ru: "Иврит" } },
  { code: "ar", flag: "🇸🇦", name: { ge: "არაბული", en: "Arabic", ru: "Арабский" } },
  { code: "az", flag: "🇦🇿", name: { ge: "აზერბაიჯანული", en: "Azerbaijani", ru: "Азербайджанский" } },
  { code: "hy", flag: "🇦🇲", name: { ge: "სომხური", en: "Armenian", ru: "Армянский" } },
  { code: "uk", flag: "🇺🇦", name: { ge: "უკრაინული", en: "Ukrainian", ru: "Украинский" } },
  { code: "fa", flag: "🇮🇷", name: { ge: "სპარსული", en: "Persian", ru: "Персидский" } },
  { code: "zh", flag: "🇨🇳", name: { ge: "ჩინური", en: "Chinese", ru: "Китайский" } },
];

const codeMap = new Map(LANGUAGES.map((l) => [l.code, l]));

export function getLanguage(codeOrName: string): LanguageInfo | null {
  if (!codeOrName) return null;
  const direct = codeMap.get(codeOrName.toLowerCase());
  if (direct) return direct;
  // Legacy fallback: try matching by English/Georgian/Russian display name
  const lower = codeOrName.toLowerCase();
  return (
    LANGUAGES.find(
      (l) =>
        l.name.en.toLowerCase() === lower ||
        l.name.ge.toLowerCase() === lower ||
        l.name.ru.toLowerCase() === lower,
    ) ?? null
  );
}
