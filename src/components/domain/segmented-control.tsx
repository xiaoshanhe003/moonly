import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { uiTextStyles } from "../ui/styles";

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
    <div className="inline-flex rounded-2xl bg-[color:var(--muted)] p-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm transition",
              active
                ? "bg-[color:var(--card-elevated)] text-[color:var(--foreground)] shadow-sm"
                : uiTextStyles.muted
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
