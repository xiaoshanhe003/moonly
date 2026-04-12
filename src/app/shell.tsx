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
import { cn, formatShortDate } from "../lib/utils";
import { uiTextStyles } from "../components/ui/styles";

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
  const visibleMonthLabel = `${visibleCalendarMonth.getMonth() + 1}月`;
  const visibleYearLabel = visibleCalendarMonth.getFullYear();

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
              <div className="mt-6 space-y-6 pb-4">
                <div className="grid grid-cols-3 gap-3 border-b border-[color:var(--border)] pb-6">
                  <div className="min-w-0">
                    <p className={cn("leading-none", uiTextStyles.sm, uiTextStyles.muted)}>周期长度</p>
                    <p className={cn("mt-2.5 leading-none font-semibold tracking-[-0.04em]", uiTextStyles.xxl)}>
                      {cycleSummary.cycleLength}天
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className={cn("leading-none", uiTextStyles.sm, uiTextStyles.muted)}>月经</p>
                    <p className={cn("mt-2.5 leading-none font-semibold tracking-[-0.04em]", uiTextStyles.xxl)}>
                      {cycleSummary.periodLength}天
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className={cn("leading-none", uiTextStyles.sm, uiTextStyles.muted)}>下次月经</p>
                    <p className={cn("mt-2.5 leading-none font-semibold tracking-[-0.04em] whitespace-nowrap", uiTextStyles.xxl)}>
                      {formatShortDate(cycleSummary.nextPeriodStart)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-baseline gap-2">
                    <p className={cn("font-semibold leading-none tracking-[-0.04em]", uiTextStyles.xl)}>
                      {visibleMonthLabel}
                    </p>
                    <span className={cn("leading-none", uiTextStyles.sm, uiTextStyles.muted)}>{visibleYearLabel}</span>
                  </div>
                  <div className={cn("grid grid-cols-7 gap-2.5 text-center", uiTextStyles.xs, uiTextStyles.muted)}>
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

      <div
        className={`mx-auto flex min-h-screen max-w-md flex-col gap-4 px-4 sm:px-6 ${
          currentView === "today" ? "py-3" : "py-6"
        }`}
      >
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
