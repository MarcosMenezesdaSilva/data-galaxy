import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIncidentes, useAcoes, useAlertas } from "@/lib/hooks";
import { fmtNumber, pct } from "@/lib/format";
import { Download, Printer } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Brush,
} from "recharts";
import {
  axisProps,
  brushProps,
  chartCategorical,
  chartColors,
  gridProps,
  labelListProps,
  legendProps,
  tooltipProps,
} from "@/lib/chart-theme";
import Papa from "papaparse";

export const Route = createFileRoute("/_app/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Data Galaxy" }] }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const incidentes = useIncidentes();
  const acoes = useAcoes();
  const alertas = useAlertas();

  // A base real tem muitos códigos de produto distintos — sem limitar, o
  // gráfico vertical vira uma pilha de barras minúsculas e ilegíveis. Mostra
  // só os 10 maiores e soma o resto em "Outros" (mesmo padrão do "Grupos com
  // maior risco acumulado" no Dashboard).
  const porProduto = useMemo(() => {
    const m = new Map<string, number>();
    incidentes.forEach((i) => {
      const p = i.produto ?? "Não informado";
      m.set(p, (m.get(p) ?? 0) + 1);
    });
    const ordenado = Array.from(m, ([produto, total]) => ({ produto, total })).sort(
      (a, b) => b.total - a.total,
    );
    const top = ordenado.slice(0, 10);
    const resto = ordenado.slice(10).reduce((s, p) => s + p.total, 0);
    return resto > 0 ? [...top, { produto: "Outros", total: resto }] : top;
  }, [incidentes]);

  const porPrio = useMemo(() => {
    const m: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 };
    incidentes.forEach((i) => {
      m[i.prioridade]++;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [incidentes]);

  const porMes = useMemo(() => {
    const m = new Map<string, number>();
    incidentes.forEach((i) => {
      const d = new Date(i.data_abertura);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return Array.from(m, ([mes, total]) => ({ mes, total })).sort((a, b) =>
      a.mes.localeCompare(b.mes),
    );
  }, [incidentes]);

  const violacoes = incidentes.filter((i) => !i.dentro_ola).length;
  const efetivas = acoes.filter((a) => a.classificacao === "Efetiva").length;
  const paliativas = acoes.filter((a) => a.classificacao === "Paliativa").length;
  const tempoRec =
    alertas
      .filter((a) => a.data_reconhecimento)
      .reduce(
        (s, a) =>
          s + (new Date(a.data_reconhecimento!).getTime() - new Date(a.data_criacao).getTime()),
        0,
      ) /
    Math.max(1, alertas.filter((a) => a.data_reconhecimento).length) /
    60000;

  // Rampa do sistema, não arco-íris: laranja na fatia que importa e neutros
  // recuando conforme a prioridade cai.
  const PIE = chartCategorical;

  function exportar(nome: string, data: Record<string, unknown>[]) {
    const csv = Papa.unparse(data);
    const b = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `${nome}.csv`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        subtitle="Indicadores operacionais e de qualidade"
        actions={
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" /> Imprimir / PDF
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Total incidentes" value={fmtNumber(incidentes.length)} />
        <MetricCard label="Violações de OLA" value={fmtNumber(violacoes)} accent="critical" />
        <MetricCard label="Correções efetivas" value={fmtNumber(efetivas)} accent="success" />
        <MetricCard
          label="Tempo médio até reconhecimento"
          value={`${tempoRec.toFixed(0)} min`}
          accent="info"
        />
      </div>

      <Tabs defaultValue="incidentes">
        <TabsList>
          <TabsTrigger value="incidentes">Incidentes</TabsTrigger>
          <TabsTrigger value="qualidade">Qualidade</TabsTrigger>
          <TabsTrigger value="previsoes">Previsões</TabsTrigger>
        </TabsList>

        <TabsContent value="incidentes" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Incidentes por período</div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => exportar("incidentes-por-mes", porMes)}
              >
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={porMes} margin={{ top: 24 }}>
                  <CartesianGrid {...gridProps} vertical={false} />
                  <XAxis dataKey="mes" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip {...tooltipProps} />
                  <Bar dataKey="total" fill={chartColors.destaque} radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="total" position="top" {...labelListProps} />
                  </Bar>
                  {porMes.length > 6 && (
                    <Brush
                      dataKey="mes"
                      {...brushProps}
                      startIndex={Math.max(0, porMes.length - 6)}
                      endIndex={porMes.length - 1}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">Por produto</div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => exportar("incidentes-produto", porProduto)}
                >
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
              </div>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={porProduto} layout="vertical" margin={{ left: 20, right: 48 }}>
                    <CartesianGrid {...gridProps} horizontal={false} />
                    <XAxis type="number" {...axisProps} />
                    <YAxis type="category" dataKey="produto" {...axisProps} width={110} />
                    <Tooltip {...tooltipProps} />
                    <Bar
                      dataKey="total"
                      fill={chartColors.destaqueSecundario}
                      radius={[0, 6, 6, 0]}
                    >
                      <LabelList dataKey="total" position="right" {...labelListProps} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card lit className="p-6">
              <div className="t-h4 mb-6">Por prioridade</div>
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
                      {porPrio.map((_, i) => (
                        <Cell key={i} fill={PIE[i % PIE.length]} />
                      ))}
                    </Pie>
                    <Legend {...legendProps} />
                    <Tooltip {...tooltipProps} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="qualidade" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard label="Correções efetivas" value={fmtNumber(efetivas)} accent="success" />
            <MetricCard
              label="Correções paliativas"
              value={fmtNumber(paliativas)}
              accent="warning"
            />
            <MetricCard
              label="Taxa de efetividade"
              value={pct((efetivas / Math.max(1, efetivas + paliativas)) * 100)}
              accent="brand"
            />
          </div>
        </TabsContent>

        <TabsContent value="previsoes">
          <Card className="p-6">
            <div className="text-sm font-semibold mb-2">Precisão das previsões</div>
            <div className="text-xs text-muted-foreground mb-3">
              MAPE médio simulado por modelo (dados demonstrativos)
            </div>
            <div className="space-y-2">
              {[
                { modelo: "AutoETS", mape: 12.4 },
                { modelo: "Seasonal Naive", mape: 18.7 },
              ].map((m) => (
                <div key={m.modelo} className="flex items-center gap-3">
                  <div className="w-40 text-sm">{m.modelo}</div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${100 - m.mape}%` }} />
                  </div>
                  <div className="text-sm font-medium w-16 text-right">{100 - m.mape}%</div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "critical" | "success" | "info" | "brand" | "warning";
}) {
  const map = {
    critical: "text-[color:var(--critical)]",
    success: "text-[color:var(--success)]",
    info: "text-[color:var(--info)]",
    brand: "text-primary",
    warning: "text-[color:var(--warning)]",
  } as const;
  return (
    <Card className="p-6">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${accent ? map[accent] : ""}`}>{value}</div>
    </Card>
  );
}
