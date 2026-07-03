/**
 * Flat list of bookable doctors, sourced from Payload.
 *
 * The booking page itself no longer calls this — it pre-loads doctors at
 * SSR via getBookingDoctorsFromPayload(). This endpoint exists for
 * DoctorMiniBooking, which needs to fuzzy-match a profile-page doctor
 * against the Doctra operator catalogue when the admin hasn't explicitly
 * linked them via `doctraId`.
 *
 * Postgres query, ~50ms. No Doctra round-trip.
 */
import { NextRequest, NextResponse } from "next/server";
import { getBookingDoctorsFromPayload } from "@/lib/payload-data";

type Locale = "ge" | "en" | "ru";

export async function GET(request: NextRequest) {
  const lang = (request.nextUrl.searchParams.get("lang") || "ge") as Locale;

  try {
    const doctors = await getBookingDoctorsFromPayload(lang);
    return NextResponse.json({ doctors });
  } catch (err) {
    console.error("all-doctors failed:", err);
    return NextResponse.json({ doctors: [] }, { status: 200 });
  }
}
