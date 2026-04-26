import { cn } from "../../lib/utils";
import { uiTextStyles } from "../ui/styles";

type SegmentedControlProps = {
  value: string;
  onChange: (value: "today" | "calendar") => void;
  items: Array<{
    value: "today" | "calendar";
    label: string;
  }>;
};

export function SegmentedControl({ value, onChange, items }: SegmentedControlProps) {
  return (
    <div className="inline-flex rounded-2xl border border-white/45 bg-[color-mix(in_srgb,var(--muted)_86%,transparent)] p-1 backdrop-blur-xl">
      {items.map((item) => {
        const active = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex items-center rounded-[12px] px-5 py-2 text-sm transition",
              active
                ? "bg-[color-mix(in_srgb,var(--card-elevated)_88%,transparent)] text-[color:var(--foreground)] shadow-[0_1px_4px_rgba(17,24,39,0.08)] backdrop-blur"
                : uiTextStyles.muted
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
