import "server-only";

// Doctra portal_exchange/v1 client for the patient portal.
// Auth header uses an underscore: `Bearer_<token>` (not standard `Bearer `).
// Endpoints (from the clinic's reference PHP):
//   auth/token_with_otp     {user_id, securityCode, hint}            -> {status, token, token_active_time}  (sends SMS OTP)
//   auth/token_confirm_otp  {user_id, token, otp}                    -> {status, error_text}
//   get_patient_info        {patient_id, with_files, ...} + Bearer   -> {status, patient}
//   get_orders              {patient_id, service_type_id:"1", ...}   -> {status, orders[]}

const BASE =
  process.env.DOCTRA_API_URL || "http://31.146.167.162:9090/doctra/hs/portal_exchange/v1";

async function post<T>(
  path: string,
  body: Record<string, unknown>,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer_${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  return (await res.json()) as T;
}

export type DoctraStatus = { status: number; error_text?: string };
export type TokenResult = DoctraStatus & { token?: string; token_active_time?: number };

export type DoctraPatient = {
  id?: string;
  patient_id?: string;
  name?: string;
  surname?: string;
  full_name?: string;
  tel?: string;
  email?: string;
  sex?: string;
  date_of_birth?: string;
  blood_group?: string;
  rhesus_factor?: string;
};
export type PatientInfoResult = DoctraStatus & { patient?: DoctraPatient };

export type DoctraOrderFile = { data?: string; name?: string; extension?: string };
export type DoctraOrder = {
  id?: string;
  order_id?: string;
  order_date?: string;
  service_name?: string;
  confirmed?: boolean;
  files?: DoctraOrderFile[];
};
export type OrdersResult = DoctraStatus & { orders?: DoctraOrder[] };

/** Step 1 — issues a token and (for a real patient) sends the SMS OTP. */
export function tokenWithOtp(userId: string, securityCode: string): Promise<TokenResult> {
  return post<TokenResult>("/auth/token_with_otp", {
    user_id: userId,
    securityCode,
    hint: "",
  });
}

/** Step 2 — confirms the SMS OTP against the issued token. */
export function confirmOtp(userId: string, token: string, otp: string): Promise<DoctraStatus> {
  return post<DoctraStatus>("/auth/token_confirm_otp", { user_id: userId, token, otp });
}

/** patientId here is the typed personal number. */
export function getPatientInfo(
  token: string,
  patientId: string,
  withFiles = false,
): Promise<PatientInfoResult> {
  return post<PatientInfoResult>(
    "/get_patient_info",
    { patient_id: patientId, with_files: withFiles, without_data_of_files: false, hash: "" },
    token,
  );
}

/** internalPatientId is patient.patient_id from get_patient_info. */
export function getOrders(
  token: string,
  internalPatientId: string,
  opts: { withFiles?: boolean; orderId?: string } = {},
): Promise<OrdersResult> {
  const now = new Date();
  const end = `${now.toISOString().slice(0, 10)} 23:59:59`;
  return post<OrdersResult>(
    "/get_orders",
    {
      date_begin: "2021-01-01 00:00:00",
      date_end: end,
      patient_id: internalPatientId,
      order_id: opts.orderId ?? "",
      service_id: "",
      service_type_id: "1",
      with_files: opts.withFiles ?? false,
      hash: "",
    },
    token,
  );
}
