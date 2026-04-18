"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, CalendarDays, Sparkles, Bell } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/appointments", icon: CalendarDays, label: "Book" },
  { href: "/pricing", icon: Sparkles, label: "Pricing" },
  { href: "/alerts", icon: Bell, label: "Alerts" },
];

export default function BottomNav({ alertCount = 0 }: { alertCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-card)] border-t border-[var(--color-border)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/") && href !== "/";
          const isAlerts = href === "/alerts";
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 flex-1 py-2"
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={active ? "text-[var(--color-pink)]" : "text-zinc-500"}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {isAlerts && alertCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-[var(--color-pink)] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide ${active ? "text-[var(--color-pink)]" : "text-zinc-500"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
