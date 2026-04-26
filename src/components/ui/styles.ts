import { cn } from "../../lib/utils";

export const uiTextStyles = {
  muted: "text-[color:var(--muted-foreground)]",
  xs: "text-[length:var(--text-xs)]",
  sm: "text-[length:var(--text-sm)]",
  md: "text-[length:var(--text-md)]",
  lg: "text-[length:var(--text-lg)]",
  xl: "text-[length:var(--text-xl)]",
  xxl: "text-[length:var(--text-2xl)]",
  xxxl: "text-[length:var(--text-3xl)]",
  heroTitle: "text-[length:var(--text-hero-title)]",
  sectionLabel: "text-[length:var(--text-xs)] uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]",
  meta: "text-[length:var(--text-sm)] font-medium text-[color:var(--muted-foreground)]"
};

export const uiSpacingStyles = {
  stackSm: "space-y-[var(--space-3)]",
  stackMd: "space-y-[var(--space-4)]",
  gapSm: "gap-[var(--space-3)]",
  gapMd: "gap-[var(--space-4)]",
  gapLg: "gap-[var(--space-6)]",
  sectionTop: "mt-[var(--space-4)]"
};

export const uiSurfaceStyles = {
  card:
    "rounded-[var(--radius-xl)] border border-[color:var(--border-strong)] bg-[color:var(--card)] p-[var(--space-5)] shadow-[var(--shadow-card)] backdrop-blur",
  elevated:
    "border-[color:var(--border-strong)] bg-[color:var(--card-elevated)] shadow-[var(--shadow-elevated)] backdrop-blur-xl",
  panel: "rounded-[var(--radius-md)] bg-[color:var(--muted)] p-[var(--space-4)]",
  panelStrong: "rounded-[var(--radius-md)] bg-[color:var(--muted-strong)] p-[var(--space-4)]"
};

export const uiLayoutStyles = {
  sheetOverlay:
    "fixed inset-0 z-50 flex items-end bg-[color:var(--overlay)] p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6",
  sheetBody:
    "max-h-[88vh] w-full overflow-hidden rounded-t-[var(--radius-record-sheet)] bg-[color:var(--card-elevated)] shadow-[var(--shadow-card)] sm:max-w-2xl sm:rounded-[var(--radius-record-sheet)]",
  sheetHeader:
    "flex items-center justify-between border-b border-[color:var(--border)] px-[var(--space-5)] py-[var(--space-4)]",
  sheetContent: "max-h-[calc(88vh-5rem)] overflow-y-auto p-[var(--space-5)]",
  input:
    "w-full rounded-[var(--radius-md)] border border-[color:var(--input)] bg-[color:var(--muted)] px-[var(--space-4)] py-[var(--space-3)] text-[color:var(--foreground)]"
};

export function getOptionPillClass(active: boolean) {
  return cn(
    "inline-flex items-center gap-[var(--space-2)] rounded-full px-[var(--space-4)] py-[var(--space-2)] text-sm transition",
    active
      ? "bg-[color:var(--foreground)] text-[color:var(--background)] shadow-[0_0_0_2px_var(--ring-soft)]"
      : "bg-[color:var(--muted)] text-[color:var(--foreground)]"
  );
}

export function getChoiceTileClass(active: boolean) {
  return cn(
    "rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-4)] text-sm transition",
    active ? "bg-[color:var(--foreground)] text-[color:var(--background)]" : "bg-[color:var(--muted)] text-[color:var(--foreground)]"
  );
}
