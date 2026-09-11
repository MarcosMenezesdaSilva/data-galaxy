import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export interface KPICardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: { value: number; label?: string };
  icon?: ReactNode;
  accent?: "brand" | "info" | "success" | "warning" | "critical" | "orange" | "violet";
  className?: string;
}

const accents: Record<NonNullable<KPICardProps["accent"]>, string> = {
  brand: "text-primary bg-primary/12",
  info: "text-[color:var(--info)] bg-[color:var(--info)]/12",
  success: "text-[color:var(--success)] bg-[color:var(--success)]/12",
  warning: "text-[color:var(--warning)] bg-[color:var(--warning)]/12",
  critical: "text-[color:var(--critical)] bg-[color:var(--critical)]/12",
  orange: "text-[color:var(--accent-orange)] bg-[color:var(--accent-orange)]/12",
  violet: "text-[color:var(--violet)] bg-[color:var(--violet)]/12",
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
        {icon && (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
              accents[accent],
            )}
          >
            {icon}
          </div>
        )}
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
