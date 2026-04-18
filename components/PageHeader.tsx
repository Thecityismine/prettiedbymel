"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  action?: React.ReactNode;
}

export default function PageHeader({ title, showBack = true, action }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between px-5 pt-12 pb-4">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
