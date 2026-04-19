import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  const { serviceId, serviceName, price, duration, date, time, clientName, phone, clientFirebaseUid, paymentMethod } =
    await request.json();

  if (!serviceId || !serviceName || !date || !time || !clientName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getAdminDb();
  const method = paymentMethod ?? "card";

  const appointmentData = {
    clientId: clientFirebaseUid ?? "walk-in",
    clientName,
    serviceId,
    serviceName,
    price,
    duration,
    date,
    time,
    depositPaid: false,
    status: "upcoming",
    notes: phone
      ? `📱 Self-booked · ${method !== "card" ? `Payment: ${method} (pending)` : `Phone: ${phone}`}`
      : `📱 Self-booked${method !== "card" ? ` · Payment: ${method} (pending)` : ""}`,
    createdAt: new Date().toISOString(),
    source: "public-booking",
    depositMethod: method,
  };

  const ref = await db.collection("appointments").add(appointmentData);

  // Return appointment ID — client redirects to static Stripe payment link
  return NextResponse.json({ appointmentId: ref.id });
}
