import { useState } from "react";
import { ChevronLeft, ChevronRight, FlaskConical } from "lucide-react";
import { scenarios } from "../../mocks/scenarios";
import { useCycleStore } from "../../features/cycle/store";
import { cn } from "../../lib/utils";

export function DevScenarioBar() {
  const activeScenario = useCycleStore((state) => state.activeScenario);
  const loadScenario = useCycleStore((state) => state.loadScenario);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="pointer-events-none fixed left-0 top-24 z-30 flex max-w-[calc(100vw-1rem)] items-start">
      <aside
        className={cn(
          "pointer-events-auto ml-2 flex w-72 flex-col gap-3 rounded-[24px] border border-dashed border-[var(--color-border)] bg-white/88 p-3 shadow-[var(--shadow-card)] backdrop-blur transition-transform duration-300",
          isCollapsed && "-translate-x-[calc(100%-3rem)]"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              <FlaskConical className="size-3.5" />
              Dev scenarios
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">切换页面状态，不影响实际布局。</p>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-panel)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-panel-strong)]"
            aria-label={isCollapsed ? "展开开发面板" : "收起开发面板"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        <div
          className={cn(
            "flex flex-wrap items-center gap-2 overflow-hidden transition-[max-height,opacity] duration-300",
            isCollapsed ? "max-h-0 opacity-0" : "max-h-72 opacity-100"
          )}
          aria-hidden={isCollapsed}
        >
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
      </aside>
    </div>
  );
}
