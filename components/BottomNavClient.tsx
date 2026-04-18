"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import BottomNav from "./BottomNav";

export default function BottomNavClient() {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setLoggedIn(!!u));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("pbm_alert_count");
    if (stored) setAlertCount(parseInt(stored, 10));

    const handler = () => {
      const val = localStorage.getItem("pbm_alert_count");
      if (val) setAlertCount(parseInt(val, 10));
    };
    window.addEventListener("pbm_alerts_updated", handler);
    return () => window.removeEventListener("pbm_alerts_updated", handler);
  }, []);

  if (!loggedIn || pathname.startsWith("/book")) return null;

  return <BottomNav alertCount={alertCount} />;
}
