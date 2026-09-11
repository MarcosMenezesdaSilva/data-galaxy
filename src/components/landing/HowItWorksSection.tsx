import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDown, BarChart3, CheckCircle2, Database, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";

/* ---------------------------------------------------------------------------
   As quatro etapas do ciclo, cada uma com uma amostra do próprio mecanismo.

   A diferença em relação aos pilares acima é de função: lá o card diz "o que
   fazemos", aqui ele mostra "como" — por isso cada etapa carrega uma
   visualização diferente em vez de mais texto.

   Os visuais são SVG e divs à mão, não Recharts: é ilustração de mecanismo,
   não dado ao vivo, e puxar a biblioteca aqui custaria JS de cliente para
   desenhar quatro figuras estáticas.
--------------------------------------------------------------------------- */

/** Sinais operacionais convergindo para a plataforma. */
function VisualFluxo() {
  const PILLS = [
    { rotulo: "Logs", classe: "left-1/2 top-0 -translate-x-1/2" },
    { rotulo: "Métricas", classe: "left-0 top-[32%]" },
    { rotulo: "Tickets", classe: "right-0 top-[32%]" },
    { rotulo: "Eventos", classe: "bottom-0 left-0" },
    { rotulo: "APIs", classe: "bottom-0 right-0" },
  ];

  // Pontas das linhas, no viewBox — batem com as âncoras das pills acima.
  const PONTAS: [number, number][] = [
    [120, 26],
    [46, 68],
    [194, 68],
    [46, 146],
    [194, 146],
  ];

  return (
    <div className="relative h-[172px] w-full" aria-hidden="true">
      <svg viewBox="0 0 240 172" className="absolute inset-0 h-full w-full">
        {PONTAS.map(([x, y], i) => {
          // Ponto a 62% do caminho: o dado em trânsito para o centro.
          const px = 120 + (x - 120) * 0.62;
          const py = 92 + (y - 92) * 0.62;
          return (
            <g key={i}>
              <line
                x1="120"
                y1="92"
                x2={x}
                y2={y}
                stroke="var(--brand-orange)"
                strokeWidth="1"
                opacity="0.3"
              />
              <circle cx={px} cy={py} r="2" fill="var(--brand-orange)" opacity="0.8" />
            </g>
          );
        })}
        <circle
          cx="120"
          cy="92"
          r="34"
          fill="var(--brand-orange)"
          opacity="0.12"
          className="dg-node-pulse"
        />
      </svg>

      <span className="absolute left-1/2 top-[53%] grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-content-center rounded-pill border border-[color:var(--border-brand)] bg-[color:var(--brand-orange-soft)] shadow-[var(--glow-md)]">
        <Database className="h-5 w-5 text-primary" />
      </span>

      {PILLS.map((p) => (
        <span
          key={p.rotulo}
          className={cn(
            "absolute rounded-pill border border-[color:var(--border-default)] bg-[color:var(--surface-02)] px-2.5 py-1 text-[11px] text-muted-foreground",
            p.classe,
          )}
        >
          {p.rotulo}
        </span>
      ))}
    </div>
  );
}

/** Série realizada e horizonte previsto, com o corte em "Hoje". */
function VisualPrevisao() {
  const uid = useId().replace(/:/g, "");
  const faixa = `dg-hw-band-${uid}`;

  const PREVISTO: [number, number][] = [
    [120, 58],
    [150, 44],
    [180, 50],
    [210, 30],
    [240, 34],
  ];

  return (
    <div className="w-full" aria-hidden="true">
      <div className="mb-3 flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 rounded-xs bg-[color:var(--muted-foreground)]" /> Real
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 rounded-xs bg-primary" /> Previsto
        </span>
      </div>

      <svg viewBox="0 0 240 100" className="h-auto w-full">
        <defs>
          <linearGradient id={faixa} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Corte do presente: separa o que foi medido do que é projeção. */}
        <line
          x1="120"
          y1="4"
          x2="120"
          y2="96"
          stroke="var(--border-strong)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />

        {/* Intervalo de confiança, só sobre o trecho projetado. */}
        <path
          d="M 120 58 L 150 32 L 180 38 L 210 16 L 240 20 L 240 48 L 210 44 L 180 62 L 150 56 Z"
          fill={`url(#${faixa})`}
        />

        <path
          d="M 0 74 L 30 66 L 60 72 L 90 54 L 120 58"
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M 120 58 L 150 44 L 180 50 L 210 30 L 240 34"
          fill="none"
          stroke="var(--brand-orange)"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />

        {PREVISTO.map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="2.5" fill="var(--brand-orange)" />
        ))}
      </svg>

      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        {["D-7", "D-3", "Hoje", "D+3", "D+7"].map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>
    </div>
  );
}

/** Score de risco e os fatores que o compõem. */
function VisualRisco() {
  const PCT = 78;
  const R = 42;
  const C = 2 * Math.PI * R;

  const FATORES = [
    { nome: "Pico de volume", peso: 42 },
    { nome: "Fila de backlog", peso: 28 },
    { nome: "Indisponibilidade", peso: 16 },
    { nome: "Sazonalidade", peso: 12 },
  ];

  return (
    <div className="flex items-center gap-4" aria-hidden="true">
      <div className="relative h-[104px] w-[104px] shrink-0">
        <svg viewBox="0 0 104 104" className="h-full w-full">
          <circle
            cx="52"
            cy="52"
            r={R}
            fill="none"
            stroke="var(--surface-hover)"
            strokeWidth="9"
          />
          {/* rotate(-90) põe o início do arco no topo. */}
          <circle
            cx="52"
            cy="52"
            r={R}
            fill="none"
            stroke="var(--brand-orange)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${((C * PCT) / 100).toFixed(1)} ${C.toFixed(1)}`}
            transform="rotate(-90 52 52)"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="dg-mono text-lg font-semibold text-foreground">{PCT}%</span>
          <span className="max-w-[64px] text-center text-[9px] leading-tight text-muted-foreground">
            Risco de violação de OLA
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 text-[11px] text-muted-foreground">Principais fatores</div>
        <ul className="flex flex-col gap-2">
          {FATORES.map((f) => (
            <li key={f.nome} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[11px] text-foreground/80">{f.nome}</span>
                <span className="dg-mono text-[11px] text-muted-foreground">{f.peso}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-pill bg-[color:var(--surface-hover)]">
                <div
                  className="h-full rounded-pill bg-primary"
                  style={{ width: `${f.peso * 1.6}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Previsto contra realizado, antes e depois da intervenção. */
function VisualImpacto() {
  const GRUPOS = [
    { rotulo: "Antes", previsto: 1240, realizado: 1180 },
    { rotulo: "Depois", previsto: 980, realizado: 310 },
  ];
  const MAX = 1240;
  const fmt = (n: number) => n.toLocaleString("pt-BR");

  return (
    <div className="relative" aria-hidden="true">
      {/* Legenda e indicador na mesma linha, com justify-between. O badge
          posicionado em absolute encostava no rótulo de valor da barra
          "Depois" quando o card estreitava. */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-xs bg-[color:var(--muted-foreground)]" /> Previsto
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-xs bg-primary" /> Realizado
          </span>
        </div>

        {/* O -68% é realizado contra previsto DEPOIS da ação (310 de 980), e
            não antes contra depois — é o volume que a intervenção evitou.
            O alpha sai de color-mix porque --success é hex: o modificador de
            opacidade do Tailwind não resolve cor vinda de variável CSS. */}
        <div
          className="flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5"
          style={{
            borderColor: "color-mix(in srgb, var(--success) 35%, transparent)",
            background: "color-mix(in srgb, var(--success) 10%, transparent)",
          }}
        >
          <ArrowDown className="h-3.5 w-3.5 shrink-0 text-[color:var(--success)]" />
          <span className="leading-tight">
            <span className="dg-mono block text-[13px] font-semibold text-[color:var(--success)]">
              -68%
            </span>
            <span className="block text-[9px] text-muted-foreground">Redução de incidentes</span>
          </span>
        </div>
      </div>

      <div className="flex items-end gap-8 pt-2">
        {GRUPOS.map((g) => (
          <div key={g.rotulo} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-[96px] w-full items-end justify-center gap-2">
              {[
                { v: g.previsto, cor: "var(--muted-foreground)", op: 0.4 },
                { v: g.realizado, cor: "var(--brand-orange)", op: 1 },
              ].map((b, i) => (
                <div key={i} className="flex w-7 flex-col items-center gap-1">
                  <span className="dg-mono text-[10px] text-foreground/70">{fmt(b.v)}</span>
                  <div
                    className="w-full rounded-t-xs"
                    style={{
                      height: `${(b.v / MAX) * 76}px`,
                      background: b.cor,
                      opacity: b.op,
                    }}
                  />
                </div>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">{g.rotulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

interface Etapa {
  icon: LucideIcon;
  title: string;
  description: string;
  visual: ReactNode;
}

const ETAPAS: Etapa[] = [
  {
    icon: Database,
    title: "Conecte os dados",
    description:
      "Centralize os sinais necessários para construir uma visão consistente da operação.",
    visual: <VisualFluxo />,
  },
  {
    icon: BarChart3,
    title: "Antecipe o que vem",
    description:
      "Modelos projetam volume de incidentes em D+1 e D+7 e identificam tendências antes que virem impacto.",
    visual: <VisualPrevisao />,
  },
  {
    icon: ShieldAlert,
    title: "Entenda o risco",
    description:
      "A plataforma calcula o risco de violação de OLA e mostra os fatores que estão contribuindo para ele.",
    visual: <VisualRisco />,
  },
  {
    icon: CheckCircle2,
    title: "Comprove o resultado",
    description:
      "Depois da intervenção, compara previsto e realizado e verifica se a correção produziu efeito.",
    visual: <VisualImpacto />,
  },
];

function StepCard({ icon: Icon, title, description, visual }: Etapa) {
  return (
    <article className="dg-glass dg-bento flex h-full flex-col gap-5 p-6">
      <span
        aria-hidden="true"
        className="grid h-12 w-12 shrink-0 place-content-center rounded-md border border-[color:var(--border-brand)] bg-[color:var(--brand-orange-soft)]"
      >
        <Icon className="h-5 w-5 text-primary" />
      </span>

      <div className="flex flex-col gap-2">
        <h3 className="t-h4 text-foreground">{title}</h3>
        <p className="t-body-sm text-pretty text-muted-foreground">{description}</p>
      </div>

      {/* mt-auto ancora o visual no rodapé, igualando os quatro cards mesmo
          com descrições de alturas diferentes. */}
      <div className="mt-auto pt-2">{visual}</div>
    </article>
  );
}

export function HowItWorksSection() {
  return (
    <div className="dg-shell relative flex flex-col gap-12 pb-24 md:gap-14 md:pb-32">
      <SectionHeader
        title="Como funciona"
        description="Dos sinais operacionais à comprovação do resultado, o Data Galaxy fecha o ciclo inteiro da operação."
      />

      <div className="dg-stagger grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {ETAPAS.map((e) => (
          <StepCard key={e.title} {...e} />
        ))}
      </div>
    </div>
  );
}
