"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, Clock, User, Pencil, Trash2, Check, X, CheckCircle, Send } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import {
  getAppointment,
  updateAppointment,
  deleteAppointment,
  markDone,
  markNoShow,
  formatApptDate,
  formatApptTime,
} from "@/lib/appointmentsDb";
import { getClients } from "@/lib/clientsDb";
import { loadServices } from "@/lib/pricingDb";
import type { Appointment, Client, Service } from "@/lib/types";

export default function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-[var(--color-pink)] border-t-transparent rounded-full animate-spin" /></div>}>
      <AppointmentDetail params={params} />
    </Suspense>
  );
}

function AppointmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const justPaid = searchParams.get("paid") === "true";

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Partial<Appointment>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sendingDeposit, setSendingDeposit] = useState(false);
  const [depositLink, setDepositLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([getAppointment(id), getClients(), loadServices()]).then(([a, c, s]) => {
      setAppt(a);
      if (a) setDraft(a);
      setClients(c);
      setServices(s);
    }).finally(() => setLoading(false));
  }, [id]);

  function setDraftField(field: string, value: string | boolean | number) {
    setDraft((p) => ({ ...p, [field]: value }));
  }

  async function handleSave() {
    if (!appt) return;
    setSaving(true);
    // Re-derive client/service names if IDs changed
    const client = clients.find((c) => c.id === draft.clientId);
    const service = services.find((s) => s.id === draft.serviceId);
    const updates: Partial<Appointment> = {
      ...draft,
      clientName: client?.name ?? appt.clientName,
      serviceName: service?.name ?? appt.serviceName,
      price: service?.price ?? appt.price,
    };
    await updateAppointment(id, updates);
    setAppt({ ...appt, ...updates });
    setEditMode(false);
    setSaving(false);
  }

  async function handleMarkDone() {
    if (!appt) return;
    await markDone(appt);
    setAppt({ ...appt, status: "done" });
  }

  async function handleMarkNoShow() {
    if (!appt) return;
    await markNoShow(appt);
    setAppt({ ...appt, status: "no-show", depositKept: appt.depositPaid });
  }

  async function sendDepositLink() {
    if (!appt) return;
    setSendingDeposit(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: appt.id,
        clientName: appt.clientName,
        serviceName: appt.serviceName,
        appointmentDate: formatApptDate(appt.date),
      }),
    });
    const { url } = await res.json();
    setDepositLink(url);
    setSendingDeposit(false);
  }

  async function copyAndShare() {
    if (!depositLink || !appt) return;
    const text = `Hi ${appt.clientName}! Please pay your $10 deposit here: ${depositLink}`;
    if (navigator.share) {
      await navigator.share({ title: "Deposit Link", text });
    } else {
      await navigator.clipboard.writeText(depositLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDelete() {
    await deleteAppointment(id);
    router.push("/appointments");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-pink)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-5">
        <p className="text-zinc-400">Appointment not found.</p>
        <Button onClick={() => router.push("/appointments")}>Back</Button>
      </div>
    );
  }

  const statusVariant = appt.status === "done" ? "done" : appt.status === "cancelled" || appt.status === "no-show" ? "overdue" : "upcoming";

  return (
    <div className="min-h-screen max-w-lg mx-auto w-full">
      <PageHeader
        title="Appointment"
        action={
          editMode ? (
            <div className="flex gap-2">
              <button onClick={() => setEditMode(false)} className="text-zinc-400 hover:text-white p-2 transition-colors">
                <X size={18} />
              </button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : <><Check size={14} className="inline mr-1" />Save</>}
              </Button>
            </div>
          ) : appt.status === "upcoming" ? (
            <button onClick={() => setEditMode(true)} className="text-zinc-400 hover:text-[var(--color-pink)] p-2 transition-colors">
              <Pencil size={18} />
            </button>
          ) : null
        }
      />

      <div className="px-5 pb-6 space-y-4">
        {/* Hero card */}
        <div className="bg-gradient-to-br from-[var(--color-pink)]/15 to-[var(--color-card)] border border-[var(--color-pink)]/20 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Client</p>
              <p className="text-white font-bold text-xl">{appt.clientName}</p>
            </div>
            <Badge variant={statusVariant}>{appt.status}</Badge>
          </div>
          <p className="text-[var(--color-pink)] font-semibold text-lg">
            {appt.serviceName}
          </p>
          <p className="text-2xl font-black text-white mt-1">${appt.price}</p>
        </div>

        {editMode ? (
          <div className="space-y-4">
            <Field label="Client">
              <select className={selectCls} value={draft.clientId} onChange={(e) => setDraftField("clientId", e.target.value)}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Service">
              <select className={selectCls} value={draft.serviceId} onChange={(e) => setDraftField("serviceId", e.target.value)}>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input className={inputCls} type="date" value={draft.date ?? ""} onChange={(e) => setDraftField("date", e.target.value)} />
              </Field>
              <Field label="Time">
                <input className={inputCls} type="time" value={draft.time ?? ""} onChange={(e) => setDraftField("time", e.target.value)} />
              </Field>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-1.5">Deposit</label>
              <div className="flex gap-2">
                {[true, false].map((val) => (
                  <button key={String(val)} type="button"
                    onClick={() => setDraftField("depositPaid", val)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                      draft.depositPaid === val
                        ? val ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                              : "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                        : "bg-[var(--color-card)] border-[var(--color-border)] text-zinc-500"
                    }`}
                  >
                    {val ? "Paid" : "Unpaid"}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Notes">
              <textarea className={`${inputCls} resize-none h-20`} value={draft.notes ?? ""} onChange={(e) => setDraftField("notes", e.target.value)} />
            </Field>
          </div>
        ) : (
          <div className="space-y-2">
            <InfoRow icon={<CalendarDays size={15} />} label="Date" value={formatApptDate(appt.date)} />
            <InfoRow icon={<Clock size={15} />} label="Time" value={formatApptTime(appt.time)} />
            <InfoRow
              icon={<User size={15} />}
              label="Deposit"
              value={appt.depositPaid ? "✓ $10 deposit paid" : "⚠ Deposit not received"}
            />
            {appt.notes && (
              <InfoRow icon={<span className="text-base">📝</span>} label="Notes" value={appt.notes} />
            )}
          </div>
        )}

        {/* Paid success banner */}
        {justPaid && (
          <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-4 py-3">
            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
            <p className="text-emerald-400 text-sm font-semibold">Deposit received! ✓</p>
          </div>
        )}

        {/* Actions */}
        {!editMode && appt.status === "upcoming" && (
          <div className="space-y-3 pt-2">
            {!appt.depositPaid && (
              <>
                <button
                  onClick={async () => {
                    await updateAppointment(id, { depositPaid: true });
                    setAppt({ ...appt, depositPaid: true });
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/25 transition-colors"
                >
                  ✓ Mark deposit as received
                </button>
                <Button variant="outline" fullWidth onClick={sendDepositLink} disabled={sendingDeposit}>
                  <Send size={14} className="inline mr-1.5" />
                  {sendingDeposit ? "Generating link…" : "Send $10 Deposit Link"}
                </Button>
                {depositLink && (
                  <div className="bg-black/40 rounded-xl px-4 py-3 space-y-2">
                    <p className="text-zinc-400 text-xs font-mono break-all">{depositLink}</p>
                    <Button size="sm" fullWidth onClick={copyAndShare}>
                      {copied ? "✓ Copied!" : "Copy & Share"}
                    </Button>
                  </div>
                )}
              </>
            )}
            <Button fullWidth size="lg" onClick={handleMarkDone}>
              <CheckCircle size={16} className="inline mr-2" />Mark as Done
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => updateAppointment(id, { status: "cancelled" }).then(() => setAppt({ ...appt, status: "cancelled" }))}>
                Cancel
              </Button>
              <button
                onClick={handleMarkNoShow}
                className="flex-1 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/20 transition-colors"
              >
                No-show {appt.depositPaid ? "· Keep $10" : ""}
              </button>
            </div>
          </div>
        )}

        {/* Delete */}
        {!editMode && (
          <div className="pt-4 border-t border-[var(--color-border)]">
            {confirmDelete ? (
              <div className="flex gap-3">
                <Button variant="ghost" fullWidth onClick={() => setConfirmDelete(false)}>Cancel</Button>
                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors">
                  Yes, delete
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 text-zinc-600 hover:text-red-400 text-sm transition-colors">
                <Trash2 size={15} /> Delete appointment
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[var(--color-pink)] transition-colors";
const selectCls = `${inputCls} appearance-none cursor-pointer`;

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3">
      <span className="text-zinc-500 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
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
