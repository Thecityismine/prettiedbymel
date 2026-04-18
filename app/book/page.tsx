"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Clock, ChevronRight } from "lucide-react";
import { formatSlot } from "@/lib/availabilityDb";
import type { Service } from "@/lib/types";

type Step = "service" | "datetime" | "info" | "confirm";

export default function BookPage() {
  const [step, setStep] = useState<Step>("service");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load services
  useEffect(() => {
    fetch("/api/book/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []));
  }, []);

  // Load slots when date + service change
  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    setSlotsLoading(true);
    setSelectedTime("");
    fetch(`/api/book/slots?date=${selectedDate}&duration=${selectedService.duration ?? 60}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedService]);

  // Min date = today
  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit() {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !phone) return;
    setSubmitting(true);
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        duration: selectedService.duration,
        date: selectedDate,
        time: selectedTime,
        clientName: clientName.trim(),
        phone: phone.trim(),
      }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3 mb-1">
          {step !== "service" && (
            <button
              onClick={() => setStep(step === "datetime" ? "service" : step === "info" ? "datetime" : "info")}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="font-playfair text-2xl font-black text-white tracking-widest uppercase">NAILS</h1>
            <p className="font-dancing text-lg text-[var(--color-pink)] text-glow-pink leading-tight">prettiedbymel</p>
          </div>
        </div>
        <p className="text-zinc-400 text-sm mt-3">Book your nail appointment · $10 deposit to confirm</p>

        {/* Step bar */}
        <div className="flex gap-1.5 mt-4">
          {(["service", "datetime", "info", "confirm"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                ["service", "datetime", "info", "confirm"].indexOf(step) >= i
                  ? "bg-[var(--color-pink)]"
                  : "bg-zinc-800"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 py-6 space-y-4 overflow-y-auto">

        {/* Step 1: Service */}
        {step === "service" && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Choose a service</p>
            <div className="space-y-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); setStep("datetime"); }}
                  className="w-full flex items-center gap-4 bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-pink)] rounded-2xl px-4 py-4 transition-all text-left active:scale-[0.98]"
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{s.name}</p>
                    <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {s.duration ?? 60} min
                    </p>
                  </div>
                  <p className="text-[var(--color-pink)] font-bold">${s.price}</p>
                  <ChevronRight size={16} className="text-zinc-600" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Date + Time */}
        {step === "datetime" && (
          <>
            <div className="bg-[var(--color-card)] border border-[var(--color-pink)]/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-white font-semibold text-sm">{selectedService?.name}</span>
              <span className="text-[var(--color-pink)] font-bold">${selectedService?.price}</span>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Pick a date</p>
              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[var(--color-pink)] transition-colors"
              />
            </div>

            {selectedDate && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Available times</p>
                {slotsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-[var(--color-pink)] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-zinc-500 text-sm">No availability on this day.</p>
                    <p className="text-zinc-600 text-xs mt-1">Try a different date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          selectedTime === slot
                            ? "bg-[var(--color-pink)] border-[var(--color-pink)] text-white shadow-[0_0_12px_var(--color-pink-glow)]"
                            : "bg-[var(--color-card)] border-[var(--color-border)] text-zinc-300 hover:border-[var(--color-pink)]"
                        }`}
                      >
                        {formatSlot(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedDate && selectedTime && (
              <button
                onClick={() => setStep("info")}
                className="w-full py-4 bg-[var(--color-pink)] text-white font-bold rounded-xl shadow-[0_0_20px_var(--color-pink-glow)] hover:bg-[var(--color-pink-dark)] transition-colors"
              >
                Continue →
              </button>
            )}
          </>
        )}

        {/* Step 3: Info */}
        {step === "info" && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your info</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-1.5">Name</label>
                <input
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[var(--color-pink)] transition-colors"
                  placeholder="Your full name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-1.5">Phone</label>
                <input
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[var(--color-pink)] transition-colors"
                  placeholder="(555) 000-0000"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={() => setStep("confirm")}
              disabled={!clientName.trim() || !phone.trim()}
              className="w-full py-4 bg-[var(--color-pink)] text-white font-bold rounded-xl shadow-[0_0_20px_var(--color-pink-glow)] hover:bg-[var(--color-pink-dark)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Review Booking →
            </button>
          </>
        )}

        {/* Step 4: Confirm */}
        {step === "confirm" && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Review & pay deposit</p>

            <div className="bg-gradient-to-b from-[var(--color-pink)]/15 to-[var(--color-card)] border border-[var(--color-pink)]/20 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Service</span>
                <span className="text-white font-semibold text-sm">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Date</span>
                <span className="text-white font-semibold text-sm">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Time</span>
                <span className="text-white font-semibold text-sm">{formatSlot(selectedTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Duration</span>
                <span className="text-white font-semibold text-sm">{selectedService?.duration} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Name</span>
                <span className="text-white font-semibold text-sm">{clientName}</span>
              </div>
              <div className="h-px bg-[var(--color-border)]" />
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Service price</span>
                <span className="text-white font-semibold text-sm">${selectedService?.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-pink)] font-semibold text-sm">Deposit due now</span>
                <span className="text-[var(--color-pink)] font-black text-lg">$10</span>
              </div>
            </div>

            <p className="text-zinc-500 text-xs text-center">
              The $10 deposit locks in your appointment. The remaining ${(selectedService?.price ?? 0) - 10} is due at your visit.
            </p>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 bg-[var(--color-pink)] text-white font-bold rounded-xl shadow-[0_0_20px_var(--color-pink-glow)] hover:bg-[var(--color-pink-dark)] transition-colors disabled:opacity-60"
            >
              {submitting ? "Redirecting to payment…" : "💳 Pay $10 Deposit"}
            </button>
          </>
        )}
      </div>

      <p className="text-center text-zinc-700 text-xs py-4 tracking-widest uppercase">
        Prettied by Mel · Suffern, NY
      </p>
    </div>
  );
}
