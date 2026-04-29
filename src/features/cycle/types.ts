export type CycleProfile = {
  lastPeriodStart: string;
  periodLength: number;
  cycleLength: number;
  isPeriodLengthEstimated: boolean;
  isCycleLengthEstimated: boolean;
  calibratedAt?: string;
};

export type BleedingLevel = "none" | "spotting" | "light" | "medium" | "heavy";
export type LegacyFlowLevel = Exclude<BleedingLevel, "spotting">;

export type PeriodSignal = "none" | "confirmed_start";

export type DailyEntry = {
  date: string;
  mood?: "great" | "happy" | "calm" | "unhappy" | "sad";
  energy?: "low" | "medium" | "higher" | "high";
  bleedingLevel?: BleedingLevel;
  symptoms?: string[];
  periodSignal?: PeriodSignal;
};

export type QuickLogStep = "mood" | "energy" | "symptoms" | "flow";

export type AppScenario =
  | "first-run"
  | "today-pending"
  | "today-in-progress"
  | "today-complete"
  | "spotting-to-period"
  | "calendar-forecast";
