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
    <div className="flex flex-1 flex-col gap-4 pb-44">
      <PhaseHeroCard summary={summary} />
      <div className="fixed inset-x-4 bottom-4 z-[45] sm:left-1/2 sm:right-auto sm:w-[calc(100%-3rem)] sm:max-w-md sm:-translate-x-1/2">
        <QuickLogCard
          date={dateKey}
          entry={entry}
          className="border-white/85 bg-white/92 shadow-[0_18px_42px_rgba(36,52,51,0.16)] backdrop-blur-xl"
        />
      </div>
    </div>
  );
}
