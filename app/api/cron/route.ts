import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin (server-side only)
function getAdminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

export async function GET(request: Request) {
  // Verify cron secret so only Vercel can call this
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrowStr = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

    const [clientsSnap, apptSnap] = await Promise.all([
      db.collection("clients").get(),
      db.collection("appointments").where("status", "==", "upcoming").get(),
    ]);

    const alerts: Record<string, unknown>[] = [];

    // Overdue clients
    clientsSnap.docs.forEach((doc) => {
      const c = doc.data();
      if (!c.lastVisit) return;
      const weeks = Math.floor((Date.now() - new Date(c.lastVisit).getTime()) / (1000 * 60 * 60 * 24 * 7));
      if (weeks >= 6) {
        alerts.push({ type: "overdue_client", clientId: doc.id, clientName: c.name, weeks });
      }
    });

    // Tomorrow reminders + missing deposits
    apptSnap.docs.forEach((doc) => {
      const a = doc.data();
      if (a.date === tomorrowStr) {
        alerts.push({ type: "appointment_soon", appointmentId: doc.id, clientName: a.clientName, service: a.serviceName });
      }
      if (!a.depositPaid && a.date >= todayStr) {
        alerts.push({ type: "deposit_missing", appointmentId: doc.id, clientName: a.clientName, date: a.date });
      }
    });

    // Write summary to Firestore so the app can read it
    await db.collection("settings").doc("alerts").set({
      alerts,
      generatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, count: alerts.length });
  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
