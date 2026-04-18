"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, CalendarDays, Sparkles, CreditCard, Bell, LogOut, Settings, ChevronRight } from "lucide-react";
import { getClients } from "@/lib/clientsDb";
import { getAppointments, formatApptTime, isUpcoming } from "@/lib/appointmentsDb";
import { computeAlerts } from "@/lib/alerts";
import { signOut } from "@/lib/auth";
import type { Appointment } from "@/lib/types";

export default function Dashboard() {
  const [alertCount, setAlertCount] = useState(0);
  const [greeting, setGreeting] = useState("Good day");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");

    Promise.all([getClients(), getAppointments()]).then(([clients, appts]) => {
      setAppointments(appts);
      const alerts = computeAlerts(clients, appts);
      setAlertCount(alerts.length);
      localStorage.setItem("pbm_alert_count", String(alerts.length));
      window.dispatchEvent(new Event("pbm_alerts_updated"));
    }).finally(() => setLoading(false));
  }, []);

  const todayAppts = appointments.filter((a) => a.date === todayStr && a.status === "upcoming")
    .sort((a, b) => a.time.localeCompare(b.time));
  const todayRevenue = todayAppts.reduce((sum, a) => sum + (a.price ?? 0), 0);
  const nextAppt = todayAppts[0];
  const upcomingCount = appointments.filter((a) => isUpcoming(a)).length;

  return (
    <main className="min-h-screen flex flex-col px-5 pt-12 pb-6 max-w-lg mx-auto w-full">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-4xl font-black text-white tracking-widest uppercase leading-none">
            NAILS
          </h1>
          <p className="font-dancing text-2xl text-[var(--color-pink)] text-glow-pink leading-tight">
            prettiedbymel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/alerts" className="relative text-zinc-500 hover:text-white transition-colors p-1">
            <Bell size={24} />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[var(--color-pink)] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </Link>
          <button onClick={() => signOut()} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Today Snapshot */}
      <div className="rounded-2xl bg-gradient-to-br from-[var(--color-pink)]/15 via-[var(--color-pink)]/5 to-transparent border border-[var(--color-pink)]/20 p-5 mb-5 shadow-[0_4px_32px_rgba(255,26,173,0.06)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{greeting}</p>
            <p className="text-white font-semibold text-sm mt-0.5">Here's your day 💅</p>
          </div>
          {alertCount > 0 && (
            <Link href="/alerts">
              <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2.5 py-1.5">
                <Bell size={11} className="text-yellow-400" />
                <span className="text-yellow-300 text-[10px] font-semibold">{alertCount} alert{alertCount > 1 ? "s" : ""}</span>
              </div>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-black/20 rounded-xl p-3">
            <p className="text-[var(--color-pink)] font-black text-2xl leading-none">
              {loading ? "—" : todayAppts.length}
            </p>
            <p className="text-zinc-500 text-[10px] uppercase tracking-wide mt-1">Today</p>
          </div>
          <div className="bg-black/20 rounded-xl p-3">
            <p className="text-[var(--color-pink)] font-black text-2xl leading-none">
              {loading ? "—" : `$${todayRevenue}`}
            </p>
            <p className="text-zinc-500 text-[10px] uppercase tracking-wide mt-1">Revenue</p>
          </div>
          <div className="bg-black/20 rounded-xl p-3">
            <p className="text-white font-black text-lg leading-none truncate">
              {loading ? "—" : nextAppt ? formatApptTime(nextAppt.time) : "Free"}
            </p>
            <p className="text-zinc-500 text-[10px] uppercase tracking-wide mt-1 truncate">
              {loading ? "" : nextAppt ? nextAppt.clientName.split(" ")[0] : "No bookings"}
            </p>
          </div>
        </div>
      </div>

      {/* Featured — Appointments */}
      <Link href="/appointments" className="block mb-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--color-pink)]/15 to-transparent border border-[var(--color-pink)]/25 hover:border-[var(--color-pink)]/60 p-5 transition-all duration-200 active:scale-[0.98] group shadow-[0_4px_20px_rgba(255,26,173,0.07)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[var(--color-pink)]/15 flex items-center justify-center group-hover:bg-[var(--color-pink)]/25 transition-colors">
                <CalendarDays size={22} className="text-[var(--color-pink)]" />
              </div>
              <div>
                <p className="font-bold text-white text-base tracking-wide">Appointments</p>
                <p className="text-zinc-500 text-xs mt-0.5">View & schedule bookings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-black text-[var(--color-pink)] leading-none">{upcomingCount}</p>
                <p className="text-zinc-600 text-[10px] uppercase tracking-wide">upcoming</p>
              </div>
              <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
          </div>
        </div>
      </Link>

      {/* Secondary cards grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {[
          { href: "/clients",      icon: Users,     label: "Clients",      sub: "Your client book" },
          { href: "/pricing",      icon: Sparkles,  label: "Pricing",      sub: "Your service menu" },
          { href: "/payments",     icon: CreditCard, label: "Payments",    sub: "Deposits & invoices" },
          { href: "/settings",     icon: Settings,  label: "Availability", sub: "Hours & booking link" },
        ].map(({ href, icon: Icon, label, sub }) => (
          <Link key={href} href={href}>
            <div className="h-full rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-zinc-600 p-4 transition-all duration-200 active:scale-[0.97] group shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
              <div className="flex flex-col gap-3 h-full">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                  <Icon size={18} className="text-zinc-300" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm tracking-wide">{label}</p>
                  <p className="text-zinc-600 text-xs mt-0.5 leading-snug">{sub}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-zinc-700 text-[10px] mt-6 tracking-widest uppercase">
        Suffern, NY · Home Based
      </p>
    </main>
  );
}
