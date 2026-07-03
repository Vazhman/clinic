import { NextRequest, NextResponse } from "next/server";
import { submitBooking } from "@/lib/doctra-api";

/**
 * Booking submission via Doctra REST API (booking_without_otac).
 *
 * Demo kill-switch: when `BOOKING_SUBMIT_DISABLED=true` is set on the
 * environment, this route validates the request shape but skips the
 * actual Doctra call. The frontend still sees `{ success: true }` so
 * the wizard's confirmation screen renders normally — useful for
 * customer demos where we don't want to create real appointments in the
 * clinic's HIS. Unset or set to anything else to re-enable real bookings.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, idNumber, doctorId, date, time, citizenship } = body;

    if (!fullName || !phone || !idNumber || !doctorId || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (process.env.BOOKING_SUBMIT_DISABLED === "true") {
      // Don't log idNumber, phone, fullName — Georgian ID is a government
      // identifier and a real booking flow could log to a shared aggregator.
      // Keep the demo log presentational only.
      const idTail = typeof idNumber === "string" ? idNumber.slice(-4) : "????";
      console.log(
        `[demo] booking submit disabled — doctorId=${doctorId} date=${date} idNumberLast4=${idTail}`,
      );
      return NextResponse.json({ success: true, demo: true });
    }

    // Split full name into first name + surname
    const nameParts = fullName.trim().split(/\s+/);
    const patientName = nameParts[0] || "";
    const patientSurname = nameParts.slice(1).join(" ") || "";

    // Convert ISO datetime "2026-04-28T13:00:00" → compact "202604281300"
    const dateBegin = time
      .replace(/[-T:]/g, "")
      .substring(0, 12); // "20260428130000" → "202604281300"

    const result = await submitBooking({
      doctorId,
      dateBegin,
      patientId: idNumber,
      patientName,
      patientSurname,
      patientTel: phone,
      // Foreign patients (passport) → non_resident=true, mirroring the live
      // booking2 form. citizenship is "True" for foreign, "False" for Georgian.
      nonResident: citizenship === "True",
    });

    if (result.status !== 0) {
      return NextResponse.json(
        { error: "Booking failed", details: result.error_text },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Booking submission failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
