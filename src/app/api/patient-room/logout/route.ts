import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, CAPTCHA_COOKIE, cookieOpts } from "@/lib/patient-room/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clear(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOpts, maxAge: 0 });
  res.cookies.set(CAPTCHA_COOKIE, "", { ...cookieOpts, maxAge: 0 });
  return res;
}

export async function POST() {
  return clear(NextResponse.json({ status: 0 }));
}

export async function GET(req: NextRequest) {
  const url = new URL("/", req.url);
  return clear(NextResponse.redirect(url));
}
