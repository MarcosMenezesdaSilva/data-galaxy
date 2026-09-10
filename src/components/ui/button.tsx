import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Botões do Data Galaxy — CTA em pill, resposta rápida (160–200ms) e sem
 * elasticidade: o botão deve parecer preciso, não flutuante. O glow laranja
 * é hierárquico e fica só no primário; se tudo brilha, nada parece importante.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill",
    "text-sm font-medium cursor-pointer select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--motion-fast)] ease-[var(--ease-out-expo)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-orange)]",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    "active:scale-[.985] hover:scale-[1.015]",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground border border-white/10",
          "hover:bg-[color:var(--brand-hover)]",
          "hover:shadow-[0_0_24px_rgba(255,74,31,.24),0_0_60px_rgba(255,74,31,.10)]",
        ].join(" "),
        destructive:
          "bg-destructive text-destructive-foreground border border-white/10 hover:brightness-110",
        outline: [
          "border border-[color:var(--border-strong)] bg-transparent text-foreground",
          "hover:bg-[color:var(--surface-03)] hover:border-[color:var(--border-brand)]",
        ].join(" "),
        secondary: [
          "bg-[color:var(--surface-02)] text-foreground border border-[color:var(--border-default)]",
          "hover:bg-[color:var(--surface-hover)] hover:border-[color:var(--border-strong)]",
        ].join(" "),
        ghost: "text-muted-foreground hover:bg-[color:var(--surface-03)] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline hover:scale-100 active:scale-100",
      },
      size: {
        default: "h-9 px-5",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 px-0",
        "icon-sm": "h-8 w-8 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
