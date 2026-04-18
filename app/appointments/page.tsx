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
import { loadAvailability, formatSlot } from "@/lib/availabilityDb";
import type { Appointment } from "@/lib/types";
import type { Availability } from "@/lib/availabilityDb";

type Tab = "upcoming" | "history";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [avail, setAvail] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAppointments(), loadAvailability()]).then(([a, av]) => {
      setAppointments(a);
      setAvail(av);
    }).finally(() => setLoading(false));
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
            <p className="text-sm font-semibold text-white">{formatApptDate(selectedDate)}</p>
            <button onClick={() => setSelectedDate(null)} className="text-xs text-zinc-500 hover:text-white transition-colors">
              ✕ Clear
            </button>
          </div>
        )}

        {/* Day timeline when a date is tapped */}
        {selectedDate && !loading && avail && (
          <DayTimeline date={selectedDate} appointments={appointments} avail={avail} />
        )}

        {/* List (only when no date selected) */}
        {!selectedDate && loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-3.5 bg-zinc-800 rounded-full w-1/3" />
                  <div className="h-5 bg-zinc-800 rounded-full w-16" />
                </div>
                <div className="h-3 bg-zinc-800 rounded-full w-2/5 mb-3" />
                <div className="flex gap-4">
                  <div className="h-2.5 bg-zinc-800 rounded-full w-20" />
                  <div className="h-2.5 bg-zinc-800 rounded-full w-14" />
                </div>
              </div>
            ))}
          </div>
        ) : !selectedDate && filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-zinc-400 text-sm">
              {tab === "upcoming" ? "No upcoming appointments" : "No past appointments"}
            </p>
          </div>
        ) : !selectedDate ? (
          <div className="space-y-2">
            {filtered.map((appt) => (
              <ApptCard key={appt.id} appt={appt} />
            ))}
          </div>
        ) : null}
      </div>

      {/* FAB */}
      <Link
        href="/appointments/new"
        className="fixed bottom-20 right-5 w-14 h-14 bg-[var(--color-pink)] rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(255,26,173,0.35)] hover:bg-[var(--color-pink-dark)] hover:shadow-[0_0_18px_rgba(255,26,173,0.5)] transition-all duration-300 z-40 animate-[fab-pulse_3s_ease-in-out_infinite]"
      >
        <Plus size={24} className="text-white" />
      </Link>
    </div>
  );
}

function DayTimeline({
  date, appointments, avail,
}: {
  date: string; appointments: Appointment[]; avail: Availability;
}) {
  const onDate = appointments.filter((a) => a.date === date && a.status === "upcoming");

  const hours: number[] = [];
  for (let h = avail.startHour; h <= avail.endHour; h++) hours.push(h);

  function apptAtHour(h: number) {
    return onDate.filter((a) => {
      const [ah] = a.time.split(":").map(Number);
      return ah === h;
    });
  }

  if (hours.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500 text-sm">Day off — no availability set.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {hours.map((h) => {
        const appts = apptAtHour(h);
        const isWork = avail.workDays.includes(new Date(date + "T12:00:00").getDay())
          && !avail.daysOff.includes(date)
          && h >= avail.startHour
          && h < avail.endHour;

        return (
          <div key={h} className="flex gap-3 items-start min-h-[44px]">
            <span className="text-xs text-zinc-600 w-12 pt-2 shrink-0 text-right">
              {formatSlot(`${String(h).padStart(2, "0")}:00`)}
            </span>
            <div className="flex-1 border-t border-zinc-800 pt-2">
              {appts.length > 0 ? (
                appts.map((a) => (
                  <Link key={a.id} href={`/appointments/${a.id}`}>
                    <div className="bg-[var(--color-pink)]/15 border border-[var(--color-pink)]/30 rounded-xl px-3 py-2 mb-1 hover:border-[var(--color-pink)] transition-colors">
                      <p className="text-white text-xs font-semibold">{a.clientName}</p>
                      <p className="text-[var(--color-pink)] text-xs">{a.serviceName} · {formatApptTime(a.time)}</p>
                    </div>
                  </Link>
                ))
              ) : isWork ? (
                <p className="text-zinc-800 text-xs pt-1">available</p>
              ) : null}
            </div>
          </div>
        );
      })}
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
