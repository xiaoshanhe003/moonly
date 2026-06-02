import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppScenario, CycleProfile, DailyEntry, LegacyFlowLevel } from "./types";
import { scenarios } from "../../mocks/scenarios";

type CycleState = {
  profile: CycleProfile | null;
  entries: Record<string, DailyEntry>;
  activeScenario: AppScenario;
  lastUpdatedAt: number;
  setProfile: (profile: CycleProfile) => void;
  restartWithProfile: (profile: CycleProfile) => void;
  updateProfile: (patch: Partial<CycleProfile>) => void;
  updateEntry: (date: string, patch: Partial<DailyEntry>) => void;
  importEntries: (profile: CycleProfile, entries: Record<string, DailyEntry>, conflictMode: "skip" | "overwrite") => void;
  loadScenario: (scenario: AppScenario, override?: { profile?: CycleProfile | null; entries?: Record<string, DailyEntry> }) => void;
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

function nextStoreTimestamp(currentTimestamp: number) {
  return Math.max(Date.now(), currentTimestamp + 1);
}

export const useCycleStore = create<CycleState>()(
  persist(
    (set) => ({
      profile: defaultScenario.profile,
      entries: buildScenarioEntries(defaultScenario),
      activeScenario: "first-run",
      lastUpdatedAt: 0,
      setProfile: (profile) =>
        set((state) => ({
          profile,
          lastUpdatedAt: nextStoreTimestamp(state.lastUpdatedAt)
        })),
      restartWithProfile: (profile) =>
        set((state) => ({
          profile,
          entries: {},
          activeScenario: "first-run",
          lastUpdatedAt: nextStoreTimestamp(state.lastUpdatedAt)
        })),
      updateProfile: (patch) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...patch } : null,
          lastUpdatedAt: nextStoreTimestamp(state.lastUpdatedAt)
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
          },
          lastUpdatedAt: nextStoreTimestamp(state.lastUpdatedAt)
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
            entries: mergedEntries,
            lastUpdatedAt: nextStoreTimestamp(state.lastUpdatedAt)
          };
        }),
      loadScenario: (scenario, override) =>
        set((state) => {
          const current = scenarios[scenario];
          return {
            profile: override?.profile ?? current.profile,
            entries: override?.entries ?? buildScenarioEntries(current),
            activeScenario: scenario,
            lastUpdatedAt: nextStoreTimestamp(state.lastUpdatedAt)
          };
        }),
      reset: () =>
        set((state) => ({
          profile: scenarios["first-run"].profile,
          entries: {},
          activeScenario: "first-run",
          lastUpdatedAt: nextStoreTimestamp(state.lastUpdatedAt)
        }))
    }),
    {
      name: "moonly-store",
      version: 5,
      migrate: (persistedState) => {
        const state = persistedState as Partial<CycleState>;

        return {
          ...state,
          entries: normalizeEntries((state.entries ?? {}) as Record<string, LegacyDailyEntry>),
          lastUpdatedAt: typeof state.lastUpdatedAt === "number" ? state.lastUpdatedAt : Date.now()
        };
      }
    }
  )
);
