import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { uiSpacingStyles, uiSurfaceStyles, uiTextStyles } from "./styles";

type DetailPanelProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function DetailPanel({ label, value, hint, action, children, className }: DetailPanelProps) {
  return (
    <div className={cn(uiSurfaceStyles.panel, className)}>
      <div className={cn("flex items-center justify-between", uiSpacingStyles.gapSm)}>
        <div>
          <p className={uiTextStyles.sectionLabel}>{label}</p>
          <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">{value}</p>
          {hint ? <p className={cn("mt-1 text-xs", uiTextStyles.muted)}>{hint}</p> : null}
        </div>
        {action}
      </div>
      {children ? <div className={uiSpacingStyles.sectionTop}>{children}</div> : null}
    </div>
  );
}
