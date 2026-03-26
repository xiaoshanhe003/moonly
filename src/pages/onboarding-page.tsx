import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCycleStore } from "../features/cycle/store";

type OnboardingStep = 0 | 1 | 2;

const totalSteps = 3;

export function OnboardingPage() {
  const setProfile = useCycleStore((state) => state.setProfile);
  const [step, setStep] = useState<OnboardingStep>(0);
  const [lastPeriodStart, setLastPeriodStart] = useState(
    new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString().slice(0, 10)
  );
  const [periodLength, setPeriodLength] = useState("5");
  const [cycleLength, setCycleLength] = useState("28");
  const [periodUnknown, setPeriodUnknown] = useState(false);
  const [cycleUnknown, setCycleUnknown] = useState(false);

  const progressText = `${step + 1}/${totalSteps}`;

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

  return (
    <Card className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--color-muted)]">Cold Start</p>
          <p className="text-sm font-medium text-[var(--color-muted)]">{progressText}</p>
        </div>
        <h2 className="text-3xl font-semibold leading-tight">先用三个问题，建立一个温和的起点。</h2>
        <p className="text-sm text-[var(--color-muted)]">
          之后你可以随时修改，这里只需要一个大致可用的基础。
        </p>
      </div>

      {step === 0 ? (
        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">上次月经开始时间</span>
          <input
            type="date"
            value={lastPeriodStart}
            onChange={(event) => setLastPeriodStart(event.target.value)}
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3"
          />
        </label>
      ) : null}

      {step === 1 ? (
        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">月经一般持续几天</span>
          <input
            type="number"
            min={2}
            max={10}
            disabled={periodUnknown}
            value={periodLength}
            onChange={(event) => setPeriodLength(event.target.value)}
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setPeriodUnknown((value) => !value)}
            className="text-sm text-[var(--color-accent-strong)]"
          >
            {periodUnknown ? "已按默认 5 天处理" : "我不太确定"}
          </button>
        </label>
      ) : null}

      {step === 2 ? (
        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">月经一般多久来一次</span>
          <input
            type="number"
            min={21}
            max={40}
            disabled={cycleUnknown}
            value={cycleLength}
            onChange={(event) => setCycleLength(event.target.value)}
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setCycleUnknown((value) => !value)}
            className="text-sm text-[var(--color-accent-strong)]"
          >
            {cycleUnknown ? "已按默认 28 天处理" : "我不太确定"}
          </button>
        </label>
      ) : null}

      <div className="flex items-center gap-3">
        {step > 0 ? (
          <Button className="flex-1" variant="secondary" onClick={previousStep}>
            上一步
          </Button>
        ) : null}

        {step < totalSteps - 1 ? (
          <Button className="flex-1" onClick={nextStep}>
            下一题
          </Button>
        ) : (
          <Button className="flex-1" onClick={completeOnboarding}>
            开始使用
          </Button>
        )}
      </div>
    </Card>
  );
}
