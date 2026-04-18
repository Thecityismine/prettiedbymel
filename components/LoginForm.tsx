"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
    } catch {
      setError("Incorrect email or password. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-background)]">
      {/* Brand */}
      <div className="text-center mb-10">
        <h1 className="font-playfair text-5xl font-black text-white tracking-widest uppercase leading-none">
          NAILS
        </h1>
        <p className="font-dancing text-3xl text-[var(--color-pink)] text-glow-pink leading-tight">
          prettiedbymel
        </p>
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 space-y-4"
      >
        <div>
          <p className="text-white font-semibold text-lg mb-0.5">Welcome back 💅</p>
          <p className="text-zinc-500 text-sm">Sign in to manage your business</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              type="email"
              className="w-full bg-black/30 border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[var(--color-pink)] transition-colors"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
              Password
            </label>
            <input
              type="password"
              className="w-full bg-black/30 border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[var(--color-pink)] transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full py-3.5 bg-[var(--color-pink)] text-white font-semibold rounded-xl hover:bg-[var(--color-pink-dark)] transition-colors shadow-[0_0_20px_var(--color-pink-glow)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="text-zinc-600 text-xs mt-8 tracking-widest uppercase">
        Suffern, NY · Home Based
      </p>
    </main>
  );
}
