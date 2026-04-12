import { BookOpen, MoonStar, Sparkle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/card";
import type { ReturnTypeOfGetCycleSummary } from "../../types/helper";
import { cn } from "../../lib/utils";
import { uiSpacingStyles, uiSurfaceStyles, uiTextStyles } from "../ui/styles";

type PhaseHeroCardProps = {
  summary: ReturnTypeOfGetCycleSummary;
};

export function PhaseHeroCard({ summary }: PhaseHeroCardProps) {
  const navigate = useNavigate();

    return (
    <Card className="overflow-hidden">
      <div className={cn("rounded-[var(--radius-lg)]", uiSurfaceStyles.panel)}>
        <div className={cn("flex items-start justify-between", uiSpacingStyles.gapSm)}>
          <div className="min-w-0">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-full text-sm transition-colors hover:text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]",
                uiTextStyles.muted
              )}
              onClick={() =>
                navigate("/phase-science", {
                  state: { initialPhaseLabel: summary.phase.label }
                })
              }
            >
              <span>{summary.phase.label}</span>
              <BookOpen className="size-4" strokeWidth={1.8} />
            </button>
            <p className={cn("mt-1 text-sm", uiTextStyles.muted)}>
              还将持续{summary.phaseRemainingDays}天·Next {summary.nextPhase.label}
            </p>
          </div>
          <button type="button" className="rounded-full bg-[color:var(--card-elevated)] p-2 text-[color:var(--muted-foreground)]">
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
            <MoonStar className="size-24 text-[color:var(--foreground)]" strokeWidth={1.2} />
          </div>
        </div>

        <div className={cn("text-center", uiSpacingStyles.stackSm)}>
          <h2 className="text-3xl font-semibold leading-tight text-[color:var(--foreground)]">{summary.phase.tone}</h2>
          <p className={cn("text-sm", uiTextStyles.muted)}>{summary.phase.advice}</p>
        </div>
      </div>
    </Card>
  );
}
