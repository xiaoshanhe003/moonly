import { useMemo, useState } from "react";
import { Check, ChevronRight, PencilLine, X } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { getBleedingLevel, getLogProgress, getSuggestedStep } from "../../features/cycle/cycle";
import type { DailyEntry, QuickLogStep } from "../../features/cycle/types";
import { cn } from "../../lib/utils";
import { useCycleStore } from "../../features/cycle/store";

const moods = [
  { label: "开心", value: "happy" },
  { label: "平静", value: "calm" },
  { label: "紧绷", value: "tense" }
] as const;

const symptomOptions = ["腹胀", "疲惫", "头痛", "痉挛"];
const flowOptions = [
  { label: "无", value: "none" },
  { label: "点滴", value: "spotting" },
  { label: "少量", value: "light" },
  { label: "中等", value: "medium" },
  { label: "较多", value: "heavy" }
] as const;
const stepOrder: QuickLogStep[] = ["mood", "symptoms", "flow"];

type QuickLogCardProps = {
  date: string;
  entry?: DailyEntry;
};

export function QuickLogCard({ date, entry }: QuickLogCardProps) {
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

  const moodLabel = moods.find((item) => item.value === entry?.mood)?.label ?? "未记录";
  const flowLabel = flowOptions.find((item) => item.value === bleedingLevel)?.label ?? "未记录";
  const symptomLabel =
    entry?.symptoms && entry.symptoms.length > 0 ? entry.symptoms.join("、") : "今天没有明显不适";
  const periodSignalLabel =
    entry?.periodSignal && entry.periodSignal !== "none" ? "这次感觉像经期开始" : "暂未标记为经期开始";
  const canShowPeriodSignal = Boolean(bleedingLevel && bleedingLevel !== "none");

  const renderPillButton = ({
    active,
    label,
    onClick
  }: {
    active: boolean;
    label: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm transition",
        active
          ? "bg-[var(--color-ink)] text-white"
          : "bg-[var(--color-panel)] text-[var(--color-ink)]"
      )}
    >
      {label}
    </button>
  );

  const renderStep = (step: QuickLogStep) => {
    const progressText = `${currentStepIndex}/${stepOrder.length}`;

    if (step === "mood") {
      return (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-[var(--color-muted)]">今天心情如何？</p>
            <p className="text-sm font-medium text-[var(--color-muted)]">{progressText}</p>
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
                className={cn(
                  "rounded-2xl px-3 py-5 text-sm transition",
                  entry?.mood === mood.value
                    ? "bg-[var(--color-ink)] text-white"
                    : "bg-[var(--color-panel)] text-[var(--color-ink)]"
                )}
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
            <p className="text-sm font-medium text-[var(--color-muted)]">身体有什么信号？</p>
            <p className="text-sm font-medium text-[var(--color-muted)]">{progressText}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {symptomOptions.map((symptom) => {
              const active = entry?.symptoms?.includes(symptom);
              return renderPillButton({
                active: Boolean(active),
                label: symptom,
                onClick: () => {
                  const previous = new Set(entry?.symptoms ?? []);
                  if (previous.has(symptom)) {
                    previous.delete(symptom);
                  } else {
                    previous.add(symptom);
                  }
                  updateEntry(date, { symptoms: [...previous] });
                  setStepOverride("symptoms");
                }
              });
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              variant="soft"
              onClick={() => {
                updateEntry(date, { symptoms: [] });
                setStepOverride("symptoms");
              }}
            >
              今天没有明显不适
            </Button>
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
          <p className="text-sm font-medium text-[var(--color-muted)]">今天有出血吗？</p>
          <p className="text-sm font-medium text-[var(--color-muted)]">{progressText}</p>
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
              className={cn(
                "rounded-2xl px-3 py-4 text-sm transition",
                bleedingLevel === flow.value
                  ? "bg-[var(--color-ink)] text-white"
                  : "bg-[var(--color-panel)] text-[var(--color-ink)]"
              )}
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

  const renderCompletedDetails = () => (
    <div className="grid gap-3">
      <div className="rounded-2xl bg-[var(--color-panel)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">心情</p>
            <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{moodLabel}</p>
          </div>
          <PencilLine className="size-4 text-[var(--color-muted)]" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {moods.map((mood) =>
            renderPillButton({
              active: entry?.mood === mood.value,
              label: mood.label,
              onClick: () => updateEntry(date, { mood: mood.value })
            })
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--color-panel)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">身体症状</p>
            <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{symptomLabel}</p>
          </div>
          <PencilLine className="size-4 text-[var(--color-muted)]" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {symptomOptions.map((symptom) =>
            renderPillButton({
              active: Boolean(entry?.symptoms?.includes(symptom)),
              label: symptom,
              onClick: () => {
                const previous = new Set(entry?.symptoms ?? []);
                if (previous.has(symptom)) {
                  previous.delete(symptom);
                } else {
                  previous.add(symptom);
                }
                updateEntry(date, { symptoms: [...previous] });
              }
            })
          )}
          <Button variant="soft" onClick={() => updateEntry(date, { symptoms: [] })}>
            <Check className="mr-1 size-4" />
            没有明显不适
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--color-panel)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">出血情况</p>
            <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{flowLabel}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{periodSignalLabel}</p>
          </div>
          <PencilLine className="size-4 text-[var(--color-muted)]" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {flowOptions.map((flow) =>
            renderPillButton({
              active: bleedingLevel === flow.value,
              label: flow.label,
              onClick: () =>
                updateEntry(date, {
                  flow: flow.value === "spotting" ? undefined : flow.value,
                  bleedingLevel: flow.value,
                  periodSignal: flow.value === "none" ? "none" : entry?.periodSignal ?? "none",
                  isPeriodStart: false
                })
            })
          )}
        </div>
        {canShowPeriodSignal ? (
          <div className="mt-4">
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
      </div>
    </div>
  );

  if (progress === "complete") {
    return (
      <>
        <Card className="sticky bottom-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--color-muted)]">今日记录已完成</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">{completedLabels}</p>
            </div>
            <Button variant="secondary" onClick={() => setIsExpanded(true)}>
              查看
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </Card>

        {isExpanded ? (
          <div
            className="fixed inset-0 z-50 flex items-end bg-[rgba(36,52,51,0.18)] p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
            onClick={() => setIsExpanded(false)}
          >
            <div
              className="max-h-[88vh] w-full overflow-hidden rounded-t-[28px] bg-white shadow-[var(--shadow-card)] sm:max-w-2xl sm:rounded-[28px]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                <div>
                  <p className="text-sm text-[var(--color-muted)]">今日记录已完成</p>
                  <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">{completedLabels}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
                  <X className="size-4" />
                </Button>
              </div>

              <div className="max-h-[calc(88vh-5rem)] overflow-y-auto p-5">{renderCompletedDetails()}</div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return <Card>{renderStep(currentStep)}</Card>;
}
