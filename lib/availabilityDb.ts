import { restGet, restPatch } from "./firestoreRest";
import { cacheGet, cacheSet } from "./cache";

export interface Availability {
  workDays: number[];   // 0=Sun … 6=Sat
  startHour: number;
  endHour: number;
  slotDuration: number; // minutes
  daysOff: string[];    // ["2026-04-25"]
}

export const defaultAvailability: Availability = {
  workDays: [2, 3, 4, 5, 6], // Tue–Sat
  startHour: 10,
  endHour: 18,
  slotDuration: 30,
  daysOff: [],
};

const KEY = "availability";

export async function loadAvailability(): Promise<Availability> {
  const hit = cacheGet<Availability>(KEY);
  if (hit) {
    if (hit.stale) {
      restGet("settings", "availability")
        .then((d) => { if (d) cacheSet(KEY, d as unknown as Availability); })
        .catch(() => {});
    }
    return hit.data;
  }
  const data = await restGet("settings", "availability");
  const avail = data ? (data as unknown as Availability) : defaultAvailability;
  if (!data) {
    // First run — seed the document
    await restPatch("settings", "availability", defaultAvailability as unknown as Record<string, unknown>);
  }
  cacheSet(KEY, avail);
  return avail;
}

export async function saveAvailability(a: Availability): Promise<void> {
  await restPatch("settings", "availability", a as unknown as Record<string, unknown>);
  cacheSet(KEY, a);
}

// Returns time strings ("10:00", "10:30"…) that are not blocked by existing appointments.
export function getAvailableSlots(
  date: string,
  avail: Availability,
  bookedAppts: { date: string; time: string; duration?: number }[],
): string[] {
  const dayOfWeek = new Date(date + "T12:00:00").getDay();
  if (!avail.workDays.includes(dayOfWeek)) return [];
  if (avail.daysOff.includes(date)) return [];

  const onDate = bookedAppts.filter((a) => a.date === date);

  const slots: string[] = [];
  for (let h = avail.startHour; h < avail.endHour; h++) {
    for (let m = 0; m < 60; m += avail.slotDuration) {
      const slotMin = h * 60 + m;
      const overlaps = onDate.some((a) => {
        const [bh, bm] = a.time.split(":").map(Number);
        const start = bh * 60 + bm;
        const end = start + (a.duration ?? 60);
        return slotMin >= start && slotMin < end;
      });
      if (!overlaps) {
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
  }
  return slots;
}

export function formatSlot(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
