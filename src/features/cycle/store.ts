import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppScenario, CycleProfile, DailyEntry, LegacyFlowLevel } from "./types";
import { scenarios } from "../../mocks/scenarios";

type CycleState = {
  profile: CycleProfile | null;
  entries: Record<string, DailyEntry>;
  activeScenario: AppScenario;
  setProfile: (profile: CycleProfile) => void;
  restartWithProfile: (profile: CycleProfile) => void;
  updateProfile: (patch: Partial<CycleProfile>) => void;
  updateEntry: (date: string, patch: Partial<DailyEntry>) => void;
  importEntries: (profile: CycleProfile, entries: Record<string, DailyEntry>, conflictMode: "skip" | "overwrite") => void;
  loadScenario: (scenario: AppScenario) => void;
  reset: () => void;
};

const defaultScenario = scenarios["first-run"];

type LegacyMood = DailyEntry["mood"] | "low";
type LegacyPeriodSignal = DailyEntry["periodSignal"] | "possible_start";
type LegacyDailyEntry = Omit<DailyEntry, "mood" | "bleedingLevel" | "periodSignal"> & {
  mood?: LegacyMood;
  bleedingLevel?: DailyEntry["bleedingLevel"];
  flow?: LegacyFlowLevel;
  periodSignal?: LegacyPeriodSignal;
  isPeriodStart?: boolean;
};

function normalizeMood(mood?: LegacyMood): DailyEntry["mood"] | undefined {
  if (mood === "low") {
    return "unhappy";
  }

  return mood;
}

function normalizeEntry(entry: LegacyDailyEntry): DailyEntry {
  const { flow, isPeriodStart, ...nextEntry } = entry;
  const periodSignal =
    entry.periodSignal === "confirmed_start" || entry.periodSignal === "possible_start" || isPeriodStart
      ? "confirmed_start"
      : entry.periodSignal;

  return {
    ...nextEntry,
    mood: normalizeMood(entry.mood),
    bleedingLevel: entry.bleedingLevel ?? flow,
    periodSignal
  };
}

function normalizeEntries(entries: Record<string, LegacyDailyEntry>) {
  return Object.fromEntries(
    Object.entries(entries).map(([date, entry]) => [date, normalizeEntry(entry)])
  );
}

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
      activeScenario: "first-run",
      setProfile: (profile) => set({ profile }),
      restartWithProfile: (profile) =>
        set({
          profile,
          entries: {},
          activeScenario: "first-run"
        }),
      updateProfile: (patch) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...patch } : null
        })),
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
      importEntries: (profile, entries, conflictMode) =>
        set((state) => {
          const mergedEntries = { ...state.entries };

          for (const [date, entry] of Object.entries(entries)) {
            if (conflictMode === "skip" && mergedEntries[date]) {
              continue;
            }

            mergedEntries[date] = entry;
          }

          return {
            profile: state.profile && Object.keys(state.entries).length > 0 ? state.profile : profile,
            entries: mergedEntries
          };
        }),
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
      name: "moonly-store",
      version: 4,
      migrate: (persistedState) => {
        const state = persistedState as Partial<CycleState>;

        return {
          ...state,
          entries: normalizeEntries((state.entries ?? {}) as Record<string, LegacyDailyEntry>)
        };
      }
    }
  )
);
