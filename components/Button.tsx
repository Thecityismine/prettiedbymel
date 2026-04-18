interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base = "font-semibold rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-40";

  const variants = {
    primary: "bg-[var(--color-pink)] text-white hover:bg-[var(--color-pink-dark)] shadow-[0_0_16px_var(--color-pink-glow)]",
    outline: "border border-[var(--color-pink)] text-[var(--color-pink)] hover:bg-[var(--color-pink)] hover:text-white",
    ghost: "text-zinc-400 hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
