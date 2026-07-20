/**
 * Sitewide search backing the header search box (Header.tsx →
 * HeaderSearch.tsx). Fans out across pages/news/services/doctors via
 * searchSite() in payload-data.ts.
 */
import { NextRequest, NextResponse } from "next/server";
import { searchSite } from "@/lib/payload-data";

type Locale = "ge" | "en" | "ru";
const LOCALES: Locale[] = ["ge", "en", "ru"];

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const localeParam = request.nextUrl.searchParams.get("locale");
  const locale = (LOCALES as string[]).includes(localeParam ?? "") ? (localeParam as Locale) : "ge";

  try {
    const results = await searchSite(locale, q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("search failed:", err);
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
