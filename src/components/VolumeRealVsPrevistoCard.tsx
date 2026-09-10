import { useId, useState } from "react";
import { Card } from "@/components/ui/card";
import { AreaChart as AreaChartIcon, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import { axisProps, chartColors, gridProps, legendProps, tooltipProps } from "@/lib/chart-theme";

export interface VolumeRealVsPrevistoCardProps {
  serie: { data: string; real: number; previsto: number }[];
  /** Deixa o card em destaque: mais alto e com título maior. */
  destaque?: boolean;
}

const TIPOS = [
  { tipo: "area" as const, icon: AreaChartIcon, label: "Área" },
  { tipo: "barra" as const, icon: BarChart3, label: "Barras" },
  { tipo: "linha" as const, icon: LineChartIcon, label: "Linha" },
];

// Alterna a visualização do mesmo dado (área / barras / linhas) — inspirado
// no recurso "magicType" dos exemplos do Apache ECharts, sem precisar trocar
// de biblioteca de gráficos. Extraído como componente porque a mesma
// comparação real-vs-previsto faz sentido tanto na visão operacional quanto
// na executiva.
//
// Cor segue o DS: o REAL é o dado vivo e leva o laranja da marca; o PREVISTO é
// contexto e fica neutro, diferenciado por traço tracejado em vez de por uma
// cor nova. Duas séries, uma só matiz — sem arco-íris.
export function VolumeRealVsPrevistoCard({ serie, destaque }: VolumeRealVsPrevistoCardProps) {
  const [tipo, setTipo] = useState<"area" | "barra" | "linha">("area");
  const uid = useId().replace(/:/g, "");
  const gReal = `gReal-${uid}`;
  const gPrev = `gPrev-${uid}`;

  return (
    <Card lit className="p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className={destaque ? "t-h4" : "t-body-sm font-medium"}>
            Volume real vs previsto (Seasonal Naive)
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Últimos 14 dias · previsto = mesmo dia da semana anterior
          </div>
        </div>
        {/* Segmented control em pill, coerente com a linguagem de rótulo do DS */}
        <div className="flex shrink-0 items-center gap-0.5 rounded-pill border border-[color:var(--border-default)] bg-[color:var(--surface-02)] p-1">
          {TIPOS.map(({ tipo: t, icon: Icon, label }) => (
            <button
              key={t}
              type="button"
              title={label}
              aria-pressed={tipo === t}
              onClick={() => setTipo(t)}
              className={`rounded-pill p-2 transition-colors duration-[var(--motion-fast)] ${
                tipo === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-[color:var(--surface-hover)] hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>
      <div className={destaque ? "h-96" : "h-72"}>
        <ResponsiveContainer>
          {tipo === "area" ? (
            <AreaChart data={serie}>
              <defs>
                <linearGradient id={gReal} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors.destaque} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={chartColors.destaque} stopOpacity={0} />
                </linearGradient>
                <linearGradient id={gPrev} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors.neutro} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={chartColors.neutro} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} vertical={false} />
              <XAxis dataKey="data" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Legend {...legendProps} />
              <Area
                type="monotone"
                dataKey="previsto"
                name="Previsto"
                stroke={chartColors.neutro}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill={`url(#${gPrev})`}
              />
              <Area
                type="monotone"
                dataKey="real"
                name="Real"
                stroke={chartColors.destaque}
                strokeWidth={2}
                fill={`url(#${gReal})`}
              />
            </AreaChart>
          ) : tipo === "barra" ? (
            <BarChart data={serie}>
              <CartesianGrid {...gridProps} vertical={false} />
              <XAxis dataKey="data" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Legend {...legendProps} />
              <Bar
                dataKey="previsto"
                name="Previsto"
                fill={chartColors.neutroRecuado}
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="real" name="Real" fill={chartColors.destaque} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={serie}>
              <CartesianGrid {...gridProps} vertical={false} />
              <XAxis dataKey="data" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Legend {...legendProps} />
              <Line
                type="monotone"
                dataKey="previsto"
                name="Previsto"
                stroke={chartColors.neutro}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="real"
                name="Real"
                stroke={chartColors.destaque}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
