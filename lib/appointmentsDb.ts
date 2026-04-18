import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { db, authReady } from "./firebase";
import { updateClient } from "./clientsDb";
import type { Appointment } from "./types";

const col = collection(db, "appointments");

export async function getAppointments(): Promise<Appointment[]> {
  await authReady;
  const snap = await getDocs(query(col, orderBy("date"), orderBy("time")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  await authReady;
  const snap = await getDoc(doc(db, "appointments", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Appointment;
}

export async function addAppointment(data: Omit<Appointment, "id">): Promise<string> {
  await authReady;
  const ref = await addDoc(col, data);
  return ref.id;
}

export async function updateAppointment(id: string, data: Partial<Appointment>): Promise<void> {
  await authReady;
  await updateDoc(doc(db, "appointments", id), data);
}

export async function deleteAppointment(id: string): Promise<void> {
  await authReady;
  await deleteDoc(doc(db, "appointments", id));
}

// Mark done and sync last visit back to the client record
export async function markDone(appt: Appointment): Promise<void> {
  await updateAppointment(appt.id, { status: "done" });
  await updateClient(appt.clientId, {
    lastVisit: appt.date,
    lastService: appt.serviceName,
  });
}

export function formatApptDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatApptTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function isUpcoming(appt: Appointment): boolean {
  return appt.status === "upcoming" && appt.date >= new Date().toISOString().slice(0, 10);
}
