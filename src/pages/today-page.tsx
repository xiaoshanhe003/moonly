import { uiSurfaceStyles } from "../components/ui/styles";
import { PhaseHeroCard } from "../components/domain/phase-hero-card";
import { QuickLogCard } from "../components/domain/quick-log-card";
import { getCycleSummary } from "../features/cycle/cycle";
import { useCycleStore } from "../features/cycle/store";

type TodayPageProps = {
  animateQuickLog?: boolean;
};

export function TodayPage({ animateQuickLog = false }: TodayPageProps) {
  const profile = useCycleStore((state) => state.profile)!;
  const entries = useCycleStore((state) => state.entries);
  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);
  const entry = entries[dateKey];

  const summary = getCycleSummary(profile, entries, today);

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-[var(--quick-log-bottom-gap)]">
      <div id="today-phase-hero" className="flex min-h-0 flex-1 flex-col pt-0">
        <PhaseHeroCard summary={summary} />
      </div>
      <div className="quick-log-sticky-shell sticky z-[45] mt-auto shrink-0 pt-8">
        <QuickLogCard
          date={dateKey}
          entry={entry}
          className={`${uiSurfaceStyles.elevated} ${animateQuickLog ? "motion-safe:animate-[quick-log-enter_620ms_cubic-bezier(0.16,1,0.3,1)_both]" : ""}`}
        />
      </div>
    </div>
  );
}
