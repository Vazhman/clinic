import { NextRequest, NextResponse } from "next/server";
import { getTimeSlots } from "@/lib/doctra-api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const operatorId = searchParams.get("operatorId");
  const date = searchParams.get("date");
  const dateBegin = searchParams.get("dateBegin");
  const dateEnd = searchParams.get("dateEnd");
  const summary = searchParams.get("summary") === "1";
  const lang = searchParams.get("lang") || "ge";

  // ── Summary mode: return list of dates that have availability ────────────
  // Used by clients to disable/hide unavailable days in calendar pickers.
  if (summary) {
    if (!branchId || !operatorId || !dateBegin || !dateEnd) {
      return NextResponse.json({ availableDates: [] });
    }

    try {
      // Doctra's date_end is exclusive — bump it forward by one day so the
      // caller's intended end-date is included in the response.
      const dEnd = new Date(dateEnd + "T00:00:00");
      dEnd.setDate(dEnd.getDate() + 1);
      const exclusiveEnd = dEnd.toISOString().split("T")[0];

      const allSlots = await getTimeSlots(branchId, dateBegin, exclusiveEnd);
      const datesWithAvailability = new Set<string>();
      for (const slot of allSlots) {
        if (slot.doctor_id !== operatorId) continue;
        if (slot.slot_type !== "available") continue;
        const datePortion = slot.date_begin.split("T")[0];
        if (datePortion) datesWithAvailability.add(datePortion);
      }

      return NextResponse.json({
        availableDates: Array.from(datesWithAvailability).sort(),
      });
    } catch (err) {
      console.error("Failed to fetch availability summary from Doctra:", err);
      return NextResponse.json({ availableDates: [] });
    }
  }

  // ── Single-day mode: full slot list with header for the chosen date ─────
  if (!branchId || !operatorId || !date) {
    return NextResponse.json({ header: "", slots: [] });
  }

  try {
    // Doctra quirk: a 1-day window (date_end = date + 1) returns ZERO slots
    // even when the doctor has an open schedule that day. We have to ask for
    // at least a 2-day window and filter the response down to the date we
    // actually want. Verified via comparing the summary mode (works on a
    // 2-day window) with the single-day mode (broken on a 1-day window) —
    // both call the same Doctra method, only the date_end differs.
    const endDate = new Date(date + "T00:00:00");
    endDate.setDate(endDate.getDate() + 2);
    const dateEnd = endDate.toISOString().split("T")[0];

    // Doctra returns slots for all doctors in department — filter to the
    // requested doctor AND to the requested date.
    const allSlots = await getTimeSlots(branchId, date, dateEnd);
    const doctorSlots = allSlots.filter(
      (s) => s.doctor_id === operatorId && s.date_begin.startsWith(date),
    );

    // Build a localized header string from the date
    const dateObj = new Date(date + "T00:00:00");
    const dayNamesMap: Record<string, string[]> = {
      ge: ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"],
      en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      ru: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
    };
    const monthNamesMap: Record<string, string[]> = {
      ge: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
      en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    };
    const headerPrefixMap: Record<string, string> = { ge: "ჩაწერის დრო", en: "Appointment time", ru: "Время записи" };
    const dayNames = dayNamesMap[lang] || dayNamesMap.ge;
    const monthNames = monthNamesMap[lang] || monthNamesMap.ge;
    const headerPrefix = headerPrefixMap[lang] || headerPrefixMap.ge;
    const header = `${headerPrefix}: ${dayNames[dateObj.getDay()]} - ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`;

    // Transform to the { time, value, available } shape the frontend expects
    const slots = doctorSlots
      .filter((s) => s.slot_type !== "no_schedule")
      .map((s) => {
        const timeStr = s.date_begin.split("T")[1]?.substring(0, 5) || "";
        return {
          time: timeStr,
          value: s.date_begin,
          available: s.slot_type === "available",
        };
      })
      .sort((a, b) => a.value.localeCompare(b.value));

    return NextResponse.json({ header, slots });
  } catch (err) {
    console.error("Failed to fetch time slots from Doctra:", err);
    // Return safe shape so frontend doesn't crash
    return NextResponse.json({ header: "", slots: [] });
  }
}
