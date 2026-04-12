export type CycleProfile = {
  lastPeriodStart: string;
  periodLength: number;
  cycleLength: number;
  isPeriodLengthEstimated: boolean;
  isCycleLengthEstimated: boolean;
};

export type BleedingLevel = "none" | "spotting" | "light" | "medium" | "heavy";

export type PeriodSignal = "none" | "possible_start" | "confirmed_start";

export type DailyEntry = {
  date: string;
  mood?: "great" | "happy" | "calm" | "low" | "tense";
  flow?: "none" | "light" | "medium" | "heavy";
  bleedingLevel?: BleedingLevel;
  symptoms?: string[];
  periodSignal?: PeriodSignal;
  isPeriodStart?: boolean;
};

export type QuickLogStep = "mood" | "symptoms" | "flow";

export type AppScenario =
  | "first-run"
  | "today-pending"
  | "today-in-progress"
  | "today-complete"
  | "calendar-forecast";
