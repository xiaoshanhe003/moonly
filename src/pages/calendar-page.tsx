import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CalendarEntrySheet } from "../components/domain/calendar-entry-sheet";
import { CalendarMonthCard } from "../components/domain/calendar-month-card";
import { useCycleStore } from "../features/cycle/store";
import { Card } from "../components/ui/card";
import { uiTextStyles } from "../components/ui/styles";
import { getCycleSummary } from "../features/cycle/cycle";
import { cn, formatShortDate } from "../lib/utils";

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffInDays(later: Date, earlier: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(later).getTime() - startOfDay(earlier).getTime()) / millisecondsPerDay);
}

function canEditRecentRecord(dateKey: string, today: Date) {
  const daysAgo = diffInDays(today, parseDateKey(dateKey));
  return daysAgo >= 0 && daysAgo < 5;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function buildCalendarMonths(profileLastPeriodStart: string, today: Date) {
  const startMonth = startOfMonth(parseDateKey(profileLastPeriodStart));
  const endMonth = addMonths(startOfMonth(today), 11);
  const monthSpan =
    (endMonth.getFullYear() - startMonth.getFullYear()) * 12 + (endMonth.getMonth() - startMonth.getMonth());

  return Array.from({ length: monthSpan + 1 }, (_, index) => addMonths(startMonth, index));
}

type SelectedEmptyDateBubble = {
  dateKey: string;
  id: number;
  isLeaving: boolean;
};

const STICKY_HEADER_BUFFER = 8;
const INITIAL_CALENDAR_SCROLL_NUDGE = 4;

const legendItems = [
  { label: "月经期", color: "var(--phase-menstrual-400)" },
  { label: "卵泡期", color: "var(--phase-follicular-400)" },
  { label: "排卵期", color: "var(--phase-ovulation-400)" },
  { label: "黄体期", color: "var(--phase-luteal-400)" }
] as const;

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

export function CalendarPage() {
  const profile = useCycleStore((state) => state.profile)!;
  const entries = useCycleStore((state) => state.entries);
  const today = new Date();
  const cycleSummary = getCycleSummary(profile, entries, today);
  const months = buildCalendarMonths(profile.lastPeriodStart, today);
  const currentMonthKey = startOfMonth(today).toISOString();
  const hasScrolledToCurrentMonth = useRef(false);
  const emptyBubbleId = useRef(0);
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const calendarHeaderRef = useRef<HTMLDivElement | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedEmptyDateBubble, setSelectedEmptyDateBubble] = useState<SelectedEmptyDateBubble | null>(null);
  const [visibleMonthKey, setVisibleMonthKey] = useState(currentMonthKey);
  const [stickyHeaderOffset, setStickyHeaderOffset] = useState(0);
  const selectedEntry = selectedDateKey ? entries[selectedDateKey] : undefined;
  const visibleMonth = new Date(visibleMonthKey);
  const visibleMonthLabel = `${visibleMonth.getMonth() + 1}月`;
  const visibleYearLabel = visibleMonth.getFullYear();

  const handleDateClick = (dateKey: string) => {
    if (canEditRecentRecord(dateKey, today)) {
      setSelectedDateKey(dateKey);
      setSelectedEmptyDateBubble(null);
      return;
    }

    if (entries[dateKey]) {
      setSelectedDateKey(dateKey);
      setSelectedEmptyDateBubble(null);
      return;
    }

    setSelectedDateKey(null);
    emptyBubbleId.current += 1;
    setSelectedEmptyDateBubble({
      dateKey,
      id: emptyBubbleId.current,
      isLeaving: false
    });
  };

  useEffect(() => {
    if (!selectedEmptyDateBubble) {
      return;
    }

    if (selectedEmptyDateBubble.isLeaving) {
      const removeTimeoutId = window.setTimeout(() => {
        setSelectedEmptyDateBubble((current) => (current?.id === selectedEmptyDateBubble.id ? null : current));
      }, 200);

      return () => {
        window.clearTimeout(removeTimeoutId);
      };
    }

    const leaveTimeoutId = window.setTimeout(() => {
      setSelectedEmptyDateBubble((current) =>
        current?.id === selectedEmptyDateBubble.id ? { ...current, isLeaving: true } : current
      );
    }, 1000);

    return () => {
      window.clearTimeout(leaveTimeoutId);
    };
  }, [selectedEmptyDateBubble]);

  useLayoutEffect(() => {
    const updateStickyHeaderOffset = () => {
      const shellHeader = document.querySelector("[data-sticky-shell-header]");
      const shellHeaderHeight = shellHeader?.getBoundingClientRect().height ?? 0;
      const calendarHeaderHeight = calendarHeaderRef.current?.getBoundingClientRect().height ?? 0;
      const nextOffset = shellHeaderHeight + calendarHeaderHeight + STICKY_HEADER_BUFFER;

      setStickyHeaderOffset(nextOffset > STICKY_HEADER_BUFFER ? nextOffset : 0);
    };

    updateStickyHeaderOffset();
    window.addEventListener("resize", updateStickyHeaderOffset);

    return () => {
      window.removeEventListener("resize", updateStickyHeaderOffset);
    };
  }, []);

  useLayoutEffect(() => {
    if (hasScrolledToCurrentMonth.current || stickyHeaderOffset === 0) {
      return;
    }

    const currentMonthElement = monthRefs.current[currentMonthKey];

    const firstDayContent = currentMonthElement?.querySelector("[data-calendar-day-content]");
    const firstDayContentTop = firstDayContent?.getBoundingClientRect().top;

    if (firstDayContentTop !== undefined) {
      window.scrollTo({
        top: Math.max(0, window.scrollY + firstDayContentTop - stickyHeaderOffset + INITIAL_CALENDAR_SCROLL_NUDGE),
        left: 0,
        behavior: "auto"
      });
    }

    hasScrolledToCurrentMonth.current = true;
  }, [currentMonthKey, stickyHeaderOffset]);

  useEffect(() => {
    const updateVisibleMonth = () => {
      if (!hasScrolledToCurrentMonth.current) {
        return;
      }

      const threshold = stickyHeaderOffset;
      let nextMonthKey = months[0]?.toISOString() ?? currentMonthKey;

      for (const month of months) {
        const key = month.toISOString();
        const element = monthRefs.current[key];

        if (!element) {
          continue;
        }

        if (element.getBoundingClientRect().top <= threshold) {
          nextMonthKey = key;
        } else {
          break;
        }
      }

      setVisibleMonthKey((current) => (current === nextMonthKey ? current : nextMonthKey));
    };

    updateVisibleMonth();
    window.addEventListener("scroll", updateVisibleMonth, { passive: true });
    window.addEventListener("resize", updateVisibleMonth);

    return () => {
      window.removeEventListener("scroll", updateVisibleMonth);
      window.removeEventListener("resize", updateVisibleMonth);
    };
  }, [currentMonthKey, months, stickyHeaderOffset]);

  return (
    <div className="space-y-4 pb-[calc(8rem+env(safe-area-inset-bottom,0px))]">
      <div
        ref={calendarHeaderRef}
        className="sticky top-[calc(72px+env(safe-area-inset-top,0px))] z-30 -mx-4 bg-[var(--color-canvas)] px-4 sm:-mx-6 sm:px-6"
        data-calendar-sticky-header
      >
        <div className="space-y-6">
          <div className="flex gap-[var(--space-10)] pb-6">
            <div className="min-w-0">
              <p className={cn("leading-none", uiTextStyles.sm, uiTextStyles.muted)}>周期长度</p>
              <p className={cn("mt-2.5 font-semibold leading-none tracking-[-0.04em]", uiTextStyles.md)}>
                {cycleSummary.cycleLength}天
              </p>
            </div>
            <div className="min-w-0">
              <p className={cn("leading-none", uiTextStyles.sm, uiTextStyles.muted)}>月经</p>
              <p className={cn("mt-2.5 font-semibold leading-none tracking-[-0.04em]", uiTextStyles.md)}>
                {cycleSummary.periodLength}天
              </p>
            </div>
            <div className="min-w-0">
              <p className={cn("leading-none", uiTextStyles.sm, uiTextStyles.muted)}>下次月经</p>
              <p className={cn("mt-2.5 whitespace-nowrap font-semibold leading-none tracking-[-0.04em]", uiTextStyles.md)}>
                {formatShortDate(cycleSummary.nextPeriodStart)}
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-baseline gap-2">
              <p className={cn("font-semibold leading-none tracking-[-0.04em]", uiTextStyles.xxl)}>
                {visibleMonthLabel}
              </p>
              <span className={cn("font-semibold leading-none tracking-[-0.04em]", uiTextStyles.xxl)}>
                {visibleYearLabel}
              </span>
            </div>
            <div
              className={cn(
                "grid grid-cols-7 gap-0 border-b border-[color:var(--border)] pb-3 text-center",
                uiTextStyles.xs,
                uiTextStyles.muted
              )}
            >
              {weekdays.map((weekday) => (
                <div key={weekday}>{weekday}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {months.map((month) => (
          <div
            key={month.toISOString()}
            ref={(node) => {
              monthRefs.current[month.toISOString()] = node;
            }}
            style={{
              scrollMarginTop: stickyHeaderOffset
            }}
          >
            <CalendarMonthCard
              monthDate={month}
              profile={profile}
              entries={entries}
              today={today}
              selectedEmptyDateKey={selectedEmptyDateBubble?.dateKey}
              selectedEmptyDateBubbleId={selectedEmptyDateBubble?.id}
              isEmptyDateBubbleLeaving={selectedEmptyDateBubble?.isLeaving}
              onDateClick={handleDateClick}
            />
          </div>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-[var(--color-canvas)] pb-[env(safe-area-inset-bottom,0px)] before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-12 before:bg-gradient-to-t before:from-[var(--color-canvas)] before:to-transparent before:content-['']">
        <Card
          className={[
            "mx-auto flex max-w-md flex-wrap gap-4 rounded-b-none border-b-0 px-4 pb-5 pt-3 text-sm shadow-none sm:px-6",
            uiTextStyles.muted
          ].join(" ")}
        >
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </div>
          ))}
        </Card>
      </div>

      {selectedDateKey ? (
        <CalendarEntrySheet
          date={selectedDateKey}
          entry={selectedEntry}
          canEdit={canEditRecentRecord(selectedDateKey, today)}
          onClose={() => setSelectedDateKey(null)}
        />
      ) : null}
    </div>
  );
}
