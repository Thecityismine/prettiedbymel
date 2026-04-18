"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, CalendarDays, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import MiniCalendar from "@/components/MiniCalendar";
import {
  getAppointments,
  formatApptDate,
  formatApptTime,
  isUpcoming,
} from "@/lib/appointmentsDb";
import type { Appointment } from "@/lib/types";

type Tab = "upcoming" | "history";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    getAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  const markedDates = new Set(appointments.map((a) => a.date));

  const todayStr = new Date().toISOString().slice(0, 10);

  const filtered = appointments.filter((a) => {
    if (selectedDate) return a.date === selectedDate;
    if (tab === "upcoming") return a.status === "upcoming" && a.date >= todayStr;
    return a.status === "done" || a.date < todayStr;
  });

  const upcoming = appointments.filter((a) => isUpcoming(a));
  const todayAppts = appointments.filter((a) => a.date === todayStr && a.status === "upcoming");

  return (
    <div className="min-h-screen max-w-lg mx-auto w-full">
      <PageHeader title="Appointments" showBack={false} />

      <div className="px-5 pb-6 space-y-4">
        {/* Today strip */}
        {todayAppts.length > 0 && !selectedDate && tab === "upcoming" && (
          <div className="bg-[var(--color-pink)]/10 border border-[var(--color-pink)]/20 rounded-xl px-4 py-3">
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Today</p>
            <p className="text-white font-semibold text-sm">
              {todayAppts.length} appointment{todayAppts.length > 1 ? "s" : ""} scheduled
            </p>
          </div>
        )}

        {/* Calendar */}
        <MiniCalendar
          markedDates={markedDates}
          selected={selectedDate}
          onSelect={(d) => setSelectedDate(d || null)}
        />

        {/* Tabs (hidden when a date is selected) */}
        {!selectedDate && (
          <div className="flex gap-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-1">
            {(["upcoming", "history"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  tab === t
                    ? "bg-[var(--color-pink)] text-white"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                {t === "upcoming" ? `Upcoming (${upcoming.length})` : "History"}
              </button>
            ))}
          </div>
        )}

        {selectedDate && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              {formatApptDate(selectedDate)}
            </p>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-[var(--color-pink)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-zinc-400 text-sm">
              {selectedDate ? "No appointments on this day" : tab === "upcoming" ? "No upcoming appointments" : "No past appointments"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((appt) => (
              <ApptCard key={appt.id} appt={appt} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/appointments/new"
        className="fixed bottom-20 right-5 w-14 h-14 bg-[var(--color-pink)] rounded-full flex items-center justify-center shadow-[0_0_20px_var(--color-pink-glow)] hover:bg-[var(--color-pink-dark)] transition-colors z-40"
      >
        <Plus size={24} className="text-white" />
      </Link>
    </div>
  );
}

function ApptCard({ appt }: { appt: Appointment }) {
  const statusVariant =
    appt.status === "done" ? "done"
    : appt.status === "cancelled" ? "overdue"
    : "upcoming";

  return (
    <Link href={`/appointments/${appt.id}`}>
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-pink)] rounded-2xl p-4 transition-all duration-200 active:scale-[0.98]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-semibold text-white text-sm">{appt.clientName}</p>
          <Badge variant={statusVariant}>{appt.status}</Badge>
        </div>
        <p className="text-[var(--color-pink)] text-sm font-medium mb-2">
          {appt.serviceName} · <span className="font-bold">${appt.price}</span>
        </p>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <CalendarDays size={11} /> {formatApptDate(appt.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} /> {formatApptTime(appt.time)}
          </span>
          <Badge variant={appt.depositPaid ? "paid" : "unpaid"}>
            {appt.depositPaid ? "Deposit paid" : "No deposit"}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
