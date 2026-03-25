import type { PropsWithChildren } from "react";
import { cn } from "../../lib/utils";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-xl)] border border-white/70 bg-white/80 p-5 shadow-[var(--shadow-card)] backdrop-blur",
        className
      )}
    >
      {children}
    </section>
  );
}
