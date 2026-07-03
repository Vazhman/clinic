/**
 * Booking system data & types.
 *
 * The clinic's backend is a 1C:Enterprise Hospital Information System
 * accessed via the Doctra REST API. API client lives in doctra-api.ts.
 * This file holds the service catalogue and shared types used by
 * both server-side API routes and client-side components.
 */

// ── Service / Branch catalogue ──────────────────────────────────────────────
// Extracted from the live booking page. Each UUID is the SOAP branchId.

export interface BookingService {
  id: string;
  name: {
    ge: string;
    en: string;
    ru: string;
  };
  category?: "cardiology" | "neurology" | "surgery" | "pediatric" | "diagnostics" | "other";
}

export interface BookingOperator {
  id: string;
  name: string;
  // Editorial fields, populated from Payload at SSR
  photo?: string | null;
  slug?: string | null;
  specialty?: string | null;
  hasProfile?: boolean;
  // Defaults to true for Payload-imported doctors. Kept on the type so the
  // dead-doctor filter in CombinedSelectionStep can still hide rows where
  // we explicitly know there's nothing bookable.
  hasAvailability?: boolean;
}

export interface TimeSlot {
  time: string; // e.g. "12:00"
  value: string; // ISO datetime e.g. "2026-04-22T12:00:00"
  available: boolean;
}

export interface TimeSlotsResponse {
  header: string; // e.g. "ჩაწერის დრო: ოთხშაბათი - 22 აპრილი"
  slots: TimeSlot[];
}

export interface BookingFormData {
  citizenship: "False" | "True"; // False = Georgian, True = Foreign
  fullName: string;
  phone: string;
  idNumber: string;
  serviceId: string;
  serviceName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
}

/**
 * ID-document validation, citizenship-aware:
 *  - Georgian citizen → personal ID is exactly 11 digits;
 *  - Foreign citizen  → passport number: 5–15 letters/digits (hyphens ok).
 * Shared by the wizard's step gate and the field's green-check indicator so
 * the visual feedback can never disagree with what actually submits.
 */
export function isValidIdNumber(value: string, foreignCitizen: boolean): boolean {
  const v = value.trim();
  return foreignCitizen ? /^[A-Za-z0-9-]{5,15}$/.test(v) : /^\d{11}$/.test(v);
}

/**
 * Fallback service catalogue.
 *
 * The booking flow now sources services from Doctra `get_departments` via
 * `/api/booking/services` (with optional Payload editorial overlay). This
 * hardcoded list is kept ONLY for the doctor profile fuzzy-match in
 * DoctorMiniBooking — used when an admin hasn't yet set `doctraBranchId`
 * on the doctor's Payload profile. Once every doctor has that field set,
 * this constant can be deleted.
 */
export const SERVICES: BookingService[] = [
  // ── Cardiology ────────────────────────────────────────────────
  { id: "cdcbecdc-9609-11eb-a564-1866daf56389", name: { ge: "კარდიოლოგია", en: "Cardiology", ru: "Кардиология" }, category: "cardiology" },
  { id: "cfdf3e5d-960a-11eb-a564-1866daf56389", name: { ge: "კარდიოექოსკოპია", en: "Cardioecoscopy", ru: "Кардиоэхоскопия" }, category: "cardiology" },
  { id: "1293f0fe-a786-11ed-a280-b8cb29a64a6e", name: { ge: "კარდიო ინტერვენცია", en: "Cardiac Intervention", ru: "Кардиоинтервенция" }, category: "cardiology" },
  { id: "daae03d7-5427-11ed-a211-b8cb29a64a6e", name: { ge: "კარდიოქირურგია", en: "Cardiac Surgery", ru: "Кардиохирургия" }, category: "cardiology" },

  // ── Neurology ─────────────────────────────────���───────────────
  { id: "e15e5ba3-d814-11eb-a019-b8cb29a64a6e", name: { ge: "ნევროლოგია", en: "Neurology", ru: "Неврология" }, category: "neurology" },
  { id: "298580a4-e249-11ec-a17f-b8cb29a64a6e", name: { ge: "ნეიროქირურგია", en: "Neurosurgery", ru: "Нейрохирургия" }, category: "neurology" },

  // ── Surgery ─────────────��───────────────────────��─────────────
  { id: "5d95cca8-960a-11eb-a564-1866daf56389", name: { ge: "ზოგადი ქირურგია", en: "General Surgery", ru: "Общая хирургия" }, category: "surgery" },
  { id: "49d23d4f-960a-11eb-a564-1866daf56389", name: { ge: "პლასტიკური ქირურგია", en: "Plastic Surgery", ru: "Пластическая хирургия" }, category: "surgery" },
  { id: "a596681c-9797-11eb-a564-1866daf56389", name: { ge: "ონკოქირურგია", en: "Oncosurgery", ru: "Онкохирурги��" }, category: "surgery" },
  { id: "e0149c77-a20d-11eb-9fd3-b8cb29a64a6e", name: { ge: "პროქტოლოგია", en: "Proctology", ru: "Проктология" }, category: "surgery" },

  // ── Pediatric ───────────���─────────────────────��───────────────
  { id: "19ef80a9-95e8-11eb-a564-1866daf56389", name: { ge: "პედიატრი/ოჯახის ექიმი", en: "Pediatrician / Family Doctor", ru: "Педиатр / Семейный врач" }, category: "pediatric" },
  { id: "19ef80aa-95e8-11eb-a564-1866daf56389", name: { ge: "ბავშვთა ნევროლოგია", en: "Pediatric Neurology", ru: "Детская неврология" }, category: "pediatric" },
  { id: "e7afdc54-9609-11eb-a564-1866daf56389", name: { ge: "ბავშვთა ქირურგია", en: "Pediatric Surgery", ru: "Детская хирургия" }, category: "pediatric" },
  { id: "a211a68a-bd2b-11ef-bcc8-cc96e5f41e6f", name: { ge: "ბავშვთა კარდიოექოსკოპია", en: "Pediatric Cardioecoscopy", ru: "Детская кардиоэхоскопия" }, category: "pediatric" },
  { id: "4c9e10cb-a08d-11eb-a566-1866daf56389", name: { ge: "ბავშვთა კარდიო-რევმატოლოგია", en: "Pediatric Cardio-Rheumatology", ru: "Детская кардио-ревматология" }, category: "pediatric" },
  { id: "2423a8e4-ff9c-11ed-ba8a-cc96e5f41e6f", name: { ge: "ბავშვთა ენდოკრინოლოგია", en: "Pediatric Endocrinology", ru: "Детская эндокринология" }, category: "pediatric" },
  { id: "9668ba20-9797-11eb-a564-1866daf56389", name: { ge: "ბავშვთა ჰემატოლოგია", en: "Pediatric Hematology", ru: "Детская гематология" }, category: "pediatric" },

  // ── Diagnostics ───────────────────────────────────────────────
  { id: "c22cd81e-960a-11eb-a564-1866daf56389", name: { ge: "ულტრასონოგრაფია", en: "Ultrasonography", ru: "Ультрасонография" }, category: "diagnostics" },
  { id: "7e6a3b2d-960a-11eb-a564-1866daf56389", name: { ge: "რენტგენოლოგია", en: "Radiology", ru: "Рентгенология" }, category: "diagnostics" },
  { id: "7f3bba55-40c1-11ed-a1f4-b8cb29a64a6e", name: { ge: "მაგნიტო-რეზონანსული ტომოგრაფია", en: "MRI", ru: "МРТ" }, category: "diagnostics" },
  { id: "8c3c929c-40c1-11ed-a1f4-b8cb29a64a6e", name: { ge: "კომპიუტერული ტომოგრაფია", en: "CT Scan", ru: "Компьютерная томография" }, category: "diagnostics" },
  { id: "f07befbe-eb12-11ec-a18a-b8cb29a64a6e", name: { ge: "ენდოსკოპია", en: "Endoscopy", ru: "Эндоскопия" }, category: "diagnostics" },

  // ── Other specialties ──��──────────────────────────────────────
  { id: "4a97afde-95e8-11eb-a564-1866daf56389", name: { ge: "ალერგოლოგია", en: "Allergology", ru: "Аллергология" }, category: "other" },
  { id: "52c36cc2-95e8-11eb-a564-1866daf56389", name: { ge: "გასტროენტეროლოგია", en: "Gastroenterology", ru: "Гастроэнтерология" }, category: "other" },
  { id: "2e19b0d4-95e8-11eb-a564-1866daf56389", name: { ge: "გინეკოლოგია", en: "Gynecology", ru: "Гинекология" }, category: "other" },
  { id: "17919d87-9798-11eb-a564-1866daf56389", name: { ge: "ოტორინოლარინგოლოგია", en: "Otorhinolaryngology", ru: "Оториноларингология" }, category: "other" },
  { id: "23a4f6ae-95e8-11eb-a564-1866daf56389", name: { ge: "ენდოკრინოლოგია", en: "Endocrinology", ru: "Эндокринология" }, category: "other" },
  { id: "2e19b0d3-95e8-11eb-a564-1866daf56389", name: { ge: "ორთოპედ-ტრავმატოლოგია", en: "Orthopedic Traumatology", ru: "Ортопедия-травматология" }, category: "other" },
  { id: "2f484538-fb86-11ec-a19e-b8cb29a64a6e", name: { ge: "ოფთალმოლოგია", en: "Ophthalmology", ru: "Офтальмология" }, category: "other" },
  { id: "92e935d3-da4b-11eb-a01c-b8cb29a64a6e", name: { ge: "თერაპია", en: "Therapy", ru: "Терапия" }, category: "other" },
  { id: "0c038794-e925-11eb-a02f-b8cb29a64a6e", name: { ge: "უროლოგია", en: "Urology", ru: "Урология" }, category: "other" },
  { id: "38b5c325-95e8-11eb-a564-1866daf56389", name: { ge: "დერმატოლოგია", en: "Dermatology", ru: "Дерматология" }, category: "other" },
  { id: "98089b06-4c45-11f0-bd83-cc96e5f41e6f", name: { ge: "ფსიქიატრია", en: "Psychiatry", ru: "Пс��хиатрия" }, category: "other" },
  { id: "3e0c475c-fe77-11ef-bd1d-cc96e5f41e6f", name: { ge: "ფსიქოლოგია", en: "Psychology", ru: "Психология" }, category: "other" },
];

// ── API helpers are in src/lib/doctra-api.ts ───────────────────────────────
