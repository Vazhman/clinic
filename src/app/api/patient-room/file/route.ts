import { NextRequest, NextResponse } from "next/server";
import { getOrders } from "@/lib/patient-room/doctra";
import { SESSION_COOKIE, readSession } from "@/lib/patient-room/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the lab-result PDF for one order. The Doctra files are generated
// on demand, so when they're not ready yet we answer 202 {ready:false} and the
// client retries (mirrors the reference lab.php polling loop).
export async function GET(req: NextRequest) {
  const session = readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || !session.authed || !session.patientId) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  const orderId = new URL(req.url).searchParams.get("orderId") || "";
  if (!orderId) return NextResponse.json({ error: "missing_order" }, { status: 400 });

  let result;
  try {
    result = await getOrders(session.token, session.patientId, { withFiles: true, orderId });
  } catch {
    return NextResponse.json({ error: "network" }, { status: 502 });
  }

  const order = result.orders?.[0];
  const file = order?.files?.[0];
  const data = file?.data;

  if (!data || data.length < 100) {
    return NextResponse.json({ ready: false }, { status: 202 });
  }

  const pdf = Buffer.from(data, "base64");
  const rawName = (order?.service_name || "lab-result").replace(/[\\/:*?"<>|]+/g, "_").trim();
  const asciiName = rawName.replace(/[^\x20-\x7E]/g, "_") || "lab-result";
  const utf8Name = encodeURIComponent(`${rawName}.pdf`);

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiName}.pdf"; filename*=UTF-8''${utf8Name}`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "no-store",
    },
  });
}
