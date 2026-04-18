"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged, User,
  signInWithPopup, GoogleAuthProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut as firebaseSignOut, updateProfile,
} from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { ChevronLeft, Clock, ChevronRight, CalendarDays, LogOut, Plus } from "lucide-react";
import { auth, db, authReady } from "@/lib/firebase";
import { formatSlot } from "@/lib/availabilityDb";
import type { Service, Appointment } from "@/lib/types";

type Screen = "auth" | "portal" | "booking";
type AuthMode = "signin" | "signup";
type BookStep = "service" | "datetime" | "review";

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function BookPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [screen, setScreen] = useState<Screen>("auth");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setScreen(u ? "portal" : "auth");
    });
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-pink)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (screen === "auth" || !user) {
    return <AuthScreen onSuccess={() => setScreen("portal")} />;
  }

  if (screen === "booking") {
    return <BookingFlow user={user} onBack={() => setScreen("portal")} />;
  }

  return (
    <ClientPortal
      user={user}
      onBook={() => setScreen("booking")}
      onSignOut={() => { firebaseSignOut(auth); setScreen("auth"); }}
    />
  );
}

// ─── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      onSuccess();
    } catch {
      setError("Google sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      const msg =
        code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential"
          ? "Incorrect email or password."
          : code === "auth/email-already-in-use"
          ? "An account with this email already exists. Sign in instead."
          : code === "auth/weak-password"
          ? "Password must be at least 6 characters."
          : "Something went wrong. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center px-6">
      <div className="text-center mb-10">
        <h1 className="font-playfair text-5xl font-black text-white tracking-widest uppercase leading-none">
          NAILS
        </h1>
        <p className="font-dancing text-3xl text-[var(--color-pink)] text-glow-pink leading-tight">
          prettiedbymel
        </p>
        <p className="text-zinc-500 text-sm mt-3">Sign in to book your appointment</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-semibold py-3.5 rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50 active:scale-[0.98]"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--color-border)]" />
          <span className="text-zinc-600 text-xs">or</span>
          <div className="flex-1 h-px bg-[var(--color-border)]" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmail} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3">
          {/* Tabs */}
          <div className="flex gap-1 bg-black/30 rounded-lg p-1">
            {(["signin", "signup"] as AuthMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  mode === m ? "bg-[var(--color-pink)] text-white" : "text-zinc-500 hover:text-white"
                }`}
              >
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <input
              className={inputCls}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          )}
          <input
            className={inputCls}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className={inputCls}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
          />

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--color-pink)] text-white font-semibold rounded-xl hover:bg-[var(--color-pink-dark)] transition-colors shadow-[0_0_20px_var(--color-pink-glow)] disabled:opacity-40"
          >
            {loading ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>

      <p className="text-zinc-700 text-xs mt-8 tracking-widest uppercase">Suffern, NY · Home Based</p>
    </main>
  );
}

// ─── Client Portal ─────────────────────────────────────────────────────────────
function ClientPortal({
  user,
  onBook,
  onSignOut,
}: {
  user: User;
  onBook: () => void;
  onSignOut: () => void;
}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      await authReady;
      const q = query(
        collection(db, "appointments"),
        where("clientId", "==", user.uid),
        orderBy("date", "desc")
      );
      const snap = await getDocs(q);
      setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
      setLoading(false);
    }
    load();
  }, [user.uid]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter((a) => a.date >= today && a.status === "upcoming");
  const past = appointments.filter((a) => a.date < today || a.status !== "upcoming");
  const firstName = (user.displayName ?? user.email ?? "there").split(/[ @]/)[0];

  return (
    <div className="min-h-screen bg-[var(--color-background)] max-w-lg mx-auto w-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-playfair text-2xl font-black text-white tracking-widest uppercase">NAILS</h1>
            <p className="font-dancing text-lg text-[var(--color-pink)] text-glow-pink leading-tight">prettiedbymel</p>
          </div>
          <button onClick={onSignOut} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1">
            <LogOut size={18} />
          </button>
        </div>
        <p className="text-white font-semibold mt-3">Hi, {firstName}! 💅</p>
      </div>

      <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto pb-10">
        {/* Book CTA */}
        <button
          onClick={onBook}
          className="w-full flex items-center gap-4 bg-gradient-to-r from-[var(--color-pink)]/20 to-transparent border border-[var(--color-pink)]/30 hover:border-[var(--color-pink)] rounded-2xl px-5 py-4 transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-[var(--color-pink)] rounded-xl flex items-center justify-center shadow-[0_0_12px_var(--color-pink-glow)] shrink-0">
            <Plus size={20} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-sm">Book New Appointment</p>
            <p className="text-zinc-500 text-xs mt-0.5">$10 deposit · locks in your slot</p>
          </div>
        </button>

        {/* Upcoming */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
            Upcoming ({loading ? "…" : upcoming.length})
          </p>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-8 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-zinc-500 text-sm">No upcoming appointments</p>
              <button onClick={onBook} className="text-[var(--color-pink)] text-xs mt-2 hover:underline">
                Book now →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((a) => <ApptCard key={a.id} appt={a} />)}
            </div>
          )}
        </div>

        {/* Past */}
        {!loading && past.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
              Past ({past.length})
            </p>
            <div className="space-y-2 opacity-60">
              {past.slice(0, 5).map((a) => <ApptCard key={a.id} appt={a} />)}
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-zinc-700 text-xs py-4 tracking-widest uppercase">
        Prettied by Mel · Suffern, NY
      </p>
    </div>
  );
}

// ─── Booking Flow ──────────────────────────────────────────────────────────────
function BookingFlow({ user, onBack }: { user: User; onBack: () => void }) {
  const [step, setStep] = useState<BookStep>("service");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetch("/api/book/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []));
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    setSlotsLoading(true);
    setSelectedTime("");
    fetch(`/api/book/slots?date=${selectedDate}&duration=${selectedService.duration ?? 60}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedService]);

  async function handlePay() {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientFirebaseUid: user.uid,
        clientName: user.displayName ?? user.email?.split("@")[0] ?? "Client",
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        duration: selectedService.duration,
        date: selectedDate,
        time: selectedTime,
      }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setSubmitting(false);
  }

  const stepIndex = ["service", "datetime", "review"].indexOf(step);

  function goBack() {
    if (step === "service") onBack();
    else if (step === "datetime") setStep("service");
    else setStep("datetime");
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={goBack} className="text-zinc-500 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-playfair text-2xl font-black text-white tracking-widest uppercase">NAILS</h1>
            <p className="font-dancing text-lg text-[var(--color-pink)] text-glow-pink leading-tight">prettiedbymel</p>
          </div>
        </div>
        <p className="text-zinc-400 text-sm">$10 deposit to confirm your appointment</p>
        <div className="flex gap-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${stepIndex >= i ? "bg-[var(--color-pink)]" : "bg-zinc-800"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 py-5 space-y-4 overflow-y-auto pb-10">

        {/* Step 1: Service */}
        {step === "service" && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Choose a service</p>
            {services.length === 0 ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 border-2 border-[var(--color-pink)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
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
                    <p className="text-[var(--color-pink)] font-bold shrink-0">${s.price}</p>
                    <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                  </button>
                ))}
              </div>
            )}
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
                    <p className="text-zinc-600 text-xs mt-1">Please try another date.</p>
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
                onClick={() => setStep("review")}
                className="w-full py-4 bg-[var(--color-pink)] text-white font-bold rounded-xl shadow-[0_0_20px_var(--color-pink-glow)] hover:bg-[var(--color-pink-dark)] transition-colors"
              >
                Continue →
              </button>
            )}
          </>
        )}

        {/* Step 3: Review + Pay */}
        {step === "review" && selectedService && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Review & pay deposit</p>

            <div className="bg-gradient-to-b from-[var(--color-pink)]/15 to-[var(--color-card)] border border-[var(--color-pink)]/20 rounded-2xl p-5 space-y-3">
              <Row label="Service" value={selectedService.name} />
              <Row
                label="Date"
                value={new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                })}
              />
              <Row label="Time" value={formatSlot(selectedTime)} />
              <Row label="Duration" value={`${selectedService.duration} min`} />
              <Row label="Name" value={user.displayName ?? user.email ?? ""} />
              <div className="h-px bg-[var(--color-border)]" />
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Service price</span>
                <span className="text-white font-semibold text-sm">${selectedService.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-pink)] font-semibold text-sm">Deposit due now</span>
                <span className="text-[var(--color-pink)] font-black text-lg">$10</span>
              </div>
            </div>

            <p className="text-zinc-500 text-xs text-center">
              The $10 deposit locks in your appointment. The remaining ${selectedService.price - 10} is due at your visit.
            </p>

            <button
              onClick={handlePay}
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

// ─── Small components ──────────────────────────────────────────────────────────
function ApptCard({ appt }: { appt: Appointment }) {
  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-4">
      <p className="font-semibold text-white text-sm">{appt.serviceName}</p>
      <p className="text-[var(--color-pink)] font-bold text-sm">${appt.price}</p>
      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1.5">
        <span className="flex items-center gap-1">
          <CalendarDays size={10} />
          {new Date(appt.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {formatSlot(appt.time)}
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            appt.status === "upcoming"
              ? "bg-[var(--color-pink)]/15 text-[var(--color-pink)]"
              : "bg-zinc-800 text-zinc-500"
          }`}
        >
          {appt.status}
        </span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-400 text-sm">{label}</span>
      <span className="text-white font-semibold text-sm">{value}</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

const inputCls = "w-full bg-black/30 border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[var(--color-pink)] transition-colors";
