"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, CalendarDays, Sparkles, CreditCard, Bell, LogOut } from "lucide-react";
import Card from "@/components/Card";
import { getClients } from "@/lib/clientsDb";
import { getAppointments } from "@/lib/appointmentsDb";
import { computeAlerts } from "@/lib/alerts";
import { signOut } from "@/lib/auth";

const navCards = [
  { href: "/clients",      icon: Users,        label: "Clients",      sub: "Manage your client book" },
  { href: "/appointments", icon: CalendarDays,  label: "Appointments", sub: "View & schedule bookings" },
  { href: "/pricing",      icon: Sparkles,      label: "Pricing",      sub: "Your service menu" },
  { href: "/payments",     icon: CreditCard,    label: "Payments",     sub: "Deposits & invoices" },
];

export default function Home() {
  const [alertCount, setAlertCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");

    Promise.all([getClients(), getAppointments()]).then(([clients, appointments]) => {
      const alerts = computeAlerts(clients, appointments);
      setAlertCount(alerts.length);
      setTodayCount(alerts.filter((a) => a.type === "appointment_today").length);
      // Store for BottomNavClient
      localStorage.setItem("pbm_alert_count", String(alerts.length));
      window.dispatchEvent(new Event("pbm_alerts_updated"));
    });
  }, []);

  return (
    <main className="min-h-screen flex flex-col px-5 pt-14 pb-6 max-w-lg mx-auto w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
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
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[var(--color-pink)] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5 glow-pink">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => signOut()}
            className="text-zinc-600 hover:text-zinc-300 transition-colors p-1"
            title="Sign out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Welcome strip */}
      <div className="rounded-2xl bg-gradient-to-r from-[var(--color-pink)]/20 to-transparent border border-[var(--color-pink)]/20 p-4 mb-6">
        <p className="text-xs text-zinc-400 uppercase tracking-widest mb-0.5">{greeting}</p>
        <p className="text-white font-semibold">
          {todayCount > 0
            ? `You have ${todayCount} appointment${todayCount > 1 ? "s" : ""} today 💅`
            : "Ready to prettify someone? 💅"}
        </p>
      </div>

      {/* Alert strip */}
      {alertCount > 0 && (
        <Link href="/alerts" className="block mb-5">
          <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 hover:border-yellow-500/40 transition-colors">
            <Bell size={15} className="text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-300 font-medium">
              {alertCount} alert{alertCount > 1 ? "s" : ""} need{alertCount === 1 ? "s" : ""} your attention
            </p>
          </div>
        </Link>
      )}

      {/* Nav cards */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {navCards.map(({ href, icon: Icon, label, sub }) => (
          <Link key={href} href={href}>
            <Card className="h-full hover:border-[var(--color-pink)] group">
              <div className="flex flex-col gap-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-pink)]/10 flex items-center justify-center group-hover:bg-[var(--color-pink)]/20 transition-colors">
                  <Icon size={20} className="text-[var(--color-pink)]" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{label}</p>
                  <p className="text-zinc-500 text-xs mt-0.5 leading-snug">{sub}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-center text-zinc-600 text-xs mt-8 tracking-widest uppercase">
        Suffern, NY · Home Based
      </p>
    </main>
  );
}
