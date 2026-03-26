import type { BleedingLevel, CycleProfile, DailyEntry, PeriodSignal } from "./types";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type PhaseKey = "menstrual" | "follicular" | "ovulation" | "luteal";
export type PeriodStartConfidence = "likely" | "confirmed" | "inferred";

type BleedingStreak = {
  start: Date;
  end: Date;
  entries: DailyEntry[];
  levels: BleedingLevel[];
};

type PeriodStartEvent = {
  date: Date;
  confidence: PeriodStartConfidence;
};

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

const strongBleedingLevels: BleedingLevel[] = ["light", "medium", "heavy"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function diffInDays(a: Date, b: Date) {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY);
}

function average(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function isStrongBleeding(level: BleedingLevel) {
  return strongBleedingLevels.includes(level);
}

function normalizePeriodSignal(entry?: DailyEntry): PeriodSignal {
  if (entry?.periodSignal) {
    return entry.periodSignal;
  }

  return entry?.isPeriodStart ? "possible_start" : "none";
}

export function getBleedingLevel(entry?: DailyEntry): BleedingLevel | undefined {
  if (entry?.bleedingLevel) {
    return entry.bleedingLevel;
  }

  if (entry?.flow) {
    return entry.flow;
  }

  return undefined;
}

function hasTrackedBleeding(entry?: DailyEntry) {
  const level = getBleedingLevel(entry);
  return level !== undefined && level !== "none";
}

function buildBaseCycleSummary(profile: CycleProfile, today: Date) {
  const start = parseDateKey(profile.lastPeriodStart);
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

  return {
    dayOfCycle,
    phase: phaseMeta[phase],
    cycleLength,
    periodLength: profile.periodLength,
    lastPeriodStart: start
  };
}

function getBleedingStreaks(entries: Record<string, DailyEntry>, today: Date) {
  const bleedingEntries = Object.values(entries)
    .filter((entry) => hasTrackedBleeding(entry))
    .filter((entry) => startOfDay(parseDateKey(entry.date)).getTime() <= startOfDay(today).getTime())
    .sort((a, b) => parseDateKey(a.date).getTime() - parseDateKey(b.date).getTime());

  return bleedingEntries.reduce<BleedingStreak[]>((streaks, entry) => {
    const date = parseDateKey(entry.date);
    const level = getBleedingLevel(entry)!;
    const current = streaks.at(-1);

    if (!current) {
      return [{ start: date, end: date, entries: [entry], levels: [level] }];
    }

    if (diffInDays(date, current.end) <= 1) {
      current.end = date;
      current.entries.push(entry);
      current.levels.push(level);
      return streaks;
    }

    streaks.push({ start: date, end: date, entries: [entry], levels: [level] });
    return streaks;
  }, []);
}

function isLikelyOvulationSpotting(streak: BleedingStreak, profile: CycleProfile) {
  if (streak.levels.length !== 1 || streak.levels[0] !== "spotting") {
    return false;
  }

  const baseSummary = buildBaseCycleSummary(profile, streak.start);
  const ovulationDay = Math.max(10, baseSummary.cycleLength - 14);
  return Math.abs(baseSummary.dayOfCycle - ovulationDay) <= 1;
}

function classifyPeriodStart(
  streak: BleedingStreak,
  entries: Record<string, DailyEntry>,
  profile: CycleProfile
): PeriodStartEvent | null {
  if (isLikelyOvulationSpotting(streak, profile)) {
    return null;
  }

  const strongDayCount = streak.levels.filter(isStrongBleeding).length;
  const firstLevel = streak.levels[0];
  const firstEntry = streak.entries[0];
  const hasUserSignal = streak.entries.some((entry) => normalizePeriodSignal(entry) !== "none");
  const previousDayKey = addDays(streak.start, -1).toISOString().slice(0, 10);
  const previousDayMissing = !entries[previousDayKey];

  if (hasUserSignal && strongDayCount > 0) {
    return { date: streak.start, confidence: "confirmed" };
  }

  if (strongDayCount >= 2) {
    return { date: streak.start, confidence: "confirmed" };
  }

  if (firstLevel === "spotting" && strongDayCount > 0) {
    return { date: streak.start, confidence: "confirmed" };
  }

  if (
    (firstLevel === "medium" || firstLevel === "heavy") &&
    previousDayMissing &&
    streak.levels.length >= 2
  ) {
    return { date: streak.start, confidence: "inferred" };
  }

  if (normalizePeriodSignal(firstEntry) !== "none" || firstLevel === "spotting") {
    return { date: streak.start, confidence: "likely" };
  }

  return null;
}

function resolveCycleMetrics(
  profile: CycleProfile,
  entries: Record<string, DailyEntry>,
  today: Date
) {
  const streaks = getBleedingStreaks(entries, today);
  const periodEvents = streaks
    .map((streak) => ({
      streak,
      event: classifyPeriodStart(streak, entries, profile)
    }))
    .filter((item): item is { streak: BleedingStreak; event: PeriodStartEvent } => Boolean(item.event));

  const reliableEvents = periodEvents.filter(
    (item) => item.event.confidence === "confirmed" || item.event.confidence === "inferred"
  );
  const latestReliable = reliableEvents.at(-1);

  const recentEventDates = reliableEvents.slice(-4).map((item) => item.event.date);
  const recentIntervals = recentEventDates.slice(1).map((date, index) => diffInDays(date, recentEventDates[index]));

  const cycleLength = recentIntervals.length > 0 ? average(recentIntervals) : profile.cycleLength;
  const periodLength = latestReliable?.streak.levels.length ?? profile.periodLength;
  const lastPeriodStart = latestReliable?.event.date ?? parseDateKey(profile.lastPeriodStart);

  return {
    cycleLength,
    periodLength,
    lastPeriodStart
  };
}

export function getCycleSummary(
  profile: CycleProfile,
  entries: Record<string, DailyEntry>,
  today: Date
) {
  const { cycleLength, periodLength, lastPeriodStart } = resolveCycleMetrics(profile, entries, today);
  const elapsed = diffInDays(today, lastPeriodStart);
  const dayIndex = ((elapsed % cycleLength) + cycleLength) % cycleLength;
  const dayOfCycle = dayIndex + 1;
  const ovulationDay = Math.max(10, cycleLength - 14);
  const phaseBoundaries = {
    menstrualEnd: periodLength,
    follicularEnd: ovulationDay - 1,
    ovulationEnd: ovulationDay + 1,
    lutealEnd: cycleLength
  };

  let phase: PhaseKey = "luteal";
  let phaseRemainingDays = phaseBoundaries.lutealEnd - dayOfCycle;
  let nextPhaseKey: PhaseKey = "menstrual";
  if (dayOfCycle <= periodLength) {
    phase = "menstrual";
    phaseRemainingDays = phaseBoundaries.menstrualEnd - dayOfCycle;
    nextPhaseKey = "follicular";
  } else if (dayOfCycle < ovulationDay) {
    phase = "follicular";
    phaseRemainingDays = phaseBoundaries.follicularEnd - dayOfCycle;
    nextPhaseKey = "ovulation";
  } else if (dayOfCycle <= ovulationDay + 1) {
    phase = "ovulation";
    phaseRemainingDays = phaseBoundaries.ovulationEnd - dayOfCycle;
    nextPhaseKey = "luteal";
  } else {
    phaseRemainingDays = phaseBoundaries.lutealEnd - dayOfCycle;
    nextPhaseKey = "menstrual";
  }

  const nextPeriodStart = addDays(lastPeriodStart, elapsed - dayIndex + cycleLength);
  const daysUntilNextPeriod = diffInDays(nextPeriodStart, today);

  return {
    dayOfCycle,
    phaseRemainingDays,
    phase: phaseMeta[phase],
    nextPhase: phaseMeta[nextPhaseKey],
    daysUntilNextPeriod,
    nextPeriodStart,
    cycleLength,
    periodLength,
    lastPeriodStart
  };
}

export function buildMonthGrid(
  profile: CycleProfile,
  entries: Record<string, DailyEntry>,
  monthDate: Date,
  today: Date
) {
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
    const summary = getCycleSummary(profile, entries, date);
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
  const bleedingLevel = getBleedingLevel(entry);
  const completedSteps = [
    entry?.mood ? "mood" : null,
    entry?.symptoms !== undefined ? "symptoms" : null,
    bleedingLevel !== undefined ? "flow" : null
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

  if (entry?.symptoms === undefined) {
    return "symptoms";
  }

  if (getBleedingLevel(entry) === undefined) {
    return "flow";
  }

  return null;
}
