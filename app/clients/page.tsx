"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Phone, AlertCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import { getClients, weeksAgo } from "@/lib/clientsDb";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClients()
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const overdue = clients.filter((c) => {
    const w = weeksAgo(c.lastVisit);
    return w !== null && w >= 6;
  });

  return (
    <div className="min-h-screen max-w-lg mx-auto w-full">
      <PageHeader title="Clients" showBack={false} />

      <div className="px-5 space-y-4 pb-6">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-[var(--color-pink)] transition-colors"
            placeholder="Search clients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Overdue alert strip */}
        {overdue.length > 0 && !query && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-300">
              <span className="font-semibold">{overdue.length} client{overdue.length > 1 ? "s" : ""}</span> haven't booked in 6+ weeks
            </p>
          </div>
        )}

        {/* Stats row */}
        {!query && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total", value: clients.length },
              { label: "Overdue", value: overdue.length },
              { label: "This month", value: clients.filter((c) => {
                if (!c.lastVisit) return false;
                const d = new Date(c.lastVisit);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Client list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--color-pink)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💅</p>
            <p className="text-zinc-400 text-sm">
              {query ? "No clients match your search" : "No clients yet — add your first one!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/clients/new"
        className="fixed bottom-20 right-5 w-14 h-14 bg-[var(--color-pink)] rounded-full flex items-center justify-center shadow-[0_0_20px_var(--color-pink-glow)] hover:bg-[var(--color-pink-dark)] transition-colors z-40"
      >
        <Plus size={24} className="text-white" />
      </Link>
    </div>
  );
}

function ClientCard({ client }: { client: Client }) {
  const weeks = weeksAgo(client.lastVisit);
  const isOverdue = weeks !== null && weeks >= 6;
  const initials = client.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Link href={`/clients/${client.id}`}>
      <div className="flex items-center gap-3 bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-pink)] rounded-2xl p-4 transition-all duration-200 active:scale-[0.98]">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          isOverdue ? "bg-yellow-500/20 text-yellow-400" : "bg-[var(--color-pink)]/15 text-[var(--color-pink)]"
        }`}>
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-white text-sm truncate">{client.name}</p>
            {isOverdue && <Badge variant="overdue">Overdue</Badge>}
          </div>
          <div className="flex items-center gap-1 text-zinc-500 text-xs">
            <Phone size={10} />
            <span>{client.phone}</span>
          </div>
          {client.lastVisit && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              {weeks === 0 ? "This week" : weeks === 1 ? "1 week ago" : `${weeks} weeks ago`}
              {client.lastService && <span> · {client.lastService}</span>}
            </p>
          )}
          {!client.lastVisit && (
            <p className="text-xs text-zinc-600 mt-0.5">No visits yet</p>
          )}
        </div>

        {/* Deposit badge */}
        {client.depositPaid !== undefined && (
          <Badge variant={client.depositPaid ? "paid" : "unpaid"}>
            {client.depositPaid ? "Paid" : "Unpaid"}
          </Badge>
        )}
      </div>
    </Link>
  );
}
