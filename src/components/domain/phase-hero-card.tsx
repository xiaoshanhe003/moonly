import { MoonStar, Sparkle } from "lucide-react";
import { Card } from "../ui/card";
import type { ReturnTypeOfGetCycleSummary } from "../../types/helper";

type PhaseHeroCardProps = {
  summary: ReturnTypeOfGetCycleSummary;
};

export function PhaseHeroCard({ summary }: PhaseHeroCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="rounded-[24px] bg-[var(--color-panel)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--color-muted)]">
              {summary.phase.label} · 还剩约 {summary.daysUntilNextPeriod} 天 · 下次月经期
            </p>
          </div>
          <button type="button" className="rounded-full bg-white p-2 text-[var(--color-muted)]">
            <Sparkle className="size-4" />
          </button>
        </div>

        <div className="my-8 flex justify-center">
          <div
            className="flex size-52 items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle, ${summary.phase.color} 0%, transparent 58%)`
            }}
          >
            <MoonStar className="size-24 text-[var(--color-ink)]" strokeWidth={1.2} />
          </div>
        </div>

        <div className="space-y-3 text-center">
          <h2 className="text-3xl font-semibold leading-tight text-[var(--color-ink)]">
            {summary.phase.tone}
          </h2>
          <p className="text-sm text-[var(--color-muted)]">{summary.phase.advice}</p>
        </div>
      </div>
    </Card>
  );
}
