import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn("flex flex-col items-center justify-center gap-3 p-10 text-center", className)}
    >
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div>
        <div className="text-base font-semibold text-foreground">{title}</div>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
      {action}
    </Card>
  );
}
