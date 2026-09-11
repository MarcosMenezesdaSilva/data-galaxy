import { KPICard } from "@/components/KPICard";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ShieldAlert, CheckCircle2, Activity, Gauge } from "lucide-react";
import { fmtNumber, pct } from "@/lib/format";
import { VolumeRealVsPrevistoCard } from "@/components/VolumeRealVsPrevistoCard";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  PieChart,
  Pie,
  Cell,
  Brush,
  Legend,
} from "recharts";
import {
  axisProps,
  brushProps,
  chartColors,
  gridProps,
  labelListProps,
  legendProps,
  prioridadeColors,
  tooltipProps,
} from "@/lib/chart-theme";

export interface DashboardExecutivoProps {
  /** Volume total previsto para D+1, somado entre produtos/categorias (previsões demonstrativas). */
  prev1: number;
  /** Volume total previsto para D+7. */
  prev7: number;
  /** % de incidentes elegíveis a KPI que ficaram dentro do OLA — null se não há elegíveis no filtro. */
  cumprimentoOla: number | null;
  /** Variação % do volume do mês corrente vs. o mês anterior — null se não há dois meses com dados. */
  tendenciaMensalPct: number | null;
  /** % de ações com classificação definida que foram "Efetiva" — null se não há ações classificadas. */
  efetividadeCorrecoes: number | null;
  criticos: number;
  totalRiscos: number;
  variacaoSemanal: { semanaAtual: number; semanaAnterior: number; pct: number };
  serieMensal: { mes: string; total: number }[];
  gruposRisco: { grupo: string; total: number }[];
  porPrio: { name: string; value: number }[];
  serieVolumeSeasonalNaive: { data: string; real: number; previsto: number }[];
}

export function DashboardExecutivo({
  prev1,
  prev7,
  cumprimentoOla,
  tendenciaMensalPct,
  efetividadeCorrecoes,
  criticos,
  totalRiscos,
  variacaoSemanal,
  serieMensal,
  gruposRisco,
  porPrio,
  serieVolumeSeasonalNaive,
}: DashboardExecutivoProps) {
  return (
    <div className="space-y-8">
      {/* Banner de atenção — calculado a partir dos incidentes carregados (sem valores fictícios) */}
      <Card
        lit={variacaoSemanal.pct <= 15}
        className={`dg-enter p-6 ${variacaoSemanal.pct > 15 ? "border-[color:var(--critical)]/40 bg-[color:var(--critical)]/5" : ""}`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`mt-0.5 rounded-pill p-2 ${variacaoSemanal.pct > 15 ? "bg-[color:var(--critical)]/15" : "bg-[color:var(--brand-orange-soft)]"}`}
          >
            <Activity
              className={`h-4 w-4 ${variacaoSemanal.pct > 15 ? "text-[color:var(--critical)]" : "text-primary"}`}
            />
          </div>
          <div className="flex-1">
            <div className="t-body-sm font-medium text-foreground">
              {variacaoSemanal.pct > 15
                ? `Atenção: volume de incidentes subiu ${variacaoSemanal.pct.toFixed(0)}% na última semana em relação à anterior.`
                : variacaoSemanal.pct < -15
                  ? `Volume de incidentes caiu ${Math.abs(variacaoSemanal.pct).toFixed(0)}% na última semana em relação à anterior.`
                  : "Volume de incidentes estável — sem variação relevante na última semana."}
            </div>
            <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              <span className="dg-mono">{fmtNumber(variacaoSemanal.semanaAtual)}</span> incidentes
              nos últimos 7 dias vs.{" "}
              <span className="dg-mono">{fmtNumber(variacaoSemanal.semanaAnterior)}</span> na semana
              anterior · cálculo direto sobre a base carregada (filtro atual).
            </div>
          </div>
        </div>
      </Card>

      {/* KPIs de negócio — previsão D+1/D+7 primeiro: é a capacidade de
          antecipação exigida pelo edital do desafio. */}
      <div className="dg-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="Previsão D+1"
          value={fmtNumber(prev1)}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="orange"
          hint="Volume esperado amanhã"
        />
        <KPICard
          label="Previsão D+7"
          value={fmtNumber(prev7)}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="orange"
          hint="Volume esperado em 7 dias"
        />
        <KPICard
          label="Cumprimento de OLA"
          value={cumprimentoOla == null ? "—" : pct(cumprimentoOla)}
          icon={<Gauge className="h-4 w-4" />}
          accent="brand"
          hint="Elegíveis a KPI no filtro atual"
        />
        <KPICard
          label="Tendência mensal"
          value={tendenciaMensalPct == null ? "—" : pct(Math.abs(tendenciaMensalPct))}
          icon={
            tendenciaMensalPct != null && tendenciaMensalPct < 0 ? (
              <TrendingDown className="h-4 w-4" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )
          }
          accent={tendenciaMensalPct != null && tendenciaMensalPct < 0 ? "success" : "orange"}
          hint="Mês corrente vs. mês anterior"
        />
        <KPICard
          label="Efetividade das correções"
          value={efetividadeCorrecoes == null ? "—" : pct(efetividadeCorrecoes)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="success"
          hint="Ações classificadas como Efetiva"
        />
        <KPICard
          label="Riscos críticos ativos"
          value={fmtNumber(criticos)}
          icon={<ShieldAlert className="h-4 w-4" />}
          accent="critical"
          hint={`${totalRiscos} avaliados`}
        />
      </div>

      {/* Tendência de 6 meses + prioridades */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card lit className="p-6 lg:col-span-2">
          <div className="t-h4 mb-1.5">Tendência de incidentes (período completo)</div>
          <div className="mb-6 text-xs text-muted-foreground">
            {serieMensal.length} meses · arraste as alças abaixo do gráfico pra navegar no tempo
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={serieMensal} margin={{ top: 24 }}>
                <CartesianGrid {...gridProps} vertical={false} />
                <XAxis dataKey="mes" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipProps} />
                <Bar dataKey="total" fill={chartColors.destaque} radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="total" position="top" {...labelListProps} />
                </Bar>
                {serieMensal.length > 6 && (
                  <Brush
                    dataKey="mes"
                    {...brushProps}
                    startIndex={Math.max(0, serieMensal.length - 6)}
                    endIndex={serieMensal.length - 1}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card lit className="p-6">
          <div className="t-h4 mb-6">Prioridades</div>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={porPrio}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  // Só rotula direto na fatia quando ela é grande o bastante
                  // pra não colidir com a vizinha (ex.: P1/P5 quase
                  // invisíveis no total) — fatias pequenas continuam
                  // explicadas pela legenda e pelo tooltip ao passar o mouse.
                  label={({
                    name,
                    value,
                    percent,
                  }: {
                    name?: string;
                    value?: number;
                    percent?: number;
                  }) =>
                    (percent ?? 0) >= 0.05
                      ? `${name}: ${value} (${((percent ?? 0) * 100).toFixed(1)}%)`
                      : ""
                  }
                  labelLine={false}
                >
                  {porPrio.map((p) => (
                    <Cell key={p.name} fill={prioridadeColors[p.name] ?? chartColors.neutro} />
                  ))}
                </Pie>
                <Legend {...legendProps} />
                <Tooltip {...tooltipProps} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Em destaque: real vs previsto — mesmo gráfico interativo (área /
          barras / linha) já usado na visão operacional. */}
      <VolumeRealVsPrevistoCard serie={serieVolumeSeasonalNaive} />

      {/* Grupos com maior risco acumulado */}
      <Card lit className="p-6">
        <div className="t-h4 mb-1.5">Grupos com maior risco acumulado</div>
        <div className="mb-6 text-xs text-muted-foreground">
          Soma da probabilidade de violação (%) dos riscos ativos de cada grupo
        </div>
        {gruposRisco.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhum risco ativo no momento.
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={gruposRisco} layout="vertical" margin={{ left: 20, right: 48 }}>
                <CartesianGrid {...gridProps} horizontal={false} />
                <XAxis type="number" {...axisProps} />
                <YAxis type="category" dataKey="grupo" {...axisProps} width={130} />
                <Tooltip {...tooltipProps} />
                <Bar dataKey="total" fill={chartColors.destaque} radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="total" position="right" {...labelListProps} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
