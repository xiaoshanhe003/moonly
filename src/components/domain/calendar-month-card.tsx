import { buildMonthGrid } from "../../features/cycle/cycle";
import type { CycleProfile, DailyEntry } from "../../features/cycle/types";
import { cn } from "../../lib/utils";
import { uiTextStyles } from "../ui/styles";
import { getMoodOption, type MoodValue } from "./mood-options";
import { stickerShadowStyles } from "./mood-sticker-styles";

type CalendarMonthCardProps = {
  monthDate: Date;
  profile: CycleProfile;
  entries: Record<string, DailyEntry>;
  today: Date;
  onEntryClick?: (dateKey: string) => void;
};

type CalendarCellTone = {
  background: string;
  color?: string;
};

const phaseFamilyMap: Record<string, string> = {
  "var(--phase-menstrual)": "menstrual",
  "var(--phase-follicular)": "follicular",
  "var(--phase-ovulation)": "ovulation",
  "var(--phase-luteal)": "luteal"
};
const calendarMoodStickerClass: Record<MoodValue, string> = {
  great: "h-[1.875rem] w-[1.875rem]",
  happy: "h-[1.875rem] w-[1.875rem]",
  calm: "h-9 w-9",
  unhappy: "h-[1.875rem] w-[1.875rem]",
  sad: "h-[1.875rem] w-[1.875rem]"
};

function getPhaseShadeColor(phaseColor: string, shade: 100 | 200 | 400) {
  const family = phaseFamilyMap[phaseColor];

  if (!family) {
    return phaseColor;
  }

  return `var(--phase-${family}-${shade})`;
}

function getCalendarCellTone(isPredictable: boolean, phaseColor: string): CalendarCellTone {
  return {
    background: getPhaseShadeColor(phaseColor, isPredictable ? 200 : 100)
  };
}

function getTodayCellTone(phaseColor: string): CalendarCellTone {
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

function DayMarker({
  dayOfMonth,
  isToday,
  tone
}: {
  dayOfMonth: number;
  isToday: boolean;
  tone: CalendarCellTone;
}) {
  return (
    <div className="relative h-5 w-full">
      <span
        className={cn(
          "absolute bottom-0 mx-auto rounded-full",
          isToday ? "inset-x-0 h-5 w-[70%]" : "inset-x-0 h-2 w-[70%]"
        )}
        style={{ background: tone.background }}
        aria-hidden="true"
      />
      <span
        className={cn(
          "absolute inset-0 z-10 inline-flex items-center justify-center text-[length:var(--text-md)] font-semibold leading-none",
          isToday ? "text-white" : "text-[color:var(--foreground)]"
        )}
      >
        {dayOfMonth}
      </span>
    </div>
  );
}

function DayCellContent({
  dateKey,
  dayOfMonth,
  isToday,
  tone,
  moodSticker,
  onEntryClick
}: {
  dateKey: string;
  dayOfMonth: number;
  isToday: boolean;
  tone: CalendarCellTone;
  moodSticker: { imageSrc: string; label: string; value: MoodValue } | null;
  onEntryClick?: (dateKey: string) => void;
}) {
  const content = (
    <>
      <DayMarker dayOfMonth={dayOfMonth} isToday={isToday} tone={tone} />
      {moodSticker ? (
        <img
          src={moodSticker.imageSrc}
          alt=""
          title={moodSticker.label}
          className={cn("mt-1.5 object-contain", stickerShadowStyles.compact, calendarMoodStickerClass[moodSticker.value])}
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  if (!onEntryClick) {
    return (
      <div className="flex w-full flex-col items-center" data-calendar-day-content>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onEntryClick(dateKey)}
      className="flex w-full flex-col items-center transition-transform active:scale-95"
      data-calendar-day-content
      aria-label={`查看 ${dateKey} 的记录`}
    >
      {content}
    </button>
  );
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
      <div className="grid grid-cols-7 gap-x-2" data-calendar-month-heading>
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
          className="row-start-2 mt-1 h-[var(--line-thin)] bg-[color:var(--border)]"
          style={{ gridColumn: `${monthStartColumn} / -1` }}
          aria-hidden="true"
        />
      </div>
      <div className="grid grid-cols-7 gap-x-0 gap-y-0" data-calendar-month-grid>
        {cells.map((cell, index) => {
          const dateKey = formatDateKey(cell.date);
          const entry = entries[dateKey];
          const moodSticker = entry?.mood ? getMoodOption(entry.mood) ?? null : null;
          const isLastRow = index >= cells.length - 7;
          const tone = cell.isToday
            ? getTodayCellTone(cell.phase.color)
            : getCalendarCellTone(cell.isPredictable, cell.phase.color);

          return (
            <div
              key={cell.date.toISOString()}
              className={cn(
                "relative min-h-[var(--calendar-cell-height)] py-[var(--space-2)]",
                isLastRow ? "border-b-0" : "border-b border-[color:var(--border)]"
              )}
              style={{
                gridColumnStart: index === 0 ? cell.date.getDay() + 1 : undefined
              }}
            >
              {!cell.inMonth ? <div className="h-full w-full opacity-0" aria-hidden="true" /> : null}
              {cell.inMonth ? (
                <DayCellContent
                  dateKey={dateKey}
                  dayOfMonth={cell.dayOfMonth}
                  isToday={cell.isToday}
                  tone={tone}
                  moodSticker={moodSticker}
                  onEntryClick={entry ? onEntryClick : undefined}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
