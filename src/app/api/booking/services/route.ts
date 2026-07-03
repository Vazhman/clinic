/**
 * Booking service catalogue, sourced from Payload.
 *
 * The booking page itself no longer calls this — it SSRs services directly
 * from Payload. Endpoint kept as a thin JSON wrapper for any external
 * consumer (e.g. third-party widgets, scripts) that wants the same data.
 *
 * Postgres query, ~50ms.
 */
import { NextResponse } from "next/server";
import { getBookingServicesFromPayload } from "@/lib/payload-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const services = await getBookingServicesFromPayload();
    return NextResponse.json(services);
  } catch (err) {
    console.error("Failed to fetch booking services:", err);
    return NextResponse.json([], { status: 200 });
  }
}
