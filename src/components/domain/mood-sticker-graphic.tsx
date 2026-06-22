import calmImage from "../../assets/mood/calm.png";
import greatImage from "../../assets/mood/great.png";
import happyImage from "../../assets/mood/happy.png";
import sadImage from "../../assets/mood/sad.png";
import unhappyImage from "../../assets/mood/unhappy.png";
import type { MoodValue } from "./mood-options";
import { cn } from "../../lib/utils";

const moodStickerImage: Record<MoodValue, string> = {
  great: greatImage,
  happy: happyImage,
  calm: calmImage,
  tense: unhappyImage,
  unhappy: unhappyImage,
  sad: sadImage
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
  className,
  title
}: MoodStickerGraphicProps) {
  return (
    <img
      src={moodStickerImage[mood]}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      className={cn("inline-block h-auto w-auto object-contain", className)}
      title={title}
    />
  );
}
