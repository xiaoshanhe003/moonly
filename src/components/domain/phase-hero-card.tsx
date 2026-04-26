import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ReturnTypeOfGetCycleSummary } from "../../types/helper";
import { cn } from "../../lib/utils";
import type { PhaseKey } from "../../features/cycle/cycle";
import { PhaseIllustration } from "./phase-illustration";
import { uiSpacingStyles, uiTextStyles } from "../ui/styles";

type PhaseHeroCardProps = {
  summary: ReturnTypeOfGetCycleSummary;
};

function getPhaseKeyFromLabel(label: string): PhaseKey {
  const labelMap: Record<string, PhaseKey> = {
    月经期: "menstrual",
    卵泡期: "follicular",
    排卵期: "ovulation",
    黄体期: "luteal"
  };

  return labelMap[label] ?? "follicular";
}

export function PhaseHeroCard({ summary }: PhaseHeroCardProps) {
  const navigate = useNavigate();
  const phaseKey = getPhaseKeyFromLabel(summary.phase.label);
  const adviceMatch = summary.phase.advice.match(/^宜\s+(.+?)\s+忌\s+(.+)$/);
  const doText = adviceMatch?.[1] ?? summary.phase.advice;
  const dontText = adviceMatch?.[2] ?? "";
  const titleText = summary.phase.tone.replace(/[。！？.!?]+$/u, "");

  return (
    <section className="relative px-2 pb-2 pt-6">
      <div className={cn("relative mx-auto flex max-w-[21rem] flex-col items-center text-center", uiSpacingStyles.gapMd)}>
        <div className={cn("inline-flex items-center gap-1 font-medium", uiTextStyles.sm, uiTextStyles.muted)}>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full transition-colors hover:text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
            onClick={() =>
              navigate("/phase-science", {
                state: { initialPhaseLabel: summary.phase.label }
              })
            }
          >
            <span className="font-medium text-[color:var(--foreground)]">{summary.phase.label}</span>
            <BookOpen className="relative -top-px size-4 text-[color:var(--foreground)]" strokeWidth={1.8} />
          </button>
          <span>· 还将持续{summary.phaseRemainingDays}天 · Next {summary.nextPhase.label}</span>
        </div>

        <div className={cn("max-w-[17.5rem]", uiSpacingStyles.stackSm)}>
          <h1
            className={cn("font-semibold leading-[1.18] text-[color:var(--foreground)]", uiTextStyles.heroTitle)}
            style={{ textWrap: "balance" }}
          >
            {titleText}
          </h1>
        </div>

        <div className="relative flex min-h-[15rem] items-center justify-center py-6">
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center"
            aria-hidden="true"
          >
            <div
              className="h-56 w-56 rounded-full blur-3xl"
              style={{
                background: `radial-gradient(circle, ${summary.phase.color} 0%, transparent 72%)`
              }}
            />
          </div>
          <PhaseIllustration phase={phaseKey} className="relative z-10 size-56 sm:size-60" />
        </div>

        <div className={cn("flex items-center justify-center gap-3 leading-none", uiTextStyles.sm)}>
          <span className="inline-flex items-center gap-1.5">
            <span className="font-semibold text-[color:var(--foreground)]">宜</span>
            <span className="text-[color:var(--muted-foreground)]">{doText}</span>
          </span>
          {dontText ? <span className="h-3.5 w-px bg-[color:var(--border)]" aria-hidden="true" /> : null}
          {dontText ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="font-semibold text-[color:var(--foreground)]">忌</span>
              <span className="text-[color:var(--muted-foreground)]">{dontText}</span>
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
