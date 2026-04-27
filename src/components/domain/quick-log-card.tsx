import { useEffect, useRef, useState } from "react";
import selectedSticker from "../../assets/stickers/selected.png";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Sheet } from "../ui/sheet";
import { getBleedingLevel, getCycleSummary, getLogProgress, getSuggestedStep } from "../../features/cycle/cycle";
import type { CycleProfile, DailyEntry, QuickLogStep } from "../../features/cycle/types";
import { cn } from "../../lib/utils";
import { useCycleStore } from "../../features/cycle/store";
import { uiSpacingStyles, uiSurfaceStyles, uiTextStyles } from "../ui/styles";
import { formatFullDate } from "../../lib/utils";
import { getMoodOption, moodOptions, type MoodValue } from "./mood-options";
import { MoodStickerGraphic } from "./mood-sticker-graphic";
import { EnergyStickerGraphic } from "./energy-sticker-graphic";
import { FlowStickerGraphic } from "./flow-sticker-graphic";
import { stickerShadowStyles } from "./mood-sticker-styles";
import { getPhaseEnergyColors, getPhaseStickerFillColor } from "./phase-colors";

const moodStickerLayout: Record<
  MoodValue,
  {
    rotate: string;
    placement: string;
  }
> = {
  great: { rotate: "-rotate-[7deg]", placement: "-left-1 top-1" },
  happy: { rotate: "-rotate-[4deg]", placement: "left-[20%] top-[3.5rem] sm:top-16" },
  calm: { rotate: "rotate-[8deg]", placement: "left-1/2 top-2 -translate-x-1/2" },
  unhappy: { rotate: "rotate-[5deg]", placement: "right-[19%] top-[3.7rem] sm:top-[4.15rem]" },
  sad: { rotate: "rotate-[6deg]", placement: "-right-1 top-1" }
};

const noSymptomLabel = "没有不适";
const energyOptions = [
  { label: "低", value: "low", rotate: "-rotate-[5deg]" },
  { label: "中", value: "medium", rotate: "rotate-[3deg]" },
  { label: "较高", value: "higher", rotate: "-rotate-[2deg]" },
  { label: "高", value: "high", rotate: "rotate-[4deg]" }
] as const;
const symptomOptions = ["疲惫", "头痛", "乳房胀痛", "腹痛", "腰痛"];
const symptomStickerRotations = ["-rotate-[3deg]", "rotate-[2deg]", "-rotate-[1deg]", "rotate-[3deg]", "-rotate-[2deg]", "rotate-[1deg]"] as const;
const flowOptions = [
  { label: "无", value: "none", rotate: "-rotate-[5deg]" },
  { label: "点滴", value: "spotting", rotate: "rotate-[4deg]" },
  { label: "少量", value: "light", rotate: "-rotate-[4deg]" },
  { label: "中等", value: "medium", rotate: "rotate-[3deg]" },
  { label: "较多", value: "heavy", rotate: "-rotate-[2deg]" }
] as const;
const stepOrder: QuickLogStep[] = ["mood", "energy", "symptoms", "flow"];
const cardSlideAnimationMs = 440;
type FlowOption = (typeof flowOptions)[number];

type CompletedLogDetailsProps = {
  entry?: DailyEntry;
  onChange: (patch: Partial<DailyEntry>) => void;
};

type CompletedRecordSheetContentProps = {
  date: string;
  entry?: DailyEntry;
  allowEditing?: boolean;
  onSave: (entry: DailyEntry) => void;
};

function SelectedStickerMark({ className }: { className?: string }) {
  return (
    <img
      src={selectedSticker}
      alt=""
      className={cn("pointer-events-none absolute z-20 h-5 w-5 object-contain", stickerShadowStyles.compact, className)}
      aria-hidden="true"
    />
  );
}

function MoodSticker({
  active,
  dimInactive = false,
  fillColor,
  label,
  value,
  onClick
}: {
  active: boolean;
  dimInactive?: boolean;
  fillColor: string;
  label: string;
  value: MoodValue;
  onClick: () => void;
}) {
  const layout = moodStickerLayout[value];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "absolute inline-flex shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-transparent bg-transparent transition duration-200 active:scale-[0.98]",
        layout.placement,
        layout.rotate,
        active ? "z-10" : cn("hover:-translate-y-0.5", dimInactive && "opacity-[0.55] hover:opacity-[0.8]")
      )}
    >
      {active ? <SelectedStickerMark className="-right-0.5 -top-0.5" /> : null}
      <MoodStickerGraphic
        mood={value}
        fillColor={fillColor}
        className={cn(
          "h-14 sm:h-16",
          stickerShadowStyles.regular
        )}
      />
    </button>
  );
}

function MoodValue({ mood, fillColor }: { mood?: DailyEntry["mood"]; fillColor: string }) {
  const moodItem = getMoodOption(mood);

  if (!moodItem) {
    return <>未记录</>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <MoodStickerGraphic
        mood={moodItem.value}
        fillColor={fillColor}
        className={cn("h-8", stickerShadowStyles.compact)}
      />
      <span>{moodItem.label}</span>
    </span>
  );
}

function EnergyValue({
  energy,
  backgroundColor,
  fillColor
}: {
  energy?: DailyEntry["energy"];
  backgroundColor: string;
  fillColor: string;
}) {
  const energyItem = energyOptions.find((item) => item.value === energy);

  if (!energyItem) {
    return <>未记录</>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <EnergyStickerGraphic
        energy={energyItem.value}
        backgroundColor={backgroundColor}
        fillColor={fillColor}
        className={cn("h-7", stickerShadowStyles.compact)}
      />
      <span>{energyItem.label}</span>
    </span>
  );
}

function EnergyStickerButton({
  active,
  dimInactive = false,
  backgroundColor,
  fillColor,
  label,
  value,
  rotate,
  onClick
}: {
  active: boolean;
  dimInactive?: boolean;
  backgroundColor: string;
  fillColor: string;
  label: string;
  value: NonNullable<DailyEntry["energy"]>;
  rotate: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex min-h-[4.25rem] items-center justify-center rounded-[var(--radius-lg)] border border-transparent bg-transparent p-1.5 transition duration-200 active:scale-[0.98]",
        rotate,
        active ? "z-10" : cn("hover:-translate-y-0.5", dimInactive && "opacity-[0.55] hover:opacity-[0.8]")
      )}
    >
      <span className="relative inline-flex">
        {active ? <SelectedStickerMark className="-right-1 top-0" /> : null}
        <EnergyStickerGraphic
          energy={value}
          backgroundColor={backgroundColor}
          fillColor={fillColor}
          className={cn("h-[3.4rem] sm:h-[3.7rem]", stickerShadowStyles.regular)}
        />
      </span>
    </button>
  );
}

function FlowStickerButton({
  active,
  dimInactive = false,
  option,
  onClick
}: {
  active: boolean;
  dimInactive?: boolean;
  option: FlowOption;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={option.label}
      title={option.label}
      className={cn(
        "relative inline-flex min-h-[5.35rem] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-lg)] bg-transparent px-1.5 py-1 transition duration-200 active:scale-[0.98]",
        active ? "z-10" : cn("hover:-translate-y-0.5", dimInactive && "opacity-[0.55] hover:opacity-[0.8]")
      )}
    >
      <span className={cn("relative inline-flex items-center justify-center", option.rotate)}>
        {active ? <SelectedStickerMark className="-right-1 top-0" /> : null}
        <FlowStickerGraphic
          level={option.value}
          className={cn("h-[3.4rem] sm:h-[3.7rem]", stickerShadowStyles.regular)}
        />
      </span>
      <span className="text-xs font-semibold text-[color:var(--foreground)]">{option.label}</span>
    </button>
  );
}

function FlowValue({ bleedingLevel }: { bleedingLevel?: DailyEntry["bleedingLevel"] }) {
  const flowItem = flowOptions.find((item) => item.value === bleedingLevel);

  if (!flowItem) {
    return <>未记录</>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <FlowStickerGraphic
        level={flowItem.value}
        className={cn("h-8", stickerShadowStyles.compact)}
      />
      <span>{flowItem.label}</span>
    </span>
  );
}

function OutlinedStickerText({ label, compact = false }: { label: string; compact?: boolean }) {
  const width = label.length * (compact ? 16 : 24) + (compact ? 18 : 32);
  const height = compact ? 34 : 42;
  const baseline = compact ? 24 : 29;
  const fontSize = compact ? 15 : 19;
  const strokeWidth = compact ? 7 : 8;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block overflow-visible"
      aria-hidden="true"
    >
      <text
        x={width / 2}
        y={baseline}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="900"
        fontFamily="inherit"
        stroke="white"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {label}
      </text>
      <text
        x={width / 2}
        y={baseline}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="900"
        fontFamily="inherit"
        fill="var(--foreground)"
      >
        {label}
      </text>
    </svg>
  );
}

function CompletedAnswerStickerRow({
  entry,
  bleedingLevel,
  energyColors,
  moodFillColor,
  className,
  animate = false
}: {
  entry?: DailyEntry;
  bleedingLevel?: DailyEntry["bleedingLevel"];
  energyColors: ReturnType<typeof getPhaseEnergyColors>;
  moodFillColor: string;
  className?: string;
  animate?: boolean;
}) {
  const moodItem = getMoodOption(entry?.mood);
  const energyItem = energyOptions.find((item) => item.value === entry?.energy);
  const flowItem = flowOptions.find((item) => item.value === bleedingLevel);
  const symptomLabel = entry?.symptoms === undefined
    ? null
    : entry.symptoms[0] ?? noSymptomLabel;

  return (
    <div className={cn("flex min-h-9 min-w-0 flex-1 items-center justify-end gap-2 overflow-visible", className)} aria-label="今日记录答案">
      {moodItem ? (
        <span className={cn("flex h-9 w-9 items-center justify-center", animate && "quick-log-sticker-pop")}>
          <MoodStickerGraphic
            mood={moodItem.value}
            fillColor={moodFillColor}
            title={moodItem.label}
            className={cn("h-8", stickerShadowStyles.compact)}
          />
        </span>
      ) : null}
      {energyItem ? (
        <span className={cn("flex h-9 w-9 items-center justify-center", animate && "quick-log-sticker-pop")}>
          <EnergyStickerGraphic
            energy={energyItem.value}
            backgroundColor={energyColors.backgroundColor}
            fillColor={energyColors.fillColor}
            className={cn("h-7", stickerShadowStyles.compact)}
          />
        </span>
      ) : null}
      {symptomLabel ? (
        <span className={cn("flex h-9 items-center justify-center", stickerShadowStyles.compact, animate && "quick-log-sticker-pop")} title={symptomLabel}>
          <OutlinedStickerText label={symptomLabel} compact />
        </span>
      ) : null}
      {flowItem ? (
        <span className={cn("flex h-9 w-9 items-center justify-center", animate && "quick-log-sticker-pop")}>
          <FlowStickerGraphic
            level={flowItem.value}
            title={flowItem.label}
            className={cn("h-7", stickerShadowStyles.compact)}
          />
        </span>
      ) : null}
    </div>
  );
}

function SymptomStickerButton({
  active,
  dimInactive = false,
  label,
  rotate,
  onClick
}: {
  active: boolean;
  dimInactive?: boolean;
  label: string;
  rotate: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex min-h-10 items-center justify-center rounded-full bg-transparent px-1 py-0.5 transition duration-200 active:scale-[0.98]",
        "drop-shadow-[0_2px_2px_rgba(15,23,42,0.1)]",
        rotate,
        active ? "z-10" : cn("hover:-translate-y-0.5", dimInactive && "opacity-[0.55] hover:opacity-[0.8]")
      )}
    >
      <span className="relative inline-flex">
        {active ? <SelectedStickerMark className="right-1.5 top-2.5" /> : null}
        <OutlinedStickerText label={label} />
      </span>
    </button>
  );
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getEntryMoodFillColor(
  profile: CycleProfile | null,
  entries: Record<string, DailyEntry>,
  dateKey?: string
) {
  if (!profile || !dateKey) {
    return getPhaseStickerFillColor();
  }

  return getPhaseStickerFillColor(getCycleSummary(profile, entries, parseDateKey(dateKey)).phase.color);
}

export function LogAnswerSummary({ entry }: { entry?: DailyEntry }) {
  const profile = useCycleStore((state) => state.profile);
  const entries = useCycleStore((state) => state.entries);
  const bleedingLevel = getBleedingLevel(entry);
  const moodFillColor = getEntryMoodFillColor(profile, entries, entry?.date);
  const energyColors = getPhaseEnergyColors(
    profile && entry?.date ? getCycleSummary(profile, entries, parseDateKey(entry.date)).phase.color : undefined
  );
  const symptomLabel =
    entry?.symptoms === undefined
      ? "未记录"
      : entry.symptoms.length > 0
        ? entry.symptoms.join("、")
        : "今天没有明显不适";
  const periodSignalLabel =
    bleedingLevel && bleedingLevel !== "none" && entry?.periodSignal && entry.periodSignal !== "none"
      ? "这是经期第一天"
      : undefined;

  return (
    <div className="grid gap-6">
      <div>
        <p className={uiTextStyles.sectionLabel}>心情</p>
        <div className="mt-2 text-base font-medium text-[color:var(--foreground)]">
          <MoodValue mood={entry?.mood} fillColor={moodFillColor} />
        </div>
      </div>
      <div>
        <p className={uiTextStyles.sectionLabel}>能量</p>
        <p className="mt-2 text-base font-medium text-[color:var(--foreground)]">
          <EnergyValue energy={entry?.energy} {...energyColors} />
        </p>
      </div>
      <div>
        <p className={uiTextStyles.sectionLabel}>身体症状</p>
        <p className="mt-2 text-base font-medium text-[color:var(--foreground)]">{symptomLabel}</p>
      </div>
      <div>
        <p className={uiTextStyles.sectionLabel}>出血情况</p>
        <p className="mt-2 text-base font-medium text-[color:var(--foreground)]">
          <FlowValue bleedingLevel={bleedingLevel} />
        </p>
        {periodSignalLabel ? <p className={cn("mt-1 text-sm", uiTextStyles.muted)}>{periodSignalLabel}</p> : null}
      </div>
    </div>
  );
}

export function CompletedRecordSheetHeader({ date }: { date: string }) {
  const profile = useCycleStore((state) => state.profile);
  const entries = useCycleStore((state) => state.entries);
  const currentDate = parseDateKey(date);
  const phaseLabel = profile ? getCycleSummary(profile, entries, currentDate).phase.label : null;

  return (
    <div className="flex items-center gap-2">
      <p className="text-sm font-medium text-[color:var(--foreground)]">{formatFullDate(currentDate)}</p>
      {phaseLabel ? <p className={cn("text-sm", uiTextStyles.muted)}>{phaseLabel}</p> : null}
    </div>
  );
}

export function CompletedLogDetails({ entry, onChange }: CompletedLogDetailsProps) {
  const profile = useCycleStore((state) => state.profile);
  const entries = useCycleStore((state) => state.entries);
  const bleedingLevel = getBleedingLevel(entry);
  const canShowPeriodSignal = Boolean(bleedingLevel && bleedingLevel !== "none");
  const noSymptomSelected = entry?.symptoms !== undefined && entry.symptoms.length === 0;
  const hasSelectedSymptoms = entry?.symptoms !== undefined;
  const questionClassName = "text-base font-medium text-[color:var(--foreground)]";
  const entryDate = entry?.date ? parseDateKey(entry.date) : null;
  const moodFillColor = getEntryMoodFillColor(profile, entries, entry?.date);
  const energyColors = getPhaseEnergyColors(
    profile && entryDate ? getCycleSummary(profile, entries, entryDate).phase.color : undefined
  );
  const flowQuestion =
    profile && entryDate && getCycleSummary(profile, entries, entryDate).phase.label === "月经期"
      ? "今天经血量如何？"
      : "今天有经血吗？";

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <p className={questionClassName}>今天心情如何？</p>
        <div className="relative mx-auto h-[7.5rem] w-full max-w-[19rem] sm:h-[8.25rem] sm:max-w-[21rem]">
          {moodOptions.map((mood) => (
            <MoodSticker
              key={mood.value}
              active={entry?.mood === mood.value}
              dimInactive={Boolean(entry?.mood)}
              fillColor={moodFillColor}
              label={mood.label}
              value={mood.value}
              onClick={() => onChange({ mood: mood.value })}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <p className={questionClassName}>感觉体内的能量如何？</p>
        <div className="grid grid-cols-4 gap-1.5">
          {energyOptions.map((energy) => (
            <EnergyStickerButton
              key={energy.value}
              active={entry?.energy === energy.value}
              dimInactive={Boolean(entry?.energy)}
              backgroundColor={energyColors.backgroundColor}
              fillColor={energyColors.fillColor}
              label={energy.label}
              value={energy.value}
              rotate={energy.rotate}
              onClick={() => onChange({ energy: energy.value })}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <p className={questionClassName}>身体有什么信号？</p>
        <div className="flex flex-wrap gap-2.5">
          <SymptomStickerButton
            active={noSymptomSelected}
            dimInactive={hasSelectedSymptoms}
            label={noSymptomLabel}
            rotate="rotate-[2deg]"
            onClick={() => onChange({ symptoms: [] })}
          />
          {symptomOptions.map((symptom, index) =>
            <SymptomStickerButton
              key={symptom}
              active={Boolean(entry?.symptoms?.includes(symptom))}
              dimInactive={hasSelectedSymptoms}
              label={symptom}
              rotate={symptomStickerRotations[index % symptomStickerRotations.length]}
              onClick={() => {
                const previous = new Set(entry?.symptoms ?? []);
                if (noSymptomSelected) {
                  previous.clear();
                }
                if (previous.has(symptom)) {
                  previous.delete(symptom);
                } else {
                  previous.add(symptom);
                }
                onChange({ symptoms: [...previous] });
              }}
            />
          )}
        </div>
      </div>

      <div className="grid gap-3">
        <p className={questionClassName}>{flowQuestion}</p>
        <div className="grid grid-cols-5 gap-1.5">
          {flowOptions.map((flow) =>
            <FlowStickerButton
              key={flow.value}
              active={bleedingLevel === flow.value}
              dimInactive={bleedingLevel !== undefined}
              option={flow}
              onClick={() =>
                onChange({
                  bleedingLevel: flow.value,
                  periodSignal: flow.value === "none" ? "none" : entry?.periodSignal ?? "none"
                })
              }
            />
          )}
        </div>
        {canShowPeriodSignal ? (
          <div className="pt-1">
            <label className="inline-flex items-center gap-3 text-sm font-medium text-[color:var(--foreground)]">
              <input
                type="checkbox"
                checked={entry?.periodSignal === "confirmed_start"}
                onChange={() =>
                  onChange({
                    bleedingLevel,
                    periodSignal: entry?.periodSignal === "confirmed_start" ? "none" : "confirmed_start"
                  })
                }
                className="size-4 rounded border-[color:var(--border)] text-[color:var(--foreground)] accent-[color:var(--foreground)]"
              />
              <span>这是经期第一天</span>
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CompletedRecordSheetContent({
  date,
  entry,
  allowEditing = true,
  onSave
}: CompletedRecordSheetContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftEntry, setDraftEntry] = useState<DailyEntry | undefined>(entry);

  const updateDraftEntry = (patch: Partial<DailyEntry>) => {
    setDraftEntry((current) => ({
      ...current,
      ...patch,
      date
    }));
  };

  if (isEditing) {
    return (
      <div className="grid gap-4">
        <div className="pb-20">
          <CompletedLogDetails entry={draftEntry} onChange={updateDraftEntry} />
        </div>
        <div className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-2 border-t border-[color:var(--border)] bg-[color:var(--card-elevated)] px-6 py-4 backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              className="min-h-12"
              onClick={() => {
                setDraftEntry(entry);
                setIsEditing(false);
              }}
            >
              取消
            </Button>
            <Button
              variant="primary"
              className="min-h-12"
              onClick={() => {
                if (draftEntry) {
                  onSave(draftEntry);
                }
                setIsEditing(false);
              }}
            >
              保存
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <LogAnswerSummary entry={entry} />
      {allowEditing ? (
        <div className="-mx-6 mt-2 border-t border-[color:var(--border)] px-6 pt-4">
          <Button
            variant="secondary"
            className="min-h-12 w-full"
            onClick={() => {
              setDraftEntry(entry);
              setIsEditing(true);
            }}
          >
            编辑
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type QuickLogCardProps = {
  date: string;
  entry?: DailyEntry;
  completedDisplay?: "compact" | "expanded";
  surface?: "card" | "plain";
  className?: string;
  allowEditingCompleted?: boolean;
};

export function QuickLogCard({
  date,
  entry,
  completedDisplay = "compact",
  surface = "card",
  className,
  allowEditingCompleted = true
}: QuickLogCardProps) {
  const profile = useCycleStore((state) => state.profile);
  const entries = useCycleStore((state) => state.entries);
  const updateEntry = useCycleStore((state) => state.updateEntry);
  const [isExpanded, setIsExpanded] = useState(false);
  const [stepOverride, setStepOverride] = useState<QuickLogStep | null>(null);
  const [isCardSwitching, setIsCardSwitching] = useState(false);
  const [transitionTargetStep, setTransitionTargetStep] = useState<QuickLogStep | null>(null);
  const [isCompletionSwitching, setIsCompletionSwitching] = useState(false);
  const [isCompletionCelebrating, setIsCompletionCelebrating] = useState(false);
  const [isReviewingFlowSignal, setIsReviewingFlowSignal] = useState(false);
  const cardTransitionTimeoutRef = useRef<number | null>(null);
  const completionCelebrationTimeoutRef = useRef<number | null>(null);
  const progress = getLogProgress(entry);
  const nextStep = getSuggestedStep(entry);
  const currentStep = stepOverride ?? nextStep ?? "mood";
  const bleedingLevel = getBleedingLevel(entry);
  const currentDate = parseDateKey(date);
  const phase = profile ? getCycleSummary(profile, entries, currentDate).phase : null;
  const phaseLabel = phase?.label ?? null;
  const moodFillColor = getPhaseStickerFillColor(phase?.color);
  const energyColors = getPhaseEnergyColors(phase?.color);
  const flowQuestion = phaseLabel === "月经期" ? "今天经血量如何？" : "今天有经血吗？";

  const canShowPeriodSignal = Boolean(bleedingLevel && bleedingLevel !== "none");
  const noSymptomSelected = entry?.symptoms !== undefined && entry.symptoms.length === 0;
  const hasSelectedSymptoms = entry?.symptoms !== undefined;

  useEffect(() => {
    return () => {
      if (cardTransitionTimeoutRef.current !== null) {
        window.clearTimeout(cardTransitionTimeoutRef.current);
      }
      if (completionCelebrationTimeoutRef.current !== null) {
        window.clearTimeout(completionCelebrationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (progress !== "complete") {
      setIsCompletionCelebrating(false);
    }
  }, [progress]);

  const scheduleStepOverride = (step: QuickLogStep | null, targetStep: QuickLogStep) => {
    if (cardTransitionTimeoutRef.current !== null) {
      window.clearTimeout(cardTransitionTimeoutRef.current);
    }

    setTransitionTargetStep(targetStep);
    setIsCardSwitching(true);
    cardTransitionTimeoutRef.current = window.setTimeout(() => {
      setStepOverride(step);
      setIsReviewingFlowSignal(false);
      setIsCardSwitching(false);
      setTransitionTargetStep(null);
      cardTransitionTimeoutRef.current = null;
    }, cardSlideAnimationMs);
  };

  const scheduleCompletion = () => {
    if (cardTransitionTimeoutRef.current !== null) {
      window.clearTimeout(cardTransitionTimeoutRef.current);
    }

    setIsCardSwitching(true);
    setIsCompletionSwitching(true);
    cardTransitionTimeoutRef.current = window.setTimeout(() => {
      setStepOverride(null);
      setIsReviewingFlowSignal(false);
      setIsCardSwitching(false);
      setIsCompletionSwitching(false);
      setIsCompletionCelebrating(true);
      cardTransitionTimeoutRef.current = null;

      if (completionCelebrationTimeoutRef.current !== null) {
        window.clearTimeout(completionCelebrationTimeoutRef.current);
      }
      completionCelebrationTimeoutRef.current = window.setTimeout(() => {
        setIsCompletionCelebrating(false);
        completionCelebrationTimeoutRef.current = null;
      }, 1200);
    }, cardSlideAnimationMs);
  };

  const renderStep = (step: QuickLogStep) => {
    const progressText = `${stepOrder.indexOf(step) + 1}/${stepOrder.length}`;
    const questionClassName = "text-sm font-medium text-[color:var(--foreground)]";
    const progressClassName = cn("text-sm leading-none", uiTextStyles.muted);
    const stepLayoutClassName = "flex h-full flex-col";
    const stepBodyClassName = "flex flex-1 items-center";

    if (step === "mood") {
      return (
        <div className={stepLayoutClassName}>
          <div className="flex items-start justify-between gap-3">
            <p className={questionClassName}>今天心情如何？</p>
            <p className={progressClassName}>{progressText}</p>
          </div>
          <div className={stepBodyClassName}>
            <div className="w-full rounded-[calc(var(--radius-xl)+10px)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,255,255,0.56))] px-3 py-4">
              <div className="relative mx-auto h-[7.5rem] w-full max-w-[19rem] sm:h-[8.25rem] sm:max-w-[21rem]">
                {moodOptions.map((mood) => (
                  <MoodSticker
                    key={mood.value}
                    active={entry?.mood === mood.value}
                    dimInactive={Boolean(entry?.mood)}
                    fillColor={moodFillColor}
                    label={mood.label}
                    value={mood.value}
                    onClick={() => {
                      setStepOverride("mood");
                      updateEntry(date, { mood: mood.value });
                      scheduleStepOverride("energy", "energy");
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (step === "energy") {
      return (
        <div className={stepLayoutClassName}>
          <div className="flex items-start justify-between gap-3">
            <p className={questionClassName}>感觉体内的能量如何？</p>
            <p className={progressClassName}>{progressText}</p>
          </div>
          <div className={stepBodyClassName}>
            <div className="w-full rounded-[calc(var(--radius-xl)+10px)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,255,255,0.56))] px-2 py-3">
              <div className="grid grid-cols-4 gap-1.5">
                {energyOptions.map((energy) => (
                  <EnergyStickerButton
                    key={energy.value}
                    active={entry?.energy === energy.value}
                    dimInactive={Boolean(entry?.energy)}
                    backgroundColor={energyColors.backgroundColor}
                    fillColor={energyColors.fillColor}
                    label={energy.label}
                    value={energy.value}
                    rotate={energy.rotate}
                    onClick={() => {
                      setStepOverride("energy");
                      updateEntry(date, { energy: energy.value });
                      scheduleStepOverride("symptoms", "symptoms");
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (step === "symptoms") {
      return (
        <div className={stepLayoutClassName}>
          <div className="flex items-start justify-between gap-3">
            <p className={questionClassName}>身体有什么信号？</p>
            <p className={progressClassName}>{progressText}</p>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <SymptomStickerButton
                active={noSymptomSelected}
                dimInactive={hasSelectedSymptoms}
                label={noSymptomLabel}
                rotate="rotate-[2deg]"
                onClick={() => {
                  updateEntry(date, { symptoms: [] });
                  setStepOverride("symptoms");
                }}
              />
              {symptomOptions.map((symptom, index) => {
                const active = entry?.symptoms?.includes(symptom);
                return (
                  <SymptomStickerButton
                    key={symptom}
                    active={Boolean(active)}
                    dimInactive={hasSelectedSymptoms}
                    label={symptom}
                    rotate={symptomStickerRotations[index % symptomStickerRotations.length]}
                    onClick={() => {
                      const previous = new Set(entry?.symptoms ?? []);
                      if (noSymptomSelected) {
                        previous.clear();
                      }
                      if (previous.has(symptom)) {
                        previous.delete(symptom);
                      } else {
                        previous.add(symptom);
                      }
                      updateEntry(date, { symptoms: [...previous] });
                      setStepOverride("symptoms");
                    }}
                  />
                );
              })}
            </div>
            <div className={cn("flex flex-wrap items-center justify-end", uiSpacingStyles.gapSm)}>
              <Button
                variant="primary"
                onClick={() => scheduleStepOverride(null, "flow")}
                disabled={entry?.symptoms === undefined}
              >
                下一步
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={stepLayoutClassName}>
        <div className="flex items-start justify-between gap-3">
          <p className={questionClassName}>{flowQuestion}</p>
          <p className={progressClassName}>{progressText}</p>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-4">
          <div className="grid grid-cols-5 gap-1.5">
            {flowOptions.map((flow) => (
              <FlowStickerButton
                key={flow.value}
                active={bleedingLevel === flow.value}
                dimInactive={bleedingLevel !== undefined}
                option={flow}
                onClick={() => {
                  setStepOverride("flow");
                  setIsReviewingFlowSignal(flow.value !== "none");
                  updateEntry(date, {
                    bleedingLevel: flow.value,
                    periodSignal: flow.value === "none" ? "none" : entry?.periodSignal ?? "none"
                  });
                  if (flow.value === "none") {
                    scheduleCompletion();
                  }
                }}
              />
            ))}
          </div>
          {canShowPeriodSignal ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex min-h-11 items-center gap-3 text-sm font-medium text-[color:var(--foreground)]">
                <input
                  type="checkbox"
                  checked={entry?.periodSignal === "confirmed_start"}
                  onChange={() =>
                    updateEntry(date, {
                      bleedingLevel,
                      periodSignal: entry?.periodSignal === "confirmed_start" ? "none" : "confirmed_start"
                    })
                  }
                  className="size-4 rounded border-[color:var(--border)] text-[color:var(--foreground)] accent-[color:var(--foreground)]"
                />
                <span>这是经期第一天</span>
              </label>
              <Button
                variant="primary"
                onClick={scheduleCompletion}
              >
                完成
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  if (progress === "complete" && !isCompletionSwitching && !isReviewingFlowSignal) {
    if (completedDisplay === "expanded") {
      const content = (
        <>
          <div>
            <p className={cn("text-sm", uiTextStyles.muted)}>今日记录</p>
            <CompletedAnswerStickerRow
              entry={entry}
              bleedingLevel={bleedingLevel}
              energyColors={energyColors}
              moodFillColor={moodFillColor}
              className="mt-3 justify-start"
            />
          </div>
          <div className={uiSpacingStyles.sectionTop}>
            <CompletedLogDetails entry={entry} onChange={(patch) => updateEntry(date, patch)} />
          </div>
        </>
      );

      return surface === "plain" ? content : <Card className="rounded-[var(--radius-record-card)]">{content}</Card>;
    }

    return (
      <>
        <button
          type="button"
          className={cn(
            uiSurfaceStyles.card,
            "quick-log-complete-card block w-full rounded-[var(--radius-record-card)] text-left transition-transform active:scale-[0.99]",
            isCompletionCelebrating && "quick-log-card--enter-up",
            className
          )}
          onClick={() => {
            setIsExpanded(true);
          }}
          aria-label="查看今日记录"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="shrink-0">
              <p className={cn("text-sm", uiTextStyles.muted)}>今日记录</p>
            </div>
            <CompletedAnswerStickerRow
              entry={entry}
              bleedingLevel={bleedingLevel}
              energyColors={energyColors}
              moodFillColor={moodFillColor}
              animate={isCompletionCelebrating}
            />
          </div>
        </button>

        {isExpanded ? (
          <Sheet
            onClose={() => setIsExpanded(false)}
            header={<CompletedRecordSheetHeader date={date} />}
          >
            <CompletedRecordSheetContent
              date={date}
              entry={entry}
              allowEditing={allowEditingCompleted}
              onSave={(nextEntry) => updateEntry(date, nextEntry)}
            />
          </Sheet>
        ) : null}
      </>
    );
  }

  const activeCard = (
    <Card
      className={cn(
        "quick-log-card rounded-[var(--radius-record-card)] quick-log-card--front",
        isCardSwitching && "quick-log-card--slide-out",
        className
      )}
    >
      <div key={currentStep} className="h-full">
        {renderStep(currentStep)}
      </div>
    </Card>
  );

  return surface === "plain" ? (
    <div className={className}>{renderStep(currentStep)}</div>
  ) : (
    <div className="quick-log-deck">
      {isCardSwitching && transitionTargetStep ? (
        <Card className={cn("quick-log-card rounded-[var(--radius-record-card)] quick-log-card--behind", className)}>
          <div className="h-full">
            {renderStep(transitionTargetStep)}
          </div>
        </Card>
      ) : null}
      {activeCard}
    </div>
  );
}
