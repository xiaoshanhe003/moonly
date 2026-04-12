import { DetailPanel } from "../ui/detail-panel";
import { Sheet } from "../ui/sheet";
import { CompletedLogDetails, QuickLogCard } from "./quick-log-card";
import { getBleedingLevel, getLogProgress } from "../../features/cycle/cycle";
import type { DailyEntry } from "../../features/cycle/types";
import { cn } from "../../lib/utils";
import { formatFullDate } from "../../lib/utils";
import { uiTextStyles } from "../ui/styles";

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
    <Sheet
      onClose={onClose}
      header={
        <>
          <p className={cn("text-sm", uiTextStyles.muted)}>{formatFullDate(dateValue)}</p>
          <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">
            {isToday ? "今日记录，可直接编辑" : "历史记录，仅供查看"}
          </p>
        </>
      }
    >
      {isToday && progress === "complete" ? (
        <div>
          <div>
            <p className={cn("text-sm", uiTextStyles.muted)}>今日记录已完成</p>
          </div>
          <div className="mt-4">
            <CompletedLogDetails date={date} entry={entry} />
          </div>
        </div>
      ) : isToday ? (
        <QuickLogCard date={date} entry={entry} surface="plain" />
      ) : (
        <div className="grid gap-3">
          <DetailPanel label="心情" value={moodLabel} />
          <DetailPanel label="身体症状" value={symptomLabel} />
          <DetailPanel label="出血情况" value={bleedingLabel} hint={periodSignalLabel} />
        </div>
      )}
    </Sheet>
  );
}
