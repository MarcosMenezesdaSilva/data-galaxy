import { useState } from "react";
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
export function VolumeRealVsPrevistoCard({ serie, destaque }: VolumeRealVsPrevistoCardProps) {
  const [tipo, setTipo] = useState<"area" | "barra" | "linha">("area");

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <div className={destaque ? "text-base font-semibold" : "text-sm font-semibold"}>
            Volume real vs previsto (Seasonal Naive)
          </div>
          <div className="text-xs text-muted-foreground">
            Últimos 14 dias · previsto = mesmo dia da semana anterior
          </div>
        </div>
        <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5 shrink-0">
          {TIPOS.map(({ tipo: t, icon: Icon, label }) => (
            <button
              key={t}
              type="button"
              title={label}
              onClick={() => setTipo(t)}
              className={`rounded p-1.5 transition-colors ${
                tipo === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent/60"
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
                <linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--info)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--info)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="data" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="previsto"
                name="Previsto"
                stroke="var(--info)"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="url(#gPrev)"
              />
              <Area
                type="monotone"
                dataKey="real"
                name="Real"
                stroke="var(--brand)"
                strokeWidth={2}
                fill="url(#gReal)"
              />
            </AreaChart>
          ) : tipo === "barra" ? (
            <BarChart data={serie}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="data" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="previsto" name="Previsto" fill="var(--info)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="real" name="Real" fill="var(--brand)" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={serie}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="data" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="previsto"
                name="Previsto"
                stroke="var(--info)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="real"
                name="Real"
                stroke="var(--brand)"
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
