import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClassifBadge } from "@/components/Badges";
import { useAcoes } from "@/lib/hooks";
import { fmtDate, fmtNumber, pct } from "@/lib/format";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
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
} from "recharts";
import type { AcaoCorretiva } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useValidacoes } from "@/lib/hooks";

export const Route = createFileRoute("/_app/validacao")({
  head: () => ({ meta: [{ title: "Validação de Correções — Data Galaxy" }] }),
  component: ValidacaoPage,
});

function ValidacaoPage() {
  const acoes = useAcoes();
  const validacoes = useValidacoes();
  const [sel, setSel] = useState<AcaoCorretiva | null>(acoes[0] ?? null);
  const atual = sel ?? acoes[0] ?? null;

  const stats = useMemo(
    () => ({
      validacao: acoes.filter((a) => a.status === "Em validação").length,
      efetivas: acoes.filter((a) => a.classificacao === "Efetiva").length,
      paliativas: acoes.filter((a) => a.classificacao === "Paliativa").length,
      inconc: acoes.filter((a) => a.classificacao === "Inconclusiva").length,
    }),
    [acoes],
  );

  // Pontos reais de validação (janelas de 7/15/30 dias) gerados para a ação
  // selecionada — nada de série sintética interpolada por render.
  const serie = useMemo(() => {
    if (!atual) return [];
    return validacoes
      .filter((v) => v.id_acao === atual.id_acao)
      .sort((a, b) => a.janela_dias - b.janela_dias)
      .map((v) => ({
        dia: `D+${v.janela_dias}`,
        previsto: v.volume_previsto,
        real: v.volume_real,
      }));
  }, [atual, validacoes]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Validação de Correções"
        subtitle="Compare o comportamento previsto com o resultado real após a ação corretiva"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <KPICard
          label="Ações em validação"
          value={fmtNumber(stats.validacao)}
          icon={<Clock className="h-4 w-4" />}
          accent="info"
        />
        <KPICard
          label="Correções efetivas"
          value={fmtNumber(stats.efetivas)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="success"
        />
        <KPICard
          label="Correções paliativas"
          value={fmtNumber(stats.paliativas)}
          icon={<XCircle className="h-4 w-4" />}
          accent="warning"
        />
        <KPICard
          label="Inconclusivas"
          value={fmtNumber(stats.inconc)}
          icon={<HelpCircle className="h-4 w-4" />}
        />
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <b>Regras demonstrativas configuráveis:</b> Efetiva = volume real ≤ 70% do previsto E
          reincidência ≤ 10% E até 2 novas violações · Paliativa = queda seguida de retomada ou
          volume real ≥ 85% do previsto ou reincidência &gt; 20% · Inconclusiva = janela não
          concluída.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Previsto vs. real após a correção</div>
              <div className="text-xs text-muted-foreground">
                Pontos reais de validação por janela de observação (7, 15 e 30 dias após a ação)
              </div>
            </div>
          </div>
          <div className="h-80">
            {serie.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={serie}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dia" stroke="var(--muted-foreground)" fontSize={11} />
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
                  <Bar dataKey="previsto" name="Previsto" fill="var(--info)" radius={4}>
                    <LabelList
                      dataKey="previsto"
                      position="top"
                      fontSize={11}
                      fill="var(--foreground)"
                    />
                  </Bar>
                  <Bar dataKey="real" name="Real" fill="var(--brand)" radius={4}>
                    <LabelList
                      dataKey="real"
                      position="top"
                      fontSize={11}
                      fill="var(--foreground)"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Sem validações registradas para esta ação ainda.
              </div>
            )}
          </div>

          <div className="mt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incidente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Previsto</TableHead>
                  <TableHead className="text-right">Real</TableHead>
                  <TableHead>Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acoes.map((a) => (
                  <TableRow
                    key={a.id_acao}
                    onClick={() => setSel(a)}
                    className={`cursor-pointer ${atual?.id_acao === a.id_acao ? "bg-primary/5" : "hover:bg-accent/40"}`}
                  >
                    <TableCell className="font-mono text-xs">{a.numero_incidente}</TableCell>
                    <TableCell>{a.produto}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{a.tipo_acao}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDate(a.data_acao)}
                    </TableCell>
                    <TableCell className="text-right">{fmtNumber(a.volume_previsto)}</TableCell>
                    <TableCell className="text-right">{fmtNumber(a.volume_real)}</TableCell>
                    <TableCell>
                      <ClassifBadge c={a.classificacao} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {atual && (
          <Card className="p-5 space-y-5 h-fit sticky top-20">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Caso selecionado</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm">{atual.numero_incidente}</span>
                <ClassifBadge c={atual.classificacao} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {atual.produto} · {atual.responsavel}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SmallMetric label="Volume previsto" value={fmtNumber(atual.volume_previsto)} />
              <SmallMetric label="Volume real" value={fmtNumber(atual.volume_real)} />
              <SmallMetric label="Reinc. 7d" value={fmtNumber(atual.reincidencias_7_dias)} />
              <SmallMetric label="Reinc. 15d" value={fmtNumber(atual.reincidencias_15_dias)} />
              <SmallMetric label="Reinc. 30d" value={fmtNumber(atual.reincidencias_30_dias)} />
              <SmallMetric label="Novas violações" value={fmtNumber(atual.novas_violacoes)} />
            </div>
            {atual.volume_previsto && atual.volume_real && (
              <div className="rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">Queda de volume</div>
                <div className="flex items-center gap-2 mt-1">
                  {atual.volume_real <= atual.volume_previsto ? (
                    <TrendingDown className="h-5 w-5 text-[color:var(--success)]" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-[color:var(--critical)]" />
                  )}
                  <div className="text-xl font-semibold">
                    {pct(
                      ((atual.volume_previsto - atual.volume_real) / atual.volume_previsto) * 100,
                    )}
                  </div>
                </div>
              </div>
            )}
            {atual.conclusao && (
              <div className="rounded-md bg-muted p-3">
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <p>{atual.conclusao}</p>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2.5">
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
