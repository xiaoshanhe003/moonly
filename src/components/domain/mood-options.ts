import type { DailyEntry } from "../../features/cycle/types";
import boredSticker from "../../assets/mood/bored.png";
import calmSticker from "../../assets/mood/calm.png";
import happySticker from "../../assets/mood/happy.png";
import notHappySticker from "../../assets/mood/not_happy.png";
import sadSticker from "../../assets/mood/sad.png";

export type MoodValue = NonNullable<DailyEntry["mood"]>;

export const moodOptions: Array<{
  label: string;
  value: MoodValue;
  imageSrc: string;
}> = [
  { label: "超开心", value: "great", imageSrc: happySticker },
  { label: "开心", value: "happy", imageSrc: calmSticker },
  { label: "平静", value: "calm", imageSrc: boredSticker },
  { label: "不乐", value: "unhappy", imageSrc: notHappySticker },
  { label: "难过", value: "sad", imageSrc: sadSticker }
];

export function getMoodOption(mood?: DailyEntry["mood"]) {
  return moodOptions.find((item) => item.value === mood);
}
