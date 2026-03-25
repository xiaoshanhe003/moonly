import type { AppScenario, CycleProfile, DailyEntry } from "../features/cycle/types";

const today = new Date();
const isoToday = today.toISOString().slice(0, 10);

function daysAgo(days: number) {
  const value = new Date(today);
  value.setDate(value.getDate() - days);
  return value.toISOString().slice(0, 10);
}

const baseProfile: CycleProfile = {
  lastPeriodStart: daysAgo(19),
  periodLength: 5,
  cycleLength: 28,
  isPeriodLengthEstimated: false,
  isCycleLengthEstimated: false
};

export const scenarios: Record<
  AppScenario,
  {
    label: string;
    profile: CycleProfile | null;
    entry?: DailyEntry;
  }
> = {
  "first-run": {
    label: "冷启动",
    profile: null
  },
  "today-pending": {
    label: "今日未记录",
    profile: baseProfile,
    entry: { date: isoToday }
  },
  "today-in-progress": {
    label: "记录中",
    profile: baseProfile,
    entry: { date: isoToday, mood: "calm" }
  },
  "today-complete": {
    label: "记录完成",
    profile: baseProfile,
    entry: {
      date: isoToday,
      mood: "calm",
      symptoms: ["腹胀", "疲惫"],
      flow: "none"
    }
  },
  "calendar-forecast": {
    label: "日历预测",
    profile: {
      ...baseProfile,
      lastPeriodStart: daysAgo(10)
    },
    entry: { date: isoToday, mood: "happy" }
  }
};
