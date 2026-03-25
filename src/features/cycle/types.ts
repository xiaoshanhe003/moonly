export type CycleProfile = {
  lastPeriodStart: string;
  periodLength: number;
  cycleLength: number;
  isPeriodLengthEstimated: boolean;
  isCycleLengthEstimated: boolean;
};

export type DailyEntry = {
  date: string;
  mood?: "happy" | "calm" | "tense";
  flow?: "none" | "light" | "medium" | "heavy";
  symptoms?: string[];
};

export type QuickLogStep = "mood" | "symptoms" | "flow";

export type AppScenario =
  | "first-run"
  | "today-pending"
  | "today-in-progress"
  | "today-complete"
  | "calendar-forecast";
