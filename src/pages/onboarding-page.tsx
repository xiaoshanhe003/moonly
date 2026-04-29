import { useEffect, useRef, useState } from "react";
import type { MouseEventHandler, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
import { useCycleStore } from "../features/cycle/store";
import type { CycleProfile } from "../features/cycle/types";
import { cn } from "../lib/utils";
import welcomeIllustration from "../assets/onboarding/welcome-illustration.png";

type OnboardingStep = 0 | 1 | 2;

const totalSteps = 3;
const onboardingScreenClass =
  "mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[var(--color-canvas)] px-7 pb-9 pt-12";
const onboardingControlShadow = "shadow-[0_6px_18px_rgba(17,24,39,0.035),0_1px_0_rgba(17,24,39,0.02)]";
const questions = [
  "你最近一次月经从哪天开始？",
  "你的月经一般持续几天？",
  "你一般多久来一次月经？"
];

function formatDateInputValue(value: string) {
  return value.replaceAll("-", "/");
}

function MoonlyMark() {
  return (
    <div className="flex justify-center" aria-label="月信">
      <svg className="size-13" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <path
          d="M18.4 21.6442C18.4 19.737 17.3721 17.1762 15.5699 14.8762C13.7789 12.5906 11.3579 10.7371 8.77809 10.0922C8.2526 9.96079 7.9058 9.46033 7.96703 8.92216C8.02833 8.38396 8.47873 7.97438 9.02031 7.9645C16.9152 7.82096 24.9742 9.57809 28.8839 16.6154C29.1736 17.1368 28.9859 17.7946 28.4645 18.0842C27.9431 18.3739 27.2857 18.1858 26.9961 17.6645C24.4315 13.0483 19.6619 10.962 14.0245 10.3326C15.2518 11.2609 16.3481 12.3676 17.2701 13.5442C19.2478 16.0681 20.56 19.0873 20.56 21.6442C20.56 25.3757 18.8116 30.6804 14.1246 33.9527C16.8227 33.6683 19.1354 33.0388 20.5642 32.2223C21.0821 31.9264 21.7417 32.1063 22.0376 32.6242C22.3335 33.142 22.1536 33.8016 21.6358 34.0976C18.859 35.6843 13.8977 36.509 8.97707 36.2224C8.45008 36.1916 8.02269 35.7843 7.96633 35.2595C7.91 34.7346 8.24115 34.2458 8.74961 34.1039C15.8963 32.1095 18.4 25.7687 18.4 21.6442Z"
          fill="#0EA5E9"
        />
        <path
          d="M28.0405 32.9005V20.8195C28.0405 20.2786 28.479 19.84 29.02 19.84C29.561 19.84 29.9995 20.2786 29.9995 20.8195V32.9005C29.9995 33.4414 29.561 33.88 29.02 33.88C28.479 33.88 28.0405 33.4414 28.0405 32.9005Z"
          fill="#0EA5E9"
        />
        <path
          d="M32.5986 31.8239L24.0561 23.2814C23.6736 22.8988 23.6736 22.2786 24.0561 21.8961C24.4387 21.5136 25.0589 21.5136 25.4414 21.8961L33.9839 30.4386C34.3664 30.8211 34.3664 31.4414 33.9839 31.8239C33.6014 32.2064 32.9812 32.2064 32.5986 31.8239Z"
          fill="#0EA5E9"
        />
        <path
          d="M25.4414 31.8239L33.9839 23.2814C34.3664 22.8988 34.3664 22.2786 33.9839 21.8961C33.6013 21.5136 32.9811 21.5136 32.5986 21.8961L24.0561 30.4386C23.6736 30.8211 23.6736 31.4414 24.0561 31.8239C24.4386 32.2064 25.0588 32.2064 25.4414 31.8239Z"
          fill="#0EA5E9"
        />
        <path
          d="M35.0605 27.8395H22.9795C22.4386 27.8395 22 27.401 22 26.86C22 26.319 22.4386 25.8805 22.9795 25.8805H35.0605C35.6014 25.8805 36.04 26.319 36.04 26.86C36.04 27.401 35.6014 27.8395 35.0605 27.8395Z"
          fill="#0EA5E9"
        />
      </svg>
    </div>
  );
}

type OnboardingInputProps = {
  children: ReactNode;
  suffix?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
};

function OnboardingInput({ children, suffix, onClick }: OnboardingInputProps) {
  return (
    <div
      className={cn(
        "flex h-[72px] w-full items-center rounded-[10px] bg-white px-4 text-lg leading-none text-black",
        onClick && "cursor-pointer",
        onboardingControlShadow
      )}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {suffix ? <span className="ml-3 shrink-0 text-[#6b7280]">{suffix}</span> : null}
    </div>
  );
}

type OnboardingPageProps = {
  onComplete?: (profile: CycleProfile) => void;
};

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const navigate = useNavigate();
  const setProfile = useCycleStore((state) => state.setProfile);
  const lastPeriodInputRef = useRef<HTMLInputElement | null>(null);
  const periodLengthInputRef = useRef<HTMLInputElement | null>(null);
  const cycleLengthInputRef = useRef<HTMLInputElement | null>(null);
  const pendingFocusRef = useRef<"period" | "cycle" | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [step, setStep] = useState<OnboardingStep>(0);
  const [lastPeriodStart, setLastPeriodStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [periodLength, setPeriodLength] = useState("5");
  const [cycleLength, setCycleLength] = useState("28");
  const [periodUnknown, setPeriodUnknown] = useState(false);
  const [cycleUnknown, setCycleUnknown] = useState(false);

  const completeOnboarding = () => {
    const profile = {
      lastPeriodStart,
      periodLength: periodUnknown ? 5 : Number(periodLength),
      cycleLength: cycleUnknown ? 28 : Number(cycleLength),
      isPeriodLengthEstimated: periodUnknown,
      isCycleLengthEstimated: cycleUnknown
    };

    if (onComplete) {
      onComplete(profile);
      return;
    }

    setProfile(profile);
    navigate("/today", { replace: true });
  };

  const nextStep = () => setStep((current) => Math.min(current + 1, totalSteps - 1) as OnboardingStep);
  const previousStep = () => setStep((current) => Math.max(current - 1, 0) as OnboardingStep);
  const openLastPeriodPicker = () => {
    const input = lastPeriodInputRef.current;

    if (!input) {
      return;
    }

    input.focus();

    try {
      input.showPicker();
    } catch {
      input.click();
    }
  };
  const selectInputValue = (input: HTMLInputElement | null) => {
    input?.focus();
    input?.select();
  };
  const togglePeriodUnknown = () =>
    setPeriodUnknown((current) => {
      const next = !current;

      if (next) {
        setPeriodLength("5");
      }

      return next;
    });

  useEffect(() => {
    if (!pendingFocusRef.current) {
      return;
    }

    const target = pendingFocusRef.current === "period" ? periodLengthInputRef.current : cycleLengthInputRef.current;
    pendingFocusRef.current = null;
    selectInputValue(target);
  }, [periodUnknown, cycleUnknown]);
  const toggleCycleUnknown = () =>
    setCycleUnknown((current) => {
      const next = !current;

      if (next) {
        setCycleLength("28");
      }

      return next;
    });

  if (!hasStarted) {
    return (
      <section className={onboardingScreenClass}>
        <MoonlyMark />

        <div className="flex min-h-0 flex-1 items-center justify-center py-7">
          <img
            src={welcomeIllustration}
            alt=""
            className="max-h-full w-full max-w-[280px] select-none object-contain"
            draggable={false}
          />
        </div>

        <div className="shrink-0 space-y-5 text-center">
          <div className="space-y-5">
            <h1 className="text-xl font-semibold leading-tight text-black">欢迎来到“月信”</h1>
            <p className="mx-auto max-w-[280px] text-base leading-[1.45] text-black">
              从几个小问题开始，了解你的身体节奏
            </p>
          </div>

          <Button className={cn("h-[50px] w-full rounded-[10px] bg-black text-base font-semibold text-white", onboardingControlShadow)} onClick={() => setHasStarted(true)}>
            立即开始
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className={onboardingScreenClass}>
      <MoonlyMark />

      <div className="flex flex-1 flex-col pt-[94px]">
        <div className="space-y-4 text-center">
          <p className="text-sm leading-none text-[#6b7280]">{step + 1}/{totalSteps}</p>
          <h1 className="text-xl font-semibold leading-tight text-black">{questions[step]}</h1>
        </div>

        <div className="mt-9 px-4">
          {step === 0 ? (
            <OnboardingInput onClick={openLastPeriodPicker}>
              <div className="relative flex min-w-0 items-center">
                <input
                  ref={lastPeriodInputRef}
                  type="date"
                  value={lastPeriodStart}
                  onChange={(event) => setLastPeriodStart(event.target.value)}
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                  aria-label={questions[step]}
                  tabIndex={-1}
                />
                <span className="min-w-0 flex-1 select-none pr-9">{formatDateInputValue(lastPeriodStart)}</span>
                <Calendar className="pointer-events-none absolute right-0 size-5 text-[#6b7280]" aria-hidden="true" />
              </div>
            </OnboardingInput>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <OnboardingInput suffix="天">
                {periodUnknown ? (
                  <button
                    type="button"
                    onClick={() => {
                      pendingFocusRef.current = "period";
                      setPeriodUnknown(false);
                    }}
                    className="w-full border-0 bg-transparent p-0 text-left outline-none"
                    aria-label="编辑月经持续天数"
                  >
                    5（默认值）
                  </button>
                ) : (
                  <input
                    ref={periodLengthInputRef}
                    type="number"
                    min={2}
                    max={10}
                    value={periodLength}
                    onChange={(event) => setPeriodLength(event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                    className="w-full border-0 bg-transparent p-0 outline-none"
                    aria-label={questions[step]}
                  />
                )}
              </OnboardingInput>
              <button
                type="button"
                onClick={togglePeriodUnknown}
                className={cn("mx-auto block text-sm font-medium", periodUnknown ? "text-black" : "text-[#8b939f]")}
              >
                不确定
              </button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <OnboardingInput suffix="天">
                {cycleUnknown ? (
                  <button
                    type="button"
                    onClick={() => {
                      pendingFocusRef.current = "cycle";
                      setCycleUnknown(false);
                    }}
                    className="w-full border-0 bg-transparent p-0 text-left outline-none"
                    aria-label="编辑周期长度"
                  >
                    28（默认值）
                  </button>
                ) : (
                  <input
                    ref={cycleLengthInputRef}
                    type="number"
                    min={21}
                    max={40}
                    value={cycleLength}
                    onChange={(event) => setCycleLength(event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                    className="w-full border-0 bg-transparent p-0 outline-none"
                    aria-label={questions[step]}
                  />
                )}
              </OnboardingInput>
              <button
                type="button"
                onClick={toggleCycleUnknown}
                className={cn("mx-auto block text-sm font-medium", cycleUnknown ? "text-black" : "text-[#8b939f]")}
              >
                不确定
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {step === 0 ? (
        <Button className={cn("h-[50px] w-full rounded-[10px] bg-black text-base font-semibold text-white", onboardingControlShadow)} onClick={nextStep}>
          下一步
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-[var(--space-5)]">
          <Button className={cn("h-[50px] rounded-[10px] bg-white text-base font-semibold text-black", onboardingControlShadow)} variant="secondary" onClick={previousStep}>
            上一步
          </Button>

          {step < totalSteps - 1 ? (
            <Button className={cn("h-[50px] rounded-[10px] bg-black text-base font-semibold text-white", onboardingControlShadow)} onClick={nextStep}>
              下一步
            </Button>
          ) : (
            <Button className={cn("h-[50px] rounded-[10px] bg-black text-base font-semibold text-white", onboardingControlShadow)} onClick={completeOnboarding}>
              完成
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
