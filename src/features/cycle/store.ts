import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppScenario, CycleProfile, DailyEntry } from "./types";
import { scenarios } from "../../mocks/scenarios";

type CycleState = {
  profile: CycleProfile | null;
  entries: Record<string, DailyEntry>;
  activeScenario: AppScenario;
  setProfile: (profile: CycleProfile) => void;
  updateEntry: (date: string, patch: Partial<DailyEntry>) => void;
  loadScenario: (scenario: AppScenario) => void;
  reset: () => void;
};

const defaultScenario = scenarios["today-pending"];

function buildScenarioEntries(scenario: (typeof scenarios)[AppScenario]) {
  if (scenario.entries) {
    return Object.fromEntries(scenario.entries.map((entry) => [entry.date, entry]));
  }

  return scenario.entry ? { [scenario.entry.date]: scenario.entry } : {};
}

export const useCycleStore = create<CycleState>()(
  persist(
    (set) => ({
      profile: defaultScenario.profile,
      entries: buildScenarioEntries(defaultScenario),
      activeScenario: "today-pending",
      setProfile: (profile) => set({ profile }),
      updateEntry: (date, patch) =>
        set((state) => ({
          entries: {
            ...state.entries,
            [date]: {
              ...state.entries[date],
              ...patch,
              date
            }
          }
        })),
      loadScenario: (scenario) =>
        set(() => {
          const current = scenarios[scenario];
          return {
            profile: current.profile,
            entries: buildScenarioEntries(current),
            activeScenario: scenario
          };
        }),
      reset: () =>
        set({
          profile: scenarios["first-run"].profile,
          entries: {},
          activeScenario: "first-run"
        })
    }),
    {
      name: "moonly-store"
    }
  )
);
