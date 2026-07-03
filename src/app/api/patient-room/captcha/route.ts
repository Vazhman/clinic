import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { CAPTCHA_COOKIE, cookieOpts, seal, type CaptchaState } from "@/lib/patient-room/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Unambiguous character set (no 0/O, 1/I/L).
const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const W = 150;
const H = 54;

function rint(max: number) {
  return crypto.randomInt(0, max);
}

function buildSvg(code: string): string {
  const colors = ["#682149", "#8A3A6B", "#DD64A6", "#4a1735"];
  let glyphs = "";
  const step = (W - 24) / code.length;
  for (let i = 0; i < code.length; i++) {
    const x = 14 + i * step + rint(6) - 3;
    const y = H / 2 + 9 + rint(8) - 4;
    const rot = rint(40) - 20;
    const col = colors[rint(colors.length)];
    glyphs += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="Georgia, serif" font-size="30" font-weight="700" fill="${col}" transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})">${code[i]}</text>`;
  }
  let noise = "";
  for (let i = 0; i < 5; i++) {
    noise += `<line x1="${rint(W)}" y1="${rint(H)}" x2="${rint(W)}" y2="${rint(H)}" stroke="rgba(104,33,73,0.18)" stroke-width="1.5"/>`;
  }
  for (let i = 0; i < 22; i++) {
    noise += `<circle cx="${rint(W)}" cy="${rint(H)}" r="1" fill="rgba(221,100,166,0.35)"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#fff"/>${noise}${glyphs}</svg>`;
}

export async function GET() {
  let code = "";
  for (let i = 0; i < 5; i++) code += CHARS[rint(CHARS.length)];

  const state: CaptchaState = { code, exp: Date.now() + 5 * 60_000 };
  const res = new NextResponse(buildSvg(code), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
  res.cookies.set(CAPTCHA_COOKIE, seal(state), { ...cookieOpts, maxAge: 5 * 60 });
  return res;
}
