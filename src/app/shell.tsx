import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const isDev = import.meta.env.DEV;
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useCycleStore((state) => state.profile);
  const entries = useCycleStore((state) => state.entries);
  const currentView = location.pathname.includes("calendar") ? "calendar" : initialView;
  const previousProfileRef = useRef(profile);
  const previousViewRef = useRef(currentView);
  const [animateQuickLog, setAnimateQuickLog] = useState(false);
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

  useLayoutEffect(() => {
    if (!previousProfileRef.current && profile) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      setAnimateQuickLog(true);
    } else if (!profile) {
      setAnimateQuickLog(false);
    }

    previousProfileRef.current = profile;
  }, [profile]);

  useLayoutEffect(() => {
    if (previousViewRef.current === "calendar" && currentView === "today") {
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
    }

    previousViewRef.current = currentView;
  }, [currentView]);

  return (
    <main
      className={cn(
        "text-[var(--color-ink)]",
        profile
          ? "min-h-screen bg-[var(--color-canvas)]"
          : "h-dvh overflow-hidden bg-[var(--color-canvas)]"
      )}
    >
      {profile ? (
        <div
          className={cn(
            "sticky top-0 z-40 w-full",
            currentView === "calendar" && "bg-[var(--color-canvas)] backdrop-blur"
          )}
          data-sticky-shell-header
        >
          <header className="mx-auto max-w-md px-4 pt-4 sm:px-6">
            <div className="flex items-center justify-center">
              <SegmentedControl
                value={currentView}
                onChange={(next) => navigate(next === "today" ? "/today" : "/calendar")}
                items={[
                  { value: "today", label: "今天" },
                  { value: "calendar", label: "日历" }
                ]}
              />
            </div>

            {currentView === "calendar" && cycleSummary ? (
              <div className="mt-6 space-y-6">
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
            ) : null}
          </header>
        </div>
      ) : null}

      <div
        className={
          profile
            ? `mx-auto flex min-h-screen max-w-md flex-col gap-4 px-4 sm:px-6 ${
                currentView === "today" ? "py-3" : "py-6"
              }`
            : "mx-auto flex h-dvh max-w-md flex-col overflow-hidden"
        }
      >
        {isDev ? <DevScenarioBar /> : null}

        {!profile ? (
          <OnboardingPage />
        ) : currentView === "today" ? (
          <TodayPage animateQuickLog={animateQuickLog} />
        ) : (
          <CalendarPage onVisibleMonthChange={setVisibleCalendarMonthKey} />
        )}
      </div>
    </main>
  );
}
