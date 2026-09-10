import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-24 w-full rounded-[10px] px-4 py-3 text-sm leading-relaxed",
          "border border-[color:var(--border-default)] bg-[color:var(--surface-02)] text-foreground",
          "transition-[border-color,box-shadow] duration-[var(--motion-fast)]",
          "placeholder:text-muted-foreground",
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
Textarea.displayName = "Textarea";

export { Textarea };
