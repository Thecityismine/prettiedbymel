"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginForm from "./LoginForm";

const PUBLIC_PATHS = ["/book"];

const AUTH_KEY = "pbm_auth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }
  // Optimistic: if we've seen a logged-in session before, assume still logged in.
  // onAuthStateChanged will correct to null within ~100ms if the session expired.
  const [user, setUser] = useState<User | null | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem(AUTH_KEY) === "1" ? ("optimistic" as unknown as User) : undefined;
  });

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) localStorage.setItem(AUTH_KEY, "1");
      else localStorage.removeItem(AUTH_KEY);
      setUser(u);
    });
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-6 h-6 border-2 border-[var(--color-pink)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <>{children}</>;
}
