import { Sheet } from "../ui/sheet";
import {
  CompletedRecordSheet,
  CompletedRecordSheetHeader,
  LogAnswerSummary
} from "./quick-log-card";
import { getLogProgress } from "../../features/cycle/cycle";
import type { DailyEntry } from "../../features/cycle/types";
import { useCycleStore } from "../../features/cycle/store";

type CalendarEntrySheetProps = {
  date: string;
  entry?: DailyEntry;
  canEdit: boolean;
  onClose: () => void;
};

export function CalendarEntrySheet({ date, entry, canEdit, onClose }: CalendarEntrySheetProps) {
  const progress = entry ? getLogProgress(entry) : null;

  if (canEdit) {
    return (
      <CompletedRecordSheet
        date={date}
        entry={entry}
        initialEditing={progress !== "complete"}
        onSave={(nextEntry) => useCycleStore.getState().updateEntry(date, nextEntry)}
        onClose={onClose}
      />
    );
  }

  return (
    <Sheet
      onClose={() => {
        onClose();
      }}
      header={<CompletedRecordSheetHeader date={date} />}
    >
      {!entry ? (
        <p className="text-base font-medium text-[color:var(--foreground)]">无记录</p>
      ) : (
        <LogAnswerSummary entry={entry} />
      )}
    </Sheet>
  );
}
