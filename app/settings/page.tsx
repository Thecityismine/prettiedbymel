"use client";

import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Button from "@/components/Button";
import { loadAvailability, saveAvailability, defaultAvailability } from "@/lib/availabilityDb";
import type { Availability } from "@/lib/availabilityDb";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function fmtHour(h: number) {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export default function SettingsPage() {
  const [avail, setAvail] = useState<Availability>(defaultAvailability);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newDayOff, setNewDayOff] = useState("");

  useEffect(() => {
    loadAvailability().then((a) => { setAvail(a); setLoading(false); });
  }, []);

  function toggleDay(day: number) {
    setAvail((a) => ({
      ...a,
      workDays: a.workDays.includes(day)
        ? a.workDays.filter((d) => d !== day)
        : [...a.workDays, day].sort(),
    }));
  }

  function addDayOff() {
    if (!newDayOff || avail.daysOff.includes(newDayOff)) return;
    setAvail((a) => ({ ...a, daysOff: [...a.daysOff, newDayOff].sort() }));
    setNewDayOff("");
  }

  function removeDayOff(d: string) {
    setAvail((a) => ({ ...a, daysOff: a.daysOff.filter((x) => x !== d) }));
  }

  async function handleSave() {
    setSaving(true);
    await saveAvailability(avail);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-pink)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto w-full">
      <PageHeader
        title="Availability"
        action={
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saved ? <><Check size={14} className="inline mr-1" />Saved</> : saving ? "Saving…" : "Save"}
          </Button>
        }
      />

      <div className="px-5 pb-8 space-y-6">

        {/* Work days */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Work Days</p>
          <div className="flex gap-2">
            {DAY_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  avail.workDays.includes(i)
                    ? "bg-[var(--color-pink)] border-[var(--color-pink)] text-white"
                    : "bg-[var(--color-card)] border-[var(--color-border)] text-zinc-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Hours */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Working Hours</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Start time</label>
              <select
                className={selectCls}
                value={avail.startHour}
                onChange={(e) => setAvail((a) => ({ ...a, startHour: parseInt(e.target.value) }))}
              >
                {HOURS.slice(6, 14).map((h) => (
                  <option key={h} value={h}>{fmtHour(h)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">End time</label>
              <select
                className={selectCls}
                value={avail.endHour}
                onChange={(e) => setAvail((a) => ({ ...a, endHour: parseInt(e.target.value) }))}
              >
                {HOURS.slice(12, 23).map((h) => (
                  <option key={h} value={h}>{fmtHour(h)}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Slot duration */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Booking Slot Size</p>
          <div className="flex gap-2">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setAvail((a) => ({ ...a, slotDuration: mins }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  avail.slotDuration === mins
                    ? "bg-[var(--color-pink)] border-[var(--color-pink)] text-white"
                    : "bg-[var(--color-card)] border-[var(--color-border)] text-zinc-400"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
          <p className="text-zinc-600 text-xs mt-2 px-1">How often appointment slots appear in the booking page.</p>
        </section>

        {/* Days off */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Days Off</p>
          <div className="flex gap-2 mb-3">
            <input
              type="date"
              className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--color-pink)] transition-colors"
              value={newDayOff}
              onChange={(e) => setNewDayOff(e.target.value)}
            />
            <button
              onClick={addDayOff}
              disabled={!newDayOff}
              className="px-4 py-2.5 bg-[var(--color-pink)] text-white rounded-xl disabled:opacity-40 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          {avail.daysOff.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-4">No days off added</p>
          ) : (
            <div className="space-y-2">
              {avail.daysOff.map((d) => (
                <div key={d} className="flex items-center justify-between bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3">
                  <span className="text-white text-sm">
                    {new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <button onClick={() => removeDayOff(d)} className="text-zinc-600 hover:text-red-400 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Booking link */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Public Booking Link</p>
          <div className="bg-[var(--color-card)] border border-[var(--color-pink)]/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-[var(--color-pink)] text-sm font-mono truncate">
              {typeof window !== "undefined" ? window.location.origin : ""}/book
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/book`)}
              className="text-zinc-400 hover:text-white text-xs shrink-0 transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-zinc-600 text-xs mt-2 px-1">Share this link so clients can book and pay online.</p>
        </section>

      </div>
    </div>
  );
}

const selectCls = "w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[var(--color-pink)] transition-colors appearance-none";
