import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[color:var(--foreground)] px-4 py-2 text-sm font-medium text-[color:var(--background)]",
        secondary: "bg-[color:var(--muted)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)]",
        ghost: "bg-[color:var(--card-elevated)] text-[color:var(--muted-foreground)]",
        soft: "bg-[color:var(--muted-strong)] px-4 py-2 text-sm text-[color:var(--foreground)]"
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
