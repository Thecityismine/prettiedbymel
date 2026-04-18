"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

export default function BottomNavClient() {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);

  if (pathname.startsWith("/book")) return null;

  useEffect(() => {
    // Read alert count that the home/alerts page stores after computing
    const stored = localStorage.getItem("pbm_alert_count");
    if (stored) setAlertCount(parseInt(stored, 10));

    // Listen for updates from other pages
    const handler = () => {
      const val = localStorage.getItem("pbm_alert_count");
      if (val) setAlertCount(parseInt(val, 10));
    };
    window.addEventListener("pbm_alerts_updated", handler);
    return () => window.removeEventListener("pbm_alerts_updated", handler);
  }, []);

  return <BottomNav alertCount={alertCount} />;
}
