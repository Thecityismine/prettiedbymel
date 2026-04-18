"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Mail, FileText, Trash2, Pencil, Check, X, CalendarDays } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import { getClient, updateClient, deleteClient, weeksAgo } from "@/lib/clientsDb";
import { getAppointments, formatApptDate, formatApptTime } from "@/lib/appointmentsDb";
import type { Client, Appointment } from "@/lib/types";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [apptHistory, setApptHistory] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Partial<Client>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    Promise.all([getClient(id), getAppointments()]).then(([c, all]) => {
      setClient(c);
      if (c) setDraft(c);
      setApptHistory(all.filter((a) => a.clientId === id).sort((a, b) => b.date.localeCompare(a.date)));
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!client) return;
    setSaving(true);
    await updateClient(id, draft);
    setClient({ ...client, ...draft });
    setEditMode(false);
    setSaving(false);
  }

  async function handleDelete() {
    await deleteClient(id);
    router.push("/clients");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-pink)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-5">
        <p className="text-zinc-400">Client not found.</p>
        <Button onClick={() => router.push("/clients")}>Back to Clients</Button>
      </div>
    );
  }

  const weeks = weeksAgo(client.lastVisit);
  const isOverdue = weeks !== null && weeks >= 6;
  const initials = client.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen max-w-lg mx-auto w-full">
      <PageHeader
        title={editMode ? "Edit Client" : client.name}
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
          ) : (
            <button onClick={() => setEditMode(true)} className="text-zinc-400 hover:text-[var(--color-pink)] p-2 transition-colors">
              <Pencil size={18} />
            </button>
          )
        }
      />

      <div className="px-5 pb-6 space-y-5">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
            isOverdue ? "bg-yellow-500/20 text-yellow-400" : "bg-[var(--color-pink)]/15 text-[var(--color-pink)]"
          }`}>
            {initials}
          </div>
          {!editMode && (
            <>
              <h2 className="text-xl font-bold text-white">{client.name}</h2>
              <div className="flex gap-2">
                {isOverdue && <Badge variant="overdue">Overdue — {weeks}w ago</Badge>}
                {client.depositPaid !== undefined && (
                  <Badge variant={client.depositPaid ? "paid" : "unpaid"}>
                    Deposit {client.depositPaid ? "Paid" : "Unpaid"}
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {editMode ? (
            <>
              <EditField label="Name" value={draft.name ?? ""} onChange={(v) => setDraft((p) => ({ ...p, name: v }))} />
              <EditField label="Phone" value={draft.phone ?? ""} onChange={(v) => setDraft((p) => ({ ...p, phone: v }))} type="tel" />
              <EditField label="Email" value={draft.email ?? ""} onChange={(v) => setDraft((p) => ({ ...p, email: v }))} type="email" />
              <EditField label="Notes" value={draft.notes ?? ""} onChange={(v) => setDraft((p) => ({ ...p, notes: v }))} multiline />
              <EditField label="Last Visit (date)" value={draft.lastVisit ?? ""} onChange={(v) => setDraft((p) => ({ ...p, lastVisit: v }))} type="date" />
              <EditField label="Last Service" value={draft.lastService ?? ""} onChange={(v) => setDraft((p) => ({ ...p, lastService: v }))} placeholder="e.g. Acrylic – Long" />
              {/* Deposit toggle */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-1.5">Deposit Status</label>
                <div className="flex gap-2">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, depositPaid: val }))}
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
            </>
          ) : (
            <>
              <InfoRow icon={<Phone size={15} />} label="Phone" value={client.phone} />
              {client.email && <InfoRow icon={<Mail size={15} />} label="Email" value={client.email} />}
              {client.notes && <InfoRow icon={<FileText size={15} />} label="Notes" value={client.notes} />}
              {client.lastVisit && (
                <InfoRow
                  icon={<CalendarDays size={15} />}
                  label="Last Visit"
                  value={`${new Date(client.lastVisit).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}${client.lastService ? ` · ${client.lastService}` : ""}`}
                />
              )}
            </>
          )}
        </div>

        {/* Stats row */}
        {!editMode && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Visits", value: apptHistory.filter((a) => a.status === "done").length },
              { label: "Total spent", value: `$${apptHistory.filter((a) => a.status === "done").reduce((s, a) => s + a.price, 0)}` },
              { label: "No-shows", value: client.noShowCount ?? 0, warn: (client.noShowCount ?? 0) > 0 },
            ].map(({ label, value, warn }) => (
              <div key={label} className={`rounded-xl border p-3 text-center ${warn ? "bg-yellow-500/10 border-yellow-500/20" : "bg-[var(--color-card)] border-[var(--color-border)]"}`}>
                <p className={`text-lg font-bold ${warn ? "text-yellow-400" : "text-white"}`}>{value}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        {!editMode && (
          <div className="grid grid-cols-2 gap-3">
            <a href={`tel:${client.phone}`}>
              <Button variant="outline" fullWidth>
                <Phone size={14} className="inline mr-1.5" />Call
              </Button>
            </a>
            <Button fullWidth onClick={() => router.push(`/appointments/new?client=${id}`)}>
              <CalendarDays size={14} className="inline mr-1.5" />Book
            </Button>
          </div>
        )}

        {/* Appointment history */}
        {!editMode && apptHistory.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Appointment History</p>
            <div className="space-y-2">
              {apptHistory.map((a) => (
                <div key={a.id} className="flex items-center gap-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{a.serviceName}</p>
                    <p className="text-zinc-500 text-xs">{formatApptDate(a.date)} · {formatApptTime(a.time)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[var(--color-pink)] font-bold text-sm">${a.price}</p>
                    <p className={`text-[10px] uppercase tracking-wide ${
                      a.status === "done" ? "text-emerald-400" :
                      a.status === "no-show" ? "text-yellow-400" :
                      a.status === "cancelled" ? "text-red-400" : "text-zinc-500"
                    }`}>{a.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete */}
        {!editMode && (
          <div className="pt-4 border-t border-[var(--color-border)]">
            {confirmDelete ? (
              <div className="flex gap-3">
                <Button variant="ghost" fullWidth onClick={() => setConfirmDelete(false)}>Cancel</Button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors"
                >
                  Yes, delete
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 text-zinc-600 hover:text-red-400 text-sm transition-colors"
              >
                <Trash2 size={15} /> Remove client
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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

function EditField({
  label, value, onChange, type = "text", multiline = false, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; multiline?: boolean; placeholder?: string;
}) {
  const cls = "w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[var(--color-pink)] transition-colors";
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-1.5">{label}</label>
      {multiline ? (
        <textarea className={`${cls} resize-none h-20`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input className={cls} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}
