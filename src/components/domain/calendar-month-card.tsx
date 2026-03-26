import { Card } from "../ui/card";
import { buildMonthGrid } from "../../features/cycle/cycle";
import type { CycleProfile, DailyEntry } from "../../features/cycle/types";
import { formatMonth } from "../../lib/utils";

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

type CalendarMonthCardProps = {
  monthDate: Date;
  profile: CycleProfile;
  entries: Record<string, DailyEntry>;
  today: Date;
  onEntryClick?: (dateKey: string) => void;
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CalendarMonthCard({ monthDate, profile, entries, today, onEntryClick }: CalendarMonthCardProps) {
  const cells = buildMonthGrid(profile, entries, monthDate, today).filter((cell) => cell.inMonth);

  return (
    <Card className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">{formatMonth(monthDate)}</h3>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs text-[var(--color-muted)]">
        {weekdays.map((weekday) => (
          <div key={weekday}>{weekday}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, index) => (
          <div key={cell.date.toISOString()} className="relative">
            {entries[formatDateKey(cell.date)] ? (
              <button
                type="button"
                onClick={() => onEntryClick?.(formatDateKey(cell.date))}
                className="flex aspect-square w-full items-center justify-center rounded-full text-sm transition-transform active:scale-95"
                style={{
                  background: cell.isPredictable ? cell.phase.color : "transparent",
                  opacity: cell.isPredictable ? 0.95 : 0.22,
                  outline: cell.isToday ? "2px solid var(--color-ink)" : "none",
                  outlineOffset: "-2px",
                  gridColumnStart: index === 0 ? cell.date.getDay() + 1 : undefined
                }}
                aria-label={`查看 ${formatDateKey(cell.date)} 的记录`}
              >
                {cell.dayOfMonth}
              </button>
            ) : (
              <div
                className="flex aspect-square items-center justify-center rounded-full text-sm"
                style={{
                  background: cell.isPredictable ? cell.phase.color : "transparent",
                  opacity: cell.isPredictable ? 0.58 : 0.22,
                  outline: cell.isToday ? "2px solid var(--color-ink)" : "none",
                  outlineOffset: "-2px",
                  gridColumnStart: index === 0 ? cell.date.getDay() + 1 : undefined
                }}
              >
                {cell.dayOfMonth}
              </div>
            )}
            {entries[formatDateKey(cell.date)] ? (
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[var(--color-ink)]" />
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
