import { restList, restGet, restPost, restUpdate, restDelete } from "./firestoreRest";
import { cacheGet, cacheSet, cacheInvalidate } from "./cache";
import { updateClient } from "./clientsDb";
import type { Appointment } from "./types";

const KEY = "appointments";

async function fetchAppointments(): Promise<Appointment[]> {
  const docs = await restList("appointments");
  return (docs as unknown as Appointment[]).sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    return d !== 0 ? d : a.time.localeCompare(b.time);
  });
}

export async function getAppointments(): Promise<Appointment[]> {
  const hit = cacheGet<Appointment[]>(KEY);
  if (hit) {
    if (hit.stale) fetchAppointments().then((d) => cacheSet(KEY, d)).catch(() => {});
    return hit.data;
  }
  const data = await fetchAppointments();
  cacheSet(KEY, data);
  return data;
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const data = await restGet("appointments", id);
  if (!data) return null;
  return { id, ...data } as unknown as Appointment;
}

export async function addAppointment(data: Omit<Appointment, "id">): Promise<string> {
  const id = await restPost("appointments", data as unknown as Record<string, unknown>);
  cacheInvalidate(KEY);
  return id;
}

export async function updateAppointment(id: string, data: Partial<Appointment>): Promise<void> {
  await restUpdate("appointments", id, data as Record<string, unknown>);
  cacheInvalidate(KEY);
}

export async function deleteAppointment(id: string): Promise<void> {
  await restDelete("appointments", id);
  cacheInvalidate(KEY);
}

export async function markDone(appt: Appointment): Promise<void> {
  await updateAppointment(appt.id, { status: "done" });
  await updateClient(appt.clientId, {
    lastVisit: appt.date,
    lastService: appt.serviceName,
    totalSpent: (appt.price ?? 0),
  });
}

export async function markNoShow(appt: Appointment): Promise<void> {
  await restUpdate("appointments", appt.id, {
    status: "no-show",
    depositKept: appt.depositPaid,
  });
  cacheInvalidate(KEY);
  const raw = await restGet("clients", appt.clientId);
  if (raw) {
    const current = (raw.noShowCount as number) ?? 0;
    await restUpdate("clients", appt.clientId, { noShowCount: current + 1 });
  }
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
