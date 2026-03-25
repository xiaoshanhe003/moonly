import { Card } from "../ui/card";
import { buildMonthGrid } from "../../features/cycle/cycle";
import type { CycleProfile } from "../../features/cycle/types";
import { formatMonth } from "../../lib/utils";

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

type CalendarMonthCardProps = {
  monthDate: Date;
  profile: CycleProfile;
  today: Date;
};

export function CalendarMonthCard({ monthDate, profile, today }: CalendarMonthCardProps) {
  const cells = buildMonthGrid(profile, monthDate, today);

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
        {cells.map((cell) => (
          <div
            key={cell.date.toISOString()}
            className="flex aspect-square items-center justify-center rounded-full text-sm"
            style={{
              background: cell.inMonth ? cell.phase.color : "transparent",
              opacity: cell.inMonth ? 0.9 : 0.3,
              outline: cell.isToday ? "2px solid var(--color-ink)" : "none",
              outlineOffset: "-2px"
            }}
          >
            {cell.dayOfMonth}
          </div>
        ))}
      </div>
    </Card>
  );
}
