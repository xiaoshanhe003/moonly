import { scenarios } from "../../mocks/scenarios";
import { useCycleStore } from "../../features/cycle/store";

export function DevScenarioBar() {
  const activeScenario = useCycleStore((state) => state.activeScenario);
  const loadScenario = useCycleStore((state) => state.loadScenario);

  return (
    <div className="rounded-[24px] border border-dashed border-[var(--color-border)] bg-white/55 p-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(scenarios).map(([key, scenario]) => (
          <button
            key={key}
            type="button"
            onClick={() => loadScenario(key as keyof typeof scenarios)}
            className={
              activeScenario === key
                ? "rounded-full bg-[var(--color-ink)] px-3 py-1.5 text-xs text-white"
                : "rounded-full bg-[var(--color-panel)] px-3 py-1.5 text-xs text-[var(--color-muted)]"
            }
          >
            {scenario.label}
          </button>
        ))}
      </div>
    </div>
  );
}
