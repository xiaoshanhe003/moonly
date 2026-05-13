import type { BleedingLevel, CycleProfile, DailyEntry, LegacyFlowLevel, PeriodSignal } from "./types";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MIN_CYCLE_LENGTH_DAYS = 21;
const CONTINUATION_BUFFER_DAYS = 3;
const MIN_CONTINUATION_WINDOW_DAYS = 8;
const SPOTTING_CONFIRMATION_WINDOW_DAYS = 2;

export type PhaseKey = "menstrual" | "follicular" | "ovulation" | "luteal";
export type PeriodStartConfidence = "likely" | "confirmed";

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
      "今天慢一点，先让身体舒服。",
      "先照顾自己，很多事可以晚一点。",
      "如果有点累，就把力气留给当下。",
      "今天不必太满，留些空给自己。",
      "给身体一点安静，给自己一点松弛。",
      "今天不必太赶，舒服更要紧。",
      "先把身体安顿好，别的都往后放放。",
      "有点倦，就少做一点。"
    ],
    dos: ["先顾舒适", "补充温热", "安排留白", "轻缓活动", "提早休息"],
    donts: ["硬扛不适", "日程过满", "久坐受凉", "高强度训练", "忽略疼痛"],
    color: "var(--phase-menstrual)"
  },
  follicular: {
    label: "卵泡期",
    tones: [
      "状态在回升，适合把日子重新接上。",
      "今天适合起个头，不用一口气做完。",
      "往前走一点，节奏会慢慢回来。",
      "把想做的事捡起来一些，就很好。",
      "趁着状态回暖，去推进一件小事吧。",
      "慢慢来，才更快。"
    ],
    dos: ["轻轻启动", "尝试新事", "安排运动", "推进计划", "外出走走"],
    donts: ["日程过满", "一下太猛", "用力过头", "熬夜补进度", "忽略热身"],
    color: "var(--phase-follicular)"
  },
  ovulation: {
    label: "排卵期",
    tones: [
      "今天更想表达，就顺势把话说出来。",
      "适合见人、沟通，也别忘了留点空。",
      "如果能量较高，可以顺势多推进一点。",
      "今天更容易向外打开，但不用用力过满。",
      "把重要的表达放在今天，正好。",
      "往外走一走，状态会更亮。"
    ],
    dos: ["安排沟通", "协作推进", "表达自己", "补充水分", "记录变化"],
    donts: ["熬夜过头", "行程太满", "忽略恢复", "情绪透支", "跳过正餐"],
    color: "var(--phase-ovulation)"
  },
  luteal: {
    label: "黄体期",
    tones: [
      "今天更适合稳着来，不必太用力。",
      "如果有点敏感，就先把世界调小一点。",
      "把节奏放稳，很多不舒服会缓下来。",
      "先顾好自己的感受，再去顾别的事。",
      "给自己留点余地，今天会更顺一些。",
      "不必什么都接住。",
      "把力气留给真正重要的事。",
      "先把负担放轻一点。",
      "今天适合往内收一收。"
    ],
    dos: ["稳住节奏", "提早休息", "减少切换", "优先刚需", "少量多次"],
    donts: ["信息过载", "情绪内耗", "咖啡过量", "反复死磕", "行程堆太满"],
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
  腹痛: {
    dos: ["热敷一下", "轻缓活动", "把节奏放慢"],
    donts: ["硬扛疼痛", "突然发力", "身体受凉"]
  },
  腰酸: {
    dos: ["起身走走", "轻柔拉伸", "腰背保暖"],
    donts: ["久坐不动", "弯腰太久", "负重太多"]
  },
  腰痛: {
    dos: ["起身走走", "轻柔拉伸", "腰背保暖"],
    donts: ["久坐不动", "弯腰太久", "负重太多"]
  },
  腹胀: {
    dos: ["少量多次", "饭后慢走", "穿得松一点"],
    donts: ["吃得太急", "久坐不动", "裤腰太紧"]
  },
  乳房胀痛: {
    dos: ["穿得更舒服", "减少压迫", "先放慢动作"],
    donts: ["衣物过紧", "频繁碰撞", "忽略不适"]
  },
  疲惫: {
    dos: ["先做刚需", "午后留白", "早点收尾"],
    donts: ["连续硬撑", "咖啡硬顶", "熬夜补进度"]
  },
  头痛: {
    dos: ["放暗一点", "补充水分", "减少屏幕"],
    donts: ["久盯屏幕", "声音太吵", "忘记喝水"]
  }
};

const moodAdviceMap: Record<
  NonNullable<DailyEntry["mood"]>,
  {
    dos: string[];
    donts: string[];
  }
> = {
  great: {
    dos: ["把握状态", "安排想做的事", "多一点表达"],
    donts: ["答应太多", "兴奋熬夜", "节奏冲太满"]
  },
  happy: {
    dos: ["推进要事", "约人见面", "把握状态"],
    donts: ["答应太多", "节奏过满", "兴奋熬夜"]
  },
  calm: {
    dos: ["稳步推进", "按序处理", "留点空档"],
    donts: ["来回切换", "临时加塞", "把表排满"]
  },
  tense: {
    dos: ["先降刺激", "留出缓冲", "把话说慢"],
    donts: ["马上硬扛", "连续切换", "把自己逼紧"]
  },
  unhappy: {
    dos: ["先降一点负担", "把期待放低", "照顾身体感受"],
    donts: ["勉强社交", "逼自己提速", "忽略疲惫"]
  },
  sad: {
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
  return entry?.periodSignal ?? "none";
}

export function getBleedingLevel(entry?: DailyEntry & { flow?: LegacyFlowLevel }): BleedingLevel | undefined {
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

function hasTrackedNoBleeding(entry?: DailyEntry) {
  const level = getBleedingLevel(entry);
  return level === "none";
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

    const gap = diffInDays(date, current.end);
    const missingGapDayKey = formatDateKey(addDays(current.end, 1));

    if (gap <= 1 || (gap === 2 && !entries[missingGapDayKey])) {
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

function getConfirmedPeriodStartEntry(streak: BleedingStreak) {
  return streak.entries.find((entry) => normalizePeriodSignal(entry) === "confirmed_start");
}

function hasConsecutiveStrongBleeding(streak: BleedingStreak) {
  return streak.entries.some((entry, index) => {
    if (!isStrongBleeding(getBleedingLevel(entry)!)) {
      return false;
    }

    const nextEntry = streak.entries[index + 1];
    return Boolean(
      nextEntry &&
        isStrongBleeding(getBleedingLevel(nextEntry)!) &&
        diffInDays(parseDateKey(nextEntry.date), parseDateKey(entry.date)) === 1
    );
  });
}

function getFirstStrongBleedingEntry(streak: BleedingStreak) {
  return streak.entries.find((entry) => isStrongBleeding(getBleedingLevel(entry)!));
}

function getFirstStrongBleedingOffset(streak: BleedingStreak) {
  const firstStrongEntry = streak.entries.find((entry) => isStrongBleeding(getBleedingLevel(entry)!));
  return firstStrongEntry ? diffInDays(parseDateKey(firstStrongEntry.date), streak.start) : null;
}

function getContinuationWindow(profile: CycleProfile) {
  return Math.max(profile.periodLength + CONTINUATION_BUFFER_DAYS, MIN_CONTINUATION_WINDOW_DAYS);
}

function getCorePeriodLength(streak: BleedingStreak, eventDate: Date) {
  const strongEntriesFromStart = streak.entries.filter((entry) => {
    const entryDate = parseDateKey(entry.date);
    return entryDate >= eventDate && isStrongBleeding(getBleedingLevel(entry)!);
  });
  const lastStrongEntry = strongEntriesFromStart.at(-1);

  return lastStrongEntry ? diffInDays(parseDateKey(lastStrongEntry.date), eventDate) + 1 : null;
}

function classifyPeriodStart(
  streak: BleedingStreak,
  profile: CycleProfile,
  previousPeriodStart: Date
): PeriodStartEvent | null {
  const confirmedEntry = getConfirmedPeriodStartEntry(streak);
  if (confirmedEntry) {
    const date = parseDateKey(confirmedEntry.date);
    return { date, confidence: "confirmed" };
  }

  const firstLevel = streak.levels[0];
  const firstStrongEntry = getFirstStrongBleedingEntry(streak);
  const firstStrongOffset = getFirstStrongBleedingOffset(streak);
  const spottingTurnsStrong =
    firstLevel === "spotting" && firstStrongEntry && firstStrongOffset !== null && firstStrongOffset <= SPOTTING_CONFIRMATION_WINDOW_DAYS;
  const candidateDate = spottingTurnsStrong ? parseDateKey(firstStrongEntry.date) : streak.start;
  const daysSincePreviousStart = diffInDays(candidateDate, previousPeriodStart);

  if (daysSincePreviousStart <= getContinuationWindow(profile) || daysSincePreviousStart < MIN_CYCLE_LENGTH_DAYS) {
    return null;
  }

  if (spottingTurnsStrong) {
    return { date: candidateDate, confidence: "confirmed" };
  }

  if (hasConsecutiveStrongBleeding(streak)) {
    return { date: streak.start, confidence: "confirmed" };
  }

  if (isLikelyOvulationSpotting(streak, profile)) {
    return null;
  }

  if (firstLevel === "medium" || firstLevel === "heavy" || firstLevel === "spotting") {
    return { date: streak.start, confidence: "likely" };
  }

  return null;
}

function isCompletedPeriodStreak(
  streak: BleedingStreak,
  entries: Record<string, DailyEntry>,
  today: Date,
  profile: CycleProfile
) {
  const normalizedToday = startOfDay(today);
  const streakEnd = startOfDay(streak.end);
  const hasLaterNoBleedingEntry = Object.values(entries).some((entry) => {
    const entryDate = startOfDay(parseDateKey(entry.date));
    return entryDate > streakEnd && entryDate <= normalizedToday && hasTrackedNoBleeding(entry);
  });

  return hasLaterNoBleedingEntry || diffInDays(normalizedToday, streakEnd) >= profile.periodLength;
}

function resolveCycleMetrics(
  profile: CycleProfile,
  entries: Record<string, DailyEntry>,
  today: Date
) {
  const streaks = getBleedingStreaks(entries, today);
  const periodEvents: Array<{ streak: BleedingStreak; event: PeriodStartEvent }> = [];
  const calibrationStart = parseDateKey(profile.lastPeriodStart);
  let previousReliableStart = calibrationStart;

  for (const streak of streaks) {
    const event = classifyPeriodStart(streak, profile, previousReliableStart);

    if (event) {
      if (startOfDay(event.date).getTime() < startOfDay(calibrationStart).getTime()) {
        continue;
      }

      periodEvents.push({ streak, event });

      if (event.confidence === "confirmed") {
        previousReliableStart = event.date;
      }
    }
  }

  const reliableEvents = periodEvents.filter((item) => item.event.confidence === "confirmed");
  const latestReliable = reliableEvents.at(-1);
  const completedReliableEvents = reliableEvents.filter((item, index) => {
    if (index < reliableEvents.length - 1) {
      return true;
    }

    return isCompletedPeriodStreak(item.streak, entries, today, profile);
  });
  const latestCompletedReliable = completedReliableEvents.at(-1);

  const recentEventDates = reliableEvents.slice(-4).map((item) => item.event.date);
  const recentIntervals = recentEventDates.slice(1).map((date, index) => diffInDays(date, recentEventDates[index]));

  const cycleLength = recentIntervals.length > 0 ? average(recentIntervals) : profile.cycleLength;
  const latestCorePeriodLength = latestCompletedReliable
    ? getCorePeriodLength(latestCompletedReliable.streak, latestCompletedReliable.event.date)
    : null;
  const periodLength = latestCorePeriodLength ?? profile.periodLength;
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
  const daysInMonth = monthEnd.getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const normalizedToday = startOfDay(today);
  const cells: Array<{
    date: Date;
    inMonth: boolean;
    isToday: boolean;
    isPredictable: boolean;
    phase: ReturnType<typeof getCycleSummary>["phase"];
    dayOfMonth: number;
  }> = [];

  for (let i = 0; i < totalCells; i += 1) {
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
    entry?.energy ? "energy" : null,
    entry?.symptoms !== undefined ? "symptoms" : null,
    bleedingLevel !== undefined ? "flow" : null
  ].filter(Boolean);

  if (completedSteps.length === 0) {
    return "pending";
  }

  if (completedSteps.length === 4) {
    return "complete";
  }

  return "in-progress";
}

export function getSuggestedStep(entry?: DailyEntry) {
  if (!entry?.mood) {
    return "mood";
  }

  if (!entry?.energy) {
    return "energy";
  }

  if (entry?.symptoms === undefined) {
    return "symptoms";
  }

  if (getBleedingLevel(entry) === undefined) {
    return "flow";
  }

  return null;
}
