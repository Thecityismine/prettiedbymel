"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged, User,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut as firebaseSignOut, updateProfile,
} from "firebase/auth";
import { restPost, restList } from "@/lib/firestoreRest";
import { ChevronLeft, Clock, ChevronRight, CalendarDays, LogOut, Plus, Lock } from "lucide-react";
import { auth, authReady } from "@/lib/firebase";
import { formatSlot, loadAvailability, getAvailableSlots, defaultAvailability } from "@/lib/availabilityDb";
import { loadServices } from "@/lib/pricingDb";
import { defaultServices } from "@/lib/defaultServices";
import type { Service, Appointment } from "@/lib/types";

type Screen = "auth" | "portal" | "booking";
type AuthMode = "signin" | "signup";
type BookStep = "service" | "datetime" | "review" | "pending";
type PayMethod = "card" | "cashapp" | "zelle";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [screen, setScreen] = useState<Screen>("auth");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        if (ADMIN_EMAIL && u.email === ADMIN_EMAIL) {
          router.replace("/dashboard");
          return;
        }
        setUser(u);
        setScreen("portal");
      } else {
        setUser(null);
        setScreen("auth");
      }
    });
  }, [router]);

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
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = name.trim() || email.split("@")[0];
        await updateProfile(cred.user, { displayName });
        await restPost("clients", {
          name: displayName,
          email,
          phone: phone.trim(),
          firebaseUid: cred.user.uid,
          totalSpent: 0,
          noShowCount: 0,
          depositPaid: false,
          createdAt: new Date().toISOString(),
          source: "self-signup",
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      setError(
        code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential"
          ? "Incorrect email or password."
          : code === "auth/email-already-in-use"
          ? "An account with this email already exists. Sign in instead."
          : code === "auth/weak-password"
          ? "Password must be at least 6 characters."
          : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError("");
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      router.replace("/dashboard");
    } catch {
      setAdminError("Incorrect email or password.");
    } finally {
      setAdminLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center px-6 relative">
      {/* Subtle admin toggle */}
      <button
        onClick={() => { setAdminMode(!adminMode); setAdminError(""); }}
        className="absolute top-6 right-6 text-[var(--color-pink)] opacity-40 hover:opacity-100 transition-opacity drop-shadow-[0_0_6px_var(--color-pink-glow)]"
        aria-label="Business login"
      >
        <Lock size={14} />
      </button>

      <div className="text-center mb-10">
        <h1 className="font-playfair text-5xl font-black text-white tracking-widest uppercase leading-none">
          NAILS
        </h1>
        <p className="font-dancing text-3xl text-[var(--color-pink)] text-glow-pink leading-tight">
          prettiedbymel
        </p>
        <p className="text-zinc-500 text-sm mt-3">
          {adminMode ? "Business login" : "Sign in to book your appointment"}
        </p>
      </div>

      {/* Admin login form */}
      {adminMode ? (
        <div className="w-full max-w-sm">
          <form
            onSubmit={handleAdminLogin}
            className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3"
          >
            <input
              className={inputCls}
              type="email"
              placeholder="Business email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <input
              className={inputCls}
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {adminError && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {adminError}
              </p>
            )}
            <button
              type="submit"
              disabled={adminLoading}
              className="w-full py-3 bg-[var(--color-pink)] text-white font-semibold rounded-xl hover:bg-[var(--color-pink-dark)] transition-colors shadow-[0_0_20px_var(--color-pink-glow)] disabled:opacity-40"
            >
              {adminLoading ? "Signing in…" : "Sign In"}
            </button>
          </form>
          <button
            onClick={() => setAdminMode(false)}
            className="mt-4 w-full text-center text-zinc-600 text-xs hover:text-zinc-400 transition-colors"
          >
            ← Back to booking
          </button>
        </div>
      ) : (
        /* Client login */
        <div className="w-full max-w-sm">
          <form
            onSubmit={handleEmail}
            className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3"
          >
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
              <>
                <input
                  className={inputCls}
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
                <input
                  className={inputCls}
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  required
                />
              </>
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
      )}

      <p className="text-zinc-700 text-xs mt-8 tracking-widest uppercase">Suffern, NY · Home Based</p>
    </main>
  );
}

// ─── Client Portal ─────────────────────────────────────────────────────────────
function ClientPortal({
  user, onBook, onSignOut,
}: {
  user: User; onBook: () => void; onSignOut: () => void;
}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState(user.displayName ?? "");

  useEffect(() => {
    async function load() {
      try {
        const [allAppts, allClients] = await Promise.all([
          restList("appointments"),
          restList("clients"),
        ]);
        const appts = (allAppts as unknown as Appointment[])
          .filter((a) => a.clientId === user.uid)
          .sort((a, b) => b.date.localeCompare(a.date));
        setAppointments(appts);
        const record = allClients.find((c) => c.firebaseUid === user.uid);
        if (record?.name) setClientName(record.name as string);
      } catch {
        // show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.uid]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter((a) => a.date >= today && a.status === "upcoming");
  const past = appointments.filter((a) => a.date < today || a.status !== "upcoming");
  const firstName = (clientName || user.displayName || user.email || "there").split(/[ @]/)[0];

  return (
    <div className="min-h-screen bg-[var(--color-background)] max-w-lg mx-auto w-full flex flex-col">
      <div className="px-5 pt-12 pb-5 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-playfair text-2xl font-black text-white tracking-widest uppercase">NAILS</h1>
            <p className="font-dancing text-lg text-[var(--color-pink)] text-glow-pink leading-tight">prettiedbymel</p>
            <div className="flex gap-3 mt-1.5">
              <a href="https://instagram.com/prettiedbymel" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-[var(--color-pink)] transition-colors" aria-label="Instagram">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="https://tiktok.com/@prettiedbymel" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-[var(--color-pink)] transition-colors" aria-label="TikTok">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.54V6.75a4.85 4.85 0 0 1-1.02-.06Z"/></svg>
              </a>
            </div>
          </div>
          <button onClick={onSignOut} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1">
            <LogOut size={18} />
          </button>
        </div>
        <p className="text-white font-semibold mt-3">Hi, {firstName}! 💅</p>
      </div>

      <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto pb-24">
        <button
          onClick={onBook}
          className="w-full flex items-center gap-4 bg-gradient-to-r from-[var(--color-pink)]/20 to-transparent border border-[var(--color-pink)]/30 hover:border-[var(--color-pink)] rounded-2xl px-5 py-4 transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-[var(--color-pink)] rounded-xl flex items-center justify-center shadow-[0_0_12px_var(--color-pink-glow)] shrink-0">
            <Plus size={20} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-sm">Book Appointment</p>
            <p className="text-zinc-500 text-xs mt-0.5">Reserve your spot in seconds</p>
          </div>
        </button>

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
            <div className="text-center py-10 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl">
              <p className="text-4xl mb-3">💅</p>
              <p className="text-white font-semibold text-sm">No bookings yet</p>
              <p className="text-zinc-500 text-xs mt-1 mb-4">Tap below to book your first appointment</p>
              <button onClick={onBook} className="px-5 py-2.5 bg-[var(--color-pink)] text-white text-sm font-semibold rounded-xl shadow-[0_0_12px_var(--color-pink-glow)] hover:bg-[var(--color-pink-dark)] transition-colors">
                Book now →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((a) => <ApptCard key={a.id} appt={a} />)}
            </div>
          )}
        </div>

        {!loading && past.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Past ({past.length})</p>
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
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [copied, setCopied] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    loadServices()
      .then(setServices)
      .catch(() => setServices(defaultServices))
      .finally(() => setServicesLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    setSlotsLoading(true);
    setSelectedTime("");
    async function loadSlots() {
      function withFallback<T>(p: Promise<T>, fallback: T): Promise<T> {
        const timer = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), 6000));
        return Promise.race([p.catch(() => fallback), timer]);
      }

      const avail = await withFallback(loadAvailability(), defaultAvailability);

      const allAppts = await withFallback(restList("appointments"), []);
      const booked = allAppts
        .filter((d) => d.date === selectedDate && d.status === "upcoming")
        .map((d) => ({
          date: d.date as string,
          time: d.time as string,
          duration: d.duration as number | undefined,
        }));

      const dur = selectedService!.duration ?? 60;
      const all = getAvailableSlots(selectedDate, avail, booked);
      setSlots(all.filter((slot) => {
        const [h, m] = slot.split(":").map(Number);
        return h * 60 + m + dur <= avail.endHour * 60;
      }));
    }
    loadSlots().finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedService]);

  const payDetails = { cashapp: "$zzmell", zelle: "(929) 595-4095" };

  async function handlePay() {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
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
          paymentMethod: "card",
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // card payments require Stripe to be configured
    } finally {
      setSubmitting(false);
    }
  }

  async function handleManualPay() {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      await restPost("appointments", {
        clientId: user.uid,
        clientName: user.displayName ?? user.email?.split("@")[0] ?? "Client",
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        duration: selectedService.duration,
        date: selectedDate,
        time: selectedTime,
        depositPaid: false,
        status: "upcoming",
        notes: `📱 Self-booked · Payment: ${payMethod} (pending)`,
        createdAt: new Date().toISOString(),
        source: "public-booking",
        depositMethod: payMethod,
      });
      setStep("pending");
    } catch {
      // keep on review step if write fails
    } finally {
      setSubmitting(false);
    }
  }

  function copyHandle() {
    const val = payDetails[payMethod as "cashapp" | "zelle"];
    if (val) navigator.clipboard.writeText(val).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const stepIndex = ["service", "datetime", "review"].indexOf(step);

  function goBack() {
    if (step === "service") onBack();
    else if (step === "datetime") setStep("service");
    else if (step === "review") setStep("datetime");
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col max-w-lg mx-auto w-full">
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
        <p className="text-zinc-400 text-sm">Secure your spot with a $10 reservation</p>
        <div className="flex gap-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${stepIndex >= i ? "bg-[var(--color-pink)]" : "bg-zinc-800"}`} />
          ))}
        </div>
      </div>

<div className="flex-1 px-5 py-5 space-y-4 overflow-y-auto overflow-x-hidden pb-10">
        {step === "service" && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Choose a service</p>
            {servicesLoading ? (
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

        {step === "datetime" && (
          <>
            <div className="bg-[var(--color-card)] border border-[var(--color-pink)]/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-white font-semibold text-sm">{selectedService?.name}</span>
              <span className="text-[var(--color-pink)] font-bold">${selectedService?.price}</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Pick a date</p>
              <div className="overflow-hidden rounded-xl">
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full max-w-full block bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[var(--color-pink)] transition-colors"
                />
              </div>
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

        {step === "review" && selectedService && (
          <>
            {/* Booking summary card */}
            <div className="bg-gradient-to-b from-[var(--color-pink)]/15 to-[var(--color-card)] border border-[var(--color-pink)]/20 rounded-2xl p-5 space-y-3">
              <div className="mb-1">
                <p className="text-[var(--color-pink)] text-xl font-black">{selectedService.name}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{selectedService.duration} min session</p>
              </div>
              <Row label="Date" value={new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} />
              <Row label="Time" value={formatSlot(selectedTime)} />
              <Row label="Name" value={user.displayName ?? user.email ?? ""} />
              <div className="h-px bg-[var(--color-border)]" />
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Service total</span>
                <span className="text-white font-semibold">${selectedService.price}</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[var(--color-pink)] font-semibold text-sm">Reservation fee</span>
                  <p className="text-zinc-600 text-xs">Applied toward your total</p>
                </div>
                <span className="text-[var(--color-pink)] font-black text-2xl">$10</span>
              </div>
            </div>

            <p className="text-zinc-600 text-xs text-center">
              ✦ Due to high demand, appointments require a reservation · Your spot is held after payment
            </p>

            {/* Card — primary */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Pay securely</p>
              <button
                onClick={handlePay}
                disabled={submitting}
                className="w-full py-4 bg-[var(--color-pink)] text-white font-bold rounded-xl shadow-[0_0_20px_var(--color-pink-glow)] hover:bg-[var(--color-pink-dark)] transition-colors disabled:opacity-60 active:scale-[0.98]"
              >
                {submitting ? "Redirecting…" : "Secure My Appointment · $10"}
              </button>
              <p className="text-zinc-600 text-xs text-center flex items-center justify-center gap-1">
                <Lock size={10} /> Secure checkout · Powered by Stripe
              </p>
              <p className="text-zinc-700 text-xs text-center">Instant confirmation after payment</p>
            </div>

            {/* CashApp / Zelle — secondary */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Other ways to pay (manual confirmation)</p>
              <div className="flex gap-2">
                {(["cashapp", "zelle"] as PayMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPayMethod(payMethod === m ? "card" : m)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97] ${
                      payMethod === m
                        ? "bg-[var(--color-pink)]/10 border-[var(--color-pink)] text-white"
                        : "bg-[var(--color-card)] border-[var(--color-border)] text-zinc-400"
                    }`}
                  >
                    <span>{m === "cashapp" ? "💚" : "💜"}</span>
                    {m === "cashapp" ? "Cash App" : "Zelle"}
                  </button>
                ))}
              </div>

              {(payMethod === "cashapp" || payMethod === "zelle") && (
                <div className="space-y-3 pt-1">
                  <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">{payMethod === "cashapp" ? "Cash App" : "Zelle"}</p>
                      <p className="text-white font-bold">{payDetails[payMethod]}</p>
                    </div>
                    <button onClick={copyHandle} className="text-xs text-[var(--color-pink)] font-semibold shrink-0 hover:opacity-70 transition-opacity">
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-zinc-500 text-xs text-center px-2">Send exactly $10 and include your name in the note.</p>
                  <button
                    onClick={handleManualPay}
                    disabled={submitting}
                    className="w-full py-4 bg-[var(--color-pink)] text-white font-bold rounded-xl shadow-[0_0_20px_var(--color-pink-glow)] hover:bg-[var(--color-pink-dark)] transition-colors disabled:opacity-60 active:scale-[0.98]"
                  >
                    {submitting ? "Confirming…" : "I've Sent Payment ✓"}
                  </button>
                  <p className="text-zinc-600 text-xs text-center">We'll confirm your appointment shortly</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Pending confirmation (manual payments) */}
        {step === "pending" && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-5">
            <p className="text-6xl">💅</p>
            <h2 className="font-playfair text-3xl font-black text-white tracking-widest uppercase">You&apos;re Almost In!</h2>
            <p className="text-zinc-300 text-base max-w-xs leading-relaxed">
              Your spot is being held. Once we receive your {payMethod === "cashapp" ? "Cash App" : "Zelle"} payment, your appointment is confirmed instantly.
            </p>
            <p className="text-zinc-400 text-sm">
              Questions? DM <span className="text-[var(--color-pink)]">@prettiedbymel</span> on Instagram.
            </p>
            <a
              href="https://instagram.com/prettiedbymel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 text-sm hover:text-[var(--color-pink)] transition-colors"
            >
              View our latest designs → Instagram
            </a>
            <button
              onClick={onBack}
              className="mt-4 text-[var(--color-pink)] text-base font-semibold hover:underline"
            >
              ← Back to my appointments
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-zinc-700 text-xs py-4 tracking-widest uppercase">
        Prettied by Mel · Suffern, NY
      </p>
    </div>
  );
}

// ─── Shared components ─────────────────────────────────────────────────────────
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
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
          appt.status === "upcoming" ? "bg-[var(--color-pink)]/15 text-[var(--color-pink)]" : "bg-zinc-800 text-zinc-500"
        }`}>
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

const inputCls = "w-full bg-black/30 border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[var(--color-pink)] transition-colors";
