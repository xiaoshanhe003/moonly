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

export const useCycleStore = create<CycleState>()(
  persist(
    (set) => ({
      profile: defaultScenario.profile,
      entries: defaultScenario.entry ? { [defaultScenario.entry.date]: defaultScenario.entry } : {},
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
            entries: current.entry ? { [current.entry.date]: current.entry } : {},
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
