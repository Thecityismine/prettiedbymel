import { NextResponse } from "next/server";
import { getStripe, DEPOSIT_AMOUNT_CENTS } from "@/lib/stripe";

export async function POST(request: Request) {
  const { appointmentId, clientName, serviceName, appointmentDate } = await request.json();

  if (!appointmentId || !clientName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: DEPOSIT_AMOUNT_CENTS,
          product_data: {
            name: `Nail Appointment Deposit`,
            description: `${serviceName} for ${clientName}${appointmentDate ? ` on ${appointmentDate}` : ""}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { appointmentId },
    success_url: `${baseUrl}/appointments/${appointmentId}?paid=true`,
    cancel_url: `${baseUrl}/appointments/${appointmentId}`,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
