import { cn } from "@/lib/utils";

export function RiskGauge({ value, size = 120 }: { value: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const off = c * (1 - clamped / 100);
  const color =
    clamped >= 80
      ? "var(--critical)"
      : clamped >= 60
        ? "var(--accent-orange)"
        : clamped >= 30
          ? "var(--warning)"
          : "var(--success)";
  const label =
    clamped >= 80 ? "Crítico" : clamped >= 60 ? "Alto" : clamped >= 30 ? "Médio" : "Baixo";
  return (
    <div
      className={cn("relative inline-flex items-center justify-center")}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--border)"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold" style={{ color }}>
          {clamped}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
