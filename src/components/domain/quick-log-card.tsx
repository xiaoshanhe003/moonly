import { useMemo, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Sheet } from "../ui/sheet";
import { getBleedingLevel, getCycleSummary, getLogProgress, getSuggestedStep } from "../../features/cycle/cycle";
import type { DailyEntry, QuickLogStep } from "../../features/cycle/types";
import { cn } from "../../lib/utils";
import { useCycleStore } from "../../features/cycle/store";
import { getChoiceTileClass, uiSpacingStyles, uiTextStyles } from "../ui/styles";
import { formatFullDate } from "../../lib/utils";

const moods = [
  { label: "超开心", value: "great", emoji: "😆" },
  { label: "开心", value: "happy", emoji: "☺️" },
  { label: "鼻酸", value: "low", emoji: "🥲" },
  { label: "想哭", value: "tense", emoji: "😭" },
  { label: "平静", value: "calm", emoji: "🙂" }
] as const;

const moodStickerLayout: Record<
  (typeof moods)[number]["value"],
  {
    rotate: string;
    shift: string;
  }
> = {
  great: { rotate: "-rotate-2", shift: "-translate-y-0.5 translate-x-0.5" },
  happy: { rotate: "rotate-1", shift: "translate-y-0.5" },
  low: { rotate: "-rotate-1", shift: "translate-y-0.5 -translate-x-0.5" },
  tense: { rotate: "rotate-2", shift: "-translate-y-0.5 translate-x-0.5" },
  calm: { rotate: "-rotate-1", shift: "translate-y-1" }
};

const noSymptomLabel = "没有不适";
const symptomOptions = ["疲惫", "头痛", "乳房胀痛", "腹胀", "腹痛", "腰酸"];
const flowOptions = [
  { label: "无", value: "none" },
  { label: "点滴", value: "spotting" },
  { label: "少量", value: "light" },
  { label: "中等", value: "medium" },
  { label: "较多", value: "heavy" }
] as const;
const stepOrder: QuickLogStep[] = ["mood", "symptoms", "flow"];

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
  emoji,
  label,
  value,
  onClick
}: {
  active: boolean;
  emoji: string;
  label: string;
  value: (typeof moods)[number]["value"];
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
        "flex h-16 w-16 items-center justify-center rounded-full border shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition duration-200 active:scale-[0.98] sm:h-18 sm:w-18",
        layout.rotate,
        layout.shift,
        active
          ? "border-[color:var(--foreground)] bg-[color:var(--muted-strong)] text-[color:var(--foreground)] shadow-[0_0_0_1px_var(--foreground)_inset,0_18px_36px_rgba(15,23,42,0.12)]"
          : "border-[color:var(--border)] bg-[color:var(--card-elevated)] text-[color:var(--foreground)] hover:-translate-y-0.5"
      )}
    >
      <span className="text-[2.6rem] leading-none sm:text-[3rem]" aria-hidden="true">
        {emoji}
      </span>
    </button>
  );
}

function MoodValue({ mood }: { mood?: DailyEntry["mood"] }) {
  const moodItem = moods.find((item) => item.value === mood);

  if (!moodItem) {
    return <>未记录</>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-base leading-none" aria-hidden="true">
        {moodItem.emoji}
      </span>
      <span>{moodItem.label}</span>
    </span>
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
        <div className="grid grid-cols-5 justify-items-center gap-3">
          {moods.map((mood) => (
            <MoodSticker
              key={mood.value}
              active={entry?.mood === mood.value}
              emoji={mood.emoji}
              label={mood.label}
              value={mood.value}
              onClick={() => onChange({ mood: mood.value })}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <p className={questionClassName}>身体有什么信号？</p>
        <div className="flex flex-wrap gap-2">
          <SelectionPill active={noSymptomSelected} label={noSymptomLabel} onClick={() => onChange({ symptoms: [] })} />
          {symptomOptions.map((symptom) =>
            <SelectionPill
              key={symptom}
              active={Boolean(entry?.symptoms?.includes(symptom))}
              label={symptom}
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
            <div className="grid grid-cols-5 justify-items-center gap-3">
              {moods.map((mood) => (
                <MoodSticker
                  key={mood.value}
                  active={entry?.mood === mood.value}
                  emoji={mood.emoji}
                  label={mood.label}
                  value={mood.value}
                  onClick={() => {
                    updateEntry(date, { mood: mood.value });
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
          <div className="mt-4 flex flex-wrap gap-2">
            <SelectionPill
              active={noSymptomSelected}
              label={noSymptomLabel}
              onClick={() => {
                updateEntry(date, { symptoms: [] });
                setStepOverride("symptoms");
              }}
            />
            {symptomOptions.map((symptom) => {
              const active = entry?.symptoms?.includes(symptom);
              return (
                <SelectionPill
                  key={symptom}
                  active={Boolean(active)}
                  label={symptom}
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
          <div className={cn(uiSpacingStyles.sectionTop, "flex flex-wrap items-center", uiSpacingStyles.gapSm)}>
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
