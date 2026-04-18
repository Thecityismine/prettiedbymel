"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, Clock, CheckCircle, Send } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import { getAppointments } from "@/lib/appointmentsDb";
import { formatApptDate } from "@/lib/appointmentsDb";
import type { Appointment } from "@/lib/types";

export default function PaymentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [linkModal, setLinkModal] = useState<{ url: string; appt: Appointment } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter((a) => a.status === "upcoming" && a.date >= todayStr);
  const paid = appointments.filter((a) => a.depositPaid && a.status !== "no-show");
  const unpaid = upcoming.filter((a) => !a.depositPaid);
  const noShows = appointments.filter((a) => a.status === "no-show");
  const depositsKept = noShows.filter((a) => a.depositKept);

  const totalDeposits = paid.length * 10;
  const totalServiceValue = appointments
    .filter((a) => a.status === "done")
    .reduce((sum, a) => sum + a.price, 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthlyDeposits = paid.filter((a) => a.date.startsWith(thisMonth)).length * 10;

  async function sendDepositLink(appt: Appointment) {
    setSendingId(appt.id);
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
    setSendingId(null);
    setLinkModal({ url, appt });
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink(url: string, appt: Appointment) {
    const text = `Hi ${appt.clientName}! Please pay your $10 deposit to lock in your nail appointment on ${formatApptDate(appt.date)}: ${url}`;
    if (navigator.share) {
      await navigator.share({ title: "Deposit Link", text });
    } else {
      await copyLink(url);
    }
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto w-full">
      <PageHeader title="Payments" showBack={false} />

      <div className="px-5 pb-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<DollarSign size={18} />}
            label="Deposits this month"
            value={`$${monthlyDeposits}`}
            accent
          />
          <StatCard
            icon={<CheckCircle size={18} />}
            label="Total service value"
            value={`$${totalServiceValue}`}
          />
          <StatCard
            icon={<CheckCircle size={18} />}
            label="Deposits collected"
            value={`$${totalDeposits}`}
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Pending deposits"
            value={String(unpaid.length)}
            warn={unpaid.length > 0}
          />
          {depositsKept.length > 0 && (
            <StatCard
              icon={<span className="text-lg">👻</span>}
              label="No-show deposits kept"
              value={`$${depositsKept.length * 10}`}
            />
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-zinc-800 rounded-full w-1/3" />
                  <div className="h-2.5 bg-zinc-800 rounded-full w-1/2" />
                </div>
                <div className="h-4 bg-zinc-800 rounded-full w-10" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Pending deposits */}
            {unpaid.length > 0 && (
              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
                  Pending Deposits ({unpaid.length})
                </p>
                <div className="space-y-2">
                  {unpaid.map((appt) => (
                    <div key={appt.id} className="bg-[var(--color-card)] border border-yellow-500/20 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-semibold text-white text-sm">{appt.clientName}</p>
                          <p className="text-zinc-400 text-xs mt-0.5">
                            {appt.serviceName} · {formatApptDate(appt.date)}
                          </p>
                        </div>
                        <Badge variant="unpaid">No deposit</Badge>
                      </div>
                      <Button
                        fullWidth
                        size="sm"
                        onClick={() => sendDepositLink(appt)}
                        disabled={sendingId === appt.id}
                      >
                        <Send size={13} className="inline mr-1.5" />
                        {sendingId === appt.id ? "Generating…" : "Send $10 Deposit Link"}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Paid deposits */}
            {paid.length > 0 && (
              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
                  Deposits Received ({paid.length})
                </p>
                <div className="space-y-2">
                  {paid.slice().reverse().map((appt) => (
                    <Link key={appt.id} href={`/appointments/${appt.id}`}>
                      <div className="flex items-center gap-3 bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-pink)] rounded-2xl px-4 py-3 transition-all duration-200">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <CheckCircle size={16} className="text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{appt.clientName}</p>
                          <p className="text-zinc-500 text-xs truncate">{appt.serviceName} · {formatApptDate(appt.date)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-emerald-400 font-bold text-sm">+$10</p>
                          <p className="text-zinc-600 text-xs">${appt.price} total</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* No-show deposits kept */}
            {depositsKept.length > 0 && (
              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
                  No-show · Deposit Kept ({depositsKept.length})
                </p>
                <div className="space-y-2">
                  {depositsKept.map((appt) => (
                    <Link key={appt.id} href={`/appointments/${appt.id}`}>
                      <div className="flex items-center gap-3 bg-[var(--color-card)] border border-yellow-500/20 rounded-2xl px-4 py-3 transition-all duration-200">
                        <div className="w-9 h-9 rounded-full bg-yellow-500/15 flex items-center justify-center shrink-0 text-sm">👻</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{appt.clientName}</p>
                          <p className="text-zinc-500 text-xs truncate">{appt.serviceName} · {formatApptDate(appt.date)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-yellow-400 font-bold text-sm">+$10</p>
                          <p className="text-zinc-600 text-xs">kept</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {appointments.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">💳</p>
                <p className="text-zinc-400 text-sm">No appointments yet — book your first client!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Link modal */}
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-4 pb-8">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <p className="text-2xl mb-2">💳</p>
              <p className="text-white font-bold text-lg">Deposit Link Ready</p>
              <p className="text-zinc-400 text-sm mt-1">
                Send this to <span className="text-white font-medium">{linkModal.appt.clientName}</span> to collect the $10 deposit
              </p>
            </div>

            <div className="bg-black/40 rounded-xl px-4 py-3 mb-4 break-all">
              <p className="text-zinc-400 text-xs font-mono">{linkModal.url}</p>
            </div>

            <div className="space-y-2">
              <Button fullWidth onClick={() => shareLink(linkModal.url, linkModal.appt)}>
                <Send size={14} className="inline mr-1.5" />
                {copied ? "Copied!" : "Share with Client"}
              </Button>
              <Button variant="outline" fullWidth onClick={() => copyLink(linkModal.url)}>
                {copied ? "✓ Copied" : "Copy Link"}
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setLinkModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, accent = false, warn = false,
}: {
  icon: React.ReactNode; label: string; value: string; accent?: boolean; warn?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${
      accent ? "bg-[var(--color-pink)]/10 border-[var(--color-pink)]/20"
      : warn ? "bg-yellow-500/10 border-yellow-500/20"
      : "bg-[var(--color-card)] border-[var(--color-border)]"
    }`}>
      <div className={`mb-2 ${accent ? "text-[var(--color-pink)]" : warn ? "text-yellow-400" : "text-zinc-500"}`}>
        {icon}
      </div>
      <p className={`text-2xl font-black ${accent ? "text-[var(--color-pink)]" : warn && value !== "0" ? "text-yellow-400" : "text-white"}`}>
        {value}
      </p>
      <p className="text-zinc-500 text-[11px] mt-0.5 leading-tight">{label}</p>
    </div>
  );
}
