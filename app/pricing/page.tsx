"use client";

import { useEffect, useState } from "react";
import { Pencil, Check, X, Plus, Trash2, Eye, Share2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Button from "@/components/Button";
import { loadServices, saveServices } from "@/lib/pricingDb";
import { defaultServices, categoryLabels } from "@/lib/defaultServices";
import type { Service } from "@/lib/types";

type Category = Service["category"];

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return h === 1 ? "1 hr" : `${h} hrs`;
  return `${h} hr ${m} min`;
}

export default function PricingPage() {
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [draft, setDraft] = useState<Service[]>(defaultServices);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Show defaultServices immediately; replace with Firestore data once auth is ready.
  useEffect(() => {
    loadServices().then((s) => {
      setServices(s);
      setDraft(s);
    });
  }, []);

  function startEdit() {
    setDraft(services);
    setEditMode(true);
  }

  function cancelEdit() {
    setDraft(services);
    setEditMode(false);
  }

  async function saveEdit() {
    setSaving(true);
    await saveServices(draft);
    setServices(draft);
    setEditMode(false);
    setSaving(false);
  }

  function updatePrice(id: string, value: string) {
    const num = parseFloat(value);
    setDraft((prev) =>
      prev.map((s) => (s.id === id ? { ...s, price: isNaN(num) ? 0 : num } : s))
    );
  }

  function updateName(id: string, value: string) {
    setDraft((prev) => prev.map((s) => (s.id === id ? { ...s, name: value } : s)));
  }

  function removeService(id: string) {
    setDraft((prev) => prev.filter((s) => s.id !== id));
  }

  function updateDuration(id: string, value: string) {
    const num = parseInt(value);
    setDraft((prev) =>
      prev.map((s) => (s.id === id ? { ...s, duration: isNaN(num) ? 0 : num } : s))
    );
  }

  function addService(category: Category) {
    const newService: Service = {
      id: `custom-${Date.now()}`,
      name: "New Service",
      price: 0,
      duration: 60,
      category,
      emoji: "💅",
    };
    setDraft((prev) => [...prev, newService]);
  }

  async function handleShare() {
    const text = buildShareText(services);
    if (navigator.share) {
      await navigator.share({ title: "Prettied by Mel – Prices", text });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const displayed = editMode ? draft : services;
  const categories: Category[] = ["basic", "acrylic", "addon"];

  if (previewMode) {
    return <PricingPreview services={services} onClose={() => setPreviewMode(false)} onShare={handleShare} copied={copied} />;
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto w-full">
      <PageHeader
        title="Pricing"
        showBack={false}
        action={
          editMode ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X size={16} />
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={saving}>
                {saving ? "Saving…" : <><Check size={14} className="inline mr-1" />Save</>}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode(true)}
                className="text-zinc-400 hover:text-white transition-colors p-2"
              >
                <Eye size={20} />
              </button>
              <button
                onClick={startEdit}
                className="text-zinc-400 hover:text-[var(--color-pink)] transition-colors p-2"
              >
                <Pencil size={20} />
              </button>
            </div>
          )
        }
      />

      <div className="px-5 pb-6 space-y-6">
        {/* Deposit notice */}
        <div className="rounded-xl bg-[var(--color-pink)]/10 border border-[var(--color-pink)]/20 px-4 py-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-pink)]/20 flex items-center justify-center shrink-0">
            <span className="text-base">💳</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Deposit Required</p>
            <p className="text-zinc-500 text-xs mt-0.5">$10 secures your spot · applied to your total</p>
          </div>
        </div>

        {/* Selection summary */}
        {selectedId && (() => {
          const s = displayed.find(x => x.id === selectedId);
          if (!s) return null;
          return (
            <div className="rounded-xl bg-gradient-to-r from-[var(--color-pink)]/15 to-transparent border border-[var(--color-pink)]/30 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">{s.emoji} {s.name}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{fmtDuration(s.duration ?? 60)}</p>
              </div>
              <p className="text-[var(--color-pink)] font-black text-xl">${s.price}</p>
            </div>
          );
        })()}

        {/* Service groups */}
        {categories.map((cat) => {
          const items = displayed.filter((s) => s.category === cat);
          if (items.length === 0 && !editMode) return null;
          return (
            <div key={cat}>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
                {categoryLabels[cat]}
              </p>
              <div className="space-y-2">
                {items.map((service) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    editMode={editMode}
                    selected={selectedId === service.id}
                    onSelect={() => !editMode && setSelectedId(selectedId === service.id ? null : service.id)}
                    onNameChange={(v) => updateName(service.id, v)}
                    onPriceChange={(v) => updatePrice(service.id, v)}
                    onDurationChange={(v) => updateDuration(service.id, v)}
                    onRemove={() => removeService(service.id)}
                  />
                ))}
                {editMode && (
                  <button
                    onClick={() => addService(cat)}
                    className="flex items-center gap-2 text-xs text-zinc-500 hover:text-[var(--color-pink)] transition-colors px-1 py-2"
                  >
                    <Plus size={14} /> Add service
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServiceRow({
  service, editMode, selected, onSelect,
  onNameChange, onPriceChange, onDurationChange, onRemove,
}: {
  service: Service; editMode: boolean; selected: boolean; onSelect: () => void;
  onNameChange: (v: string) => void; onPriceChange: (v: string) => void;
  onDurationChange: (v: string) => void; onRemove: () => void;
}) {
  return (
    <div
      onClick={!editMode ? onSelect : undefined}
      className={`rounded-xl px-4 py-3.5 border transition-all duration-200 ${
        editMode
          ? "bg-[var(--color-card)] border-[var(--color-border)]"
          : selected
          ? "bg-[var(--color-pink)]/10 border-[var(--color-pink)]/60 cursor-pointer active:scale-[0.98]"
          : "bg-[var(--color-card)] border-[var(--color-border)] cursor-pointer hover:border-zinc-600 active:scale-[0.98]"
      }`}
    >
      {editMode ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl w-7 shrink-0">{service.emoji}</span>
            <input
              className="flex-1 bg-transparent text-white text-sm font-medium outline-none border-b border-zinc-700 focus:border-[var(--color-pink)] pb-0.5 min-w-0"
              value={service.name}
              onChange={(e) => onNameChange(e.target.value)}
            />
            <button onClick={onRemove} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0 ml-1">
              <Trash2 size={15} />
            </button>
          </div>
          <div className="flex gap-4 pl-9">
            <div className="flex items-center gap-1">
              <span className="text-zinc-500 text-xs">$</span>
              <input
                type="number"
                className="w-14 bg-transparent text-[var(--color-pink)] font-bold text-sm outline-none border-b border-zinc-700 focus:border-[var(--color-pink)] pb-0.5"
                value={service.price}
                onChange={(e) => onPriceChange(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-zinc-500 text-xs">⏱</span>
              <input
                type="number"
                className="w-12 bg-transparent text-zinc-300 text-sm outline-none border-b border-zinc-700 focus:border-[var(--color-pink)] pb-0.5"
                value={service.duration ?? 60}
                onChange={(e) => onDurationChange(e.target.value)}
              />
              <span className="text-zinc-500 text-xs">min</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-xl w-7 shrink-0">{service.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${selected ? "text-white" : "text-zinc-200"}`}>{service.name}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{fmtDuration(service.duration ?? 60)}</p>
          </div>
          <span className={`font-bold text-sm shrink-0 ${selected ? "text-[var(--color-pink)]" : "text-[var(--color-pink)]"}`}>
            ${service.price}
          </span>
        </div>
      )}
    </div>
  );
}

function PricingPreview({
  services,
  onClose,
  onShare,
  copied,
}: {
  services: Service[];
  onClose: () => void;
  onShare: () => void;
  copied: boolean;
}) {
  const categories: Category[] = ["basic", "acrylic", "addon"];
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-[var(--color-background)]">
      {/* Shareable card */}
      <div className="w-full max-w-xs rounded-3xl bg-gradient-to-b from-[#1a001a] to-[#0a0a0a] border border-[var(--color-pink)]/30 p-6 shadow-[0_0_40px_var(--color-pink-glow)]">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-playfair text-3xl font-black text-white tracking-widest uppercase">NAILS</h2>
          <p className="font-dancing text-xl text-[var(--color-pink)] text-glow-pink">prettiedbymel</p>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[var(--color-pink)]/50 to-transparent" />
        </div>

        {/* Services */}
        <div className="space-y-4">
          {categories.map((cat) => {
            const items = services.filter((s) => s.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat}>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">{categoryLabels[cat]}</p>
                <div className="space-y-1.5">
                  {items.map((s) => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span className="text-zinc-300">{s.name}</span>
                      <span className="text-[var(--color-pink)] font-bold">${s.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-[var(--color-pink)]/50 to-transparent" />
        <p className="text-center text-zinc-500 text-xs mt-3">DM to book · $10 deposit required</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 w-full max-w-xs">
        <Button variant="outline" fullWidth onClick={onClose}>
          <X size={14} className="inline mr-1.5" />Back
        </Button>
        <Button fullWidth onClick={onShare}>
          <Share2 size={14} className="inline mr-1.5" />
          {copied ? "Copied!" : "Share"}
        </Button>
      </div>
    </div>
  );
}

function buildShareText(services: Service[]): string {
  const lines = ["💅 Prettied by Mel – Price List", ""];
  const cats: Category[] = ["basic", "acrylic", "addon"];
  cats.forEach((cat) => {
    const items = services.filter((s) => s.category === cat);
    if (!items.length) return;
    lines.push(categoryLabels[cat]);
    items.forEach((s) => lines.push(`  ${s.name} – $${s.price}`));
    lines.push("");
  });
  lines.push("DM to book · $10 deposit required");
  return lines.join("\n");
}
