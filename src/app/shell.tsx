import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Circle, Sparkles } from "lucide-react";
import { TodayPage } from "../pages/today-page";
import { CalendarPage } from "../pages/calendar-page";
import { OnboardingPage } from "../pages/onboarding-page";
import { DevScenarioBar } from "../components/domain/dev-scenario-bar";
import { SegmentedControl } from "../components/domain/segmented-control";
import { useCycleStore } from "../features/cycle/store";
import { Button } from "../components/ui/button";
import { getCycleSummary } from "../features/cycle/cycle";
import { cn } from "../lib/utils";

type AppShellProps = {
  initialView: "today" | "calendar";
};

export function AppShell({ initialView }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useCycleStore((state) => state.profile);
  const currentView = location.pathname.includes("calendar") ? "calendar" : initialView;

  const cycleSummary = profile ? getCycleSummary(profile, new Date()) : null;

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-4 py-6 text-[var(--color-ink)] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col gap-4">
        <header className="rounded-[32px] border border-white/70 bg-white/70 p-4 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[var(--color-muted)]">
                Moonly
              </p>
              <h1 className="mt-1 font-['Avenir_Next','Manrope','Segoe_UI',sans-serif] text-2xl font-semibold">
                {currentView === "today" ? "Today view" : "Calendar view"}
              </h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => useCycleStore.getState().reset()}>
              <Sparkles className="size-4" />
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <SegmentedControl
              value={currentView}
              onChange={(next) => navigate(next === "today" ? "/today" : "/calendar")}
              items={[
                { value: "today", label: "今日", icon: Circle },
                { value: "calendar", label: "日历", icon: CalendarDays }
              ]}
            />

            <div
              className={cn(
                "rounded-2xl px-3 py-2 text-right text-xs",
                cycleSummary
                  ? "bg-[var(--color-panel)] text-[var(--color-muted)]"
                  : "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
              )}
            >
              {cycleSummary ? (
                <>
                  <p>{cycleSummary.phase.label}</p>
                  <p className="font-semibold text-[var(--color-ink)]">
                    Day {cycleSummary.dayOfCycle}
                  </p>
                </>
              ) : (
                <>
                  <p>首次使用</p>
                  <p className="font-semibold text-[var(--color-ink)]">建立基础数据</p>
                </>
              )}
            </div>
          </div>
        </header>

        <DevScenarioBar />

        {!profile ? (
          <OnboardingPage />
        ) : currentView === "today" ? (
          <TodayPage />
        ) : (
          <CalendarPage />
        )}
      </div>
    </main>
  );
}
