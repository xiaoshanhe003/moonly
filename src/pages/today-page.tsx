import { useRef } from "react";
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
  const initialAdviceRef = useRef(summary.phase.advice);
  const stableSummary = {
    ...summary,
    phase: {
      ...summary.phase,
      advice: initialAdviceRef.current
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 pb-6">
      <PhaseHeroCard summary={stableSummary} />
      <div className="mt-auto">
        <QuickLogCard date={dateKey} entry={entry} />
      </div>
    </div>
  );
}
