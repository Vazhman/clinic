import "server-only";
import crypto from "node:crypto";

// Encrypted, httpOnly cookie session for the patient portal — mirrors the
// PHP $_SESSION['doctra'] / $_SESSION['captcha'] state, but signed + encrypted
// (AES-256-GCM) with a key derived from PAYLOAD_SECRET. No external deps.

export const SESSION_COOKIE = "pr_session";
export const CAPTCHA_COOKIE = "pr_captcha";

export type PortalSession = {
  token: string; // Doctra OTP token (Bearer_<token>)
  userId: string; // the personal number the patient typed
  patientId?: string; // internal patient.patient_id from get_patient_info (for get_orders)
  authed: boolean; // true only after OTP confirmation
  exp: number; // epoch ms
};

export type CaptchaState = { code: string; exp: number };

function key(): Buffer {
  const secret = process.env.PAYLOAD_SECRET || "default-secret-change-me";
  return crypto.createHash("sha256").update(secret).digest(); // 32 bytes
}

export function seal(obj: unknown): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(obj), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function unseal<T>(value: string | undefined | null): T | null {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const enc = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return JSON.parse(dec.toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function readSession(value: string | undefined | null): PortalSession | null {
  const s = unseal<PortalSession>(value);
  if (!s || typeof s.token !== "string" || s.exp < Date.now()) return null;
  return s;
}

// Cookie attributes shared by every Set-Cookie we emit.
export const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
