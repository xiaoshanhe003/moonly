import type { DailyEntry } from "../../features/cycle/types";

export type MoodValue = NonNullable<DailyEntry["mood"]>;

export const moodOptions: Array<{
  label: string;
  value: MoodValue;
}> = [
  { label: "超开心", value: "great" },
  { label: "开心", value: "happy" },
  { label: "平静", value: "calm" },
  { label: "不乐", value: "unhappy" },
  { label: "难过", value: "sad" }
];

export function getMoodOption(mood?: DailyEntry["mood"]) {
  return moodOptions.find((item) => item.value === mood);
}
