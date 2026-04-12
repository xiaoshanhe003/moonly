import type { PropsWithChildren } from "react";
import { cn } from "../../lib/utils";
import { uiSurfaceStyles } from "./styles";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return <section className={cn(uiSurfaceStyles.card, className)}>{children}</section>;
}
