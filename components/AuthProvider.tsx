"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginForm from "./LoginForm";

const PUBLIC_PATHS = ["/book"];
const AUTH_KEY = "pbm_auth";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Skip auth entirely for public client-facing paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  const [user, setUser] = useState<User | null | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem(AUTH_KEY) === "1" ? ("optimistic" as unknown as User) : undefined;
  });

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        localStorage.setItem(AUTH_KEY, "1");
        // If admin email is configured and this user isn't the admin → send to client portal
        if (ADMIN_EMAIL && u.email !== ADMIN_EMAIL) {
          router.replace("/book");
          return;
        }
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
      setUser(u);
    });
  }, [router]);

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
