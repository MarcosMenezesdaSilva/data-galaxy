import { Link } from "@tanstack/react-router";
import { KPICard } from "@/components/KPICard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrioridadeBadge, OlaBadge, SeveridadeBadge } from "@/components/Badges";
import { EmptyState } from "@/components/EmptyState";
import { VolumeRealVsPrevistoCard } from "@/components/VolumeRealVsPrevistoCard";
import {
  AlertTriangle,
  Bell,
  Wrench,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldOff,
} from "lucide-react";
import { fmtNumber, fmtDateTime, fmtTempoRestanteSla } from "@/lib/format";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import { axisProps, chartColors, gridProps, labelListProps, tooltipProps } from "@/lib/chart-theme";
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
    <div className="space-y-8">
      {/* KPIs operacionais */}
      <div className="dg-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Em destaque: real vs previsto — é o gráfico mais visual da tela,
          sobe pro topo (logo depois dos KPIs) em vez de ficar escondido lá
          embaixo, num tamanho maior. */}
      <VolumeRealVsPrevistoCard serie={serieVolumeSeasonalNaive} destaque />

      {/* Elemento central: fila de ação */}
      <Card lit className="p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <div className="t-h4">Top riscos ativos de OLA</div>
            <div className="mt-1 text-xs text-muted-foreground">
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
              const sla = fmtTempoRestanteSla(r.tempo_restante_minutos);
              return (
                <div
                  key={r.id_risco}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-02)] px-3 py-2.5 transition-colors duration-[var(--motion-fast)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]"
                >
                  <div className="dg-mono w-24 truncate text-xs text-muted-foreground">
                    {r.numero_incidente}
                  </div>
                  <PrioridadeBadge p={r.prioridade} />
                  {incidenteRel && <OlaBadge dentro={incidenteRel.dentro_ola} />}
                  <div className="text-xs flex-1 min-w-[140px] truncate">
                    {r.produto} · {r.grupo}
                  </div>
                  <div
                    className="text-xs whitespace-nowrap"
                    style={{ color: sla.estourado ? "var(--critical)" : "var(--muted-foreground)" }}
                  >
                    {sla.texto}
                  </div>
                  <div
                    className="dg-mono w-16 text-right text-sm font-medium"
                    style={{
                      color:
                        r.probabilidade_violacao >= 80
                          ? "var(--critical)"
                          : r.probabilidade_violacao >= 60
                            ? "var(--brand-orange)"
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
      <Card lit className="p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="t-h4">Alertas não reconhecidos</div>
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
                className="flex flex-wrap items-center gap-2 rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-02)] px-3 py-2.5"
              >
                <SeveridadeBadge s={a.severidade} />
                <div className="min-w-[160px] flex-1 truncate text-sm">{a.titulo}</div>
                <div className="text-xs text-muted-foreground">{a.produto}</div>
                <div className="dg-mono text-[11px] text-muted-foreground">
                  {fmtDateTime(a.data_criacao)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Incidentes por grupo */}
      <Card lit className="p-6">
        <div className="t-h4 mb-6">Incidentes por grupo responsável</div>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={porGrupo} layout="vertical" margin={{ left: 20, right: 48 }}>
              <CartesianGrid {...gridProps} horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="grupo" {...axisProps} width={110} />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="total" fill={chartColors.destaque} radius={[0, 6, 6, 0]}>
                <LabelList dataKey="total" position="right" {...labelListProps} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
