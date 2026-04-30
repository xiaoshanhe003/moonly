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
  pageHeaderBar: "h-[72px]",
  pageHeaderSafeArea: "pt-[env(safe-area-inset-top,0px)]",
  pageHeaderInner: "mx-auto flex h-[72px] w-full max-w-md items-center px-4 sm:px-6",
  sheetOverlay:
    "fixed inset-0 z-50 flex items-end justify-center bg-[color:var(--overlay)] p-0 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] backdrop-blur-sm sm:items-center sm:p-6",
  sheetFrame: "flex max-h-full w-full flex-col items-end sm:max-w-2xl",
  sheetCloseButton:
    "mr-5 h-9 w-14 rounded-b-none rounded-t-[8px] bg-[color:var(--muted)] text-[color:var(--foreground)] shadow-none hover:bg-[color:var(--muted)] sm:mr-6",
  sheetBody:
    "flex min-h-[17rem] w-full flex-col overflow-hidden rounded-t-[var(--radius-record-sheet)] bg-[color:var(--card-elevated)] shadow-[var(--shadow-card)] sm:rounded-[var(--radius-record-sheet)]",
  sheetHeader: "px-6 pb-0 pt-8 sm:pt-6",
  sheetContent: "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 pb-8 pt-5 sm:pb-6",
  sheetFooter:
    "border-t border-[color:var(--border)] px-6 pb-[calc(var(--space-5)+env(safe-area-inset-bottom,0px))] pt-3 sm:pb-6",
  sheetPrimaryActionButton:
    "h-[50px] w-full rounded-[10px] bg-[color:var(--foreground)] text-base font-semibold text-[color:var(--background)]",
  sheetSecondaryActionButton:
    "h-[50px] w-full rounded-[10px] bg-[color:var(--muted)] text-base font-semibold text-[color:var(--foreground)]",
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
