import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Gauge, LayoutDashboard, Layers, Sparkles, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";

/* ---------------------------------------------------------------------------
   Visuais dos cards

   Cada capacidade ganha um tratamento próprio — série temporal, barras de
   probabilidade, agrupamento, prévia de UI e conversa. São SVG e divs à mão,
   de propósito: Recharts aqui custaria JS de cliente antes do LCP para
   desenhar o que nesta página é ilustração, não dado ao vivo.

   Os nomes de produto e grupo vêm do vocabulário real do sistema
   (demo-data.ts), então a prévia fala a mesma língua do produto.
--------------------------------------------------------------------------- */

/** Série com o realizado cheio e o horizonte previsto tracejado. */
function VisualPrevisao() {
  const uid = useId().replace(/:/g, "");
  const fillId = `dg-cap-fill-${uid}`;

  return (
    <svg viewBox="0 0 240 84" aria-hidden="true" className="h-auto w-full">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Intervalo de confiança, só sobre o trecho previsto. */}
      <path
        d="M120 40 L144 28 L168 32 L192 18 L216 20 L240 10 L240 40 L216 48 L192 42 L168 52 L144 44 Z"
        fill="var(--brand-orange)"
        opacity="0.1"
      />
      <path d="M0 60 L24 54 L48 62 L72 46 L96 52 L120 40 L120 84 L0 84 Z" fill={`url(#${fillId})`} />
      <path
        d="M0 60 L24 54 L48 62 L72 46 L96 52 L120 40"
        fill="none"
        stroke="var(--brand-orange)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M120 40 L144 36 L168 42 L192 30 L216 34 L240 24"
        fill="none"
        stroke="var(--brand-orange)"
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
        opacity="0.75"
      />
      {/* O ponto de corte entre o que aconteceu e o que é previsão. */}
      <circle cx="120" cy="40" r="3.5" fill="var(--brand-orange)" />
    </svg>
  );
}

/** Fila de risco: probabilidade como barra, do mais urgente ao menos. */
function VisualRisco() {
  const FILA: { produto: string; p: number }[] = [
    { produto: "Cloud", p: 84 },
    { produto: "E-mail Corporativo", p: 61 },
    { produto: "Hosting", p: 38 },
  ];

  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      {FILA.map((r) => (
        <div key={r.produto} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="t-micro truncate text-muted-foreground">{r.produto}</span>
            <span className="dg-mono t-micro text-foreground">{r.p}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-pill bg-[color:var(--surface-hover)]">
            <div
              className="h-full rounded-pill"
              style={{
                width: `${r.p}%`,
                // Só a faixa alta acende. Laranja cheio em risco médio
                // treinaria o olho a ignorar o laranja.
                background: r.p >= 70 ? "var(--brand-orange)" : "var(--muted-foreground)",
                opacity: r.p >= 70 ? 1 : 0.45,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Recorrências agrupadas: um cluster em destaque, dois em repouso. */
function VisualCluster() {
  const CLUSTERS: { cx: number; cy: number; pontos: [number, number][]; forte: boolean }[] = [
    {
      cx: 40,
      cy: 34,
      pontos: [
        [0, 0],
        [11, -7],
        [-9, 6],
        [6, 9],
        [-12, -8],
        [14, 5],
      ],
      forte: true,
    },
    {
      cx: 122,
      cy: 52,
      pontos: [
        [0, 0],
        [-10, -6],
        [9, 7],
        [12, -5],
      ],
      forte: false,
    },
    {
      cx: 196,
      cy: 28,
      pontos: [
        [0, 0],
        [8, 8],
        [-11, 5],
        [5, -9],
        [-6, -7],
      ],
      forte: false,
    },
  ];

  return (
    <svg viewBox="0 0 240 84" aria-hidden="true" className="h-auto w-full">
      {CLUSTERS.map((c) => (
        <g key={`${c.cx}-${c.cy}`}>
          <circle
            cx={c.cx}
            cy={c.cy}
            r="26"
            fill="none"
            stroke={c.forte ? "var(--border-brand)" : "var(--border-strong)"}
            strokeDasharray="3 5"
          />
          {c.pontos.map(([dx, dy]) => (
            <circle
              key={`${dx}-${dy}`}
              cx={c.cx + dx}
              cy={c.cy + dy}
              r="3"
              fill={c.forte ? "var(--brand-orange)" : "var(--muted-foreground)"}
              opacity={c.forte ? 0.95 : 0.5}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** Prévia da Central de Operações: KPIs do dia e volume por grupo. */
function VisualDashboard() {
  const KPIS: { label: string; valor: string; destaque?: boolean }[] = [
    { label: "Abertos hoje", valor: "318" },
    { label: "OLA cumprido", valor: "94,2%" },
    { label: "Riscos altos", valor: "12", destaque: true },
  ];
  const BARRAS = [62, 88, 45, 71, 34, 56];

  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2.5">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-sm border border-[color:var(--border-subtle)] bg-[color:var(--surface-02)] p-3"
          >
            <div className="t-micro truncate text-muted-foreground">{k.label}</div>
            <div
              className={cn(
                "dg-mono mt-1.5 text-lg",
                k.destaque ? "text-primary" : "text-foreground",
              )}
            >
              {k.valor}
            </div>
          </div>
        ))}
      </div>

      <div className="flex h-16 items-end gap-2">
        {BARRAS.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-xs"
            style={{
              height: `${h}%`,
              background: i === 1 ? "var(--brand-orange)" : "var(--muted-foreground)",
              opacity: i === 1 ? 1 : 0.28,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Prévia do Assistente: pergunta do operador, resposta ancorada nos dados. */
function VisualAssistente() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <div className="self-end rounded-lg rounded-br-xs border border-[color:var(--border-subtle)] bg-[color:var(--surface-03)] px-4 py-2.5">
        <span className="t-body-sm text-foreground">Qual grupo puxou o pico de ontem?</span>
      </div>

      <div className="flex items-start gap-2.5 self-start rounded-lg rounded-bl-xs border border-[color:var(--border-brand)] bg-[color:var(--brand-orange-soft)] px-4 py-2.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span className="t-body-sm text-pretty text-foreground">
          Infraestrutura, com 41 dos 96 incidentes — concentrados em Cloud.
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

interface Capacidade {
  icon: LucideIcon;
  title: string;
  description: string;
  visual: ReactNode;
  /** "stack" põe o visual abaixo do texto; "split" lado a lado. */
  layout: "stack" | "split";
  /** Colunas ocupadas no grid de 6 do desktop. */
  span: string;
}

const CAPACIDADES: Capacidade[] = [
  {
    icon: TrendingUp,
    title: "Previsão de volume",
    description:
      "Horizontes D+1 e D+7 por produto, com intervalo de confiança e comparação entre AutoETS e Seasonal Naive.",
    visual: <VisualPrevisao />,
    layout: "stack",
    span: "md:col-span-2",
  },
  {
    icon: Gauge,
    title: "Risco de OLA",
    description:
      "Fila ordenada por probabilidade de violação, com os fatores de cada risco e ação direta: notificar, abrir alerta ou registrar ação preventiva.",
    visual: <VisualRisco />,
    layout: "stack",
    span: "md:col-span-2",
  },
  {
    icon: Layers,
    title: "Problemas e recorrências",
    description:
      "Agrupa incidentes que repetem o mesmo padrão para expor a causa raiz por trás da recorrência.",
    visual: <VisualCluster />,
    layout: "stack",
    span: "md:col-span-2",
  },
  {
    icon: LayoutDashboard,
    title: "Central de Operações",
    description:
      "KPIs do dia, previsão, cumprimento de OLA, tendência mensal e a fila de riscos mais urgentes em uma leitura só.",
    visual: <VisualDashboard />,
    layout: "split",
    span: "md:col-span-3",
  },
  {
    icon: Sparkles,
    title: "Assistente sobre os seus dados",
    description:
      "Pergunte em português sobre incidentes, riscos e previsões. A resposta sai da base carregada, com a Base de Conhecimento como contexto.",
    visual: <VisualAssistente />,
    layout: "split",
    span: "md:col-span-3",
  },
];

function CapabilityCard({ icon: Icon, title, description, visual, layout, span }: Capacidade) {
  const split = layout === "split";

  return (
    <article className={cn("dg-glass dg-bento flex flex-col gap-6 p-7", span)}>
      <div className={cn(split && "flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-7")}>
        <div className={cn("flex flex-col gap-3", split && "lg:flex-1")}>
          <span className="inline-flex items-center gap-2.5">
            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <h3 className="t-h4 text-foreground">{title}</h3>
          </span>
          <p className="t-body-sm text-pretty text-muted-foreground">{description}</p>
        </div>

        {split && <div className="lg:w-[46%] lg:shrink-0">{visual}</div>}
      </div>

      {/* mt-auto ancora o visual no rodapé do card, igualando os três da
          primeira linha mesmo com descrições de alturas diferentes. */}
      {!split && <div className="mt-auto">{visual}</div>}
    </article>
  );
}

export function CapabilitiesSection() {
  return (
    <section
      id="what-we-provide"
      className="scroll-mt-24 border-t border-[color:var(--border-subtle)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-24 md:px-10 md:py-32">
        <SectionHeader
          eyebrow="Capabilities"
          title="What we provide"
          description="Cinco capacidades que cobrem o ciclo da operação, da antecipação do volume até a prova de que a correção funcionou."
        />

        <div className="dg-stagger grid gap-5 md:grid-cols-6">
          {CAPACIDADES.map((c) => (
            <CapabilityCard key={c.title} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}
