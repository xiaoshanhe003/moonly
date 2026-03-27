import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarEntrySheet } from "../components/domain/calendar-entry-sheet";
import { CalendarMonthCard } from "../components/domain/calendar-month-card";
import { useCycleStore } from "../features/cycle/store";
import { Card } from "../components/ui/card";

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
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

type CalendarPageProps = {
  onVisibleMonthChange?: (monthKey: string) => void;
};

export function CalendarPage({ onVisibleMonthChange }: CalendarPageProps) {
  const profile = useCycleStore((state) => state.profile)!;
  const entries = useCycleStore((state) => state.entries);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const months = buildCalendarMonths(profile.lastPeriodStart, today);
  const currentMonthKey = startOfMonth(today).toISOString();
  const currentMonthRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledToCurrentMonth = useRef(false);
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [visibleMonthKey, setVisibleMonthKey] = useState(currentMonthKey);
  const selectedEntry = selectedDateKey ? entries[selectedDateKey] : undefined;
  const selectedDateValue = useMemo(
    () => (selectedDateKey ? parseDateKey(selectedDateKey) : null),
    [selectedDateKey]
  );
  useEffect(() => {
    if (hasScrolledToCurrentMonth.current) {
      return;
    }

    currentMonthRef.current?.scrollIntoView({
      block: "start"
    });
    window.scrollBy({ top: -280, behavior: "instant" });
    hasScrolledToCurrentMonth.current = true;
  }, []);

  useEffect(() => {
    const updateVisibleMonth = () => {
      const threshold = 220;
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
  }, [currentMonthKey, months]);

  useEffect(() => {
    onVisibleMonthChange?.(visibleMonthKey);
  }, [onVisibleMonthChange, visibleMonthKey]);

  return (
    <div className="space-y-4 pb-32">
      <div className="space-y-4">
        {months.map((month) => (
          <div
            key={month.toISOString()}
            ref={(node) => {
              monthRefs.current[month.toISOString()] = node;
              if (month.toISOString() === currentMonthKey) {
                currentMonthRef.current = node;
              }
            }}
            className={month.toISOString() === currentMonthKey ? "scroll-mt-72" : undefined}
          >
            <CalendarMonthCard
              monthDate={month}
              profile={profile}
              entries={entries}
              today={today}
              onEntryClick={setSelectedDateKey}
            />
          </div>
        ))}
      </div>

      <Card className="sticky bottom-4 z-30 bg-white/92 flex flex-wrap gap-4 text-sm text-[var(--color-muted)]">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[var(--color-rose)]" />
          月经期
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[var(--color-accent)]" />
          卵泡期
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[var(--color-gold)]" />
          排卵期
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[var(--color-blue)]" />
          黄体期
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[var(--color-ink)]" />
          已记录
        </div>
        <div>浅色日期表示预测</div>
      </Card>

      {selectedDateKey && selectedEntry && selectedDateValue ? (
        <CalendarEntrySheet
          date={selectedDateKey}
          dateValue={selectedDateValue}
          entry={selectedEntry}
          isToday={selectedDateKey === todayKey}
          onClose={() => setSelectedDateKey(null)}
        />
      ) : null}
    </div>
  );
}
