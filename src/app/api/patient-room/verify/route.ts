import { NextRequest, NextResponse } from "next/server";
import { confirmOtp, getPatientInfo } from "@/lib/patient-room/doctra";
import {
  SESSION_COOKIE,
  cookieOpts,
  readSession,
  seal,
  type PortalSession,
} from "@/lib/patient-room/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Step 2: confirm the SMS OTP, then resolve the internal patient_id and mark
// the session authenticated.
export async function POST(req: NextRequest) {
  let body: { otp?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 2, error_text: "Bad request" }, { status: 400 });
  }

  const session = readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ status: 9, error_text: "session_expired" });

  const otp = (body.otp || "").trim();
  if (!/^\d{3,8}$/.test(otp)) return NextResponse.json({ status: 21, error_text: "invalid_otp" });

  let confirm;
  try {
    confirm = await confirmOtp(session.userId, session.token, otp);
  } catch {
    return NextResponse.json({ status: 1, error_text: "network" }, { status: 502 });
  }
  if (confirm.status > 0) {
    return NextResponse.json({ status: confirm.status, error_text: confirm.error_text || "incorrect_otp" });
  }

  // Resolve internal patient_id (needed by get_orders).
  let patientId: string | undefined;
  try {
    const info = await getPatientInfo(session.token, session.userId, false);
    patientId = info.patient?.patient_id || session.userId;
  } catch {
    patientId = session.userId;
  }

  const updated: PortalSession = { ...session, patientId, authed: true };
  const res = NextResponse.json({ status: 0 });
  const maxAge = Math.max(60, Math.floor((session.exp - Date.now()) / 1000));
  res.cookies.set(SESSION_COOKIE, seal(updated), { ...cookieOpts, maxAge });
  return res;
}
