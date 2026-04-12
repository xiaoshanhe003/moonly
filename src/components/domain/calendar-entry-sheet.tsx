import { Sheet } from "../ui/sheet";
import {
  CompletedRecordSheetContent,
  CompletedRecordSheetHeader,
  LogAnswerSummary,
  QuickLogCard
} from "./quick-log-card";
import { getLogProgress } from "../../features/cycle/cycle";
import type { DailyEntry } from "../../features/cycle/types";
import { useCycleStore } from "../../features/cycle/store";
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

export function CalendarEntrySheet({ date, dateValue, entry, isToday, onClose }: CalendarEntrySheetProps) {
  const progress = getLogProgress(entry);

  return (
    <Sheet
      onClose={() => {
        onClose();
      }}
      header={
        isToday ? (
          <CompletedRecordSheetHeader date={date} />
        ) : (
          <>
            <p className={cn("text-sm", uiTextStyles.muted)}>{formatFullDate(dateValue)}</p>
            <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">历史记录，仅供查看</p>
          </>
        )
      }
    >
      {isToday && progress === "complete" ? (
        <CompletedRecordSheetContent
          date={date}
          entry={entry}
          onSave={(nextEntry) => useCycleStore.getState().updateEntry(date, nextEntry)}
        />
      ) : isToday ? (
        <QuickLogCard date={date} entry={entry} surface="plain" />
      ) : (
        <LogAnswerSummary entry={entry} />
      )}
    </Sheet>
  );
}
