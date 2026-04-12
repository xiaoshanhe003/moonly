import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarEntrySheet } from "../components/domain/calendar-entry-sheet";
import { CalendarMonthCard } from "../components/domain/calendar-month-card";
import { useCycleStore } from "../features/cycle/store";
import { Card } from "../components/ui/card";
import { uiTextStyles } from "../components/ui/styles";

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

const STICKY_HEADER_BUFFER = 8;

const legendItems = [
  { label: "月经期", color: "var(--phase-menstrual)" },
  { label: "卵泡期", color: "var(--phase-follicular)" },
  { label: "排卵期", color: "var(--phase-ovulation)" },
  { label: "黄体期", color: "var(--phase-luteal)" }
] as const;

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
  const [stickyHeaderOffset, setStickyHeaderOffset] = useState(0);
  const selectedEntry = selectedDateKey ? entries[selectedDateKey] : undefined;
  const selectedDateValue = useMemo(
    () => (selectedDateKey ? parseDateKey(selectedDateKey) : null),
    [selectedDateKey]
  );

  useEffect(() => {
    const updateStickyHeaderOffset = () => {
      const stickyHeader = document.querySelector("[data-sticky-shell-header]");
      const stickyHeaderHeight = stickyHeader?.getBoundingClientRect().height ?? 0;
      setStickyHeaderOffset(stickyHeaderHeight > 0 ? stickyHeaderHeight + STICKY_HEADER_BUFFER : 0);
    };

    updateStickyHeaderOffset();
    window.addEventListener("resize", updateStickyHeaderOffset);

    return () => {
      window.removeEventListener("resize", updateStickyHeaderOffset);
    };
  }, []);

  useEffect(() => {
    if (hasScrolledToCurrentMonth.current || stickyHeaderOffset === 0) {
      return;
    }

    currentMonthRef.current?.scrollIntoView({
      block: "start"
    });
    window.scrollBy({ top: -stickyHeaderOffset, behavior: "instant" });
    hasScrolledToCurrentMonth.current = true;
  }, [stickyHeaderOffset]);

  useEffect(() => {
    const updateVisibleMonth = () => {
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
            style={{
              scrollMarginTop: stickyHeaderOffset
            }}
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

      <div className="fixed inset-x-0 bottom-0 z-30">
        <Card
          className={[
            "mx-auto flex max-w-md flex-wrap gap-4 rounded-b-none border-b-0 px-4 pb-5 pt-3 text-sm shadow-none sm:px-6",
            uiTextStyles.muted
          ].join(" ")}
        >
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </div>
          ))}
        </Card>
      </div>

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
