import { BookOpen, MoonStar, Sparkle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/card";
import type { ReturnTypeOfGetCycleSummary } from "../../types/helper";

type PhaseHeroCardProps = {
  summary: ReturnTypeOfGetCycleSummary;
};

export function PhaseHeroCard({ summary }: PhaseHeroCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden">
      <div className="rounded-[24px] bg-[var(--color-panel)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-strong)]"
              onClick={() =>
                navigate("/phase-science", {
                  state: { initialPhaseLabel: summary.phase.label }
                })
              }
            >
              <span>{summary.phase.label}</span>
              <BookOpen className="size-4" strokeWidth={1.8} />
            </button>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              还将持续{summary.phaseRemainingDays}天·Next {summary.nextPhase.label}
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
