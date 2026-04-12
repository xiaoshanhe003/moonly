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
    tones: string[];
    dos: string[];
    donts: string[];
    color: string;
  }
> = {
  menstrual: {
    label: "月经期",
    tones: [
      "今天适合放慢节奏，先照顾身体感受。",
      "先把身体放在前面，别急着跟日程较劲。",
      "如果状态偏低也没关系，今天更适合温柔一点。",
      "把步子收小一点，身体舒服比效率更重要。",
      "今天可以不那么满，先让自己处在舒服的频率里。"
    ],
    dos: ["温热饮食", "留白日程", "先顾舒适", "轻缓活动", "早点休息"],
    donts: ["硬扛不适", "过度透支", "久坐受凉", "高强度训练", "忽略疼痛"],
    color: "var(--phase-menstrual)"
  },
  follicular: {
    label: "卵泡期",
    tones: [
      "能量通常会慢慢回升，可以轻轻把计划重新打开。",
      "如果感觉状态在回来，今天适合把事情一点点接上。",
      "这是重新起步的窗口，先把节奏慢慢拉起来。",
      "不必一下冲满，稳稳地启动就很好。",
      "今天适合把想做的事往前推一小步。"
    ],
    dos: ["轻启动", "尝试新事", "安排轻运动", "推进计划", "外出走走"],
    donts: ["日程过满", "一下太猛", "过度用力", "熬夜补进度", "忽略热身"],
    color: "var(--phase-follicular)"
  },
  ovulation: {
    label: "排卵期",
    tones: [
      "身心可能更外向，也别忘了给自己留出缓冲。",
      "今天也许更想连接外界，但别把自己排得太满。",
      "适合互动和表达，也记得给恢复留一点位置。",
      "如果状态在线，可以把沟通和协作往前放。",
      "今天的能量更适合流动起来，但不必用满。"
    ],
    dos: ["安排沟通", "协作推进", "表达自己", "记录变化", "补充水分"],
    donts: ["过度熬夜", "行程太满", "忽略恢复", "情绪透支", "跳过正餐"],
    color: "var(--phase-ovulation)"
  },
  luteal: {
    label: "黄体期",
    tones: [
      "身体正放慢节奏，多给自己一些温柔吧。",
      "今天更适合稳住节奏，而不是把自己推得更紧。",
      "如果有点敏感或疲惫，先把负担减下来。",
      "把切换变少一点，你会感觉更顺。",
      "今天适合往内收一收，把能量留给真正重要的事。"
    ],
    dos: ["稳住节奏", "提早休息", "减少切换", "优先刚需", "少量多次"],
    donts: ["信息过载", "情绪内耗", "咖啡过量", "死磕细节", "行程堆太满"],
    color: "var(--phase-luteal)"
  }
};

const symptomAdviceMap: Record<
  string,
  {
    dos: string[];
    donts: string[];
  }
> = {
  腹胀: {
    dos: ["少量多次", "饭后慢走", "穿得松一点"],
    donts: ["吃得太急", "久坐不动", "裤腰太紧"]
  },
  疲惫: {
    dos: ["先做刚需", "午后留白", "早点收尾"],
    donts: ["连续硬撑", "咖啡硬顶", "熬夜补进度"]
  },
  头痛: {
    dos: ["放暗一点", "补充水分", "减少屏幕"],
    donts: ["久盯屏幕", "声音太吵", "忘记喝水"]
  },
  痉挛: {
    dos: ["热敷一下", "轻缓拉伸", "减少奔波"],
    donts: ["硬扛疼痛", "突然发力", "身体受凉"]
  }
};

const moodAdviceMap: Record<
  NonNullable<DailyEntry["mood"]>,
  {
    dos: string[];
    donts: string[];
  }
> = {
  happy: {
    dos: ["推进要事", "约人见面", "把握状态"],
    donts: ["答应太多", "节奏过满", "兴奋熬夜"]
  },
  calm: {
    dos: ["稳步推进", "按序处理", "留点空档"],
    donts: ["来回切换", "临时加塞", "把表排满"]
  },
  tense: {
    dos: ["先减负担", "把事做少", "放慢语速"],
    donts: ["继续加码", "硬扛情绪", "把自己逼紧"]
  }
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hashString(value: string) {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function pickDailyPhrase(items: string[], seed: string) {
  return items[hashString(seed) % items.length];
}

function pickContextualPhrase(
  baseItems: string[],
  contextItems: string[],
  primarySeed: string,
  fallbackSeed: string
) {
  if (contextItems.length > 0) {
    return pickDailyPhrase(contextItems, primarySeed);
  }

  return pickDailyPhrase(baseItems, fallbackSeed);
}

function buildPhaseAdvice(phase: PhaseKey, date: Date, entry?: DailyEntry) {
  const meta = phaseMeta[phase];
  const dateKey = formatDateKey(date);
  const symptomContexts = (entry?.symptoms ?? [])
    .map((symptom) => symptomAdviceMap[symptom])
    .filter(Boolean);
  const moodContext = entry?.mood ? moodAdviceMap[entry.mood] : undefined;

  const contextualDos = [
    ...symptomContexts.flatMap((context) => context.dos),
    ...(moodContext?.dos ?? [])
  ];
  const contextualDonts = [
    ...symptomContexts.flatMap((context) => context.donts),
    ...(moodContext?.donts ?? [])
  ];

  if (entry && hasTrackedBleeding(entry)) {
    contextualDos.push("照顾体感", "准备备用");
    contextualDonts.push("硬撑行程", "忽略更换");
  }

  const doText = pickContextualPhrase(
    meta.dos,
    contextualDos,
    `${phase}:${dateKey}:do:context`,
    `${phase}:${dateKey}:do:base`
  );
  const dontText = pickContextualPhrase(
    meta.donts,
    contextualDonts,
    `${phase}:${dateKey}:dont:context`,
    `${phase}:${dateKey}:dont:base`
  );

  return `宜 ${doText}  忌 ${dontText}`;
}

function buildPhaseTone(phase: PhaseKey, date: Date) {
  const meta = phaseMeta[phase];
  return pickDailyPhrase(meta.tones, `${phase}:${formatDateKey(date)}:tone`);
}

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
    phase: {
      ...phaseMeta[phase],
      tone: buildPhaseTone(phase, today),
      advice: buildPhaseAdvice(phase, today)
    },
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
    phase: {
      ...phaseMeta[phase],
      tone: buildPhaseTone(phase, today),
      advice: buildPhaseAdvice(phase, today)
    },
    nextPhase: {
      ...phaseMeta[nextPhaseKey],
      tone: buildPhaseTone(nextPhaseKey, addDays(today, Math.max(phaseRemainingDays, 1))),
      advice: buildPhaseAdvice(nextPhaseKey, addDays(today, Math.max(phaseRemainingDays, 1)))
    },
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
  const normalizedToday = startOfDay(today);
  const cells: Array<{
    date: Date;
    inMonth: boolean;
    isToday: boolean;
    isPredictable: boolean;
    phase: ReturnType<typeof getCycleSummary>["phase"];
    dayOfMonth: number;
  }> = [];

  for (let i = 0; i < 42; i += 1) {
    const date = addDays(monthStart, i - startWeekday);
    const summary = getCycleSummary(profile, entries, date);
    const normalizedDate = startOfDay(date);
    const isPredictable = normalizedDate.getTime() > normalizedToday.getTime();
    cells.push({
      date,
      inMonth: date >= monthStart && date <= monthEnd,
      isToday: normalizedDate.getTime() === normalizedToday.getTime(),
      isPredictable,
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
