import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input do DS: 48px de altura, raio 10px, superfície um passo abaixo do card
 * e foco que acende a borda em laranja com um halo de 3px.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-[10px] px-4 text-sm",
          "border border-[color:var(--border-default)] bg-[color:var(--surface-02)] text-foreground",
          "transition-[border-color,box-shadow] duration-[var(--motion-fast)]",
          "placeholder:text-muted-foreground",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "focus-visible:outline-none focus-visible:border-[color:rgba(255,74,31,.65)]",
          "focus-visible:shadow-[0_0_0_3px_rgba(255,74,31,.10)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
