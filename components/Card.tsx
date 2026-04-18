interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = "", glow = false, onClick }: CardProps) {
  const base =
    "rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-4 transition-all duration-200";
  const glowClass = glow ? "border-[var(--color-pink)] shadow-[0_0_16px_var(--color-pink-glow)]" : "";
  const clickable = onClick ? "cursor-pointer hover:border-[var(--color-pink)] active:scale-[0.98]" : "";

  return (
    <div className={`${base} ${glowClass} ${clickable} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
