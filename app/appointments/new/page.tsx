"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Button from "@/components/Button";
import { addAppointment } from "@/lib/appointmentsDb";
import { getClients } from "@/lib/clientsDb";
import { loadServices } from "@/lib/pricingDb";
import type { Client, Service } from "@/lib/types";

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-[var(--color-pink)] border-t-transparent rounded-full animate-spin" /></div>}>
      <NewAppointmentForm />
    </Suspense>
  );
}

function NewAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledClientId = searchParams.get("client") ?? "";

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    clientId: prefilledClientId,
    serviceId: "",
    date: new Date().toISOString().slice(0, 10),
    time: "12:00",
    depositPaid: false,
    notes: "",
  });

  useEffect(() => {
    Promise.all([getClients(), loadServices()]).then(([c, s]) => {
      setClients(c);
      setServices(s);
      if (!prefilledClientId && c.length > 0) setForm((f) => ({ ...f, clientId: c[0].id }));
      if (s.length > 0) setForm((f) => ({ ...f, serviceId: s[0].id }));
    }).finally(() => setLoading(false));
  }, [prefilledClientId]);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const selectedClient = clients.find((c) => c.id === form.clientId);
  const selectedService = services.find((s) => s.id === form.serviceId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient || !selectedService) return;
    setSaving(true);
    await addAppointment({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      date: form.date,
      time: form.time,
      depositPaid: form.depositPaid,
      status: "upcoming",
      notes: form.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    router.push("/appointments");
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
      <PageHeader title="New Appointment" />

      <form onSubmit={handleSubmit} className="px-5 pb-6 space-y-4">
        {/* Summary card */}
        <div className="bg-gradient-to-r from-[var(--color-pink)]/15 to-transparent border border-[var(--color-pink)]/20 rounded-2xl p-4">
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Booking</p>
          <p className="text-white font-bold text-lg">{selectedClient?.name ?? "—"}</p>
          <p className="text-[var(--color-pink)] font-semibold">
            {selectedService ? `${selectedService.name} · $${selectedService.price}` : "—"}
          </p>
        </div>

        {/* Client */}
        <SelectField label="Client">
          <select
            className={selectCls}
            value={form.clientId}
            onChange={(e) => set("clientId", e.target.value)}
            required
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </SelectField>

        {/* Service */}
        <SelectField label="Service">
          <select
            className={selectCls}
            value={form.serviceId}
            onChange={(e) => set("serviceId", e.target.value)}
            required
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>
            ))}
          </select>
        </SelectField>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Date">
            <input
              className={inputCls}
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </SelectField>
          <SelectField label="Time">
            <input
              className={inputCls}
              type="time"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
              required
            />
          </SelectField>
        </div>

        {/* Deposit toggle */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-1.5">
            $10 Deposit
          </label>
          <div className="flex gap-2">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => set("depositPaid", val)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                  form.depositPaid === val
                    ? val
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                      : "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                    : "bg-[var(--color-card)] border-[var(--color-border)] text-zinc-500"
                }`}
              >
                {val ? "✓ Paid" : "Not yet"}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <SelectField label="Notes">
          <textarea
            className={`${inputCls} resize-none h-20`}
            placeholder="Inspo, nail shape, color requests…"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </SelectField>

        <Button type="submit" fullWidth size="lg" disabled={saving || !form.clientId || !form.serviceId}>
          {saving ? "Booking…" : "Confirm Appointment"}
        </Button>
      </form>
    </div>
  );
}

const inputCls = "w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[var(--color-pink)] transition-colors";
const selectCls = `${inputCls} appearance-none cursor-pointer`;

function SelectField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}
