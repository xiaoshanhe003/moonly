import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-strong)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white",
        secondary:
          "bg-[var(--color-panel)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]",
        ghost: "bg-white/70 text-[var(--color-muted)]",
        soft: "bg-[var(--color-accent-soft)] px-4 py-2 text-sm text-[var(--color-accent-strong)]"
      },
      size: {
        default: "",
        icon: "size-10"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
