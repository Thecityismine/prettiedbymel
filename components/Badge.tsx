type BadgeVariant = "paid" | "unpaid" | "overdue" | "upcoming" | "done" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const styles: Record<BadgeVariant, string> = {
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  unpaid: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  overdue: "bg-red-500/15 text-red-400 border-red-500/30",
  upcoming: "bg-[var(--color-pink)]/15 text-[var(--color-pink)] border-[var(--color-pink)]/30",
  done: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  default: "bg-white/5 text-zinc-300 border-white/10",
};

export default function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles[variant]}`}>
      {children}
    </span>
  );
}
