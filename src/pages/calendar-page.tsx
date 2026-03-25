import { Card } from "../components/ui/card";
import { CalendarMonthCard } from "../components/domain/calendar-month-card";
import { getCycleSummary } from "../features/cycle/cycle";
import { useCycleStore } from "../features/cycle/store";
import { formatShortDate } from "../lib/utils";

export function CalendarPage() {
  const profile = useCycleStore((state) => state.profile)!;
  const today = new Date();
  const summary = getCycleSummary(profile, today);
  const months = [
    new Date(today.getFullYear(), today.getMonth(), 1),
    new Date(today.getFullYear(), today.getMonth() + 1, 1)
  ];

  return (
    <div className="space-y-4 pb-6">
      <Card>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-[var(--color-muted)]">周期长度</p>
            <p className="mt-1 text-2xl font-semibold">{profile.cycleLength}天</p>
          </div>
          <div>
            <p className="text-[var(--color-muted)]">月经</p>
            <p className="mt-1 text-2xl font-semibold">{profile.periodLength}天</p>
          </div>
          <div>
            <p className="text-[var(--color-muted)]">下次月经</p>
            <p className="mt-1 text-2xl font-semibold">{formatShortDate(summary.nextPeriodStart)}</p>
          </div>
        </div>
      </Card>

      <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {months.map((month) => (
          <div key={month.toISOString()} className="min-w-full snap-center">
            <CalendarMonthCard monthDate={month} profile={profile} today={today} />
          </div>
        ))}
      </div>

      <Card className="flex flex-wrap gap-4 text-sm text-[var(--color-muted)]">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[var(--color-rose)]" />
          月经期
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[var(--color-accent)]" />
          卵泡期
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[var(--color-gold)]" />
          排卵期
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[var(--color-blue)]" />
          黄体期
        </div>
      </Card>
    </div>
  );
}
