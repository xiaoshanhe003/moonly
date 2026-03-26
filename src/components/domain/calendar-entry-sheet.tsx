import { X } from "lucide-react";
import { Button } from "../ui/button";
import { CompletedLogDetails, QuickLogCard } from "./quick-log-card";
import { getBleedingLevel, getLogProgress } from "../../features/cycle/cycle";
import type { DailyEntry } from "../../features/cycle/types";
import { formatFullDate } from "../../lib/utils";

type CalendarEntrySheetProps = {
  date: string;
  dateValue: Date;
  entry: DailyEntry;
  isToday: boolean;
  onClose: () => void;
};

const moodLabels: Record<NonNullable<DailyEntry["mood"]>, string> = {
  happy: "开心",
  calm: "平静",
  tense: "紧绷"
};

const bleedingLabels: Record<NonNullable<DailyEntry["bleedingLevel"]>, string> = {
  none: "无",
  spotting: "点滴",
  light: "少量",
  medium: "中等",
  heavy: "较多"
};

export function CalendarEntrySheet({ date, dateValue, entry, isToday, onClose }: CalendarEntrySheetProps) {
  const bleedingLevel = getBleedingLevel(entry);
  const progress = getLogProgress(entry);
  const moodLabel = entry.mood ? moodLabels[entry.mood] : "未记录";
  const symptomLabel =
    entry.symptoms === undefined
      ? "未记录"
      : entry.symptoms.length > 0
        ? entry.symptoms.join("、")
        : "今天没有明显不适";
  const bleedingLabel = bleedingLevel ? bleedingLabels[bleedingLevel] : "未记录";
  const periodSignalLabel =
    entry.periodSignal && entry.periodSignal !== "none" ? "这次感觉像经期开始" : "未标记为经期开始";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-[rgba(36,52,51,0.18)] p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full overflow-hidden rounded-t-[28px] bg-white shadow-[var(--shadow-card)] sm:max-w-2xl sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <p className="text-sm text-[var(--color-muted)]">{formatFullDate(dateValue)}</p>
            <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
              {isToday ? "今日记录，可直接编辑" : "历史记录，仅供查看"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="max-h-[calc(88vh-5rem)] overflow-y-auto p-5">
          {isToday && progress === "complete" ? (
            <div>
              <div>
                <p className="text-sm text-[var(--color-muted)]">今日记录已完成</p>
              </div>
              <div className="mt-4">
                <CompletedLogDetails date={date} entry={entry} />
              </div>
            </div>
          ) : isToday ? (
            <QuickLogCard date={date} entry={entry} surface="plain" />
          ) : (
            <div className="grid gap-3">
              <div className="rounded-2xl bg-[var(--color-panel)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">心情</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{moodLabel}</p>
              </div>

              <div className="rounded-2xl bg-[var(--color-panel)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">身体症状</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{symptomLabel}</p>
              </div>

              <div className="rounded-2xl bg-[var(--color-panel)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">出血情况</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{bleedingLabel}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{periodSignalLabel}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
