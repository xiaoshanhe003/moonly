import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCycleStore } from "../features/cycle/store";
import { cn } from "../lib/utils";
import { uiTextStyles } from "../components/ui/styles";

type OnboardingStep = 0 | 1 | 2;

const totalSteps = 3;
const stepTitles = ["先确认一个起点", "经期通常持续多久", "周期大概有多长"];
const stepDescriptions = [
  "选一个大致日期就好，之后可以在日历里随时修正。",
  "如果记不清，可以先用默认值，后面再慢慢校准。",
  "不确定也没关系，我们会先按常见节律生成初始状态。"
];
const onboardingInputClass =
  "min-w-0 max-w-full appearance-none rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--card-elevated)] px-[var(--space-4)] py-[var(--space-3)] text-[color:var(--foreground)] shadow-[0_1px_0_rgba(17,24,39,0.03)]";

export function OnboardingPage() {
  const setProfile = useCycleStore((state) => state.setProfile);
  const [hasStarted, setHasStarted] = useState(false);
  const [step, setStep] = useState<OnboardingStep>(0);
  const [lastPeriodStart, setLastPeriodStart] = useState(
    new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString().slice(0, 10)
  );
  const [periodLength, setPeriodLength] = useState("5");
  const [cycleLength, setCycleLength] = useState("28");
  const [periodUnknown, setPeriodUnknown] = useState(false);
  const [cycleUnknown, setCycleUnknown] = useState(false);

  const completeOnboarding = () =>
    setProfile({
      lastPeriodStart,
      periodLength: periodUnknown ? 5 : Number(periodLength),
      cycleLength: cycleUnknown ? 28 : Number(cycleLength),
      isPeriodLengthEstimated: periodUnknown,
      isCycleLengthEstimated: cycleUnknown
    });

  const nextStep = () => setStep((current) => Math.min(current + 1, totalSteps - 1) as OnboardingStep);
  const previousStep = () => setStep((current) => Math.max(current - 1, 0) as OnboardingStep);
  const helperButtonClass = cn(uiTextStyles.sm, uiTextStyles.muted);

  if (!hasStarted) {
    return (
      <Card className="mt-8 overflow-hidden border-[color:var(--border-strong)] bg-[color:var(--card-elevated)] p-5 shadow-[var(--shadow-soft)] sm:mt-10">
        <div className="relative flex min-h-[23rem] flex-col justify-between">
          <div
            className="pointer-events-none absolute left-1/2 top-16 size-56 -translate-x-1/2 rounded-full opacity-80 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, var(--phase-luteal-100) 0%, rgba(254, 243, 199, 0.58) 42%, transparent 72%)"
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 space-y-8">
            <p className={cn(uiTextStyles.sm, "font-medium", uiTextStyles.muted)}>Moonly</p>
            <div className="flex justify-center py-6">
              <div className="relative flex size-36 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[color:var(--phase-follicular-100)]" />
                <div className="absolute inset-y-0 right-0 w-1/2 rounded-r-full bg-[color:var(--card-elevated)]" />
                <div className="absolute inset-3 rounded-full border border-[color:var(--border-strong)]" />
                <span className="relative z-10 font-semibold tracking-[0.18em] text-[color:var(--foreground)]">
                  月信
                </span>
              </div>
            </div>
            <div className="space-y-3 text-center">
              <h2 className={cn(uiTextStyles.xxl, "font-semibold leading-snug")}>听见身体的潮汐</h2>
            </div>
          </div>

          <Button className="relative z-10 min-h-12 w-full" onClick={() => setHasStarted(true)}>
            进入月信
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-8 space-y-6 border-[color:var(--border-strong)] bg-[color:var(--card-elevated)] p-5 shadow-[var(--shadow-soft)] sm:mt-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className={cn(uiTextStyles.sm, "font-medium", uiTextStyles.muted)}>初次设置</p>
          <div className="flex items-center gap-1.5" aria-label={`第 ${step + 1} 题，共 ${totalSteps} 题`}>
            {Array.from({ length: totalSteps }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === step ? "w-5 bg-[color:var(--foreground)]" : "w-1.5 bg-[color:var(--muted-strong)]"
                )}
              />
            ))}
          </div>
        </div>
        <div className="space-y-2.5">
          <h2 className={cn(uiTextStyles.xxl, "font-semibold leading-snug")}>先告诉我一点点你的节律</h2>
          <p className={cn(uiTextStyles.sm, "leading-[1.7]", uiTextStyles.muted)}>
            {stepDescriptions[step]}
          </p>
        </div>
      </div>

      {step === 0 ? (
        <label className="block min-w-0 space-y-3 rounded-[var(--radius-lg)] bg-[color:var(--muted)] p-[var(--space-4)]">
          <span className={cn(uiTextStyles.sm, "font-medium text-[color:var(--foreground)]")}>{stepTitles[step]}</span>
          <input
            type="date"
            value={lastPeriodStart}
            onChange={(event) => setLastPeriodStart(event.target.value)}
            className={cn("w-full", onboardingInputClass)}
          />
        </label>
      ) : null}

      {step === 1 ? (
        <label className="block min-w-0 space-y-3 rounded-[var(--radius-lg)] bg-[color:var(--muted)] p-[var(--space-4)]">
          <span className={cn(uiTextStyles.sm, "font-medium text-[color:var(--foreground)]")}>{stepTitles[step]}</span>
          <input
            type="number"
            min={2}
            max={10}
            disabled={periodUnknown}
            value={periodLength}
            onChange={(event) => setPeriodLength(event.target.value)}
            className={cn(
              "w-full",
              onboardingInputClass,
              "disabled:opacity-50"
            )}
          />
          <button type="button" onClick={() => setPeriodUnknown((value) => !value)} className={cn(helperButtonClass, "font-medium")}>
            {periodUnknown ? "已按默认 5 天处理" : "我不太确定"}
          </button>
        </label>
      ) : null}

      {step === 2 ? (
        <label className="block min-w-0 space-y-3 rounded-[var(--radius-lg)] bg-[color:var(--muted)] p-[var(--space-4)]">
          <span className={cn(uiTextStyles.sm, "font-medium text-[color:var(--foreground)]")}>{stepTitles[step]}</span>
          <input
            type="number"
            min={21}
            max={40}
            disabled={cycleUnknown}
            value={cycleLength}
            onChange={(event) => setCycleLength(event.target.value)}
            className={cn(
              "w-full",
              onboardingInputClass,
              "disabled:opacity-50"
            )}
          />
          <button type="button" onClick={() => setCycleUnknown((value) => !value)} className={cn(helperButtonClass, "font-medium")}>
            {cycleUnknown ? "已按默认 28 天处理" : "我不太确定"}
          </button>
        </label>
      ) : null}

      <div className="flex items-center gap-3">
        {step > 0 ? (
          <Button className="flex-1" variant="secondary" onClick={previousStep}>
            上一题
          </Button>
        ) : null}

        {step < totalSteps - 1 ? (
          <Button className="min-h-12 flex-1" onClick={nextStep}>
            下一题
          </Button>
        ) : (
          <Button className="min-h-12 flex-1" onClick={completeOnboarding}>
            开始使用
          </Button>
        )}
      </div>
    </Card>
  );
}
