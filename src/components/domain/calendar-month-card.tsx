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

const moodEmojiMap: Record<NonNullable<DailyEntry["mood"]>, string> = {
  happy: "😄",
  calm: "🙂",
  tense: "😣"
};

const phaseFamilyMap: Record<string, string> = {
  "var(--phase-menstrual)": "menstrual",
  "var(--phase-follicular)": "follicular",
  "var(--phase-ovulation)": "ovulation",
  "var(--phase-luteal)": "luteal"
};

function getPhaseShadeColor(phaseColor: string, shade: 100 | 200 | 400) {
  const family = phaseFamilyMap[phaseColor];

  if (!family) {
    return phaseColor;
  }

  return `var(--phase-${family}-${shade})`;
}

function getCalendarCellTone(isPredictable: boolean, phaseColor: string) {
  return {
    background: getPhaseShadeColor(phaseColor, isPredictable ? 200 : 100)
  };
}

function getTodayCellTone(phaseColor: string) {
  return {
    background: getPhaseShadeColor(phaseColor, 400),
    color: "white"
  };
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CalendarMonthCard({
  monthDate,
  profile,
  entries,
  today,
  onEntryClick
}: CalendarMonthCardProps) {
  const cells = buildMonthGrid(profile, entries, monthDate, today);
  const monthStartColumn = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay() + 1;

  return (
    <section className="space-y-0 pt-5 first:pt-0">
      <div className="mb-3 grid grid-cols-7 gap-x-2">
        <h2
          className={cn(
            "justify-self-center font-semibold leading-none tracking-[-0.04em] text-[color:var(--foreground)]",
            uiTextStyles.md
          )}
          style={{ gridColumnStart: monthStartColumn }}
        >
          {monthDate.getMonth() + 1}月
        </h2>
        <div
          className="row-start-2 mt-3 h-[var(--line-thin)] bg-[color:var(--border)]"
          style={{ gridColumn: `${monthStartColumn} / -1` }}
          aria-hidden="true"
        />
      </div>
      <div className="grid grid-cols-7 gap-x-0 gap-y-0">
        {cells.map((cell, index) => {
          const dateKey = formatDateKey(cell.date);
          const entry = entries[dateKey];
          const hasEntry = Boolean(entry);
          const moodEmoji = entry?.mood ? moodEmojiMap[entry.mood] : null;
          const tone = cell.isToday
            ? getTodayCellTone(cell.phase.color)
            : getCalendarCellTone(cell.isPredictable, cell.phase.color);

          return (
            <div
              key={cell.date.toISOString()}
              className={cn(
                "relative min-h-[var(--calendar-cell-height)] pt-1",
                cell.inMonth ? "border-b border-[color:var(--border)]" : "border-b border-transparent"
              )}
              style={{
                gridColumnStart: index === 0 ? cell.date.getDay() + 1 : undefined
              }}
            >
              {!cell.inMonth ? <div className="h-full w-full opacity-0" aria-hidden="true" /> : null}
              {cell.inMonth && hasEntry ? (
                <button
                  type="button"
                  onClick={() => onEntryClick?.(dateKey)}
                  className="flex w-full flex-col items-center transition-transform active:scale-95"
                  aria-label={`查看 ${dateKey} 的记录`}
                >
                  <div className="relative flex h-6 w-full items-start justify-center">
                    <span
                      className={cn(
                        "relative z-10 inline-flex items-center justify-center text-[length:var(--text-md)] font-semibold leading-none",
                        cell.isToday
                          ? "h-6 min-w-[2rem] rounded-full px-2"
                          : "size-7 rounded-full text-[color:var(--foreground)]"
                      )}
                      style={cell.isToday ? tone : undefined}
                    >
                      {cell.dayOfMonth}
                    </span>
                    {!cell.isToday ? (
                      <span
                        className="absolute bottom-0 h-1.5 w-[70%] rounded-full"
                        style={{
                          background: tone.background
                        }}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  {moodEmoji ? (
                    <span className={cn("mt-2 leading-none", uiTextStyles.xl)} aria-hidden="true">
                      {moodEmoji}
                    </span>
                  ) : null}
                </button>
              ) : null}
              {cell.inMonth && !hasEntry ? (
                <div className="flex w-full flex-col items-center">
                  <div className="relative flex h-6 w-full items-start justify-center">
                    <span
                      className={cn(
                        "relative z-10 inline-flex items-center justify-center text-[length:var(--text-md)] font-semibold leading-none",
                        cell.isToday
                          ? "h-6 min-w-[2rem] rounded-full px-2"
                          : "size-7 rounded-full text-[color:var(--foreground)]"
                      )}
                      style={cell.isToday ? tone : undefined}
                    >
                      {cell.dayOfMonth}
                    </span>
                    {!cell.isToday ? (
                      <span
                        className="absolute bottom-0 h-1.5 w-[70%] rounded-full"
                        style={{
                          background: tone.background
                        }}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
