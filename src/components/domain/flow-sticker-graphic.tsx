import heavySvg from "../../assets/flow/heavy.svg?raw";
import lightSvg from "../../assets/flow/light.svg?raw";
import mediumSvg from "../../assets/flow/medium.svg?raw";
import noneSvg from "../../assets/flow/none.svg?raw";
import spottingSvg from "../../assets/flow/spotting.svg?raw";
import type { BleedingLevel } from "../../features/cycle/types";
import { InlineStickerSvg } from "./inline-sticker-svg";

const flowSvgByLevel: Record<BleedingLevel, string> = {
  none: noneSvg,
  spotting: spottingSvg,
  light: lightSvg,
  medium: mediumSvg,
  heavy: heavySvg
};

type FlowStickerGraphicProps = {
  level: BleedingLevel;
  title?: string;
  className?: string;
};

export function FlowStickerGraphic({ level, title, className }: FlowStickerGraphicProps) {
  return (
    <InlineStickerSvg
      svg={flowSvgByLevel[level]}
      title={title}
      className={className}
      replacements={[{ from: "#FB7185", to: "var(--phase-menstrual)" }]}
    />
  );
}
