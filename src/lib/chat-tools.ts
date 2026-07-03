/**
 * Chat assistant tools.
 *
 * These are the only "actions" the LLM can take. Each returns a small,
 * well-shaped JSON object that fits comfortably in a tool-call response.
 *
 * Design notes:
 *  - The LLM (Gemini) is multilingual and smart enough to map "head hurts"
 *    → neurology natively, so we don't ship a symptom-to-specialty
 *    dictionary. The clinic's actual specialty list is fetched live via
 *    listServices() and handed to the model, which then picks one.
 *  - Tool outputs are intentionally compact — every extra field eats into
 *    the model's context budget.
 *  - All tools fail soft: errors → `{ ok: false, reason }` rather than
 *    throws, so the LLM can apologize and recover instead of the route
 *    500ing.
 *  - Booking deep-link is constructed via `buildBookingLink()` and
 *    returned from get_earliest_availability — the model passes that
 *    URL through to the user verbatim.
 */

import {
  getBookingServicesFromPayload,
  getBookingDoctorsFromPayload,
  getContactPage,
  getCheckupPackages,
  getAllNews,
  getLabTests,
  getStats,
} from "@/lib/payload-data";
import { getPagesContent } from "@/lib/payload-pages";
import { getTimeSlots } from "@/lib/doctra-api";
import type { Locale } from "@/lib/seo-helpers";
import { SERVICES as FALLBACK_SERVICES } from "@/lib/booking-data";
import { localizeName } from "@/lib/translit-ka";

// ── Types the LLM sees ─────────────────────────────────────────────────────

type ServiceSummary = {
  id: string;
  name: string;
  category: string;
};

type DoctorSummary = {
  id: string;
  name: string;
  specialty: string | null;
  serviceId: string;
  profileUrl: string | null;
};

type SlotSummary = {
  date: string;        // "2026-05-22"
  time: string;        // "14:30"
  bookingUrl: string;  // /[locale]/booking?branch=...&operator=...&date=...&time=...
};

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Map a Payload BookingService → compact summary, picking the right
 * localized name. We fall back to the hardcoded list if the Payload query
 * returns nothing — typically only the case in fresh dev DBs where the
 * services collection hasn't been seeded yet.
 */
async function getServicesForLocale(locale: Locale): Promise<ServiceSummary[]> {
  const fromPayload = await getBookingServicesFromPayload();
  const source = fromPayload.length > 0 ? fromPayload : FALLBACK_SERVICES;
  return source.map((s) => ({
    id: s.id,
    name: s.name[locale] || s.name.ge,
    category: s.category ?? "other",
  }));
}

/**
 * Build the booking page URL that pre-selects service / doctor / slot.
 * BookingWizard reads `branch`, `operator`, `date`, `time` from the URL —
 * see prefill effect in BookingWizard.tsx.
 */
function buildBookingLink(
  locale: Locale,
  serviceId: string,
  doctorId: string,
  isoSlot?: string,
): string {
  const url = new URL(`https://placeholder.local/${locale}/booking`);
  url.searchParams.set("branch", serviceId);
  url.searchParams.set("operator", doctorId);
  if (isoSlot) {
    const [date, timePart] = isoSlot.split("T");
    if (date) url.searchParams.set("date", date);
    if (timePart) url.searchParams.set("time", timePart.substring(0, 5));
  }
  // Strip the placeholder origin so we hand back a relative URL — the chat
  // widget renders this as a plain Next.js link.
  return url.pathname + url.search;
}

// ── Tools ──────────────────────────────────────────────────────────────────

/**
 * Tool 1: list_services — return all specialties this clinic offers.
 *
 * The LLM uses this to know which department a symptom maps to. Without
 * this, the model might confidently recommend "rheumatology" when the
 * clinic doesn't actually have one.
 */
export async function listServices(locale: Locale): Promise<{
  ok: true;
  services: ServiceSummary[];
}> {
  const services = await getServicesForLocale(locale);
  return { ok: true, services };
}

/**
 * Tool 2: list_doctors — return doctors for a specialty.
 *
 * Pass `serviceId` (the branch UUID from list_services) to filter. With
 * no filter, returns everyone (used only when the user explicitly asks
 * for a list of all doctors).
 */
export async function listDoctors(
  locale: Locale,
  serviceId?: string,
): Promise<{ ok: true; doctors: DoctorSummary[] }> {
  const rows = await getBookingDoctorsFromPayload(locale);
  const filtered = serviceId
    ? rows.filter((r) => r.serviceId === serviceId)
    : rows;
  const doctors: DoctorSummary[] = filtered.slice(0, 20).map((r) => ({
    id: r.operator.id,
    // Doctra-imported doctors only have Georgian names; for en/ru users we
    // transliterate to Latin so the assistant doesn't reply in Georgian
    // script (e.g. "Dr. Irina Zamtaradze" instead of "ირინა ზამთარაძე").
    name: localizeName(r.operator.name, locale),
    specialty: r.operator.specialty ? localizeName(r.operator.specialty, locale) : null,
    serviceId: r.serviceId,
    profileUrl: r.operator.slug ? `/${locale}/doctors/${r.operator.slug}` : null,
  }));
  return { ok: true, doctors };
}

/**
 * Tool 3: get_earliest_availability — find the soonest open slots for a
 * given doctor, looking ahead `daysAhead` days (default 14, capped at 30).
 *
 * Returns up to 5 slots so the LLM can offer "14:30, 16:00, or 17:30
 * today" instead of dumping a whole calendar.
 *
 * `serviceId` is the branch UUID, `doctorId` is the operator UUID.
 */
export async function getEarliestAvailability(
  locale: Locale,
  serviceId: string,
  doctorId: string,
  daysAhead = 14,
): Promise<
  | { ok: true; slots: SlotSummary[]; bookingUrl: string }
  | { ok: false; reason: string }
> {
  if (!serviceId || !doctorId) {
    return { ok: false, reason: "missing serviceId or doctorId" };
  }
  const cappedDays = Math.min(Math.max(daysAhead, 1), 30);
  const today = new Date();
  const begin = today.toISOString().split("T")[0];
  const end = new Date(today.getTime() + cappedDays * 86_400_000)
    .toISOString()
    .split("T")[0];

  try {
    const allSlots = await getTimeSlots(serviceId, begin, end);
    const open = allSlots
      .filter((s) => s.doctor_id === doctorId && s.slot_type === "available")
      .sort((a, b) => a.date_begin.localeCompare(b.date_begin))
      .slice(0, 5);

    const slots: SlotSummary[] = open.map((s) => {
      const [date, timePart] = s.date_begin.split("T");
      return {
        date: date ?? "",
        time: timePart?.substring(0, 5) ?? "",
        bookingUrl: buildBookingLink(locale, serviceId, doctorId, s.date_begin),
      };
    });

    return {
      ok: true,
      slots,
      // Fallback link — opens the wizard at this doctor with no specific
      // slot. The LLM uses this when offering "see all available times".
      bookingUrl: buildBookingLink(locale, serviceId, doctorId),
    };
  } catch (err) {
    console.error("getEarliestAvailability failed:", err);
    return { ok: false, reason: "doctra-unreachable" };
  }
}

/**
 * Tool 4: get_clinic_info — return clinic-controlled facts (address,
 * phone, hours, languages spoken). Sourced from the ContactPage global
 * in Payload so the clinic can edit without code changes. The LLM is
 * instructed to use this for any factual claim about hours/location/
 * contact, and to fall back to "please call us" if the field is empty.
 *
 * This is the answer to "no, the LLM is not allowed to make up our
 * opening hours".
 */
export async function getClinicInfo(locale: Locale): Promise<{
  ok: true;
  info: {
    address: string | null;
    phone: string | null;
    email: string | null;
    workingHours: string | null;
    languages: string[];
    emergencyNumber: string;
    doctorCount: number | null;
    specialtyCount: number | null;
  };
}> {
  // Fetch contact + the clinic's curated stats + the specialty list together.
  const [contact, stats, services] = await Promise.all([
    getContactPage(locale),
    getStats(),
    getBookingServicesFromPayload(),
  ]);
  // ContactPage stores fields as nested {label, value} pairs (see
  // ContactPageCms in payload-data.ts). Working hours has weekdays +
  // weekends so we join them with " / ".
  const wh = contact?.workingHours ?? null;
  const workingHours = wh
    ? [wh.weekdays, wh.weekends].filter(Boolean).join(" / ") || null
    : null;
  return {
    ok: true,
    info: {
      address: contact?.address?.value ?? null,
      phone: contact?.phone?.display ?? contact?.phone?.value ?? null,
      email: contact?.email?.value ?? null,
      workingHours,
      languages: ["ქართული", "English", "Русский"],
      emergencyNumber: "112",
      // Clinic's advertised doctor headcount (CMS-curated) + how many
      // specialties/departments are bookable. Lets the assistant answer
      // "how many doctors do you have?" instead of refusing.
      doctorCount: stats?.doctors ?? null,
      specialtyCount: Array.isArray(services) ? services.length : null,
    },
  };
}

// ── Check-up packages ────────────────────────────────────────────────────────

type CheckupSummary = {
  name: string;
  price: number;
  currency: string;
  audience: string | null; // 'woman' | 'man' | 'child' | null (suits everyone)
  tests: string[];
};

/** Preventive check-up packages (price, who they're for, included tests). */
export async function listCheckups(
  locale: Locale,
): Promise<{ ok: true; checkups: CheckupSummary[] }> {
  const pkgs = await getCheckupPackages(locale);
  const checkups: CheckupSummary[] = pkgs.slice(0, 30).map((p) => ({
    name: localizeName(p.name, locale),
    price: p.price,
    currency: p.currency,
    audience: p.audience ?? null,
    tests: (p.includedTests && p.includedTests.length > 0
      ? p.includedTests
      : p.includedServices ?? []
    ).slice(0, 25),
  }));
  return { ok: true, checkups };
}

// ── Health articles / news ───────────────────────────────────────────────────

type NewsSummary = {
  title: string;
  excerpt: string;
  url: string;
};

/** Search published clinic health articles by keyword (title/excerpt). */
export async function searchNews(
  locale: Locale,
  query?: string,
): Promise<{ ok: true; articles: NewsSummary[] }> {
  const { docs } = await getAllNews(locale, 1, 50);
  const q = (query ?? "").trim().toLowerCase();
  const matched = q
    ? docs.filter((d) => `${d.title} ${d.excerpt ?? ""}`.toLowerCase().includes(q))
    : docs;
  const articles: NewsSummary[] = matched.slice(0, 6).map((d) => ({
    title: d.title,
    excerpt: d.excerpt ?? "",
    url: `/${locale}/blog/${d.slug}`,
  }));
  return { ok: true, articles };
}

// ── Lab / diagnostic tests ───────────────────────────────────────────────────

type LabTestSummary = { title: string; summary: string; url: string };

/** Search the clinic's lab/diagnostic test catalog by keyword. */
export async function listLabTests(
  locale: Locale,
  query?: string,
): Promise<{ ok: true; tests: LabTestSummary[] }> {
  const all = await getLabTests(locale);
  const q = (query ?? "").trim().toLowerCase();
  const matched = q
    ? all.filter((t) => `${t.title} ${t.summary}`.toLowerCase().includes(q))
    : all;
  const tests: LabTestSummary[] = matched.slice(0, 12).map((t) => ({
    title: t.title,
    summary: t.summary,
    url: `/${locale}/lab-tests/${t.slug}`,
  }));
  return { ok: true, tests };
}

// ── CMS page content ─────────────────────────────────────────────────────────

type PageSnippet = { title: string; snippet: string; url: string };

/** Search published CMS pages (e.g. About) and return text the model can
 *  answer from. */
export async function searchPages(
  locale: Locale,
  query?: string,
): Promise<{ ok: true; pages: PageSnippet[] }> {
  const all = await getPagesContent(locale);
  const q = (query ?? "").trim().toLowerCase();
  const matched = q
    ? all.filter((p) => `${p.title} ${p.text}`.toLowerCase().includes(q))
    : all;
  const pages: PageSnippet[] = matched.slice(0, 4).map((p) => ({
    title: p.title,
    snippet: p.text.slice(0, 800),
    url: `/${locale}/pages/${p.slug}`,
  }));
  return { ok: true, pages };
}

// ── Availability on a SPECIFIC date ──────────────────────────────────────────

/** Whether a doctor has open slots on one specific date (YYYY-MM-DD). Answers
 *  "does Dr X have time on <date>?" — unlike get_earliest_availability, which
 *  only returns the soonest slots regardless of date. */
export async function checkAvailabilityOnDate(
  locale: Locale,
  serviceId: string,
  doctorId: string,
  date: string,
): Promise<
  | { ok: true; date: string; slots: { time: string; bookingUrl: string }[] }
  | { ok: false; reason: string }
> {
  if (!serviceId || !doctorId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, reason: "need serviceId, doctorId and a date as YYYY-MM-DD" };
  }
  try {
    const all = await getTimeSlots(serviceId, date, date);
    const open = all
      .filter((s) => s.doctor_id === doctorId && s.slot_type === "available")
      .sort((a, b) => a.date_begin.localeCompare(b.date_begin));
    const slots = open.map((s) => ({
      time: s.date_begin.split("T")[1]?.substring(0, 5) ?? "",
      bookingUrl: buildBookingLink(locale, serviceId, doctorId, s.date_begin),
    }));
    return { ok: true, date, slots };
  } catch (err) {
    console.error("checkAvailabilityOnDate failed:", err);
    return { ok: false, reason: "doctra-unreachable" };
  }
}
