import { uiSurfaceStyles } from "../components/ui/styles";
import { PhaseHeroCard } from "../components/domain/phase-hero-card";
import { QuickLogCard } from "../components/domain/quick-log-card";
import { getCycleSummary } from "../features/cycle/cycle";
import { useCycleStore } from "../features/cycle/store";

export function TodayPage() {
  const profile = useCycleStore((state) => state.profile)!;
  const entries = useCycleStore((state) => state.entries);
  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);
  const entry = entries[dateKey];

  const summary = getCycleSummary(profile, entries, today);

  return (
    <div className="flex flex-1 flex-col">
      <div id="today-phase-hero" className="flex flex-1 flex-col justify-start pt-0">
        <PhaseHeroCard summary={summary} />
      </div>
      <div className="sticky bottom-3 z-[45] mt-auto pt-4">
        <QuickLogCard
          date={dateKey}
          entry={entry}
          className={uiSurfaceStyles.elevated}
        />
      </div>
    </div>
  );
}
