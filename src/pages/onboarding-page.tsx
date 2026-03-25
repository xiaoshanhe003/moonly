import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCycleStore } from "../features/cycle/store";

export function OnboardingPage() {
  const setProfile = useCycleStore((state) => state.setProfile);
  const [lastPeriodStart, setLastPeriodStart] = useState(
    new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString().slice(0, 10)
  );
  const [periodLength, setPeriodLength] = useState("5");
  const [cycleLength, setCycleLength] = useState("28");
  const [periodUnknown, setPeriodUnknown] = useState(false);
  const [cycleUnknown, setCycleUnknown] = useState(false);

  return (
    <Card className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--color-muted)]">Cold Start</p>
        <h2 className="text-3xl font-semibold leading-tight">
          先用三个问题，建立一个温和的起点。
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          之后你可以随时修改，这里只需要一个大致可用的基础。
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-[var(--color-muted)]">上次月经开始时间</span>
        <input
          type="date"
          value={lastPeriodStart}
          onChange={(event) => setLastPeriodStart(event.target.value)}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <Button
        className="w-full"
        onClick={() =>
          setProfile({
            lastPeriodStart,
            periodLength: periodUnknown ? 5 : Number(periodLength),
            cycleLength: cycleUnknown ? 28 : Number(cycleLength),
            isPeriodLengthEstimated: periodUnknown,
            isCycleLengthEstimated: cycleUnknown
          })
        }
      >
        开始使用
      </Button>
    </Card>
  );
}
