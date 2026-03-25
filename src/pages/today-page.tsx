import { ActionHintsCard } from "../components/domain/action-hints-card";
import { PhaseHeroCard } from "../components/domain/phase-hero-card";
import { QuickLogCard } from "../components/domain/quick-log-card";
import { getCycleSummary } from "../features/cycle/cycle";
import { useCycleStore } from "../features/cycle/store";

export function TodayPage() {
  const profile = useCycleStore((state) => state.profile)!;
  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);
  const entry = useCycleStore((state) => state.entries[dateKey]);

  const summary = getCycleSummary(profile, today);

  return (
    <div className="space-y-4 pb-6">
      <PhaseHeroCard summary={summary} />
      <ActionHintsCard dos={summary.phase.dos} donts={summary.phase.donts} />
      <QuickLogCard date={dateKey} entry={entry} />
    </div>
  );
}
