import calmSvg from "../../assets/mood/calm.svg?raw";
import greatSvg from "../../assets/mood/great.svg?raw";
import happySvg from "../../assets/mood/happy.svg?raw";
import sadSvg from "../../assets/mood/sad.svg?raw";
import unhappySvg from "../../assets/mood/unhappy.svg?raw";
import type { MoodValue } from "./mood-options";
import { InlineStickerSvg } from "./inline-sticker-svg";

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
  return (
    <InlineStickerSvg
      svg={moodStickerSvg[mood]}
      title={title}
      className={className}
      replacements={[
        { from: "#BAE6FD", to: fillColor },
        { from: "#0369A1", to: strokeColor }
      ]}
    />
  );
}
