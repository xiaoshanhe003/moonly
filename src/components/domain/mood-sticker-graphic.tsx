import calmSvg from "../../assets/mood/calm.svg?raw";
import greatSvg from "../../assets/mood/great.svg?raw";
import happySvg from "../../assets/mood/happy.svg?raw";
import sadSvg from "../../assets/mood/sad.svg?raw";
import unhappySvg from "../../assets/mood/unhappy.svg?raw";
import type { MoodValue } from "./mood-options";
import { cn } from "../../lib/utils";

const moodStickerSvg: Record<MoodValue, string> = {
  great: greatSvg,
  happy: happySvg,
  calm: calmSvg,
  unhappy: unhappySvg,
  sad: sadSvg
};

type MoodStickerGraphicProps = {
  mood: MoodValue;
  fillColor?: string;
  strokeColor?: string;
  className?: string;
  title?: string;
};

export function MoodStickerGraphic({
  mood,
  fillColor = "#BAE6FD",
  strokeColor = "var(--foreground)",
  className,
  title
}: MoodStickerGraphicProps) {
  const svgMarkup = moodStickerSvg[mood]
    .replaceAll("#BAE6FD", fillColor)
    .replaceAll("#0369A1", strokeColor);

  return (
    <span
      title={title}
      className={cn("inline-flex [&_svg]:h-full [&_svg]:w-auto [&_svg]:overflow-visible", className)}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
      aria-hidden="true"
    />
  );
}
