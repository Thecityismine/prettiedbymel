"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Button from "@/components/Button";
import { addClient } from "@/lib/clientsDb";

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setSaving(true);
    await addClient({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      notes: form.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    router.push("/clients");
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto w-full">
      <PageHeader title="New Client" />

      <form onSubmit={handleSubmit} className="px-5 pb-6 space-y-4">
        {/* Avatar preview */}
        <div className="flex justify-center py-4">
          <div className="w-20 h-20 rounded-full bg-[var(--color-pink)]/15 border-2 border-[var(--color-pink)]/30 flex items-center justify-center text-2xl font-bold text-[var(--color-pink)]">
            {form.name ? form.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "?"}
          </div>
        </div>

        <Field label="Name *" placeholder="e.g. Sofia Rodriguez">
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </Field>

        <Field label="Phone *" placeholder="e.g. 555-123-4567">
          <input
            className={inputCls}
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            required
          />
        </Field>

        <Field label="Email" placeholder="optional">
          <input
            className={inputCls}
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>

        <Field label="Notes" placeholder="Nail preferences, allergies, fave shapes…">
          <textarea
            className={`${inputCls} resize-none h-24`}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>

        <Button type="submit" fullWidth size="lg" disabled={saving || !form.name || !form.phone}>
          {saving ? "Saving…" : "Add Client"}
        </Button>
      </form>
    </div>
  );
}

const inputCls =
  "w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[var(--color-pink)] transition-colors";

function Field({ label, placeholder, children }: { label: string; placeholder?: string; children: React.ReactNode }) {
  void placeholder;
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}
