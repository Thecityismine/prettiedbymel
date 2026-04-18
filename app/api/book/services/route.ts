import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  const db = getAdminDb();
  const snap = await db.collection("settings").doc("pricing").get();
  if (!snap.exists) {
    // Return defaults if not set up yet
    const { defaultServices } = await import("@/lib/defaultServices");
    return NextResponse.json({ services: defaultServices });
  }
  return NextResponse.json({ services: snap.data()?.services ?? [] });
}
