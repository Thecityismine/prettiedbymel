import type { Client, Appointment } from "./types";

export type AlertSeverity = "warning" | "info" | "error";

export interface Alert {
  id: string;
  type: "overdue_client" | "appointment_soon" | "deposit_missing" | "appointment_today";
  severity: AlertSeverity;
  title: string;
  body: string;
  href: string;
}

export function computeAlerts(clients: Client[], appointments: Appointment[]): Alert[] {
  const alerts: Alert[] = [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  // Overdue clients (no visit in 6+ weeks)
  for (const c of clients) {
    if (!c.lastVisit) continue;
    const weeks = Math.floor((Date.now() - new Date(c.lastVisit).getTime()) / (1000 * 60 * 60 * 24 * 7));
    if (weeks >= 6) {
      alerts.push({
        id: `overdue-${c.id}`,
        type: "overdue_client",
        severity: "warning",
        title: `${c.name} is overdue`,
        body: `Last visit ${weeks} weeks ago${c.lastService ? ` · ${c.lastService}` : ""}`,
        href: `/clients/${c.id}`,
      });
    }
  }

  const upcoming = appointments.filter((a) => a.status === "upcoming");

  // Today's appointments
  for (const a of upcoming.filter((a) => a.date === todayStr)) {
    alerts.push({
      id: `today-${a.id}`,
      type: "appointment_today",
      severity: "info",
      title: `Today: ${a.clientName}`,
      body: `${a.serviceName} · $${a.price} — check deposit status`,
      href: `/appointments/${a.id}`,
    });
  }

  // Tomorrow's appointments (24hr reminder)
  for (const a of upcoming.filter((a) => a.date === tomorrowStr)) {
    alerts.push({
      id: `soon-${a.id}`,
      type: "appointment_soon",
      severity: "info",
      title: `Tomorrow: ${a.clientName}`,
      body: `${a.serviceName} · $${a.price}`,
      href: `/appointments/${a.id}`,
    });
  }

  // Missing deposits on upcoming appointments (next 14 days)
  const cutoff = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
  for (const a of upcoming.filter((a) => !a.depositPaid && a.date >= todayStr && a.date <= cutoff)) {
    if (alerts.find((al) => al.id === `today-${a.id}` || al.id === `soon-${a.id}`)) continue;
    alerts.push({
      id: `deposit-${a.id}`,
      type: "deposit_missing",
      severity: "error",
      title: `No deposit — ${a.clientName}`,
      body: `${a.serviceName} on ${new Date(a.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      href: `/appointments/${a.id}`,
    });
  }

  return alerts;
}

export const alertMeta: Record<Alert["type"], { emoji: string; color: string }> = {
  overdue_client: { emoji: "⏰", color: "text-yellow-400" },
  appointment_today: { emoji: "📅", color: "text-[var(--color-pink)]" },
  appointment_soon: { emoji: "🔔", color: "text-blue-400" },
  deposit_missing: { emoji: "💳", color: "text-red-400" },
};
