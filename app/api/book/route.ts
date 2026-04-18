import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getStripe, DEPOSIT_AMOUNT_CENTS } from "@/lib/stripe";

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

  // CashApp / Zelle — no Stripe, return success immediately
  if (method === "cashapp" || method === "zelle") {
    return NextResponse.json({ success: true, appointmentId: ref.id });
  }

  // Card — create Stripe checkout session
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: DEPOSIT_AMOUNT_CENTS,
          product_data: {
            name: "Appointment Deposit – Prettied by Mel",
            description: `${serviceName} · ${date} at ${time}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { appointmentId: ref.id },
    success_url: `${baseUrl}/book/success`,
    cancel_url: `${baseUrl}/`,
    customer_email: undefined,
    phone_number_collection: { enabled: false },
  });

  return NextResponse.json({ url: session.url });
}
