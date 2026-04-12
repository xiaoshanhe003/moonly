import { buildMonthGrid } from "../../features/cycle/cycle";
import type { CycleProfile, DailyEntry } from "../../features/cycle/types";
import { cn } from "../../lib/utils";
import { uiTextStyles } from "../ui/styles";

type CalendarMonthCardProps = {
  monthDate: Date;
  profile: CycleProfile;
  entries: Record<string, DailyEntry>;
  today: Date;
  onEntryClick?: (dateKey: string) => void;
};

function getCalendarCellTone(isPredictable: boolean, hasEntry: boolean, phaseColor: string) {
  if (isPredictable) {
    return {
      background: phaseColor,
      color: "var(--foreground)",
      opacity: hasEntry ? 0.42 : 0.28
    };
  }

  return {
    background: phaseColor,
    color: "var(--foreground)",
    opacity: hasEntry ? 0.82 : 0.6
  };
}

function getTodayCellTone() {
  return {
    background: "var(--foreground)",
    color: "var(--background)",
    opacity: 1
  };
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CalendarMonthCard({ monthDate, profile, entries, today, onEntryClick }: CalendarMonthCardProps) {
  const cells = buildMonthGrid(profile, entries, monthDate, today);

  return (
    <section className="space-y-0">
      <h2 className="mb-4 text-[length:var(--text-lg)] font-semibold leading-none tracking-[-0.04em] text-[color:var(--foreground)]">
        {monthDate.getMonth() + 1}月
      </h2>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, index) => {
          const dateKey = formatDateKey(cell.date);
          const hasEntry = Boolean(entries[dateKey]);
          const tone = cell.isToday
            ? getTodayCellTone()
            : getCalendarCellTone(cell.isPredictable, hasEntry, cell.phase.color);

          return (
            <div
              key={cell.date.toISOString()}
              className="relative"
              style={{
                gridColumnStart: index === 0 ? cell.date.getDay() + 1 : undefined
              }}
            >
              {!cell.inMonth ? <div className="aspect-square w-full rounded-full opacity-0" aria-hidden="true" /> : null}
              {cell.inMonth && hasEntry ? (
              <button
                type="button"
                onClick={() => onEntryClick?.(dateKey)}
                className={cn(
                  "flex aspect-square w-full items-center justify-center rounded-full text-sm transition-transform active:scale-95",
                  cell.inMonth ? "" : uiTextStyles.muted
                )}
                style={{
                  ...tone,
                  outline: cell.isToday ? "2px solid var(--foreground)" : "none",
                  outlineOffset: "-2px"
                }}
                aria-label={`查看 ${dateKey} 的记录`}
              >
                {cell.dayOfMonth}
              </button>
              ) : null}
              {cell.inMonth && !hasEntry ? (
              <div
                className={cn(
                  "flex aspect-square items-center justify-center rounded-full text-sm",
                  cell.inMonth ? "" : uiTextStyles.muted
                )}
                style={{
                  ...tone,
                  outline: cell.isToday ? "2px solid var(--foreground)" : "none",
                  outlineOffset: "-2px"
                }}
              >
                {cell.dayOfMonth}
              </div>
              ) : null}
              {cell.inMonth && hasEntry ? (
                <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[color:var(--foreground)]" />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
