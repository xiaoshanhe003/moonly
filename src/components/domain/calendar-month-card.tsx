import { Card } from "../ui/card";
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

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CalendarMonthCard({ monthDate, profile, entries, today, onEntryClick }: CalendarMonthCardProps) {
  const cells = buildMonthGrid(profile, entries, monthDate, today);
  const monthLabelColumnStart = monthDate.getDay() + 1;

  return (
    <Card className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        <div
          className="text-sm font-semibold text-[color:var(--phase-menstrual)]"
          style={{ gridColumnStart: monthLabelColumnStart }}
        >
          {monthDate.getMonth() + 1}月
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, index) => (
          <div
            key={cell.date.toISOString()}
            className="relative"
            style={{
              gridColumnStart: index === 0 ? cell.date.getDay() + 1 : undefined
            }}
          >
            {!cell.inMonth ? <div className="aspect-square w-full rounded-full opacity-0" aria-hidden="true" /> : null}
            {cell.inMonth && entries[formatDateKey(cell.date)] ? (
              <button
                type="button"
                onClick={() => onEntryClick?.(formatDateKey(cell.date))}
                className={cn(
                  "flex aspect-square w-full items-center justify-center rounded-full text-sm transition-transform active:scale-95",
                  cell.inMonth ? "text-[color:var(--foreground)]" : uiTextStyles.muted
                )}
                style={{
                  background: cell.isPredictable ? cell.phase.color : "transparent",
                  opacity: cell.isPredictable ? 0.95 : 0.22,
                  outline: cell.isToday ? "2px solid var(--foreground)" : "none",
                  outlineOffset: "-2px"
                }}
                aria-label={`查看 ${formatDateKey(cell.date)} 的记录`}
              >
                {cell.dayOfMonth}
              </button>
            ) : null}
            {cell.inMonth && !entries[formatDateKey(cell.date)] ? (
              <div
                className={cn(
                  "flex aspect-square items-center justify-center rounded-full text-sm",
                  cell.inMonth ? "text-[color:var(--foreground)]" : uiTextStyles.muted
                )}
                style={{
                  background: cell.isPredictable ? cell.phase.color : "transparent",
                  opacity: cell.isPredictable ? 0.58 : 0.22,
                  outline: cell.isToday ? "2px solid var(--foreground)" : "none",
                  outlineOffset: "-2px"
                }}
              >
                {cell.dayOfMonth}
              </div>
            ) : null}
            {cell.inMonth && entries[formatDateKey(cell.date)] ? (
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[color:var(--foreground)]" />
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
