import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, PencilLine } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { getLogProgress, getSuggestedStep } from "../../features/cycle/cycle";
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
  { label: "少量", value: "light" },
  { label: "中等", value: "medium" },
  { label: "较多", value: "heavy" }
] as const;

type QuickLogCardProps = {
  date: string;
  entry?: DailyEntry;
};

export function QuickLogCard({ date, entry }: QuickLogCardProps) {
  const updateEntry = useCycleStore((state) => state.updateEntry);
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = getLogProgress(entry);
  const nextStep = getSuggestedStep(entry);

  const completedLabels = useMemo(() => {
    const labels = [];
    if (entry?.mood) labels.push("心情");
    if (entry?.symptoms?.length) labels.push("症状");
    if (entry?.flow) labels.push("出血量");
    return labels.join(" · ");
  }, [entry]);

  const moodLabel = moods.find((item) => item.value === entry?.mood)?.label ?? "未记录";
  const flowLabel = flowOptions.find((item) => item.value === entry?.flow)?.label ?? "未记录";
  const symptomLabel =
    entry?.symptoms && entry.symptoms.length > 0 ? entry.symptoms.join("、") : "今天没有明显不适";

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
    if (step === "mood") {
      return (
        <>
          <p className="text-sm font-medium text-[var(--color-muted)]">今天心情如何？</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.value}
                type="button"
                onClick={() => updateEntry(date, { mood: mood.value })}
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
          <p className="text-sm font-medium text-[var(--color-muted)]">身体有什么信号？</p>
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
                }
              });
            })}
          </div>
          <div className="mt-4">
            <Button variant="soft" onClick={() => updateEntry(date, { symptoms: [] })}>
              今天没有明显不适
            </Button>
          </div>
        </>
      );
    }

    return (
      <>
        <p className="text-sm font-medium text-[var(--color-muted)]">今天出血量如何？</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {flowOptions.map((flow) => (
            <button
              key={flow.value}
              type="button"
              onClick={() => updateEntry(date, { flow: flow.value })}
              className={cn(
                "rounded-2xl px-3 py-4 text-sm transition",
                entry?.flow === flow.value
                  ? "bg-[var(--color-ink)] text-white"
                  : "bg-[var(--color-panel)] text-[var(--color-ink)]"
              )}
            >
              {flow.label}
            </button>
          ))}
        </div>
      </>
    );
  };

  if (progress === "complete") {
    return (
      <Card className="sticky bottom-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--color-muted)]">今日记录已完成</p>
            <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">{completedLabels}</p>
          </div>
          <Button variant="secondary" onClick={() => setIsExpanded((value) => !value)}>
            {isExpanded ? "收起" : "查看"}
            {isExpanded ? (
              <ChevronDown className="ml-1 size-4" />
            ) : (
              <ChevronRight className="ml-1 size-4" />
            )}
          </Button>
        </div>

        {isExpanded ? (
          <div className="mt-5 space-y-5 border-t border-[var(--color-border)] pt-5">
            <div className="grid gap-3">
              <div className="rounded-2xl bg-[var(--color-panel)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                      心情
                    </p>
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
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                      身体症状
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">
                      {symptomLabel}
                    </p>
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
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                      出血量
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{flowLabel}</p>
                  </div>
                  <PencilLine className="size-4 text-[var(--color-muted)]" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {flowOptions.map((flow) =>
                    renderPillButton({
                      active: entry?.flow === flow.value,
                      label: flow.label,
                      onClick: () => updateEntry(date, { flow: flow.value })
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    );
  }

  return <Card>{renderStep(nextStep ?? "mood")}</Card>;
}
