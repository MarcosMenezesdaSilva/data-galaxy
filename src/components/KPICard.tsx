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

/**
 * Métrica: rótulo em label técnico, número em Geist Mono com tabular-nums
 * (dado de sistema se distingue de interface) e o laranja entrando só no
 * ícone — o card inteiro não vira bloco de cor.
 */
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
    <Card lit interactive className={cn("flex flex-col gap-3 p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="t-micro uppercase text-muted-foreground">{label}</div>
        {icon && <div className={cn("shrink-0", accents[accent])}>{icon}</div>}
      </div>
      <div className="dg-mono t-h3 text-foreground">{value}</div>
      {(hint || trend) && (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          {hint && <span className="text-muted-foreground">{hint}</span>}
          {trend && (
            <span
              className={cn(
                "dg-mono font-medium",
                trend.value >= 0 ? "text-[color:var(--critical)]" : "text-[color:var(--success)]",
              )}
            >
              {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value).toFixed(1)}% {trend.label}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
