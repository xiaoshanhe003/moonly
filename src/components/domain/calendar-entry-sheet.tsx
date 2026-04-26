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

type CalendarEntrySheetProps = {
  date: string;
  entry?: DailyEntry;
  isToday: boolean;
  onClose: () => void;
};

export function CalendarEntrySheet({ date, entry, isToday, onClose }: CalendarEntrySheetProps) {
  const progress = entry ? getLogProgress(entry) : null;

  return (
    <Sheet
      onClose={() => {
        onClose();
      }}
      header={<CompletedRecordSheetHeader date={date} />}
    >
      {!entry ? (
        <p className="text-base font-medium text-[color:var(--foreground)]">无记录</p>
      ) : isToday && progress === "complete" ? (
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
