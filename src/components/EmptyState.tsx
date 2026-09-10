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
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-12 text-center",
        // Vazio não é erro: superfície um passo abaixo do card e sem borda
        // acesa, para não pedir atenção que não merece.
        "border-dashed bg-transparent shadow-none",
        className,
      )}
    >
      {icon && <div className="text-[color:var(--text-disabled)]">{icon}</div>}
      <div className="space-y-2">
        <div className="t-h4 text-foreground">{title}</div>
        {description && (
          <p className="t-body-sm mx-auto max-w-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </Card>
  );
}
