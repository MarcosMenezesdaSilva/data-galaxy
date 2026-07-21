import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" className="h-7 w-7">
        <defs>
          <linearGradient id="dg-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--accent-orange)" />
          </linearGradient>
        </defs>
        <circle
          cx="16"
          cy="16"
          r="14"
          fill="none"
          stroke="url(#dg-grad)"
          strokeWidth="1.2"
          opacity="0.4"
        />
        {[
          [16, 4],
          [26, 10],
          [26, 22],
          [16, 28],
          [6, 22],
          [6, 10],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.2" fill="url(#dg-grad)" />
        ))}
        <circle cx="16" cy="16" r="3.4" fill="url(#dg-grad)" />
        {[
          [16, 4],
          [26, 10],
          [26, 22],
          [16, 28],
          [6, 22],
          [6, 10],
        ].map(([x, y], i) => (
          <line
            key={i}
            x1="16"
            y1="16"
            x2={x}
            y2={y}
            stroke="url(#dg-grad)"
            strokeWidth="0.8"
            opacity="0.55"
          />
        ))}
      </svg>
    </div>
  );
}

export function BrandWordmark({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <div className="leading-tight">
        <div className="text-[15px] font-bold tracking-tight text-foreground">
          DATA <span className="text-primary">GALAXY</span>
        </div>
        {subtitle && (
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            by Locaweb
          </div>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
