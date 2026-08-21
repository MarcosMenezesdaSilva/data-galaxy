import { Link } from "@tanstack/react-router";
import { KPICard } from "@/components/KPICard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrioridadeBadge, OlaBadge, SeveridadeBadge } from "@/components/Badges";
import { EmptyState } from "@/components/EmptyState";
import {
  AlertTriangle,
  Bell,
  Wrench,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldOff,
} from "lucide-react";
import { fmtNumber, fmtDateTime } from "@/lib/format";
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
  LabelList,
} from "recharts";
import type { Incidente, RiscoOla, Alerta } from "@/lib/types";

export interface DashboardOperacionalProps {
  incHoje: number;
  ativos: number;
  totalAlertas: number;
  emVal: number;
  efetivas: number;
  paliativas: number;
  criticos: number;
  totalRiscos: number;
  topRiscos: RiscoOla[];
  incidentesPorNumero: Map<string, Incidente>;
  alertasNaoReconhecidos: Alerta[];
  porGrupo: { grupo: string; total: number }[];
  serieVolumeSeasonalNaive: { data: string; real: number; previsto: number }[];
}

export function DashboardOperacional({
  incHoje,
  ativos,
  totalAlertas,
  emVal,
  efetivas,
  paliativas,
  criticos,
  totalRiscos,
  topRiscos,
  incidentesPorNumero,
  alertasNaoReconhecidos,
  porGrupo,
  serieVolumeSeasonalNaive,
}: DashboardOperacionalProps) {
  return (
    <div className="space-y-6">
      {/* KPIs operacionais */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="Incidentes hoje"
          value={fmtNumber(incHoje)}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="brand"
        />
        <KPICard
          label="Alertas ativos"
          value={fmtNumber(ativos)}
          icon={<Bell className="h-4 w-4" />}
          accent="warning"
          hint={`${totalAlertas} totais`}
        />
        <KPICard
          label="Riscos críticos de OLA"
          value={fmtNumber(criticos)}
          icon={<ShieldAlert className="h-4 w-4" />}
          accent="critical"
          hint={`${totalRiscos} avaliados`}
        />
        <KPICard
          label="Correções em validação"
          value={fmtNumber(emVal)}
          icon={<Wrench className="h-4 w-4" />}
          accent="info"
        />
        <KPICard
          label="Correções efetivas"
          value={fmtNumber(efetivas)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="success"
        />
        <KPICard
          label="Correções paliativas"
          value={fmtNumber(paliativas)}
          icon={<XCircle className="h-4 w-4" />}
          accent="warning"
        />
      </div>

      {/* Elemento central: fila de ação */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold">Top riscos ativos de OLA</div>
            <div className="text-xs text-muted-foreground">
              Ordenado pelo maior risco de violação · fila de ação prioritária
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/riscos-ola">Ver todos</Link>
          </Button>
        </div>
        {topRiscos.length === 0 ? (
          <EmptyState
            icon={<ShieldOff className="h-8 w-8" />}
            title="Nenhum risco de OLA calculado"
            description="Os riscos aparecem aqui a partir dos incidentes ativos carregados na base atual."
          />
        ) : (
          <div className="max-h-[420px] overflow-y-auto space-y-2">
            {topRiscos.map((r) => {
              const incidenteRel = incidentesPorNumero.get(r.numero_incidente);
              return (
                <div
                  key={r.id_risco}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-accent/40 transition-colors"
                >
                  <div className="text-xs font-mono text-muted-foreground w-24 truncate">
                    {r.numero_incidente}
                  </div>
                  <PrioridadeBadge p={r.prioridade} />
                  {incidenteRel && <OlaBadge dentro={incidenteRel.dentro_ola} />}
                  <div className="text-xs flex-1 min-w-[140px] truncate">
                    {r.produto} · {r.grupo}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.tempo_restante_minutos} min
                  </div>
                  <div
                    className="w-16 text-right text-sm font-semibold"
                    style={{
                      color:
                        r.probabilidade_violacao >= 80
                          ? "var(--critical)"
                          : r.probabilidade_violacao >= 60
                            ? "var(--accent-orange)"
                            : "var(--warning)",
                    }}
                  >
                    {r.probabilidade_violacao}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Alertas não reconhecidos */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Alertas não reconhecidos</div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/alertas">Ver todos</Link>
          </Button>
        </div>
        {alertasNaoReconhecidos.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Nenhum alerta novo pendente de reconhecimento.
          </div>
        ) : (
          <div className="space-y-1.5">
            {alertasNaoReconhecidos.map((a) => (
              <div
                key={a.id_alerta}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2"
              >
                <SeveridadeBadge s={a.severidade} />
                <div className="text-sm flex-1 min-w-[160px] truncate">{a.titulo}</div>
                <div className="text-xs text-muted-foreground">{a.produto}</div>
                <div className="text-[11px] text-muted-foreground">
                  {fmtDateTime(a.data_criacao)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Charts operacionais */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm font-semibold mb-3">Incidentes por grupo responsável</div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={porGrupo} layout="vertical" margin={{ left: 20, right: 32 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="grupo"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" fill="var(--brand)" radius={[0, 6, 6, 0]}>
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
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold mb-3">Volume real vs previsto (Seasonal Naive)</div>
          <div className="text-xs text-muted-foreground mb-1">
            Últimos 14 dias · previsto = mesmo dia da semana anterior
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={serieVolumeSeasonalNaive}>
                <defs>
                  <linearGradient id="gRealOp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPrevOp" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#gPrevOp)"
                />
                <Area
                  type="monotone"
                  dataKey="real"
                  name="Real"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  fill="url(#gRealOp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
