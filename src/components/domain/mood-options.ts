import type { DailyEntry } from "../../features/cycle/types";
import calmSticker from "../../assets/mood/calm.png";
import greatSticker from "../../assets/mood/great.png";
import happySticker from "../../assets/mood/happy.png";
import sadSticker from "../../assets/mood/sad.png";
import unhappySticker from "../../assets/mood/unhappy.png";

export type MoodValue = NonNullable<DailyEntry["mood"]>;

export const moodOptions: Array<{
  label: string;
  value: MoodValue;
  imageSrc: string;
}> = [
  { label: "超开心", value: "great", imageSrc: greatSticker },
  { label: "开心", value: "happy", imageSrc: happySticker },
  { label: "平静", value: "calm", imageSrc: calmSticker },
  { label: "不乐", value: "unhappy", imageSrc: unhappySticker },
  { label: "难过", value: "sad", imageSrc: sadSticker }
];

export function getMoodOption(mood?: DailyEntry["mood"]) {
  return moodOptions.find((item) => item.value === mood);
}
