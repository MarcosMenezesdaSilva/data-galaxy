import { cn } from "@/lib/utils";

/**
 * Gauge de risco. A cor é semântica (o DS pede que status não dependa só do
 * laranja), mas o número é dado de sistema — Geist Mono, tabular. O trilho
 * usa a borda do sistema, não uma cor própria.
 */
export function RiskGauge({ value, size = 120 }: { value: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const off = c * (1 - clamped / 100);
  const color =
    clamped >= 80
      ? "var(--critical)"
      : clamped >= 60
        ? "var(--brand-orange)"
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
      {/* Glow só nas faixas que exigem atenção — iluminação é hierarquia. */}
      {clamped >= 60 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 rounded-pill"
          style={{ background: `radial-gradient(circle, ${color}, transparent 62%)`, opacity: 0.1 }}
        />
      )}
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--border-strong)"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 600ms var(--ease-out-expo)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <div className="dg-mono t-h3" style={{ color }}>
          {clamped}
        </div>
        <div className="t-micro uppercase text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
