import type { Metadata } from "next";
import { cookies } from "next/headers";
import PatientRoomClient, { type RoomData } from "@/components/patient-room/PatientRoomClient";
import PatientRoomLogin from "@/components/patient-room/PatientRoomLogin";
import { SESSION_COOKIE, readSession } from "@/lib/patient-room/session";
import { getPatientInfo, getOrders } from "@/lib/patient-room/doctra";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = { ge: "ჩემი ოთახი", en: "My Room", ru: "Мой кабинет" };
  return { title: titles[locale] || titles.ge, robots: { index: false, follow: false } };
}

export default async function PatientRoomPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = (["ge", "en", "ru"].includes(locale) ? locale : "ge") as "ge" | "en" | "ru";

  const session = readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || !session.authed) {
    return <PatientRoomLogin locale={loc} />;
  }

  // Fetch profile + lab orders server-side with the patient's OTP token.
  const [info, orders] = await Promise.all([
    getPatientInfo(session.token, session.userId, false),
    session.patientId
      ? getOrders(session.token, session.patientId, { withFiles: false })
      : Promise.resolve({ status: 0, orders: [] as never[] }),
  ]);

  // Token expired / revoked mid-session → back to login.
  if (info.status > 0 || !info.patient) {
    return <PatientRoomLogin locale={loc} />;
  }

  const p = info.patient;
  const data: RoomData = {
    profile: {
      fullName: p.full_name || [p.name, p.surname].filter(Boolean).join(" ") || "—",
      name: p.name || "",
      surname: p.surname || "",
      personalId: p.id || session.userId,
      phone: p.tel || "",
      email: p.email || "",
      sex: (p.sex || "").toLowerCase(),
      dob: p.date_of_birth ? p.date_of_birth.slice(0, 10) : "",
      bloodGroup: p.blood_group || "",
      rhesus: (p.rhesus_factor || "").toLowerCase(),
    },
    orders: (orders.orders || [])
      .filter((o) => o && o.confirmed === true)
      .map((o) => ({
        id: String(o.id ?? o.order_id ?? ""),
        date: o.order_date ? o.order_date.slice(0, 10) : "",
        name: o.service_name || "—",
      }))
      .filter((o) => o.id),
  };

  return <PatientRoomClient locale={loc} data={data} />;
}
