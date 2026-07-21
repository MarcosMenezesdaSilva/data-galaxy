import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export interface KPICardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: { value: number; label?: string };
  icon?: ReactNode;
  accent?: "brand" | "info" | "success" | "warning" | "critical" | "orange";
  className?: string;
}

const accents: Record<NonNullable<KPICardProps["accent"]>, string> = {
  brand: "text-primary",
  info: "text-[color:var(--info)]",
  success: "text-[color:var(--success)]",
  warning: "text-[color:var(--warning)]",
  critical: "text-[color:var(--critical)]",
  orange: "text-[color:var(--accent-orange)]",
};

export function KPICard({
  label,
  value,
  hint,
  trend,
  icon,
  accent = "brand",
  className,
}: KPICardProps) {
  return (
    <Card className={cn("p-4 gap-2", className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        {icon && <div className={cn("shrink-0", accents[accent])}>{icon}</div>}
      </div>
      <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="flex items-center justify-between text-xs">
        {hint && <span className="text-muted-foreground">{hint}</span>}
        {trend && (
          <span
            className={cn(
              trend.value >= 0 ? "text-[color:var(--critical)]" : "text-[color:var(--success)]",
              "font-medium",
            )}
          >
            {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value).toFixed(1)}% {trend.label}
          </span>
        )}
      </div>
    </Card>
  );
}
