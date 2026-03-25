import type { CycleProfile, DailyEntry } from "./types";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type PhaseKey = "menstrual" | "follicular" | "ovulation" | "luteal";

const phaseMeta: Record<
  PhaseKey,
  {
    label: string;
    tone: string;
    advice: string;
    dos: string[];
    donts: string[];
    color: string;
  }
> = {
  menstrual: {
    label: "月经期",
    tone: "今天适合放慢节奏，先照顾身体感受。",
    advice: "宜 温和热茶  忌 过度消耗",
    dos: ["留白日程", "关注舒适度"],
    donts: ["过度透支", "忽略疼痛"],
    color: "var(--color-rose)"
  },
  follicular: {
    label: "卵泡期",
    tone: "能量通常会慢慢回升，可以轻轻把计划重新打开。",
    advice: "宜 轻启动  忌 安排过满",
    dos: ["尝试新任务", "安排轻运动"],
    donts: ["日程过满", "过度用力"],
    color: "var(--color-accent)"
  },
  ovulation: {
    label: "排卵期",
    tone: "身心可能更外向，也别忘了给自己留出缓冲。",
    advice: "宜 社交协作  忌 忽略恢复",
    dos: ["安排沟通", "记录变化"],
    donts: ["忽略补水", "过度熬夜"],
    color: "var(--color-gold)"
  },
  luteal: {
    label: "黄体期",
    tone: "身体正放慢节奏，多给自己一些温柔吧。",
    advice: "宜 稳住节奏  忌 忽视身体信号",
    dos: ["降低切换成本", "提早休息"],
    donts: ["信息过载", "情绪内耗"],
    color: "var(--color-blue)"
  }
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function diffInDays(a: Date, b: Date) {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY);
}

export function getCycleSummary(profile: CycleProfile, today: Date) {
  const start = new Date(profile.lastPeriodStart);
  const elapsed = diffInDays(today, start);
  const cycleLength = profile.cycleLength;
  const dayIndex = ((elapsed % cycleLength) + cycleLength) % cycleLength;
  const dayOfCycle = dayIndex + 1;
  const ovulationDay = Math.max(10, cycleLength - 14);

  let phase: PhaseKey = "luteal";
  if (dayOfCycle <= profile.periodLength) {
    phase = "menstrual";
  } else if (dayOfCycle < ovulationDay) {
    phase = "follicular";
  } else if (dayOfCycle <= ovulationDay + 1) {
    phase = "ovulation";
  }

  const nextPeriodStart = addDays(start, elapsed - dayIndex + cycleLength);
  const daysUntilNextPeriod = diffInDays(nextPeriodStart, today);

  return {
    dayOfCycle,
    phase: phaseMeta[phase],
    daysUntilNextPeriod,
    nextPeriodStart
  };
}

export function buildMonthGrid(profile: CycleProfile, monthDate: Date, today: Date) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startWeekday = monthStart.getDay();
  const cells: Array<{
    date: Date;
    inMonth: boolean;
    isToday: boolean;
    phase: ReturnType<typeof getCycleSummary>["phase"];
    dayOfMonth: number;
  }> = [];

  for (let i = 0; i < 42; i += 1) {
    const date = addDays(monthStart, i - startWeekday);
    const summary = getCycleSummary(profile, date);
    cells.push({
      date,
      inMonth: date >= monthStart && date <= monthEnd,
      isToday: startOfDay(date).getTime() === startOfDay(today).getTime(),
      phase: summary.phase,
      dayOfMonth: date.getDate()
    });
  }

  return cells;
}

export function getLogProgress(entry?: DailyEntry) {
  const completedSteps = [
    entry?.mood ? "mood" : null,
    entry?.symptoms?.length ? "symptoms" : null,
    entry?.flow ? "flow" : null
  ].filter(Boolean);

  if (completedSteps.length === 0) {
    return "pending";
  }

  if (completedSteps.length === 3) {
    return "complete";
  }

  return "in-progress";
}

export function getSuggestedStep(entry?: DailyEntry) {
  if (!entry?.mood) {
    return "mood";
  }

  if (!entry?.symptoms?.length) {
    return "symptoms";
  }

  if (!entry?.flow) {
    return "flow";
  }

  return null;
}
