import { useMemo, useState } from "react";
import { Check, ChevronRight, PencilLine } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { DetailPanel } from "../ui/detail-panel";
import { Sheet } from "../ui/sheet";
import { getBleedingLevel, getLogProgress, getSuggestedStep } from "../../features/cycle/cycle";
import type { DailyEntry, QuickLogStep } from "../../features/cycle/types";
import { cn } from "../../lib/utils";
import { useCycleStore } from "../../features/cycle/store";
import { getChoiceTileClass, getOptionPillClass, uiSpacingStyles, uiTextStyles } from "../ui/styles";

const moods = [
  { label: "开心", value: "happy" },
  { label: "平静", value: "calm" },
  { label: "紧绷", value: "tense" }
] as const;

const noSymptomLabel = "没有不适";
const symptomOptions = ["腹胀", "疲惫", "头痛", "痉挛"];
const flowOptions = [
  { label: "无", value: "none" },
  { label: "点滴", value: "spotting" },
  { label: "少量", value: "light" },
  { label: "中等", value: "medium" },
  { label: "较多", value: "heavy" }
] as const;
const stepOrder: QuickLogStep[] = ["mood", "symptoms", "flow"];

type CompletedLogDetailsProps = {
  date: string;
  entry?: DailyEntry;
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
    <button type="button" onClick={onClick} className={getOptionPillClass(active)}>
      {active ? <Check className="size-4" /> : null}
      {label}
    </button>
  );
}

export function CompletedLogDetails({ date, entry }: CompletedLogDetailsProps) {
  const updateEntry = useCycleStore((state) => state.updateEntry);
  const bleedingLevel = getBleedingLevel(entry);
  const moodLabel = moods.find((item) => item.value === entry?.mood)?.label ?? "未记录";
  const flowLabel = flowOptions.find((item) => item.value === bleedingLevel)?.label ?? "未记录";
  const symptomLabel =
    entry?.symptoms && entry.symptoms.length > 0 ? entry.symptoms.join("、") : "今天没有明显不适";
  const periodSignalLabel =
    entry?.periodSignal && entry.periodSignal !== "none" ? "这次感觉像经期开始" : "暂未标记为经期开始";
  const canShowPeriodSignal = Boolean(bleedingLevel && bleedingLevel !== "none");
  const noSymptomSelected = entry?.symptoms !== undefined && entry.symptoms.length === 0;

  return (
    <div className={cn("grid", uiSpacingStyles.gapSm)}>
      <DetailPanel label="心情" value={moodLabel} action={<PencilLine className={cn("size-4", uiTextStyles.muted)} />}>
        <div className="flex flex-wrap gap-2">
          {moods.map((mood) =>
            <SelectionPill
              key={mood.value}
              active={entry?.mood === mood.value}
              label={mood.label}
              onClick={() => updateEntry(date, { mood: mood.value })}
            />
          )}
        </div>
      </DetailPanel>

      <DetailPanel
        label="身体症状"
        value={symptomLabel}
        action={<PencilLine className={cn("size-4", uiTextStyles.muted)} />}
      >
        <div className="flex flex-wrap gap-2">
          <SelectionPill active={noSymptomSelected} label={noSymptomLabel} onClick={() => updateEntry(date, { symptoms: [] })} />
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
                updateEntry(date, { symptoms: [...previous] });
              }}
            />
          )}
        </div>
      </DetailPanel>

      <DetailPanel
        label="出血情况"
        value={flowLabel}
        hint={periodSignalLabel}
        action={<PencilLine className={cn("size-4", uiTextStyles.muted)} />}
      >
        <div className="flex flex-wrap gap-2">
          {flowOptions.map((flow) =>
            <SelectionPill
              key={flow.value}
              active={bleedingLevel === flow.value}
              label={flow.label}
              onClick={() =>
                updateEntry(date, {
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
          <div className={uiSpacingStyles.sectionTop}>
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
      </DetailPanel>
    </div>
  );
}

type QuickLogCardProps = {
  date: string;
  entry?: DailyEntry;
  completedDisplay?: "compact" | "expanded";
  surface?: "card" | "plain";
  className?: string;
};

export function QuickLogCard({
  date,
  entry,
  completedDisplay = "compact",
  surface = "card",
  className
}: QuickLogCardProps) {
  const updateEntry = useCycleStore((state) => state.updateEntry);
  const [isExpanded, setIsExpanded] = useState(false);
  const [stepOverride, setStepOverride] = useState<QuickLogStep | null>(null);
  const progress = getLogProgress(entry);
  const nextStep = getSuggestedStep(entry);
  const currentStep = stepOverride ?? nextStep ?? "mood";
  const currentStepIndex = stepOrder.indexOf(currentStep) + 1;
  const bleedingLevel = getBleedingLevel(entry);

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

    if (step === "mood") {
      return (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className={cn("text-sm font-medium", uiTextStyles.muted)}>今天心情如何？</p>
            <p className={cn("text-sm font-medium", uiTextStyles.muted)}>{progressText}</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.value}
                type="button"
                onClick={() => {
                  updateEntry(date, { mood: mood.value });
                  setStepOverride("symptoms");
                }}
                className={getChoiceTileClass(entry?.mood === mood.value)}
              >
                {mood.label}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (step === "symptoms") {
      return (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className={cn("text-sm font-medium", uiTextStyles.muted)}>身体有什么信号？</p>
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
          <p className={cn("text-sm font-medium", uiTextStyles.muted)}>今天有出血吗？</p>
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
            <CompletedLogDetails date={date} entry={entry} />
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
            <Button variant="secondary" onClick={() => setIsExpanded(true)}>
              查看
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </Card>

        {isExpanded ? (
          <Sheet
            onClose={() => setIsExpanded(false)}
            header={
              <>
                <p className={cn("text-sm", uiTextStyles.muted)}>今日记录已完成</p>
                <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">{completedLabels}</p>
              </>
            }
          >
            <CompletedLogDetails date={date} entry={entry} />
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
