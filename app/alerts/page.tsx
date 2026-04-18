"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, RefreshCw } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getClients } from "@/lib/clientsDb";
import { getAppointments } from "@/lib/appointmentsDb";
import { computeAlerts, alertMeta } from "@/lib/alerts";
import type { Alert } from "@/lib/alerts";

const typeLabels: Record<Alert["type"], string> = {
  appointment_today: "Today",
  appointment_soon: "Tomorrow",
  deposit_missing: "Missing Deposit",
  overdue_client: "Overdue Client",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [clients, appointments] = await Promise.all([getClients(), getAppointments()]);
      setAlerts(computeAlerts(clients, appointments));
    } catch {
      // show empty alerts on error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, []);

  async function requestNotifications() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === "granted") {
      new Notification("Prettied by Mel", {
        body: "You'll now get reminders for appointments and overdue clients!",
        icon: "/icons/icon-192.svg",
      });
    }
  }

  const grouped = {
    appointment_today: alerts.filter((a) => a.type === "appointment_today"),
    appointment_soon: alerts.filter((a) => a.type === "appointment_soon"),
    deposit_missing: alerts.filter((a) => a.type === "deposit_missing"),
    overdue_client: alerts.filter((a) => a.type === "overdue_client"),
  } as Record<Alert["type"], Alert[]>;

  const order: Alert["type"][] = ["appointment_today", "appointment_soon", "deposit_missing", "overdue_client"];

  return (
    <div className="min-h-screen max-w-lg mx-auto w-full">
      <PageHeader
        title="Alerts"
        showBack={false}
        action={
          <button onClick={load} className="text-zinc-500 hover:text-white p-2 transition-colors">
            <RefreshCw size={18} />
          </button>
        }
      />

      <div className="px-5 pb-6 space-y-5">
        {/* Push notification opt-in */}
        {notifPermission === "default" && (
          <button
            onClick={requestNotifications}
            className="w-full flex items-center gap-3 bg-[var(--color-pink)]/10 border border-[var(--color-pink)]/20 rounded-2xl px-4 py-3 text-left hover:border-[var(--color-pink)]/40 transition-colors"
          >
            <Bell size={20} className="text-[var(--color-pink)] shrink-0" />
            <div>
              <p className="text-white text-sm font-semibold">Enable notifications</p>
              <p className="text-zinc-400 text-xs">Get reminders even when the app is closed</p>
            </div>
          </button>
        )}
        {notifPermission === "granted" && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
            <span className="text-emerald-400 text-sm">✓</span>
            <p className="text-emerald-400 text-sm font-medium">Notifications enabled</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--color-pink)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">✨</p>
            <p className="text-white font-semibold mb-1">All clear!</p>
            <p className="text-zinc-400 text-sm">No alerts right now. You're on top of it.</p>
          </div>
        ) : (
          order.map((type) => {
            const group = grouped[type];
            if (!group.length) return null;
            const meta = alertMeta[type];
            return (
              <div key={type}>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                  {typeLabels[type]} ({group.length})
                </p>
                <div className="space-y-2">
                  {group.map((alert) => (
                    <Link key={alert.id} href={alert.href}>
                      <div className="flex items-start gap-3 bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-pink)] rounded-2xl px-4 py-3.5 transition-all duration-200 active:scale-[0.98]">
                        <span className="text-xl shrink-0 mt-0.5">{meta.emoji}</span>
                        <div>
                          <p className={`text-sm font-semibold ${meta.color}`}>{alert.title}</p>
                          <p className="text-zinc-400 text-xs mt-0.5">{alert.body}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
