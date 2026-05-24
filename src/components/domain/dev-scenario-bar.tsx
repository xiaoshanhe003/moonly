import { type PointerEvent, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FlaskConical } from "lucide-react";
import { buildPhaseProfile, scenarios } from "../../mocks/scenarios";
import { useCycleStore } from "../../features/cycle/store";
import { cn } from "../../lib/utils";
import { getOptionPillClass, uiTextStyles } from "../ui/styles";
import { formatDateKey } from "../../lib/date";
import type { AppScenario } from "../../features/cycle/types";

const PANEL_GAP = 8;
const DEFAULT_TOP = 96;
const visibleScenarioKeys = ["first-run", "today-pending", "today-complete", "spotting-to-period"] as const;
const phaseScenarioKeys = ["phase-menstrual", "phase-follicular", "phase-ovulation", "phase-luteal"] as const;
const phaseDayByScenario = {
  "phase-menstrual": 2,
  "phase-follicular": 7,
  "phase-ovulation": 14,
  "phase-luteal": 21
} as const;

type PhaseScenarioKey = (typeof phaseScenarioKeys)[number];

function buildDevScenarioEntries(scenario: AppScenario) {
  const today = formatDateKey(new Date());
  const current = scenarios[scenario];

  if (scenario === "spotting-to-period" && current.entries) {
    return Object.fromEntries(current.entries.map((entry) => [entry.date, entry]));
  }

  const todayEntry = current.entries?.find((entry) => entry.date === today) ?? current.entry;

  if (todayEntry) {
    return { [today]: todayEntry };
  }

  return { [today]: { date: today } };
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("button, a, input, select, textarea"));
}

export function DevScenarioBar() {
  const activeScenario = useCycleStore((state) => state.activeScenario);
  const loadScenario = useCycleStore((state) => state.loadScenario);
  const [selectedPhase, setSelectedPhase] = useState<PhaseScenarioKey>("phase-luteal");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const panelRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    originX: PANEL_GAP,
    originY: DEFAULT_TOP,
    moved: false
  });
  const [position, setPosition] = useState(() => ({
    x: PANEL_GAP,
    y: DEFAULT_TOP
  }));

  useEffect(() => {
    const handleResize = () => {
      if (!panelRef.current) {
        return;
      }

      const { offsetWidth, offsetHeight } = panelRef.current;
      const maxX = Math.max(PANEL_GAP, window.innerWidth - offsetWidth - PANEL_GAP);
      const maxY = Math.max(PANEL_GAP, window.innerHeight - offsetHeight - PANEL_GAP);

      setPosition((current) => ({
        x: Math.min(Math.max(current.x, PANEL_GAP), maxX),
        y: Math.min(Math.max(current.y, PANEL_GAP), maxY)
      }));
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!panelRef.current || isInteractiveTarget(event.target)) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!panelRef.current || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;

    if (!dragStateRef.current.moved && Math.hypot(deltaX, deltaY) > 4) {
      dragStateRef.current.moved = true;
    }

    const maxX = Math.max(PANEL_GAP, window.innerWidth - panelRef.current.offsetWidth - PANEL_GAP);
    const maxY = Math.max(PANEL_GAP, window.innerHeight - panelRef.current.offsetHeight - PANEL_GAP);

    setPosition({
      x: Math.min(Math.max(dragStateRef.current.originX + deltaX, PANEL_GAP), maxX),
      y: Math.min(Math.max(dragStateRef.current.originY + deltaY, PANEL_GAP), maxY)
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!panelRef.current || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);

    const panelWidth = panelRef.current.offsetWidth;
    const maxX = Math.max(PANEL_GAP, window.innerWidth - panelWidth - PANEL_GAP);
    const snapLeft = position.x + panelWidth / 2 < window.innerWidth / 2;

    setPosition((current) => ({
      ...current,
      x: snapLeft ? PANEL_GAP : maxX
    }));

    dragStateRef.current.pointerId = null;
  };

  const loadScenarioForSelectedPhase = (scenario: AppScenario) => {
    if (scenario === "first-run") {
      loadScenario(scenario);
      return;
    }

    loadScenario(scenario, {
      profile: buildPhaseProfile(phaseDayByScenario[selectedPhase]),
      entries: buildDevScenarioEntries(scenario)
    });
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      <aside
        ref={panelRef}
        className={cn(
          "pointer-events-auto fixed flex w-72 max-w-[calc(100vw-1rem)] flex-col gap-3 rounded-[var(--radius-lg)] border border-dashed border-[color:var(--border)] bg-[color:var(--card-elevated)] p-3 shadow-[var(--shadow-card)] backdrop-blur transition-[transform,left,top] duration-300",
          isCollapsed && "-translate-x-[calc(100%-3rem)]"
        )}
        style={{
          left: position.x,
          top: position.y
        }}
      >
        <div
          className="flex items-start justify-between gap-3 touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div>
            <p className={cn("flex items-center gap-2 font-semibold uppercase tracking-[0.22em]", uiTextStyles.xs, uiTextStyles.muted)}>
              <FlaskConical className="size-3.5" />
              Dev scenarios
            </p>
            <p className={cn("mt-1", uiTextStyles.xs, uiTextStyles.muted)}>切换页面状态，不影响实际布局。</p>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--muted)] p-0 text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted-strong)]"
            aria-label={isCollapsed ? "展开开发面板" : "收起开发面板"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        <div
          className={cn(
            "grid gap-3 overflow-hidden transition-[max-height,opacity] duration-300",
            isCollapsed ? "max-h-0 opacity-0" : "max-h-80 opacity-100"
          )}
          aria-hidden={isCollapsed}
        >
          <div className="flex flex-wrap items-center gap-2">
            {visibleScenarioKeys.map((key) => {
              const scenario = scenarios[key];

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => loadScenarioForSelectedPhase(key)}
                  className={cn(getOptionPillClass(activeScenario === key), uiTextStyles.xs, "px-3 py-1.5")}
                >
                  {scenario.label}
                </button>
              );
            })}
          </div>

          <label className="grid gap-1.5">
            <span className={cn(uiTextStyles.xs, uiTextStyles.muted)}>Phase</span>
            <select
              value={selectedPhase}
              onChange={(event) => {
                const nextPhase = event.target.value as PhaseScenarioKey;
                setSelectedPhase(nextPhase);

                if (activeScenario !== "first-run") {
                  loadScenario(activeScenario, {
                    profile: buildPhaseProfile(phaseDayByScenario[nextPhase]),
                    entries: buildDevScenarioEntries(activeScenario)
                  });
                }
              }}
              className={cn(
                "h-9 w-full rounded-[var(--radius-sm)] border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--border-strong)] focus:ring-2 focus:ring-[color:var(--ring-soft)]",
                uiTextStyles.sm
              )}
            >
              {phaseScenarioKeys.map((key) => (
                <option key={key} value={key}>
                  {scenarios[key].label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </aside>
    </div>
  );
}
