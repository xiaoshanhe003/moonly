import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

type SegmentedControlProps = {
  value: string;
  onChange: (value: "today" | "calendar") => void;
  items: Array<{
    value: "today" | "calendar";
    label: string;
    icon: LucideIcon;
  }>;
};

export function SegmentedControl({ value, onChange, items }: SegmentedControlProps) {
  return (
    <div className="inline-flex rounded-2xl bg-[var(--color-panel)] p-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-sm transition",
              active ? "bg-white text-[var(--color-ink)] shadow-sm" : "text-[var(--color-muted)]"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
