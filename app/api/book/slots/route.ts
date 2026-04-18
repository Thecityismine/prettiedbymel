import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getAvailableSlots, defaultAvailability } from "@/lib/availabilityDb";
import type { Availability } from "@/lib/availabilityDb";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const duration = parseInt(searchParams.get("duration") ?? "60");

  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const db = getAdminDb();

  const [availSnap, apptsSnap] = await Promise.all([
    db.collection("settings").doc("availability").get(),
    db.collection("appointments").where("date", "==", date).where("status", "==", "upcoming").get(),
  ]);

  const avail: Availability = availSnap.exists ? (availSnap.data() as Availability) : defaultAvailability;

  const booked = apptsSnap.docs.map((d) => ({
    date: d.data().date as string,
    time: d.data().time as string,
    duration: d.data().duration as number | undefined,
  }));

  const slots = getAvailableSlots(date, avail, booked);

  // Filter slots that have enough room for this service duration
  const filtered = slots.filter((slot) => {
    const [h, m] = slot.split(":").map(Number);
    const slotEndMin = h * 60 + m + duration;
    const endMin = avail.endHour * 60;
    return slotEndMin <= endMin;
  });

  return NextResponse.json({ slots: filtered });
}
