import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 t-micro uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-primary text-primary-foreground",
        secondary:
          "border-[color:var(--border-default)] bg-[color:var(--surface-03)] text-foreground",
        destructive: "border-white/10 bg-destructive text-destructive-foreground",
        outline: "border-[color:var(--border-default)] bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
