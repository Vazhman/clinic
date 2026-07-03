import { NextRequest, NextResponse } from "next/server";
import { tokenWithOtp } from "@/lib/patient-room/doctra";
import {
  CAPTCHA_COOKIE,
  SESSION_COOKIE,
  cookieOpts,
  seal,
  unseal,
  type CaptchaState,
  type PortalSession,
} from "@/lib/patient-room/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Step 1: validate captcha (server-side), then ask Doctra to issue a token +
// send the SMS OTP. Stores an un-authed session (authed:false) with the token.
export async function POST(req: NextRequest) {
  let body: { userId?: string; securityCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 2, error_text: "Bad request" }, { status: 400 });
  }

  const userId = (body.userId || "").trim();
  const securityCode = (body.securityCode || "").trim();

  // Georgian personal number (11 digits) OR a passport number (alphanumeric)
  // for foreign patients — accept both, just sanity-check length/charset.
  if (!/^[A-Za-z0-9]{4,20}$/.test(userId)) {
    return NextResponse.json({ status: 2, error_text: "invalid_id" });
  }

  // Captcha check (case-insensitive), mirrors $_SESSION['captcha'].
  const captcha = unseal<CaptchaState>(req.cookies.get(CAPTCHA_COOKIE)?.value);
  if (!captcha || captcha.exp < Date.now() || captcha.code.toUpperCase() !== securityCode.toUpperCase()) {
    return NextResponse.json({ status: 4, error_text: "captcha" });
  }

  let result;
  try {
    result = await tokenWithOtp(userId, securityCode);
  } catch {
    return NextResponse.json({ status: 1, error_text: "network" }, { status: 502 });
  }

  if (result.status > 0 || !result.token) {
    return NextResponse.json({ status: result.status || 1, error_text: result.error_text || "auth_failed" });
  }

  const ttlMin = result.token_active_time && result.token_active_time > 0 ? result.token_active_time : 60;
  const session: PortalSession = {
    token: result.token,
    userId,
    authed: false,
    exp: Date.now() + ttlMin * 60_000,
  };

  const res = NextResponse.json({ status: 0 });
  res.cookies.set(SESSION_COOKIE, seal(session), { ...cookieOpts, maxAge: ttlMin * 60 });
  // burn the captcha so it can't be replayed
  res.cookies.set(CAPTCHA_COOKIE, "", { ...cookieOpts, maxAge: 0 });
  return res;
}
