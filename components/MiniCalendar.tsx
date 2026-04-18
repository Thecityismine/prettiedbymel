"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  markedDates: Set<string>; // "YYYY-MM-DD"
  selected: string | null;
  onSelect: (date: string) => void;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

export default function MiniCalendar({ markedDates, selected, onSelect }: MiniCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = today.toISOString().slice(0, 10);
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function pad(n: number) { return n.toString().padStart(2, "0"); }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="text-zinc-500 hover:text-white transition-colors p-1">
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold text-white">
          {MONTHS[viewMonth]} {viewYear}
        </p>
        <button onClick={nextMonth} className="text-zinc-500 hover:text-white transition-colors p-1">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-zinc-600 py-1">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selected;
          const hasAppt = markedDates.has(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr === selected ? "" : dateStr)}
              className="relative flex flex-col items-center justify-center h-9 rounded-xl transition-all"
              style={{
                background: isSelected ? "var(--color-pink)" : isToday ? "rgba(255,26,173,0.1)" : "transparent",
              }}
            >
              <span className={`text-xs font-medium ${
                isSelected ? "text-white" : isToday ? "text-[var(--color-pink)]" : "text-zinc-300"
              }`}>
                {day}
              </span>
              {hasAppt && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--color-pink)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
