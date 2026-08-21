import { KPICard } from "@/components/KPICard";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ShieldAlert, CheckCircle2, Activity, Gauge } from "lucide-react";
import { fmtNumber, pct } from "@/lib/format";
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
  Legend,
} from "recharts";

export interface DashboardExecutivoProps {
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
}

const PIE_COLORS = [
  "var(--critical)",
  "var(--accent-orange)",
  "var(--warning)",
  "var(--info)",
  "var(--muted-foreground)",
];

export function DashboardExecutivo({
  cumprimentoOla,
  tendenciaMensalPct,
  efetividadeCorrecoes,
  criticos,
  totalRiscos,
  variacaoSemanal,
  serieMensal,
  gruposRisco,
  porPrio,
}: DashboardExecutivoProps) {
  return (
    <div className="space-y-6">
      {/* Banner de atenção — calculado a partir dos incidentes carregados (sem valores fictícios) */}
      <Card
        className={`p-4 ${variacaoSemanal.pct > 15 ? "border-[color:var(--critical)]/40 bg-[color:var(--critical)]/5" : "border-border"}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 rounded-full p-2 ${variacaoSemanal.pct > 15 ? "bg-[color:var(--critical)]/15" : "bg-primary/10"}`}
          >
            <Activity
              className={`h-4 w-4 ${variacaoSemanal.pct > 15 ? "text-[color:var(--critical)]" : "text-primary"}`}
            />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">
              {variacaoSemanal.pct > 15
                ? `Atenção: volume de incidentes subiu ${variacaoSemanal.pct.toFixed(0)}% na última semana em relação à anterior.`
                : variacaoSemanal.pct < -15
                  ? `Volume de incidentes caiu ${Math.abs(variacaoSemanal.pct).toFixed(0)}% na última semana em relação à anterior.`
                  : "Volume de incidentes estável — sem variação relevante na última semana."}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {fmtNumber(variacaoSemanal.semanaAtual)} incidentes nos últimos 7 dias vs.{" "}
              {fmtNumber(variacaoSemanal.semanaAnterior)} na semana anterior · cálculo direto sobre
              a base carregada (filtro atual).
            </div>
          </div>
        </div>
      </Card>

      {/* KPIs de negócio */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="text-sm font-semibold mb-3">
            Tendência de incidentes (últimos 6 meses)
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={serieMensal}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" fill="var(--brand)" radius={[6, 6, 0, 0]}>
                  <LabelList
                    dataKey="total"
                    position="top"
                    fontSize={11}
                    fill="var(--foreground)"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold mb-3">Prioridades</div>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={porPrio}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {porPrio.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Grupos com maior risco acumulado */}
      <Card className="p-4">
        <div className="text-sm font-semibold mb-1">Grupos com maior risco acumulado</div>
        <div className="text-xs text-muted-foreground mb-3">
          Soma da probabilidade de violação (%) dos riscos ativos de cada grupo
        </div>
        {gruposRisco.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhum risco ativo no momento.
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={gruposRisco} layout="vertical" margin={{ left: 20, right: 32 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="grupo"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" fill="var(--accent-orange)" radius={[0, 6, 6, 0]}>
                  <LabelList
                    dataKey="total"
                    position="right"
                    fontSize={11}
                    fill="var(--foreground)"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
