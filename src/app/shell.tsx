import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Settings as SettingsIcon } from "lucide-react";
import { TodayPage } from "../pages/today-page";
import { CalendarPage } from "../pages/calendar-page";
import { OnboardingPage } from "../pages/onboarding-page";
import { DevScenarioBar } from "../components/domain/dev-scenario-bar";
import { InstallAppButton } from "../components/domain/install-app-button";
import { SegmentedControl } from "../components/domain/segmented-control";
import { Button } from "../components/ui/button";
import { useCycleStore } from "../features/cycle/store";
import { getCycleSummary } from "../features/cycle/cycle";
import type { CycleProfile } from "../features/cycle/types";
import { cn, formatShortDate } from "../lib/utils";
import { uiLayoutStyles, uiTextStyles } from "../components/ui/styles";

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

type AppShellProps = {
  initialView: "today" | "calendar";
};

export function AppShell({ initialView }: AppShellProps) {
  const isDev = import.meta.env.DEV;
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useCycleStore((state) => state.profile);
  const setProfile = useCycleStore((state) => state.setProfile);
  const entries = useCycleStore((state) => state.entries);
  const currentView = location.pathname.includes("calendar") ? "calendar" : initialView;
  const previousProfileRef = useRef(profile);
  const previousViewRef = useRef(currentView);
  const [animateQuickLog, setAnimateQuickLog] = useState(false);
  const [importNotice, setImportNotice] = useState("");
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
    const locationState = location.state as { importNotice?: string } | null;

    if (locationState?.importNotice) {
      setImportNotice(locationState.importNotice);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!importNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => setImportNotice(""), 2200);

    return () => window.clearTimeout(timeoutId);
  }, [importNotice]);

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

  const completeOnboarding = (nextProfile: CycleProfile) => {
    setProfile(nextProfile);
    navigate("/today", { replace: true });
  };

  return (
    <main
      className={cn(
        "text-[var(--color-ink)]",
        profile
          ? "flex min-h-dvh flex-col bg-[var(--color-canvas)]"
          : "h-dvh overflow-hidden bg-[var(--color-canvas)]"
      )}
    >
      {profile ? (
        <div
          className={cn(
            "sticky top-0 z-40 w-full",
            uiLayoutStyles.pageHeaderSafeArea,
            currentView === "calendar" && "bg-[var(--color-canvas)] backdrop-blur"
          )}
          data-sticky-shell-header
        >
          <header className="mx-auto max-w-md px-4 sm:px-6">
            <div className={cn(uiLayoutStyles.pageHeaderBar, "flex items-center justify-between gap-3")}>
              <SegmentedControl
                value={currentView}
                onChange={(next) => navigate(next === "today" ? "/today" : "/calendar")}
                items={[
                  { value: "today", label: "今天" },
                  { value: "calendar", label: "日历" }
                ]}
              />
              <div className="flex shrink-0 items-center gap-2">
                <InstallAppButton placement="header" />
                <Button
                  className="size-10 shrink-0 bg-transparent text-[color:var(--foreground)] shadow-none hover:bg-[color:var(--muted)]"
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/settings")}
                  aria-label="打开设置"
                >
                  <SettingsIcon className="size-5" aria-hidden="true" />
                </Button>
              </div>
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
            ? `mx-auto flex w-full max-w-md flex-col gap-4 px-4 sm:px-6 ${
                currentView === "today" ? "min-h-0 flex-1 py-3" : "min-h-screen py-6"
              }`
            : "mx-auto flex h-dvh max-w-md flex-col overflow-hidden"
        }
      >
        {isDev ? <DevScenarioBar /> : null}

        {!profile ? (
          <OnboardingPage onComplete={completeOnboarding} />
        ) : currentView === "today" ? (
          <TodayPage animateQuickLog={animateQuickLog} />
        ) : (
          <CalendarPage onVisibleMonthChange={setVisibleCalendarMonthKey} />
        )}
      </div>

      {importNotice ? (
        <div
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] left-1/2 z-50 -translate-x-1/2 rounded-full border border-[color:var(--border)] bg-[color:var(--card-elevated)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] shadow-[var(--shadow-elevated)]"
          role="status"
        >
          {importNotice}
        </div>
      ) : null}
    </main>
  );
}
