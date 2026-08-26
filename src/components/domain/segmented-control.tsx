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
  const activeIndex = Math.max(0, items.findIndex((item) => item.value === value));
  const toggle = () => {
    const nextIndex = activeIndex === 0 ? 1 : 0;
    onChange(items[nextIndex].value);
  };

  return (
    <button
      type="button"
      aria-label={activeIndex === 0 ? "切换到日历" : "切换到今天"}
      aria-pressed={activeIndex === 1}
      onClick={toggle}
      className="inline-flex rounded-2xl border border-white/45 bg-[color-mix(in_srgb,var(--muted)_86%,transparent)] p-1 backdrop-blur-xl"
    >
      <span className="relative grid grid-cols-2">
        <span
          aria-hidden="true"
          className={cn(
            "segmented-thumb pointer-events-none absolute inset-y-0 left-0 rounded-[12px] bg-[color:var(--card-elevated)] shadow-[0_1px_4px_rgba(17,24,39,0.08)] backdrop-blur",
            activeIndex > 0 && "segmented-thumb-active"
          )}
          style={{ width: `${100 / items.length}%` }}
        />
        {items.map((item, index) => {
          const active = index === activeIndex;

          return (
            <span
              key={item.value}
              className={cn(
                "relative z-10 inline-flex items-center whitespace-nowrap rounded-[12px] px-4 py-2 text-sm transition-colors duration-[220ms]",
                active ? "text-[color:var(--foreground)]" : uiTextStyles.muted
              )}
            >
              {item.label}
            </span>
          );
        })}
      </span>
    </button>
  );
}
