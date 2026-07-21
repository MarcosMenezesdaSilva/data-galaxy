import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIncidentes } from "@/lib/hooks";
import { fmtNumber, fmtDate } from "@/lib/format";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  ComposedChart,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import { PRODUTOS } from "@/lib/demo-data";
import { Info, Brain, Layers, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useApp } from "@/lib/store";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export const Route = createFileRoute("/_app/previsoes")({
  head: () => ({ meta: [{ title: "Previsões — Data Galaxy" }] }),
  component: PrevisoesPage,
});

function PrevisoesPage() {
  const previsoesRaw = useLiveQuery(() => db.previsoes.toArray(), []);
  const previsoes = useMemo(() => previsoesRaw ?? [], [previsoesRaw]);
  const carregando = previsoesRaw === undefined;
  const incidentes = useIncidentes();
  const modo = useApp((s) => s.modo);

  // Histórico últimos 30 + previsão próximos 7
  const serie = useMemo(() => {
    const map = new Map<
      string,
      { data: string; real?: number; previsto?: number; inf?: number; sup?: number }
    >();
    for (let d = 29; d >= 0; d--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - d);
      const label = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const real = incidentes.filter(
        (i) => new Date(i.data_abertura).toDateString() === dt.toDateString(),
      ).length;
      map.set(label, { data: label, real });
    }
    // Aggregate forecast by day
    const prevByDay = new Map<string, { volume: number; inf: number; sup: number }>();
    previsoes.forEach((p) => {
      const dt = new Date(p.data_prevista);
      const label = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const cur = prevByDay.get(label) ?? { volume: 0, inf: 0, sup: 0 };
      cur.volume += p.volume_previsto;
      cur.inf += p.limite_inferior;
      cur.sup += p.limite_superior;
      prevByDay.set(label, cur);
    });
    prevByDay.forEach((v, k) => {
      const existing = map.get(k) ?? { data: k };
      map.set(k, { ...existing, previsto: v.volume, inf: v.inf, sup: v.sup });
    });
    return Array.from(map.values());
  }, [previsoes, incidentes]);

  const porProduto = useMemo(() => {
    const map = new Map<string, number>();
    previsoes
      .filter((p) => p.horizonte === "D+7")
      .forEach((p) => map.set(p.produto, (map.get(p.produto) ?? 0) + p.volume_previsto));
    return Array.from(map, ([produto, volume]) => ({ produto, volume })).sort(
      (a, b) => b.volume - a.volume,
    );
  }, [previsoes]);

  const totalD1 = previsoes
    .filter((p) => p.horizonte === "D+1")
    .reduce((s, p) => s + p.volume_previsto, 0);
  const totalD7 = previsoes
    .filter((p) => p.horizonte === "D+7")
    .reduce((s, p) => s + p.volume_previsto, 0);

  if (carregando) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (previsoes.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Previsão de Incidentes"
          subtitle="Modelos AutoETS e Seasonal Naive · janelas D+1 e D+7"
        />
        <EmptyState
          icon={<TrendingUp className="h-8 w-8" />}
          title="Nenhuma previsão disponível"
          description="As previsões demonstrativas aparecem aqui após o carregamento dos dados."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Previsão de Incidentes"
        subtitle="Modelos AutoETS e Seasonal Naive · janelas D+1 e D+7"
        actions={
          <Badge variant="outline" className="gap-1.5">
            {modo === "demo" ? "Modo demonstração" : "Dados importados"}
          </Badge>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Volume previsto D+1" value={fmtNumber(totalD1)} accent="brand" />
        <StatCard label="Volume previsto D+7" value={fmtNumber(totalD7)} accent="orange" />
        <StatCard label="Confiança média" value="82%" accent="info" />
        <StatCard label="Produtos monitorados" value={String(PRODUTOS.length)} accent="success" />
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold">Histórico vs. previsão</div>
            <div className="text-xs text-muted-foreground">
              30 dias históricos + 7 dias projetados · com intervalos de confiança
            </div>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer>
            <ComposedChart data={serie}>
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
                dataKey="sup"
                name="Limite superior"
                stroke="none"
                fill="var(--info)"
                fillOpacity={0.1}
              />
              <Area
                dataKey="inf"
                name="Limite inferior"
                stroke="none"
                fill="var(--info)"
                fillOpacity={0.1}
              />
              <Line
                type="monotone"
                dataKey="real"
                name="Real"
                stroke="var(--brand)"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="previsto"
                name="Previsto"
                stroke="var(--info)"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="text-sm font-semibold mb-3">Previsão D+7 por produto</div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={porProduto}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="produto"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={80}
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
                <Bar dataKey="volume" fill="var(--accent-orange)" radius={[6, 6, 0, 0]}>
                  <LabelList
                    dataKey="volume"
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
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">Modelos planejados</div>
          </div>
          <ul className="space-y-3 text-sm">
            <ModelItem
              name="AutoETS"
              desc="Previsão de volume por produto e prioridade"
              status="Simulado"
            />
            <ModelItem
              name="Seasonal Naive"
              desc="Baseline sazonal para comparação"
              status="Simulado"
            />
            <ModelItem name="XGBoost" desc="Probabilidade de violação de OLA" status="Planejado" />
            <ModelItem name="SHAP" desc="Explicabilidade dos fatores de risco" status="Planejado" />
            <ModelItem name="K-Means" desc="Clusters de padrões recorrentes" status="Planejado" />
          </ul>
          <div className="mt-4 flex items-start gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            Nesta versão MVP os modelos não são executados em tempo real. As previsões exibidas são
            importadas ou geradas por dados demonstrativos.
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-primary" />
          <div className="text-sm font-semibold">Tabela diária de previsões</div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Data prevista</TableHead>
                <TableHead>Horizonte</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Inferior</TableHead>
                <TableHead className="text-right">Superior</TableHead>
                <TableHead>Modelo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previsoes.slice(0, 30).map((p) => (
                <TableRow key={p.id_previsao}>
                  <TableCell className="font-mono text-xs">{p.id_previsao}</TableCell>
                  <TableCell className="text-xs">{fmtDate(p.data_prevista)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.horizonte}</Badge>
                  </TableCell>
                  <TableCell>{p.produto}</TableCell>
                  <TableCell className="text-right font-medium">
                    {fmtNumber(p.volume_previsto)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    {fmtNumber(p.limite_inferior)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    {fmtNumber(p.limite_superior)}
                  </TableCell>
                  <TableCell className="text-xs">{p.modelo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "brand" | "orange" | "info" | "success";
}) {
  const map = {
    brand: "text-primary",
    orange: "text-[color:var(--accent-orange)]",
    info: "text-[color:var(--info)]",
    success: "text-[color:var(--success)]",
  };
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${map[accent]}`}>{value}</div>
    </Card>
  );
}

function ModelItem({
  name,
  desc,
  status,
}: {
  name: string;
  desc: string;
  status: "Simulado" | "Planejado";
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          <Badge
            variant={status === "Simulado" ? "secondary" : "outline"}
            className="text-[10px] py-0"
          >
            {status}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </li>
  );
}
