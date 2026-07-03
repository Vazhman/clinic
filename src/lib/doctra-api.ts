/**
 * Doctra REST API client.
 *
 * Replaces the legacy PHP/SOAP proxy. Talks directly to the clinic's
 * 1C:Enterprise HTTP Service at the Doctra endpoint.
 *
 * Key quirks discovered during integration:
 *  - Every request body MUST include `"hash": ""` (undocumented but required)
 *  - Dates for get_time_slots must be ISO format "2026-04-28", not compact "20260428"
 *  - Auth header uses underscore: `Bearer_<token>`, not standard `Bearer <token>`
 *  - Token TTL is 60 seconds — we cache and auto-refresh
 */

const API_URL = process.env.DOCTRA_API_URL || "http://31.146.167.162:9090/doctra/hs/portal_exchange/v1";
const API_USER = process.env.DOCTRA_USER || "";
const API_PASSWORD = process.env.DOCTRA_PASSWORD || "";

// ── Token cache ────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getToken(): Promise<string> {
  // Return cached token if still valid (with 10s safety margin)
  if (cachedToken && Date.now() < tokenExpiresAt - 10_000) {
    return cachedToken;
  }

  const res = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_type: 0,
      user: API_USER,
      password: API_PASSWORD,
    }),
  });

  const data = await res.json();

  if (data.status !== 0) {
    throw new Error(`Doctra auth failed: ${data.error_text || "Unknown error"}`);
  }

  cachedToken = data.token;
  // token_active_time is in minutes
  tokenExpiresAt = Date.now() + data.token_active_time * 60 * 1000;

  return data.token;
}

// ── Generic authenticated request ──────────────────────────────────────────

async function doctraFetch<T>(endpoint: string, body: Record<string, unknown> = {}): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer_${token}`,
    },
    body: JSON.stringify({ ...body, hash: "" }),
  });

  const data = await res.json();

  // If token expired mid-request, retry once with a fresh token
  if (data.status === 9) {
    cachedToken = null;
    tokenExpiresAt = 0;
    const freshToken = await getToken();

    const retryRes = await fetch(`${API_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer_${freshToken}`,
      },
      body: JSON.stringify({ ...body, hash: "" }),
    });

    const retryData = await retryRes.json();
    if (retryData.status !== 0) {
      throw new Error(`Doctra ${endpoint} failed: ${retryData.error_text || "Unknown error"}`);
    }
    return retryData;
  }

  if (data.status !== 0) {
    throw new Error(`Doctra ${endpoint} failed: ${data.error_text || "Unknown error"}`);
  }

  return data;
}

// ── Public API ─────────────────────────────────────────────────────────────

export interface DoctraDepartment {
  id: string;
  name: string;
  address: string;
  name_en: string;
  type: string;
  type_id: string;
}

export interface DoctraDoctor {
  id: string;
  jid: string;
  name: string;
  department_id: string;
  picture: string;
  services: string[];
  consultation_price: string;
  name_en: string;
  degree: string;
  degree_en: string;
  specialty: string;
  specialty_en: string;
  counterparty: string;
  phone: string;
  email: string;
  family_doctor: boolean;
}

export interface DoctraTimeSlot {
  doctor_id: string;
  date_begin: string;
  date_end: string;
  slot_type: "available" | "booked" | "no_schedule";
  patient_id: string;
  patient_name: string;
  order_id: string;
}

/** Fetch all departments from the Doctra API */
export async function getDepartments(): Promise<DoctraDepartment[]> {
  const data = await doctraFetch<{ departments: DoctraDepartment[] }>("get_departments");
  return data.departments ?? [];
}

/** Fetch doctors for a given department */
export async function getDoctors(departmentId: string): Promise<DoctraDoctor[]> {
  const data = await doctraFetch<{ doctors: DoctraDoctor[] }>("get_doctors", {
    department_id: departmentId,
    doctor_id: "",
    with_files: false,
    doctor_name: "",
  });
  return data.doctors ?? [];
}

/** Fetch time slots for a department on a date range */
export async function getTimeSlots(
  departmentId: string,
  dateBegin: string,
  dateEnd: string,
): Promise<DoctraTimeSlot[]> {
  const data = await doctraFetch<{ time_slot: DoctraTimeSlot[] }>("get_time_slots", {
    date_begin: dateBegin,
    date_end: dateEnd,
    department_id: departmentId,
    doctors: [],
    patient_id: "",
    organization_id: "",
  });
  return data.time_slot ?? [];
}

/**
 * Returns true when the given doctor has at least one `available` slot in
 * the next `daysAhead` (default 14) days. Used by the doctor profile page
 * server component to decide whether to render the booking CTA + widget at
 * all — without this check, every Doctra-linked doctor shows the widget
 * even when Doctra has zero slots for them, leading patients into an
 * empty calendar.
 *
 * Failures (network, Doctra down) return `true` to fail open — a brief
 * Doctra outage shouldn't hide every booking button site-wide. The
 * patient will see the empty-calendar state in that case, which is still
 * better than silently removing the CTA.
 */
export async function hasUpcomingAvailability(
  departmentId: string,
  doctorId: string,
  daysAhead = 14,
): Promise<boolean> {
  if (!departmentId || !doctorId) return false;
  try {
    const today = new Date();
    const dateBegin = today.toISOString().split("T")[0];
    const end = new Date(today);
    end.setDate(end.getDate() + daysAhead);
    const dateEnd = end.toISOString().split("T")[0];
    const slots = await getTimeSlots(departmentId, dateBegin, dateEnd);
    return slots.some(
      (s) => s.doctor_id === doctorId && s.slot_type === "available",
    );
  } catch {
    // Network / Doctra blip — fail open so the CTA stays visible.
    return true;
  }
}

/** Submit a booking (booking_without_otac) */
export async function submitBooking(params: {
  doctorId: string;
  dateBegin: string; // format: "202604281300" (yyyyMMddHHmm)
  patientId: string; // ID number
  patientName: string;
  patientSurname: string;
  patientTel: string;
  patientEmail?: string;
  nonResident?: boolean; // true = foreign patient (passport). Matches the live
  // booking2 form's `non_resident` select (False=resident / True=non-resident).
}): Promise<{ status: number; error_text: string }> {
  return doctraFetch("booking_without_otac", {
    doctor_id: params.doctorId,
    date_begin: params.dateBegin,
    order_id: "",
    cancelation: false,
    patient_id: params.patientId,
    patient_name: params.patientName,
    patient_surname: params.patientSurname,
    patient_date_of_birth: "",
    patient_tel: params.patientTel,
    patient_email: params.patientEmail || "",
    patient_sex: "",
    non_resident: params.nonResident ?? false,
  });
}
