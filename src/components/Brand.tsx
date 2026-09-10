import { cn } from "@/lib/utils";
import { useId, type CSSProperties, type ReactNode } from "react";

/**
 * Símbolo Data Galaxy: núcleo conectado a seis nodes.
 *
 * A geometria é fixa — não reinterpretar por seção. O que varia é só
 * iluminação e movimento: o gradiente oficial (135°, #FF3A14 → #FF4A1F →
 * #FF6025), o glow que vive ATRÁS da arte (nunca deformando o desenho) e a
 * sequência de entrada do hero.
 *
 * Sequência (≈1100ms): círculo externo → núcleo → conexões desenhadas →
 * nodes em sequência → pulso laranja percorrendo a rede.
 */

// Posições dos nodes no viewBox 32×32. Distância ao núcleo ≈ 12 em todos.
const NODES = [
  [16, 4],
  [26, 10],
  [26, 22],
  [16, 28],
  [6, 22],
  [6, 10],
] as const;

const DASH_LINE = 13;
const DASH_RING = 88; // 2πr, r = 14

// `--dg-dash` alimenta o keyframe dg-draw; custom property exige cast.
const traco = (dash: number, animation: string) =>
  ({ strokeDasharray: dash, "--dg-dash": dash, animation }) as CSSProperties;

export function BrandMark({
  className,
  size = 28,
  animated = false,
  glow = false,
}: {
  className?: string;
  size?: number;
  /** Liga a sequência de entrada — usar só em hero/loading, não no header. */
  animated?: boolean;
  /** Halo laranja atrás da arte. */
  glow?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `dg-grad-${uid}`;
  const softId = `dg-grad-soft-${uid}`;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Glow atrás: elemento próprio, fora do SVG da marca. */}
      {glow && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[45%] rounded-pill"
          style={{
            background: "radial-gradient(circle, var(--brand-orange-glow), transparent 65%)",
          }}
        />
      )}

      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        role="img"
        aria-label="Data Galaxy"
        className="relative"
      >
        <defs>
          {/* Gradiente oficial a 135° */}
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-orange-hot)" />
            <stop offset="45%" stopColor="var(--brand-orange)" />
            <stop offset="100%" stopColor="var(--brand-orange-light)" />
          </linearGradient>
          <linearGradient id={softId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-orange-hot)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--brand-orange-light)" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* 01 — círculo externo */}
        <circle
          cx="16"
          cy="16"
          r="14"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="1.2"
          opacity="0.4"
          style={animated ? traco(DASH_RING, "dg-draw 420ms var(--ease-out-expo) both") : undefined}
        />

        {/* 03 — conexões desenhadas do núcleo até cada node */}
        {NODES.map(([x, y], i) => (
          <line
            key={`line-${i}`}
            x1="16"
            y1="16"
            x2={x}
            y2={y}
            stroke={`url(#${gradId})`}
            strokeWidth="0.8"
            opacity="0.55"
            style={
              animated
                ? traco(DASH_LINE, `dg-draw 380ms var(--ease-out-expo) ${350 + i * 40}ms both`)
                : undefined
            }
          />
        ))}

        {/* 05 — pulso laranja percorrendo a rede (uma passada) */}
        {animated &&
          NODES.map(([x, y], i) => (
            <line
              key={`surge-${i}`}
              x1="16"
              y1="16"
              x2={x}
              y2={y}
              stroke="var(--brand-orange-light)"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0"
              style={{ animation: `dg-surge 520ms ease-out ${950 + i * 45}ms both` }}
            />
          ))}

        {/* 02 — núcleo central */}
        <circle
          cx="16"
          cy="16"
          r="3.4"
          fill={`url(#${gradId})`}
          style={
            animated
              ? {
                  transformOrigin: "16px 16px",
                  animation: "dg-pop 320ms var(--ease-out-expo) 200ms both",
                }
              : undefined
          }
        />

        {/* 04 — nodes entram em sequência */}
        {NODES.map(([x, y], i) => (
          <circle
            key={`node-${i}`}
            cx={x}
            cy={y}
            r="2.2"
            fill={`url(#${gradId})`}
            style={
              animated
                ? {
                    transformOrigin: `${x}px ${y}px`,
                    animation: `dg-pop 300ms var(--ease-out-expo) ${600 + i * 60}ms both`,
                  }
                : undefined
            }
          />
        ))}
      </svg>
    </div>
  );
}

export function BrandWordmark({
  subtitle = true,
  animated = false,
  glow = false,
}: {
  subtitle?: boolean;
  animated?: boolean;
  glow?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark size={28} animated={animated} glow={glow} />
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
          DATA <span className="text-primary">GALAXY</span>
        </div>
        {subtitle && (
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            by Locaweb
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Eyebrow do DS: pill discreta com um node laranja antes do texto.
 * `● DATA INTELLIGENCE`
 */
export function Eyebrow({
  children,
  className,
  style,
  node = true,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Desliga o node laranja que antecede o texto. */
  node?: boolean;
}) {
  return (
    <span className={cn("dg-pill", !node && "dg-pill-plain", className)} style={style}>
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="dg-enter flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h1 className="t-h2 text-foreground">{title}</h1>
        {subtitle && <p className="t-body-sm mt-3 max-w-3xl text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
