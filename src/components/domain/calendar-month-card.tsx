import { buildMonthGrid } from "../../features/cycle/cycle";
import type { CycleProfile, DailyEntry } from "../../features/cycle/types";
import { cn } from "../../lib/utils";
import { uiTextStyles } from "../ui/styles";
import { getMoodOption } from "./mood-options";
import { MoodStickerGraphic } from "./mood-sticker-graphic";
import { stickerShadowStyles } from "./mood-sticker-styles";
import { getPhaseShadeColor, getPhaseStickerFillColor } from "./phase-colors";

type CalendarMonthCardProps = {
  monthDate: Date;
  profile: CycleProfile;
  entries: Record<string, DailyEntry>;
  today: Date;
  selectedEmptyDateKey?: string | null;
  selectedEmptyDateBubbleId?: number | null;
  isEmptyDateBubbleLeaving?: boolean;
  onDateClick?: (dateKey: string) => void;
};

type CalendarCellTone = {
  background: string;
  dotClassName: string;
};

function getCalendarCellTone(isPredictable: boolean, phaseColor: string): CalendarCellTone {
  return {
    background: getPhaseShadeColor(phaseColor, 200),
    dotClassName: isPredictable ? "h-1.5 w-1.5" : "h-2.5 w-2.5"
  };
}

function getTodayCellTone(phaseColor: string): CalendarCellTone {
  return {
    background: getPhaseShadeColor(phaseColor, 200),
    dotClassName: "h-2.5 w-2.5"
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
  isToday
}: {
  dayOfMonth: number;
  isToday: boolean;
}) {
  return (
    <div className="flex h-5 w-full items-center justify-center">
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full text-[length:var(--text-md)] font-semibold leading-none",
          isToday
            ? "h-5 min-w-5 px-1.5 bg-[color:var(--foreground)] text-[color:var(--background)]"
            : "text-[color:var(--foreground)]"
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
  phaseLabel,
  phaseFillColor,
  moodSticker,
  showPhaseBubble,
  phaseBubbleId,
  isPhaseBubbleLeaving,
  onDateClick
}: {
  dateKey: string;
  dayOfMonth: number;
  isToday: boolean;
  tone: CalendarCellTone;
  phaseLabel: string;
  phaseFillColor: string;
  moodSticker: { value: NonNullable<DailyEntry["mood"]>; label: string } | null;
  showPhaseBubble: boolean;
  phaseBubbleId?: number | null;
  isPhaseBubbleLeaving?: boolean;
  onDateClick?: (dateKey: string) => void;
}) {
  const content = (
    <>
      {showPhaseBubble ? (
        <span
          key={phaseBubbleId}
          className={cn(
            "phase-bubble absolute left-1/2 top-0 z-10 whitespace-nowrap rounded-[0.65rem] border border-[color:var(--border)] bg-[color:var(--card-elevated)] px-2.5 py-1.5 text-sm font-medium leading-none text-[color:var(--foreground)] shadow-[var(--shadow-card)]",
            isPhaseBubbleLeaving
              ? "[animation:phase-bubble-fade_200ms_ease-out_forwards]"
              : "[animation:phase-bubble-float_160ms_ease-out_forwards]"
          )}
          role="status"
        >
          {phaseLabel}
          <span
            className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[color:var(--border)] bg-[color:var(--card-elevated)]"
            aria-hidden="true"
          />
        </span>
      ) : null}
      <DayMarker dayOfMonth={dayOfMonth} isToday={isToday} />
      <div className="mt-1.5 flex h-8 w-full items-center justify-center">
        {moodSticker ? (
          <MoodStickerGraphic
            mood={moodSticker.value}
            title={moodSticker.label}
            fillColor={phaseFillColor}
            className={cn("h-8 max-w-[70%]", stickerShadowStyles.compact)}
          />
        ) : (
          <span
            className={cn("rounded-full", tone.dotClassName)}
            style={{ background: tone.background }}
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );

  if (!onDateClick) {
    return (
      <div className="relative flex w-full flex-col items-center" data-calendar-day-content>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onDateClick(dateKey)}
      className="relative flex w-full flex-col items-center transition-transform active:scale-95"
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
  selectedEmptyDateKey,
  selectedEmptyDateBubbleId,
  isEmptyDateBubbleLeaving,
  onDateClick
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
          const phaseFillColor = getPhaseStickerFillColor(cell.phase.color);
          const showPhaseBubble = selectedEmptyDateKey === dateKey && !entry;

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
                  phaseLabel={cell.phase.label}
                  phaseFillColor={phaseFillColor}
                  moodSticker={moodSticker}
                  showPhaseBubble={showPhaseBubble}
                  phaseBubbleId={selectedEmptyDateBubbleId}
                  isPhaseBubbleLeaving={isEmptyDateBubbleLeaving}
                  onDateClick={onDateClick}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
