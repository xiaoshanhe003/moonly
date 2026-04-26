import fullSvg from "../../assets/energy/full.svg?raw";
import highSvg from "../../assets/energy/high.svg?raw";
import lowSvg from "../../assets/energy/low.svg?raw";
import midSvg from "../../assets/energy/mid.svg?raw";
import type { DailyEntry } from "../../features/cycle/types";
import { InlineStickerSvg } from "./inline-sticker-svg";

type EnergyValue = NonNullable<DailyEntry["energy"]>;

const energyStickerSvg: Record<EnergyValue, string> = {
  low: lowSvg,
  medium: midSvg,
  higher: highSvg,
  high: fullSvg
};

type EnergyStickerGraphicProps = {
  energy: EnergyValue;
  backgroundColor?: string;
  fillColor?: string;
  className?: string;
};

export function EnergyStickerGraphic({
  energy,
  backgroundColor = "#BAE6FD",
  fillColor = "#0EA5E9",
  className
}: EnergyStickerGraphicProps) {
  return (
    <InlineStickerSvg
      svg={energyStickerSvg[energy]}
      className={className}
      replacements={[
        { from: "#BAE6FD", to: backgroundColor },
        { from: "#0EA5E9", to: fillColor },
        { from: "#0284C7", to: fillColor }
      ]}
    />
  );
}
