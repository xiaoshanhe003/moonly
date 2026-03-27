import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { getCycleSummary, type PhaseKey } from "../features/cycle/cycle";
import { useCycleStore } from "../features/cycle/store";
import { cn } from "../lib/utils";

type ScienceTabKey = "overview" | PhaseKey;

type ScienceContent = {
  label: string;
  subtitle: string;
  overview: string;
  durationLabel: string;
  duration: string;
  hormoneLabel: string;
  hormones: string;
  bodySignals: string[];
  bodySignalsLabel: string;
  mindSignals: string[];
  mindSignalsLabel: string;
  suggestions: string[];
  suggestionsLabel: string;
  accent: string;
  accentSoft: string;
};

const scienceContentMap: Record<ScienceTabKey, ScienceContent> = {
  overview: {
    label: "概述",
    subtitle: "女性生理周期是由激素调节的一组周期性变化，核心围绕排卵、子宫内膜变化和月经展开。",
    overview:
      "月经周期通常从一次月经来潮的第一天开始计算，到下一次月经来潮前一天结束。每个人的周期长度、经期长度和体感差异都可能不同，规律并不等于完全一致。",
    durationLabel: "常见范围",
    duration: "周期约21-35天，经期约2-8天",
    hormoneLabel: "主要激素",
    hormones: "下丘脑和垂体调控下，雌激素、孕激素、促卵泡生成素与黄体生成素共同作用",
    bodySignals: [
      "青春期出现初潮，平均多发生在10-15岁之间，个体差异很常见",
      "围绝经期后月经会逐渐停止，绝经通常指连续12个月没有月经，常见于45-55岁之间",
      "周期会随着年龄、睡眠、压力、体重变化、疾病和药物等因素波动"
    ],
    bodySignalsLabel: "生理进程",
    mindSignals: [
      "不同阶段的激素波动，可能影响精力、食欲、睡眠、情绪和专注力",
      "这些变化并不意味着表现一定受限，更像是身体给出的节律提示"
    ],
    mindSignalsLabel: "激素影响",
    suggestions: [
      "把周期当作观察身体节律的一种线索，而不是必须完全标准化的模板",
      "如果月经长期过少、过多、疼痛剧烈或周期长期紊乱，值得进一步就医确认",
      "记录月经、症状和情绪，通常比单独记日期更有帮助"
    ],
    suggestionsLabel: "如何理解周期",
    accent: "var(--color-ink)",
    accentSoft: "rgba(36,52,51,0.08)"
  },
  menstrual: {
    label: "月经期",
    subtitle: "子宫内膜脱落，身体进入一次新的周期起点。",
    overview:
      "月经期通常从出血开始计算。这个阶段雌激素和孕激素都处在较低水平，身体会优先处理修复和恢复。",
    durationLabel: "持续时间",
    duration: "3-7天",
    hormoneLabel: "激素",
    hormones: "雌激素和孕激素处于低位",
    bodySignalsLabel: "身体表现",
    bodySignals: ["可能会有腹部不适、疲惫感或下背酸胀", "体温相对较低，耐力和恢复节奏更慢"],
    mindSignalsLabel: "心理与行为特征",
    mindSignals: ["更适合把节奏放慢一点", "如果想独处、安静一些，通常是正常反应"],
    suggestionsLabel: "建议",
    suggestions: ["优先睡眠和补水", "安排更轻的活动和更松的日程", "如果不适明显，先以舒适和恢复为主"],
    accent: "var(--color-rose)",
    accentSoft: "rgba(239,194,200,0.26)"
  },
  follicular: {
    label: "卵泡期",
    subtitle: "卵巢中的卵泡开始发育，身体逐渐回到更轻盈的状态。",
    overview:
      "卵泡期的卵泡开始发育成熟。雌激素水平上升，常会带来更活跃的身心状态，恢复感和启动感也更明显。",
    durationLabel: "持续时间",
    duration: "7-10天",
    hormoneLabel: "激素",
    hormones: "雌激素上升",
    bodySignalsLabel: "身体表现",
    bodySignals: ["子宫内膜重新增厚，为排卵做准备", "能量逐步恢复，皮肤状态和新陈代谢可能更活跃"],
    mindSignalsLabel: "心理与行为特征",
    mindSignals: ["心情较轻，专注力上升，社交欲增强", "创造力与学习效率更容易被调动起来"],
    suggestionsLabel: "建议",
    suggestions: ["迎接新事物和挑战的好时机", "适合进行中高强度运动和力量训练", "更适合安排重要会议、输出型工作或见面活动"],
    accent: "var(--color-accent-strong)",
    accentSoft: "rgba(208,222,164,0.28)"
  },
  ovulation: {
    label: "排卵期",
    subtitle: "卵子排出前后，身体常处在一个更外向、更有表现力的窗口。",
    overview:
      "排卵期通常发生在排卵日前后。雌激素处于高位，黄体生成素快速波动，部分人会感受到明显的活力与表达欲。",
    durationLabel: "持续时间",
    duration: "2-4天",
    hormoneLabel: "激素",
    hormones: "雌激素高位，黄体生成素快速波动",
    bodySignalsLabel: "身体表现",
    bodySignals: ["分泌物可能变得更清透、有弹性", "有些人会感到一侧轻微腹痛或更明显的身体存在感"],
    mindSignalsLabel: "心理与行为特征",
    mindSignals: ["更愿意连接外界，表达欲和行动力增强", "在沟通、展示、社交场景里通常更容易进入状态"],
    suggestionsLabel: "建议",
    suggestions: ["适合安排表达、展示、合作类任务", "维持规律饮食和补水，避免行程排太满", "如果精力在线，可以推进重要互动和公开场景"],
    accent: "var(--color-gold)",
    accentSoft: "rgba(237,208,127,0.3)"
  },
  luteal: {
    label: "黄体期",
    subtitle: "排卵后身体进入准备阶段，能量模式会逐步转向内收。",
    overview:
      "黄体期从排卵后开始，孕激素水平上升。如果没有受孕，激素会在后段逐渐回落，这也是很多人开始感到敏感和疲惫的时期。",
    durationLabel: "持续时间",
    duration: "10-14天",
    hormoneLabel: "激素",
    hormones: "孕激素上升，后段可能逐步回落",
    bodySignalsLabel: "身体表现",
    bodySignals: ["可能出现乳房胀痛、腹胀、水肿或食欲变化", "体温略高，身体更需要稳定节奏和恢复空间"],
    mindSignalsLabel: "心理与行为特征",
    mindSignals: ["更容易对噪音、压力和信息切换敏感", "情绪波动增多时，通常不意味着你做得不够好"],
    suggestionsLabel: "建议",
    suggestions: ["减少高频切换，优先真正重要的事", "提早休息，给日程留缓冲", "尽量用稳定、低刺激的环境保护能量"],
    accent: "var(--color-blue)",
    accentSoft: "rgba(200,215,240,0.28)"
  }
};

const scienceTabOrder: ScienceTabKey[] = ["overview", "menstrual", "follicular", "ovulation", "luteal"];

function getPhaseKeyFromLabel(label?: string): PhaseKey | null {
  const phaseOrder: PhaseKey[] = ["menstrual", "follicular", "ovulation", "luteal"];
  const match = phaseOrder.find((phaseKey) => scienceContentMap[phaseKey].label === label);
  return match ?? null;
}

type LocationState = {
  initialPhaseLabel?: string;
};

export function PhaseSciencePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useCycleStore((state) => state.profile)!;
  const entries = useCycleStore((state) => state.entries);
  const summary = getCycleSummary(profile, entries, new Date());
  const locationState = location.state as LocationState | null;

  const initialPhase = useMemo(
    () => getPhaseKeyFromLabel(locationState?.initialPhaseLabel) ?? getPhaseKeyFromLabel(summary.phase.label) ?? "follicular",
    [locationState?.initialPhaseLabel, summary.phase.label]
  );

  const [activeTab, setActiveTab] = useState<ScienceTabKey>(initialPhase);
  const activeContent = scienceContentMap[activeTab];

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-4 py-6 text-[var(--color-ink)] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col gap-4">
        <div className="sticky top-4 z-40">
          <header className="overflow-hidden rounded-[32px] border border-white/70 bg-white/88 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="px-4 pt-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="返回">
                <ArrowLeft className="size-4" />
              </Button>
            </div>

            <div className="overflow-x-auto scrollbar-none">
              <div className="flex min-w-max gap-6 px-4 pt-4 text-sm">
                {scienceTabOrder.map((tabKey) => {
                  const phase = scienceContentMap[tabKey];
                  const isActive = tabKey === activeTab;

                  return (
                    <button
                      key={tabKey}
                      type="button"
                      className={cn(
                        "relative shrink-0 pb-3 font-medium transition-colors",
                        isActive ? "text-[var(--color-accent-strong)]" : "text-[var(--color-muted)]"
                      )}
                      onClick={() => setActiveTab(tabKey)}
                    >
                      {phase.label}
                      <span
                        className={cn(
                          "absolute inset-x-0 bottom-0 h-0.5 rounded-full transition-opacity",
                          isActive ? "opacity-100" : "opacity-0"
                        )}
                        style={{ backgroundColor: "var(--color-accent-strong)" }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </header>
        </div>

        <section className="rounded-[32px] border border-white/70 bg-white/82 p-5 shadow-[var(--shadow-card)] backdrop-blur">
          <div>
            <h1 className="text-3xl font-semibold leading-none">{activeContent.label}</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{activeContent.overview}</p>
          </div>

          <div className="mt-8 grid gap-7">
            <div>
              <p className="text-sm font-medium text-[var(--color-panel-strong)]">概述</p>
              <p className="mt-3 text-base leading-7 text-[var(--color-ink)]">{activeContent.subtitle}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--color-panel-strong)]">{activeContent.durationLabel}</p>
              <p className="mt-3 text-xl font-semibold text-[var(--color-ink)]">{activeContent.duration}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--color-panel-strong)]">{activeContent.hormoneLabel}</p>
              <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">{activeContent.hormones}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--color-panel-strong)]">{activeContent.bodySignalsLabel}</p>
              <div className="mt-3 space-y-2 text-base leading-7 text-[var(--color-ink)]">
                {activeContent.bodySignals.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--color-panel-strong)]">{activeContent.mindSignalsLabel}</p>
              <div className="mt-3 space-y-2 text-base leading-7 text-[var(--color-ink)]">
                {activeContent.mindSignals.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--color-panel-strong)]">{activeContent.suggestionsLabel}</p>
              <div className="mt-3 space-y-3 text-base leading-7 text-[var(--color-ink)]">
                {activeContent.suggestions.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--color-ink)]" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
