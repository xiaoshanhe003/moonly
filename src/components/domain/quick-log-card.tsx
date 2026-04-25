import { useMemo, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import energyFullSticker from "../../assets/energy/full.png";
import energyHighSticker from "../../assets/energy/high.png";
import energyLowSticker from "../../assets/energy/low.png";
import energyMidSticker from "../../assets/energy/mid.png";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Sheet } from "../ui/sheet";
import { getBleedingLevel, getCycleSummary, getLogProgress, getSuggestedStep } from "../../features/cycle/cycle";
import type { DailyEntry, QuickLogStep } from "../../features/cycle/types";
import { cn } from "../../lib/utils";
import { useCycleStore } from "../../features/cycle/store";
import { getChoiceTileClass, uiSpacingStyles, uiTextStyles } from "../ui/styles";
import { formatFullDate } from "../../lib/utils";
import { getMoodOption, moodOptions, type MoodValue } from "./mood-options";
import { stickerShadowStyles } from "./mood-sticker-styles";

const moodStickerLayout: Record<
  MoodValue,
  {
    rotate: string;
    placement: string;
    imageSize?: string;
  }
> = {
  great: { rotate: "-rotate-[7deg]", placement: "-left-1 top-1" },
  happy: { rotate: "-rotate-[4deg]", placement: "left-[20%] top-[3.5rem] sm:top-16", imageSize: "h-[4.25rem] sm:h-[4.75rem]" },
  calm: { rotate: "rotate-[8deg]", placement: "left-1/2 top-2 -translate-x-1/2", imageSize: "h-[3rem] sm:h-[3.5rem]" },
  unhappy: { rotate: "rotate-[5deg]", placement: "right-[19%] top-[3.7rem] sm:top-[4.15rem]" },
  sad: { rotate: "rotate-[6deg]", placement: "-right-1 top-1" }
};

const noSymptomLabel = "没有不适";
const energyOptions = [
  { label: "低", value: "low", imageSrc: energyLowSticker, rotate: "-rotate-[5deg]" },
  { label: "中", value: "medium", imageSrc: energyMidSticker, rotate: "rotate-[3deg]" },
  { label: "较高", value: "higher", imageSrc: energyHighSticker, rotate: "-rotate-[2deg]" },
  { label: "高", value: "high", imageSrc: energyFullSticker, rotate: "rotate-[4deg]" }
] as const;
const symptomOptions = ["疲惫", "头痛", "乳房胀痛", "腹痛", "腰痛"];
const symptomStickerRotations = ["-rotate-[3deg]", "rotate-[2deg]", "-rotate-[1deg]", "rotate-[3deg]", "-rotate-[2deg]", "rotate-[1deg]"] as const;
const flowOptions = [
  { label: "无", value: "none" },
  { label: "点滴", value: "spotting" },
  { label: "少量", value: "light" },
  { label: "中等", value: "medium" },
  { label: "较多", value: "heavy" }
] as const;
const stepOrder: QuickLogStep[] = ["mood", "energy", "symptoms", "flow"];

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

function SelectionPill({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-[var(--space-2)] rounded-full border px-[var(--space-4)] py-[var(--space-2)] text-sm transition",
        active
          ? "border-[color:var(--foreground)] bg-[color:var(--muted-strong)] text-[color:var(--foreground)] shadow-[0_0_0_1px_var(--foreground)_inset]"
          : "border-[color:var(--border)] bg-[color:var(--muted)] text-[color:var(--foreground)]"
      )}
    >
      {active ? <Check className="size-4" /> : <span className="size-4 rounded-full border border-[color:var(--border)]" aria-hidden="true" />}
      {label}
    </button>
  );
}

function MoodSticker({
  active,
  imageSrc,
  label,
  value,
  onClick
}: {
  active: boolean;
  imageSrc: string;
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
        "absolute inline-flex shrink-0 items-center justify-center rounded-[var(--radius-lg)] border bg-transparent transition duration-200 active:scale-[0.98]",
        layout.placement,
        layout.rotate,
        active
          ? "border-[color:var(--foreground)] shadow-[0_0_0_1px_var(--foreground)_inset,0_18px_36px_rgba(15,23,42,0.12)]"
          : "border-transparent hover:-translate-y-0.5"
      )}
    >
      <img
        src={imageSrc}
        alt=""
        className={cn(
          "w-auto object-contain",
          stickerShadowStyles.regular,
          layout.imageSize ?? "h-14 sm:h-16"
        )}
        aria-hidden="true"
      />
    </button>
  );
}

function MoodValue({ mood }: { mood?: DailyEntry["mood"] }) {
  const moodItem = getMoodOption(mood);

  if (!moodItem) {
    return <>未记录</>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <img
        src={moodItem.imageSrc}
        alt=""
        className={cn("h-8 w-8 object-contain", stickerShadowStyles.compact)}
        aria-hidden="true"
      />
      <span>{moodItem.label}</span>
    </span>
  );
}

function EnergyValue({ energy }: { energy?: DailyEntry["energy"] }) {
  const energyItem = energyOptions.find((item) => item.value === energy);

  if (!energyItem) {
    return <>未记录</>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <img
        src={energyItem.imageSrc}
        alt=""
        className={cn("h-7 w-auto object-contain", stickerShadowStyles.compact)}
        aria-hidden="true"
      />
      <span>{energyItem.label}</span>
    </span>
  );
}

function EnergyStickerButton({
  active,
  imageSrc,
  label,
  rotate,
  onClick
}: {
  active: boolean;
  imageSrc: string;
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
        "inline-flex min-h-[4.25rem] items-center justify-center rounded-[var(--radius-lg)] border bg-transparent p-1.5 transition duration-200 active:scale-[0.98]",
        rotate,
        active
          ? "border-[color:var(--foreground)] shadow-[0_0_0_1px_var(--foreground)_inset]"
          : "border-transparent hover:-translate-y-0.5"
      )}
    >
      <img
        src={imageSrc}
        alt=""
        className={cn("h-[3.4rem] w-auto object-contain sm:h-[3.7rem]", stickerShadowStyles.regular)}
        aria-hidden="true"
      />
    </button>
  );
}

function OutlinedStickerText({ label }: { label: string }) {
  const width = label.length * 24 + 32;

  return (
    <svg
      width={width}
      height="42"
      viewBox={`0 0 ${width} 42`}
      className="block overflow-visible"
      aria-hidden="true"
    >
      <text
        x={width / 2}
        y="29"
        textAnchor="middle"
        fontSize="19"
        fontWeight="900"
        fontFamily="inherit"
        stroke="white"
        strokeWidth="8"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {label}
      </text>
      <text
        x={width / 2}
        y="29"
        textAnchor="middle"
        fontSize="19"
        fontWeight="900"
        fontFamily="inherit"
        fill="var(--foreground)"
      >
        {label}
      </text>
    </svg>
  );
}

function SymptomStickerButton({
  active,
  label,
  rotate,
  onClick
}: {
  active: boolean;
  label: string;
  rotate: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-full bg-transparent px-1 py-0.5 transition duration-200 active:scale-[0.98]",
        "drop-shadow-[0_2px_2px_rgba(15,23,42,0.1)]",
        rotate,
        active
          ? "shadow-[0_0_0_1px_var(--foreground)_inset]"
          : "hover:-translate-y-0.5"
      )}
    >
      <OutlinedStickerText label={label} />
    </button>
  );
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function LogAnswerSummary({ entry }: { entry?: DailyEntry }) {
  const bleedingLevel = getBleedingLevel(entry);
  const flowLabel = flowOptions.find((item) => item.value === bleedingLevel)?.label ?? "未记录";
  const symptomLabel =
    entry?.symptoms === undefined
      ? "未记录"
      : entry.symptoms.length > 0
        ? entry.symptoms.join("、")
        : "今天没有明显不适";
  const periodSignalLabel =
    bleedingLevel && bleedingLevel !== "none" && entry?.periodSignal && entry.periodSignal !== "none"
      ? "这次感觉像经期开始"
      : undefined;

  return (
    <div className="grid gap-6">
      <div>
        <p className={uiTextStyles.sectionLabel}>心情</p>
        <div className="mt-2 text-base font-medium text-[color:var(--foreground)]">
          <MoodValue mood={entry?.mood} />
        </div>
      </div>
      <div>
        <p className={uiTextStyles.sectionLabel}>能量</p>
        <p className="mt-2 text-base font-medium text-[color:var(--foreground)]">
          <EnergyValue energy={entry?.energy} />
        </p>
      </div>
      <div>
        <p className={uiTextStyles.sectionLabel}>身体症状</p>
        <p className="mt-2 text-base font-medium text-[color:var(--foreground)]">{symptomLabel}</p>
      </div>
      <div>
        <p className={uiTextStyles.sectionLabel}>出血情况</p>
        <p className="mt-2 text-base font-medium text-[color:var(--foreground)]">{flowLabel}</p>
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
  const questionClassName = "text-base font-medium text-[color:var(--foreground)]";
  const entryDate = entry?.date ? parseDateKey(entry.date) : null;
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
              imageSrc={mood.imageSrc}
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
              imageSrc={energy.imageSrc}
              label={energy.label}
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
            label={noSymptomLabel}
            rotate="rotate-[2deg]"
            onClick={() => onChange({ symptoms: [] })}
          />
          {symptomOptions.map((symptom, index) =>
            <SymptomStickerButton
              key={symptom}
              active={Boolean(entry?.symptoms?.includes(symptom))}
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
        <div className="flex flex-wrap gap-2">
          {flowOptions.map((flow) =>
            <SelectionPill
              key={flow.value}
              active={bleedingLevel === flow.value}
              label={flow.label}
              onClick={() =>
                onChange({
                  flow: flow.value === "spotting" ? undefined : flow.value,
                  bleedingLevel: flow.value,
                  periodSignal: flow.value === "none" ? "none" : entry?.periodSignal ?? "none",
                  isPeriodStart: false
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
                checked={entry?.periodSignal === "possible_start"}
                onChange={() =>
                  onChange({
                    flow:
                      bleedingLevel && bleedingLevel !== "none" && bleedingLevel !== "spotting"
                        ? bleedingLevel
                        : undefined,
                    bleedingLevel,
                    periodSignal: entry?.periodSignal === "possible_start" ? "none" : "possible_start",
                    isPeriodStart: false
                  })
                }
                className="size-4 rounded border-[color:var(--border)] text-[color:var(--foreground)] accent-[color:var(--foreground)]"
              />
              <span>这次感觉像经期开始</span>
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
        <CompletedLogDetails entry={draftEntry} onChange={updateDraftEntry} />
        <div className="-mx-6 mt-2 border-t border-[color:var(--border)] px-6 pt-4">
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
  const progress = getLogProgress(entry);
  const nextStep = getSuggestedStep(entry);
  const currentStep = stepOverride ?? nextStep ?? "mood";
  const currentStepIndex = stepOrder.indexOf(currentStep) + 1;
  const bleedingLevel = getBleedingLevel(entry);
  const currentDate = parseDateKey(date);
  const phaseLabel = profile ? getCycleSummary(profile, entries, currentDate).phase.label : null;
  const flowQuestion = phaseLabel === "月经期" ? "今天经血量如何？" : "今天有经血吗？";

  const completedLabels = useMemo(() => {
    const labels = [];
    if (entry?.mood) labels.push("心情");
    if (entry?.energy) labels.push("能量");
    if (entry?.symptoms !== undefined) labels.push("症状");
    if (bleedingLevel !== undefined) labels.push("出血");
    if (entry?.periodSignal && entry.periodSignal !== "none") labels.push("经期信号");
    return labels.join(" · ");
  }, [bleedingLevel, entry]);
  const canShowPeriodSignal = Boolean(bleedingLevel && bleedingLevel !== "none");
  const noSymptomSelected = entry?.symptoms !== undefined && entry.symptoms.length === 0;

  const renderStep = (step: QuickLogStep) => {
    const progressText = `${currentStepIndex}/${stepOrder.length}`;
    const questionClassName = "text-sm font-medium text-[color:var(--foreground)]";

    if (step === "mood") {
      return (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className={questionClassName}>今天心情如何？</p>
            <p className={cn("text-sm font-medium", uiTextStyles.muted)}>{progressText}</p>
          </div>
          <div className="mt-4 rounded-[calc(var(--radius-xl)+10px)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,255,255,0.56))] px-3 py-4">
            <div className="relative mx-auto h-[7.5rem] w-full max-w-[19rem] sm:h-[8.25rem] sm:max-w-[21rem]">
              {moodOptions.map((mood) => (
                <MoodSticker
                  key={mood.value}
                  active={entry?.mood === mood.value}
                  imageSrc={mood.imageSrc}
                  label={mood.label}
                  value={mood.value}
                  onClick={() => {
                    updateEntry(date, { mood: mood.value });
                    setStepOverride("energy");
                  }}
                />
              ))}
            </div>
          </div>
        </>
      );
    }

    if (step === "energy") {
      return (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className={questionClassName}>感觉体内的能量如何？</p>
            <p className={cn("text-sm font-medium", uiTextStyles.muted)}>{progressText}</p>
          </div>
          <div className="mt-4 rounded-[calc(var(--radius-xl)+10px)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,255,255,0.56))] px-2 py-3">
            <div className="grid grid-cols-4 gap-1.5">
              {energyOptions.map((energy) => (
                <EnergyStickerButton
                  key={energy.value}
                  active={entry?.energy === energy.value}
                  imageSrc={energy.imageSrc}
                  label={energy.label}
                  rotate={energy.rotate}
                  onClick={() => {
                    updateEntry(date, { energy: energy.value });
                    setStepOverride("symptoms");
                  }}
                />
              ))}
            </div>
          </div>
        </>
      );
    }

    if (step === "symptoms") {
      return (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className={questionClassName}>身体有什么信号？</p>
            <p className={cn("text-sm font-medium", uiTextStyles.muted)}>{progressText}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <SymptomStickerButton
              active={noSymptomSelected}
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
          <div className={cn(uiSpacingStyles.sectionTop, "flex flex-wrap items-center justify-end", uiSpacingStyles.gapSm)}>
            <Button
              variant="primary"
              onClick={() => setStepOverride(null)}
              disabled={entry?.symptoms === undefined}
            >
              下一步
            </Button>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="flex items-start justify-between gap-3">
          <p className={questionClassName}>{flowQuestion}</p>
          <p className={cn("text-sm font-medium", uiTextStyles.muted)}>{progressText}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {flowOptions.map((flow) => (
            <button
              key={flow.value}
              type="button"
              onClick={() =>
                updateEntry(date, {
                  flow: flow.value === "spotting" ? undefined : flow.value,
                  bleedingLevel: flow.value,
                  periodSignal: flow.value === "none" ? "none" : entry?.periodSignal ?? "none",
                  isPeriodStart: false
                })
              }
              className={getChoiceTileClass(bleedingLevel === flow.value)}
            >
              {flow.label}
            </button>
          ))}
        </div>
        {canShowPeriodSignal ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              variant={entry?.periodSignal === "possible_start" ? "primary" : "soft"}
              onClick={() =>
                updateEntry(date, {
                  flow:
                    bleedingLevel && bleedingLevel !== "none" && bleedingLevel !== "spotting"
                      ? bleedingLevel
                      : undefined,
                  bleedingLevel,
                  periodSignal: entry?.periodSignal === "possible_start" ? "none" : "possible_start",
                  isPeriodStart: false
                })
              }
            >
              这次感觉像经期开始
            </Button>
          </div>
        ) : null}
      </>
    );
  };

  if (progress === "complete") {
    if (completedDisplay === "expanded") {
      const content = (
        <>
          <div>
            <p className={cn("text-sm", uiTextStyles.muted)}>今日记录已完成</p>
            <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">{completedLabels}</p>
          </div>
          <div className={uiSpacingStyles.sectionTop}>
            <CompletedLogDetails entry={entry} onChange={(patch) => updateEntry(date, patch)} />
          </div>
        </>
      );

      return surface === "plain" ? content : <Card>{content}</Card>;
    }

    return (
      <>
        <Card className={className}>
          <div className={cn("flex items-center justify-between", uiSpacingStyles.gapSm)}>
            <div>
              <p className={cn("text-sm", uiTextStyles.muted)}>今日记录已完成</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setIsExpanded(true);
              }}
            >
              查看
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </Card>

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

  return surface === "plain" ? (
    <div className={className}>{renderStep(currentStep)}</div>
  ) : (
    <Card className={className}>{renderStep(currentStep)}</Card>
  );
}
