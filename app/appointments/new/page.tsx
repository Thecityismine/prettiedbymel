"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Clock, UserPlus } from "lucide-react";
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
  const [clientSearch, setClientSearch] = useState("");

  const [form, setForm] = useState({
    serviceId: "",
    clientId: prefilledClientId,
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    depositPaid: false,
    notes: "",
  });

  useEffect(() => {
    Promise.all([getClients(), loadServices()]).then(([c, s]) => {
      setClients(c);
      setServices(s);
      if (s.length > 0) setForm((f) => ({ ...f, serviceId: s[0].id }));
      if (!prefilledClientId && c.length > 0) setForm((f) => ({ ...f, clientId: c[0].id }));
      // Pre-fill search with prefilled client name
      if (prefilledClientId) {
        const match = c.find((cl) => cl.id === prefilledClientId);
        if (match) setClientSearch(match.name);
      }
    }).finally(() => setLoading(false));
  }, [prefilledClientId]);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const selectedService = services.find((s) => s.id === form.serviceId);
  const selectedClient = clients.find((c) => c.id === form.clientId);

  const filteredClients = clientSearch.trim()
    ? clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
    : clients;

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
      duration: selectedService.duration,
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

      <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-5">

        {/* Step 1 — Service */}
        <Field label="1. Service">
          <SelectWrapper>
            <select
              className={selectCls}
              value={form.serviceId}
              onChange={(e) => set("serviceId", e.target.value)}
              required
            >
              <option value="" disabled>Choose a service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name} — ${s.price}
                </option>
              ))}
            </select>
          </SelectWrapper>

          {/* Price + duration strip */}
          {selectedService && (
            <div className="flex items-center gap-3 mt-2 px-1">
              <span className="text-[var(--color-pink)] font-bold text-sm">${selectedService.price}</span>
              <span className="text-zinc-600 text-xs">·</span>
              <span className="flex items-center gap-1 text-zinc-400 text-xs">
                <Clock size={11} />
                {selectedService.duration} min
              </span>
            </div>
          )}
        </Field>

        {/* Step 2 — Date + Time */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="2. Date">
            <input
              className={baseCls}
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </Field>
          <Field label="Time">
            <input
              className={baseCls}
              type="time"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
              required
            />
          </Field>
        </div>

        {/* Step 3 — Client */}
        <Field label="3. Client">
          {clients.length === 0 ? (
            <button
              type="button"
              onClick={() => router.push("/clients/new")}
              className={`${baseCls} flex items-center gap-2 text-[var(--color-pink)]`}
            >
              <UserPlus size={16} /> Add your first client
            </button>
          ) : (
            <>
              <input
                className={baseCls}
                placeholder="Search client…"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  // clear selection when typing
                  if (selectedClient && !e.target.value.toLowerCase().startsWith(selectedClient.name.toLowerCase().slice(0, 1))) {
                    set("clientId", "");
                  }
                }}
              />
              {/* Dropdown results */}
              {clientSearch && !selectedClient && filteredClients.length > 0 && (
                <div className="mt-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                  {filteredClients.slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[var(--color-pink)]/10 transition-colors border-b border-[var(--color-border)] last:border-0"
                      onClick={() => {
                        set("clientId", c.id);
                        setClientSearch(c.name);
                      }}
                    >
                      {c.name}
                      {c.lastService && <span className="text-zinc-500 text-xs ml-2">· {c.lastService}</span>}
                    </button>
                  ))}
                </div>
              )}
              {selectedClient && (
                <p className="text-xs text-zinc-500 mt-1.5 px-1">
                  {selectedClient.lastVisit
                    ? `Last visit: ${new Date(selectedClient.lastVisit + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : "First visit"}
                  {(selectedClient.noShowCount ?? 0) > 0 && (
                    <span className="text-yellow-400 ml-2">· {selectedClient.noShowCount} no-show{selectedClient.noShowCount! > 1 ? "s" : ""}</span>
                  )}
                </p>
              )}
            </>
          )}
        </Field>

        {/* Step 4 — Deposit */}
        <Field label="4. Deposit">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => set("depositPaid", true)}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold border transition-all ${
                form.depositPaid
                  ? "bg-[var(--color-pink)] border-[var(--color-pink)] text-white shadow-[0_0_16px_var(--color-pink-glow)]"
                  : "bg-[var(--color-card)] border-[var(--color-border)] text-zinc-400"
              }`}
            >
              💳 Pay now
            </button>
            <button
              type="button"
              onClick={() => set("depositPaid", false)}
              className={`flex-1 py-3.5 rounded-xl text-sm font-semibold border transition-colors ${
                !form.depositPaid
                  ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
                  : "bg-[var(--color-card)] border-[var(--color-border)] text-zinc-500"
              }`}
            >
              Pay later
            </button>
          </div>
          {form.depositPaid && (
            <p className="text-xs text-zinc-500 mt-1.5 px-1">$10 deposit · locks in the appointment</p>
          )}
        </Field>

        {/* Notes */}
        <Field label="Notes">
          <textarea
            className={`${baseCls} resize-none h-24`}
            placeholder="Inspo, nail shape, color requests…"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>

        {/* Summary */}
        {selectedService && selectedClient && (
          <div className="bg-gradient-to-r from-[var(--color-pink)]/15 to-transparent border border-[var(--color-pink)]/20 rounded-2xl px-4 py-3">
            <p className="text-white font-semibold text-sm">{selectedClient.name}</p>
            <p className="text-[var(--color-pink)] text-sm">
              {selectedService.name} · <span className="font-bold">${selectedService.price}</span>
              <span className="text-zinc-500 ml-2 text-xs">· {selectedService.duration} min</span>
            </p>
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={saving || !form.clientId || !form.serviceId || clients.length === 0}
        >
          {saving ? "Booking…" : "Confirm Appointment"}
        </Button>
      </form>
    </div>
  );
}

const baseCls = "w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[var(--color-pink)] transition-colors";
const selectCls = `${baseCls} appearance-none bg-transparent pr-10 cursor-pointer`;

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}
