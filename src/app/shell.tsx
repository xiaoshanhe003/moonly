import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, CircleDot } from "lucide-react";
import { TodayPage } from "../pages/today-page";
import { CalendarPage } from "../pages/calendar-page";
import { OnboardingPage } from "../pages/onboarding-page";
import { DevScenarioBar } from "../components/domain/dev-scenario-bar";
import { SegmentedControl } from "../components/domain/segmented-control";
import { useCycleStore } from "../features/cycle/store";
import { getCycleSummary } from "../features/cycle/cycle";
import { formatMonth, formatShortDate } from "../lib/utils";

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

type AppShellProps = {
  initialView: "today" | "calendar";
};

export function AppShell({ initialView }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useCycleStore((state) => state.profile);
  const entries = useCycleStore((state) => state.entries);
  const currentView = location.pathname.includes("calendar") ? "calendar" : initialView;
  const previousViewRef = useRef(currentView);
  const [visibleCalendarMonthKey, setVisibleCalendarMonthKey] = useState(() =>
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  );

  const cycleSummary = profile ? getCycleSummary(profile, entries, new Date()) : null;
  const visibleCalendarMonth = new Date(visibleCalendarMonthKey);

  useEffect(() => {
    if (currentView === "calendar") {
      setVisibleCalendarMonthKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
    }
  }, [currentView]);

  useEffect(() => {
    if (previousViewRef.current === "calendar" && currentView === "today") {
      requestAnimationFrame(() => {
        const stickyHeader = document.querySelector("[data-sticky-shell-header]");
        const heroCard = document.getElementById("today-phase-hero");
        const stickyHeaderHeight = stickyHeader?.getBoundingClientRect().height ?? 0;
        const targetTop = heroCard?.getBoundingClientRect().top ?? 0;
        const topPadding = 8;

        window.scrollTo({
          top: Math.max(0, window.scrollY + targetTop - stickyHeaderHeight - topPadding),
          left: 0,
          behavior: "auto"
        });
      });
    }

    previousViewRef.current = currentView;
  }, [currentView]);

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      {profile ? (
        <div className="sticky top-0 z-40 w-full bg-[var(--color-canvas)] backdrop-blur" data-sticky-shell-header>
          <header className="mx-auto max-w-md px-4 pt-4 sm:px-6">
            <div className="flex items-center justify-center">
              <SegmentedControl
                value={currentView}
                onChange={(next) => navigate(next === "today" ? "/today" : "/calendar")}
                items={[
                  { value: "today", label: "今天", icon: CircleDot },
                  { value: "calendar", label: "日历", icon: Calendar }
                ]}
              />
            </div>

            {currentView === "calendar" && cycleSummary ? (
              <div className="mt-4 space-y-4 pb-4">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-[var(--color-muted)]">周期长度</p>
                    <p className="mt-1 text-2xl font-semibold">{cycleSummary.cycleLength}天</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-muted)]">月经</p>
                    <p className="mt-1 text-2xl font-semibold">{cycleSummary.periodLength}天</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-muted)]">下次月经</p>
                    <p className="mt-1 text-2xl font-semibold">{formatShortDate(cycleSummary.nextPeriodStart)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-3xl font-semibold leading-none">{formatMonth(visibleCalendarMonth)}</p>
                  <div className="grid grid-cols-7 gap-2 text-center text-xs text-[var(--color-muted)]">
                    {weekdays.map((weekday) => (
                      <div key={weekday}>{weekday}</div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </header>
        </div>
      ) : null}

      <div className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-4 py-6 sm:px-6">
        <DevScenarioBar />

        {!profile ? (
          <OnboardingPage />
        ) : currentView === "today" ? (
          <TodayPage />
        ) : (
          <CalendarPage onVisibleMonthChange={setVisibleCalendarMonthKey} />
        )}
      </div>
    </main>
  );
}
