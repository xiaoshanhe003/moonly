import type { DailyEntry } from "../../features/cycle/types";

export type MoodValue = NonNullable<DailyEntry["mood"]>;

export const moodOptions: Array<{
  label: string;
  value: MoodValue;
}> = [
  { label: "超开心", value: "great" },
  { label: "开心", value: "happy" },
  { label: "平静", value: "calm" },
  { label: "紧绷", value: "tense" },
  { label: "难过", value: "sad" }
];

const historicalMoodOptions: Array<{
  label: string;
  value: MoodValue;
}> = [{ label: "不乐", value: "unhappy" }];

const displayMoodOptions = [...moodOptions, ...historicalMoodOptions];

export function getMoodOption(mood?: DailyEntry["mood"]) {
  return displayMoodOptions.find((item) => item.value === mood);
}

export function getEditableMoodOptions(mood?: DailyEntry["mood"]) {
  const historicalMood = historicalMoodOptions.find((item) => item.value === mood);

  return historicalMood
    ? moodOptions.map((item) => (item.value === "tense" ? historicalMood : item))
    : moodOptions;
}
