import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getStripe, DEPOSIT_AMOUNT_CENTS } from "@/lib/stripe";

export async function POST(request: Request) {
  const { serviceId, serviceName, price, duration, date, time, clientName, phone, clientFirebaseUid } =
    await request.json();

  if (!serviceId || !serviceName || !date || !time || !clientName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getAdminDb();

  // Create appointment (depositPaid: false until Stripe webhook confirms)
  const ref = await db.collection("appointments").add({
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
    notes: phone ? `📱 Self-booked · Phone: ${phone}` : "📱 Self-booked",
    createdAt: new Date().toISOString(),
    source: "public-booking",
  });

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
    cancel_url: `${baseUrl}/book`,
    customer_email: undefined,
    phone_number_collection: { enabled: false },
  });

  return NextResponse.json({ url: session.url });
}
