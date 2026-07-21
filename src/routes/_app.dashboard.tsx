import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/Brand";
import { KPICard } from "@/components/KPICard";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrioridadeBadge, OlaBadge } from "@/components/Badges";
import {
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  Bell,
  Wrench,
  CheckCircle2,
  Activity,
  Radio,
  Info,
  XCircle,
} from "lucide-react";
import { useIncidentes, useAlertas, useRiscos, useAcoes, usePrevisoes } from "@/lib/hooks";
import { fmtNumber, fmtDateTime } from "@/lib/format";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  LabelList,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { PRODUTOS, GRUPOS } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Central de Operações — Data Galaxy" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const incidentes = useIncidentes();
  const alertas = useAlertas();
  const riscos = useRiscos();
  const acoes = useAcoes();
  const previsoes = usePrevisoes();
  const [produto, setProduto] = useState<string>("todos");
  const [prio, setPrio] = useState<string>("todas");
  const [grupo, setGrupo] = useState<string>("todos");

  const filtrados = useMemo(
    () =>
      incidentes.filter(
        (i) =>
          (produto === "todos" || i.produto === produto) &&
          (prio === "todas" || i.prioridade === prio) &&
          (grupo === "todos" || i.grupo_designado === grupo),
      ),
    [incidentes, produto, prio, grupo],
  );

  const incidentesPorNumero = useMemo(
    () => new Map(incidentes.map((i) => [i.numero_incidente, i])),
    [incidentes],
  );

  // Âncora temporal: a data mais recente presente na base carregada (em vez
  // do relógio da máquina), já que os dados demonstrativos são concentrados
  // em set-dez/2025 e uma base importada pode ter outra janela temporal.
  const dataAncora = useMemo(() => {
    if (!filtrados.length) return new Date();
    return new Date(Math.max(...filtrados.map((i) => new Date(i.data_abertura).getTime())));
  }, [filtrados]);

  const hoje = dataAncora.toDateString();
  const incHoje = filtrados.filter((i) => new Date(i.data_abertura).toDateString() === hoje).length;
  const prev1 = previsoes
    .filter((p) => p.horizonte === "D+1")
    .reduce((s, p) => s + p.volume_previsto, 0);
  const prev7 = previsoes
    .filter((p) => p.horizonte === "D+7")
    .reduce((s, p) => s + p.volume_previsto, 0);
  const criticos = riscos.filter((r) => r.faixa_risco === "Crítico" && r.status === "Ativo").length;
  const ativos = alertas.filter((a) => a.status === "Novo" || a.status === "Em tratamento").length;
  const emVal = acoes.filter((a) => a.status === "Em validação").length;
  const efetivas = acoes.filter((a) => a.classificacao === "Efetiva").length;
  const paliativas = acoes.filter((a) => a.classificacao === "Paliativa").length;

  // Real vs previsto (últimos 14 dias, ancorados na data mais recente da base).
  // Estimador "Seasonal Naive" (citado no pitch do projeto, junto com AutoETS):
  // a previsão de um dia é o volume real observado no mesmo dia da semana
  // anterior — cálculo 100% determinístico a partir dos incidentes carregados.
  const serieVolumeSeasonalNaive = useMemo(() => {
    const contarPorDia = (dt: Date) => {
      const key = dt.toDateString();
      return filtrados.filter((i) => new Date(i.data_abertura).toDateString() === key).length;
    };
    const dias: { data: string; real: number; previsto: number }[] = [];
    for (let d = 13; d >= 0; d--) {
      const dt = new Date(dataAncora);
      dt.setDate(dt.getDate() - d);
      const semanaAnterior = new Date(dt);
      semanaAnterior.setDate(semanaAnterior.getDate() - 7);
      const real = contarPorDia(dt);
      const previsto = contarPorDia(semanaAnterior);
      dias.push({
        data: dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        real,
        previsto,
      });
    }
    return dias;
  }, [filtrados, dataAncora]);

  // Variação real semana a semana (para o banner de atenção) — comparação
  // entre os 7 dias mais recentes e os 7 dias imediatamente anteriores.
  const variacaoSemanal = useMemo(() => {
    const fimAtual = dataAncora.getTime();
    const inicioAtual = fimAtual - 7 * 86400000;
    const inicioAnterior = inicioAtual - 7 * 86400000;
    const semanaAtual = filtrados.filter((i) => {
      const t = new Date(i.data_abertura).getTime();
      return t > inicioAtual && t <= fimAtual;
    }).length;
    const semanaAnterior = filtrados.filter((i) => {
      const t = new Date(i.data_abertura).getTime();
      return t > inicioAnterior && t <= inicioAtual;
    }).length;
    const pct = semanaAnterior > 0 ? ((semanaAtual - semanaAnterior) / semanaAnterior) * 100 : 0;
    return { semanaAtual, semanaAnterior, pct };
  }, [filtrados, dataAncora]);

  const porGrupo = useMemo(() => {
    const map = new Map<string, number>();
    filtrados.forEach((i) => map.set(i.grupo_designado, (map.get(i.grupo_designado) ?? 0) + 1));
    return Array.from(map, ([grupo, total]) => ({ grupo, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filtrados]);

  const porPrio = useMemo(() => {
    const map: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 };
    filtrados.forEach((i) => {
      map[i.prioridade] = (map[i.prioridade] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtrados]);

  const topProdutos = useMemo(() => {
    const map = new Map<string, number>();
    filtrados.forEach((i) => {
      const p = i.produto ?? "Não informado";
      map.set(p, (map.get(p) ?? 0) + 1);
    });
    return Array.from(map, ([produto, total]) => ({ produto, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [filtrados]);

  const topRiscos = riscos.slice(0, 6);
  const monitorPct = filtrados.length
    ? (filtrados.filter((i) => i.origem_incidente === "Monitoramento").length / filtrados.length) *
      100
    : 0;
  const semInterv = filtrados.filter((i) => i.status_incidente === "Sem Intervenção").length;

  const PIE_COLORS = [
    "var(--critical)",
    "var(--accent-orange)",
    "var(--warning)",
    "var(--info)",
    "var(--muted-foreground)",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Operações"
        subtitle="Visão integrada de incidentes, previsões e riscos operacionais."
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={produto} onValueChange={setProduto}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os produtos</SelectItem>
                {PRODUTOS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={prio} onValueChange={setPrio}>
              <SelectTrigger className="w-full sm:w-[176px] h-9">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas prioridades</SelectItem>
                {["P1", "P2", "P3", "P4", "P5"].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={grupo} onValueChange={setGrupo}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os grupos</SelectItem>
                {GRUPOS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

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

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Incidentes hoje"
          value={fmtNumber(incHoje)}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="brand"
          trend={{ value: 12.4, label: "vs. média" }}
        />
        <KPICard
          label="Previsão D+1"
          value={fmtNumber(prev1)}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="orange"
          hint="Volume esperado"
        />
        <KPICard
          label="Previsão D+7"
          value={fmtNumber(prev7)}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="orange"
          hint="7 dias à frente"
        />
        <KPICard
          label="Riscos críticos de OLA"
          value={fmtNumber(criticos)}
          icon={<ShieldAlert className="h-4 w-4" />}
          accent="critical"
          hint={`${riscos.length} avaliados`}
        />
        <KPICard
          label="Alertas ativos"
          value={fmtNumber(ativos)}
          icon={<Bell className="h-4 w-4" />}
          accent="warning"
          hint={`${alertas.length} totais`}
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

      {/* Chart real vs previsto + donut prioridades */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Volume real vs previsto (Seasonal Naive)</div>
              <div className="text-xs text-muted-foreground">
                Últimos 14 dias · escala diária · previsto = mesmo dia da semana anterior
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={serieVolumeSeasonalNaive}>
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

      {/* Grupos + Top produtos */}
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
          <div className="text-sm font-semibold mb-3">Produtos com maior recorrência</div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={topProdutos}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="produto"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" fill="var(--accent-orange)" radius={[6, 6, 0, 0]}>
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
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="text-sm font-semibold mb-3">Top riscos ativos de OLA</div>
          <div className="space-y-2">
            {topRiscos.map((r) => {
              const incidenteRel = incidentesPorNumero.get(r.numero_incidente);
              return (
                <div
                  key={r.id_risco}
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-accent/40 transition-colors"
                >
                  <div className="text-xs font-mono text-muted-foreground w-24 truncate">
                    {r.numero_incidente}
                  </div>
                  <PrioridadeBadge p={r.prioridade} />
                  {incidenteRel && <OlaBadge dentro={incidenteRel.dentro_ola} />}
                  <div className="text-xs flex-1 min-w-0 truncate">
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
        </Card>

        <Card className="p-4 space-y-4">
          <div>
            <div className="text-sm font-semibold mb-3">Origem das aberturas</div>
            <div className="flex items-center gap-3">
              <Radio className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{monitorPct.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Monitoramento automático</div>
              </div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${monitorPct}%` }} />
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="text-sm font-semibold mb-2">Sem intervenção</div>
            <div className="flex items-center gap-3">
              <Info className="h-6 w-6 text-[color:var(--warning)]" />
              <div>
                <div className="text-xl font-bold">{fmtNumber(semInterv)}</div>
                <div className="text-xs text-muted-foreground">incidentes no filtro atual</div>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="text-xs text-muted-foreground">Última atualização</div>
            <div className="text-sm">{fmtDateTime(new Date().toISOString())}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
