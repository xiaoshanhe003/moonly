import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { PhaseIllustration } from "../components/domain/phase-illustration";
import { getCycleSummary, type PhaseKey } from "../features/cycle/cycle";
import { useCycleStore } from "../features/cycle/store";
import { cn } from "../lib/utils";
import { uiTextStyles } from "../components/ui/styles";

type ScienceTabKey = "overview" | PhaseKey;

type HormoneItem = {
  name: string;
  role: string;
  trend: number[];
};

type PhaseSummary = {
  name: string;
  description: string;
};

type ScienceContent = {
  label: string;
  title?: string;
  subtitle: string;
  overview: string;
  durationLabel: string;
  duration: string;
  hormoneLabel: string;
  hormones: string;
  hormoneItems?: HormoneItem[];
  bodySignals: string[];
  bodySignalsLabel: string;
  phaseSummaries?: PhaseSummary[];
  mindSignals: string[];
  mindSignalsLabel: string;
  suggestions: string[];
  suggestionsLabel: string;
};

const HORMONE_CHART_WIDTH = 160;
const HORMONE_CHART_HEIGHT = 72;
const HORMONE_CHART_PADDING_X = 0;
const HORMONE_CHART_PADDING_Y = 8;

const hormonePhaseBands = [
  { label: "经", start: 0, end: 2, color: "var(--phase-menstrual-100)" },
  { label: "卵", start: 2, end: 4, color: "var(--phase-follicular-100)" },
  { label: "排", start: 4, end: 5, color: "var(--phase-ovulation-100)" },
  { label: "黄", start: 5, end: 8, color: "var(--phase-luteal-100)" }
] as const;

const scienceStyles = {
  stickyHeader: "sticky top-0 z-40 w-full bg-[var(--color-canvas)]/95 backdrop-blur",
  headerInner: "mx-auto max-w-md overflow-hidden border-b border-[color:var(--border)] px-[var(--space-6)]",
  tabRow: "flex min-w-max gap-6 pt-4",
  tabLabel: "flex items-center gap-1.5 leading-none",
  pageBody: "mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col gap-6 px-[var(--space-6)] py-7",
  sectionBody: "pb-10 pt-4",
  illustrationWrap: "mb-8 flex justify-center",
  illustrationHalo: "flex size-56 items-center justify-center rounded-full",
  titleTag: "mt-2 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--muted)] px-2.5 py-1 font-medium leading-none text-[var(--color-ink)]",
  sectionGrid: "mt-10 grid gap-10",
  hormoneGrid: "grid grid-cols-2 gap-3",
  softCard: "rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--muted)] px-4 py-4",
  phaseSummaryCard: "mt-5 rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--muted)] px-4 py-4",
  phaseSummaryList: "space-y-4",
  phaseSummaryRow: "flex items-start gap-4",
  phaseSummaryName: "w-14 shrink-0 font-medium text-[var(--color-ink)]",
  suggestionList: "mt-3 space-y-3",
  suggestionRow: "flex items-start gap-3",
  suggestionDot: "mt-2 size-1.5 shrink-0 rounded-full bg-[var(--color-ink)]"
} as const;

const scienceContentMap: Record<ScienceTabKey, ScienceContent> = {
  overview: {
    label: "概述",
    title: "不止“月经”",
    subtitle: "月经周期不是只有月经那几天，而是身体经历的一段连续变化。",
    overview:
      "一个周期通常从月经第一天开始，到下一次月经前一天结束。激素会在不同阶段升降，推动身体进入不同状态，也可能带来精力、情绪、睡眠和食欲上的变化。",
    durationLabel: "认识周期",
    duration:
      "月经周期通常约21-35天，其中经期通常约2-8天。周期会受到睡眠、压力、体重变化、疾病和药物影响，因此每个人的节律和感受都可能不同。",
    hormoneLabel: "推动周期变化的激素们",
    hormones: "",
    hormoneItems: [
      {
        name: "雌激素 (E2)",
        role: "帮助卵泡发育，也常和精力回升、情绪更轻快有关",
        trend: [0.22, 0.28, 0.52, 0.84, 0.92, 0.52, 0.68, 0.62, 0.26]
      },
      {
        name: "孕激素 (P4)",
        role: "排卵后帮助身体进入准备状态，也常和更想放慢节奏、容易疲惫有关",
        trend: [0.12, 0.12, 0.12, 0.16, 0.22, 0.54, 0.88, 0.74, 0.18]
      },
      {
        name: "促卵泡生成素 (FSH)",
        role: "帮助卵巢里的卵泡开始发育，是周期启动的一部分",
        trend: [0.46, 0.36, 0.28, 0.26, 0.4, 0.3, 0.2, 0.22, 0.34]
      },
      {
        name: "黄体生成素 (LH)",
        role: "推动排卵发生，是周期转换的关键信号",
        trend: [0.14, 0.14, 0.16, 0.2, 0.96, 0.18, 0.14, 0.14, 0.14]
      }
    ],
    bodySignals: [
      "四个阶段是连续变化，不是突然切换",
      "周期会受睡眠、压力、体重变化、疾病和药物影响",
      "有些人分期感很明显，也有些人感觉不强"
    ],
    bodySignalsLabel: "你可以先抓住这些",
    phaseSummaries: [
      {
        name: "月经期",
        description: "需要恢复，精力偏低，情绪更内收"
      },
      {
        name: "卵泡期",
        description: "状态变轻快，精力和专注力回升"
      },
      {
        name: "排卵期",
        description: "活力更强，更愿意表达和连接"
      },
      {
        name: "黄体期",
        description: "更敏感，容易疲惫，需要稳定节奏"
      }
    ],
    mindSignals: [
      "激素变化也会带来一些日常状态上的波动，比如精力、情绪、睡眠、食欲和专注力。很多时候，这只是身体在提醒你，它需要被留意。"
    ],
    mindSignalsLabel: "激素可能影响你的日常表现",
    suggestions: [
      "把周期当作理解身体节律的一条线索，而不是必须对照的标准答案。",
      "除了记录日期，也可以记录精力、情绪、睡眠、食欲和身体不适，慢慢找到自己的模式。",
      "如果长期疼痛剧烈、出血异常或周期持续紊乱，建议就医确认。"
    ],
    suggestionsLabel: "如何更好地使用“月信”"
  },
  menstrual: {
    label: "月经期",
    subtitle: "子宫内膜脱落，身体进入一次新的周期起点。",
    overview:
      "月经期通常从出血开始。这个阶段雌激素和孕激素都处在低位，身体会更偏向修复和恢复。",
    durationLabel: "持续时间",
    duration: "3-7天",
    hormoneLabel: "激素变化",
    hormones: "雌激素和孕激素处于低位",
    bodySignalsLabel: "身体变化",
    bodySignals: ["可能会有腹部不适、疲惫或下背酸胀", "体温相对较低，耐力和恢复节奏也会偏慢"],
    mindSignalsLabel: "日常表现",
    mindSignals: ["更适合把节奏放慢一点", "想安静一些或减少社交，通常是正常反应"],
    suggestionsLabel: "如何与身体相处",
    suggestions: ["优先睡眠、补水和保暖", "把活动安排得轻一点，给身体留恢复空间", "如果不适明显，先以舒适为主，不必勉强跟上原来的节奏"]
  },
  follicular: {
    label: "卵泡期",
    subtitle: "卵巢中的卵泡开始发育，身体逐渐回到更轻盈的状态。",
    overview:
      "卵泡期里，卵泡开始发育成熟。雌激素水平上升，身体常会感觉更轻快，启动感也会更明显。",
    durationLabel: "持续时间",
    duration: "7-10天",
    hormoneLabel: "激素变化",
    hormones: "雌激素上升",
    bodySignalsLabel: "身体变化",
    bodySignals: ["子宫内膜重新增厚，为排卵做准备", "能量逐步恢复，身体通常会更有启动感"],
    mindSignalsLabel: "日常表现",
    mindSignals: ["状态通常会更轻快，专注力和行动力也更容易起来", "更适合学习、推进计划，或把新想法往前试一试"],
    suggestionsLabel: "如何与身体相处",
    suggestions: ["可以把想推进的事慢慢接起来", "如果身体状态合适，适合安排运动或力量训练", "需要输出、沟通或见面的事，也可以往前放一些"]
  },
  ovulation: {
    label: "排卵期",
    subtitle: "卵子排出前后，身体常处在一个更外向、更有表现力的窗口。",
    overview:
      "排卵期通常发生在排卵日前后。雌激素处于高位，黄体生成素快速波动，部分人会感受到更明显的活力和表达欲。",
    durationLabel: "持续时间",
    duration: "2-4天",
    hormoneLabel: "激素变化",
    hormones: "雌激素高位，黄体生成素快速波动",
    bodySignalsLabel: "身体变化",
    bodySignals: ["分泌物可能变得更清透、有弹性", "有些人会感到一侧轻微腹痛，或更明显地留意到身体变化"],
    mindSignalsLabel: "日常表现",
    mindSignals: ["更愿意连接外界，表达欲和行动力也会更强一些", "在沟通、展示或社交场景里，通常更容易进入状态"],
    suggestionsLabel: "如何与身体相处",
    suggestions: ["适合安排表达、展示或合作类任务", "维持规律饮食和补水，也别把行程排得太满", "如果精力在线，可以把重要互动往前放，但还是记得留出缓冲"]
  },
  luteal: {
    label: "黄体期",
    subtitle: "排卵后身体进入准备阶段，能量模式会逐步转向内收。",
    overview:
      "黄体期从排卵后开始，孕激素水平上升。如果没有受孕，激素会在后段逐渐回落，很多人也会在这时更容易感到敏感和疲惫。",
    durationLabel: "持续时间",
    duration: "10-14天",
    hormoneLabel: "激素变化",
    hormones: "孕激素上升，后段可能逐步回落",
    bodySignalsLabel: "身体变化",
    bodySignals: ["可能出现乳房胀痛、腹胀、水肿或食欲变化", "体温会略高一些，身体也更需要稳定节奏和恢复空间"],
    mindSignalsLabel: "日常表现",
    mindSignals: ["更容易对噪音、压力和信息切换敏感", "如果情绪起伏变多，也不代表你做得不够好"],
    suggestionsLabel: "如何与身体相处",
    suggestions: ["减少高频切换，把能量留给真正重要的事", "提早休息，给日程留一点缓冲", "尽量用稳定、低刺激的环境保护自己"]
  }
};

const scienceTabOrder: ScienceTabKey[] = ["overview", "menstrual", "follicular", "ovulation", "luteal"];

function getPhaseKeyFromLabel(label?: string): PhaseKey | null {
  const phaseOrder: PhaseKey[] = ["menstrual", "follicular", "ovulation", "luteal"];
  const match = phaseOrder.find((phaseKey) => scienceContentMap[phaseKey].label === label);
  return match ?? null;
}

function renderHighlightedDuration(text: string) {
  const parts = text.split(/(\d+-\d+天|\d+天)/g);

  return parts.map((part, index) =>
    /(\d+-\d+天|\d+天)/.test(part) ? (
      <span key={`${part}-${index}`} className="font-medium text-[var(--color-ink)]">
        {part}
      </span>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

function HormoneTrendChart({ trend }: { trend: number[] }) {
  const width = HORMONE_CHART_WIDTH;
  const height = HORMONE_CHART_HEIGHT;
  const paddingX = HORMONE_CHART_PADDING_X;
  const paddingY = HORMONE_CHART_PADDING_Y;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;
  const stepX = innerWidth / (trend.length - 1);

  const pointList = trend.map((value, index) => {
    const x = paddingX + stepX * index;
    const y = paddingY + innerHeight * (1 - value);
    return { x, y, value, index };
  });
  const points = pointList.map((point) => `${point.x},${point.y}`).join(" ");
  const peakPoint = pointList.reduce((maxPoint, point) => (point.value > maxPoint.value ? point : maxPoint), pointList[0]);

  return (
    <div className="mt-auto pt-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[72px] w-full overflow-visible">
        {hormonePhaseBands.map((band) => {
          const x = paddingX + stepX * band.start;
          const rectWidth = stepX * (band.end - band.start);

          return (
            <g key={band.label}>
              <rect x={x} y={paddingY} width={rectWidth} height={innerHeight} fill={band.color} opacity="0.55" />
              <text
                x={x + rectWidth / 2}
                y={height + 3}
                textAnchor="middle"
                className="fill-[var(--color-muted)] text-[10px]"
              >
                {band.label}
              </text>
            </g>
          );
        })}
        <polyline
          fill="none"
          points={points}
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={peakPoint.x}
          cy={peakPoint.y}
          r="2"
          fill="var(--color-ink)"
          stroke="var(--color-ink)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
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
  const currentPhase = getPhaseKeyFromLabel(locationState?.initialPhaseLabel) ?? getPhaseKeyFromLabel(summary.phase.label) ?? "follicular";
  const [activeTab, setActiveTab] = useState<ScienceTabKey>("overview");
  const hasMounted = useRef(false);
  const activeContent = scienceContentMap[activeTab];
  const activeIllustrationPhase = activeTab === "overview" ? currentPhase : activeTab;
  const introText = `${activeContent.subtitle} ${activeContent.overview}`;
  const activeTitle = activeContent.title ?? activeContent.label;
  const isCurrentPhaseTab = activeTab !== "overview" && activeTab === currentPhase;
  const sectionTitleClass = cn(uiTextStyles.lg, "font-medium text-[var(--color-ink)]");
  const bodyTextClass = cn(uiTextStyles.md, "leading-[var(--line-height-body)] text-[var(--color-ink-subtle)]");

  useLayoutEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto"
    });
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <div className={scienceStyles.stickyHeader}>
        <header className={scienceStyles.headerInner}>
          <div className="pt-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="返回">
              <ArrowLeft className="size-5 text-[var(--color-ink)]" />
            </Button>
          </div>

          <div className="overflow-x-auto scrollbar-none">
            <div className={cn(scienceStyles.tabRow, uiTextStyles.md)}>
              {scienceTabOrder.map((tabKey) => {
                const phase = scienceContentMap[tabKey];
                const isActive = tabKey === activeTab;
                const isCurrentPhase = tabKey === currentPhase;

                return (
                  <button
                    key={tabKey}
                    type="button"
                    className={cn(
                      "relative shrink-0 pb-3 font-medium transition-colors",
                      isActive ? "text-[color:var(--foreground)]" : uiTextStyles.muted
                    )}
                    onClick={() => setActiveTab(tabKey)}
                  >
                    <span className={scienceStyles.tabLabel}>
                      {isCurrentPhase ? <MapPin className="size-3.5" /> : null}
                      <span>{phase.label}</span>
                    </span>
                    <span
                      className={cn(
                        "absolute inset-x-0 bottom-0 h-0.5 rounded-full transition-opacity",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                      style={{ backgroundColor: "var(--foreground)" }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </header>
      </div>

      <div className={scienceStyles.pageBody}>
        <section className={scienceStyles.sectionBody}>
          {activeTab === "overview" ? null : (
            <div className={scienceStyles.illustrationWrap}>
              <div
                className={scienceStyles.illustrationHalo}
                style={{
                  background: `radial-gradient(circle, var(--phase-${activeIllustrationPhase}) 0%, transparent 58%)`
                }}
              >
                <PhaseIllustration phase={activeIllustrationPhase} className="size-44" />
              </div>
            </div>
          )}

          <div>
            <h1 className={cn("font-medium leading-none text-[var(--color-ink)]", uiTextStyles.xxl)}>{activeTitle}</h1>
            {isCurrentPhaseTab ? (
              <p className={cn(scienceStyles.titleTag, uiTextStyles.sm)}>
                <MapPin className="size-3.5 shrink-0" />
                <span>你在这里</span>
              </p>
            ) : null}
            <p className={cn("mt-3", bodyTextClass)}>{introText}</p>
          </div>

          <div className={scienceStyles.sectionGrid}>
            <div>
              <p className={sectionTitleClass}>{activeContent.durationLabel}</p>
              <p className={cn("mt-3", bodyTextClass)}>
                {activeTab === "overview" ? renderHighlightedDuration(activeContent.duration) : activeContent.duration}
              </p>
            </div>

            <div>
              <p className={sectionTitleClass}>{activeContent.hormoneLabel}</p>
              {activeContent.hormones ? <p className={cn("mt-3", bodyTextClass)}>{activeContent.hormones}</p> : null}
              {activeContent.hormoneItems ? (
                <>
                  <div className={cn(activeContent.hormones ? "mt-5" : "mt-4", scienceStyles.hormoneGrid)}>
                    {activeContent.hormoneItems.map((item) => (
                      <div key={item.name} className={cn("flex h-full flex-col", scienceStyles.softCard)}>
                        <p className={cn("font-medium text-[var(--color-ink)]", uiTextStyles.md)}>{item.name}</p>
                        <p className={cn("mt-2", bodyTextClass)}>{item.role}</p>
                        <HormoneTrendChart trend={item.trend} />
                      </div>
                    ))}
                  </div>
                  <p className={cn("mt-4", uiTextStyles.sm, uiTextStyles.muted)}>* 图示为典型趋势，不代表精确数值。</p>
                </>
              ) : null}
            </div>

            {activeTab === "overview" ? null : (
              <div>
                <p className={sectionTitleClass}>{activeContent.bodySignalsLabel}</p>
                <div className={cn("mt-3 space-y-2", bodyTextClass)}>
                  {activeContent.bodySignals.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className={sectionTitleClass}>{activeContent.mindSignalsLabel}</p>
              <div className={cn("mt-3 space-y-2", bodyTextClass)}>
                {activeContent.mindSignals.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
              {activeContent.phaseSummaries ? (
                <div className={scienceStyles.phaseSummaryCard}>
                  <div className={scienceStyles.phaseSummaryList}>
                    {activeContent.phaseSummaries.map((item) => (
                      <div key={item.name} className={scienceStyles.phaseSummaryRow}>
                        <p className={cn(scienceStyles.phaseSummaryName, uiTextStyles.md)}>{item.name}</p>
                        <p className={cn("min-w-0 flex-1", bodyTextClass)}>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <p className={sectionTitleClass}>{activeContent.suggestionsLabel}</p>
              <div className={cn(scienceStyles.suggestionList, bodyTextClass)}>
                {activeContent.suggestions.map((item) => (
                  <div key={item} className={scienceStyles.suggestionRow}>
                    <span className={scienceStyles.suggestionDot} />
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
