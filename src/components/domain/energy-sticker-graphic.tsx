import fullSvg from "../../assets/energy/full.svg?raw";
import highSvg from "../../assets/energy/high.svg?raw";
import lowSvg from "../../assets/energy/low.svg?raw";
import midSvg from "../../assets/energy/mid.svg?raw";
import type { DailyEntry } from "../../features/cycle/types";
import { cn } from "../../lib/utils";

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
  const svgMarkup = energyStickerSvg[energy]
    .replaceAll("#BAE6FD", backgroundColor)
    .replaceAll("#0EA5E9", fillColor)
    .replaceAll("#0284C7", fillColor);

  return (
    <span
      className={cn("inline-flex [&_svg]:h-full [&_svg]:w-auto [&_svg]:overflow-visible", className)}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
      aria-hidden="true"
    />
  );
}
