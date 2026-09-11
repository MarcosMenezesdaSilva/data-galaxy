import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { KPICard } from "@/components/KPICard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClassifBadge } from "@/components/Badges";
import { useAcoes, useValidacoes } from "@/lib/hooks";
import { db } from "@/lib/db";
import { useApp } from "@/lib/store";
import { fmtDate, fmtNumber, pct } from "@/lib/format";
import { PRODUTOS, GRUPOS } from "@/lib/demo-data";
import type { AcaoCorretiva } from "@/lib/types";
import {
  Plus,
  Wrench,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ListChecks,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Info,
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
import {
  axisProps,
  chartColors,
  gridProps,
  labelListProps,
  legendProps,
  tooltipProps,
} from "@/lib/chart-theme";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const TIPOS = [
  "Reinício de serviço",
  "Ajuste de configuração",
  "Aumento de capacidade",
  "Correção de código",
  "Rollback",
  "Ajuste de monitoramento",
  "Mudança de infraestrutura",
  "Outro",
];

export const Route = createFileRoute("/_app/correcoes")({
  head: () => ({ meta: [{ title: "Correções — Data Galaxy" }] }),
  component: CorrecoesPage,
});

function CorrecoesPage() {
  const acoes = useAcoes();
  const modo = useApp((s) => s.modo);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    numero: "",
    produto: "Hosting",
    grupo: "Infraestrutura",
    responsavel: "",
    tipo: "Reinício de serviço",
    descricao: "",
    causa: "",
  });

  async function criar() {
    if (!form.numero || !form.descricao) {
      toast.error("Preencha número do incidente e descrição.");
      return;
    }
    const acao: AcaoCorretiva = {
      id_acao: `ACT-${Date.now()}`,
      numero_incidente: form.numero,
      produto: form.produto,
      grupo_responsavel: form.grupo,
      responsavel: form.responsavel || "—",
      tipo_acao: form.tipo,
      descricao_acao: form.descricao,
      causa_provavel: form.causa,
      data_acao: new Date().toISOString(),
      status: "Planejada",
      classificacao: "Pendente",
      // Registro manual do usuário — herda a origem do modo atual, mas não é
      // um registro sintético gerado automaticamente para o seed do MVP.
      origem_dado: modo === "demo" ? "DEMONSTRACAO" : "IMPORTADO",
      gerado_para_mvp: false,
    };
    await db.acoes.add(acao);
    toast.success("Ação corretiva registrada");
    setOpen(false);
    setForm({
      numero: "",
      produto: "Hosting",
      grupo: "Infraestrutura",
      responsavel: "",
      tipo: "Reinício de serviço",
      descricao: "",
      causa: "",
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Correções"
        subtitle="Registre, acompanhe e valide o ciclo completo de correções aplicadas a incidentes e riscos"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1.5" /> Nova ação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova ação corretiva</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Número do incidente">
                    <Input
                      value={form.numero}
                      onChange={(e) => setForm({ ...form, numero: e.target.value })}
                      placeholder="INC0000000"
                    />
                  </FormField>
                  <FormField label="Responsável">
                    <Input
                      value={form.responsavel}
                      onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                      placeholder="Nome"
                    />
                  </FormField>
                  <FormField label="Produto">
                    <Select
                      value={form.produto}
                      onValueChange={(v) => setForm({ ...form, produto: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUTOS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Grupo">
                    <Select
                      value={form.grupo}
                      onValueChange={(v) => setForm({ ...form, grupo: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRUPOS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Tipo de ação">
                    <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Causa provável">
                    <Input
                      value={form.causa}
                      onChange={(e) => setForm({ ...form, causa: e.target.value })}
                    />
                  </FormField>
                </div>
                <FormField label="Descrição da ação">
                  <Textarea
                    rows={4}
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  />
                </FormField>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={criar}>Registrar ação</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="acoes">
        <TabsList>
          <TabsTrigger value="acoes">Ações</TabsTrigger>
          <TabsTrigger value="validacao">Validação de Efetividade</TabsTrigger>
        </TabsList>

        <TabsContent value="acoes" className="space-y-6">
          <div className="grid gap-3 md:grid-cols-4">
            <MiniStat
              icon={<Wrench className="h-4 w-4" />}
              label="Total de ações"
              value={String(acoes.length)}
            />
            <MiniStat
              icon={<Clock className="h-4 w-4" />}
              label="Em validação"
              value={String(acoes.filter((a) => a.status === "Em validação").length)}
              accent="text-[color:var(--info)]"
            />
            <MiniStat
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Efetivas"
              value={String(acoes.filter((a) => a.classificacao === "Efetiva").length)}
              accent="text-[color:var(--success)]"
            />
            <MiniStat
              icon={<ListChecks className="h-4 w-4" />}
              label="Paliativas"
              value={String(acoes.filter((a) => a.classificacao === "Paliativa").length)}
              accent="text-[color:var(--warning)]"
            />
          </div>

          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Incidente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acoes.map((a) => (
                  <TableRow key={a.id_acao}>
                    <TableCell className="font-mono text-xs">{a.id_acao}</TableCell>
                    <TableCell className="font-mono text-xs">{a.numero_incidente}</TableCell>
                    <TableCell className="text-sm">{a.tipo_acao}</TableCell>
                    <TableCell>{a.produto}</TableCell>
                    <TableCell className="text-sm">{a.responsavel}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDate(a.data_acao)}
                    </TableCell>
                    <TableCell className="text-xs">{a.status}</TableCell>
                    <TableCell>
                      <ClassifBadge c={a.classificacao} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="validacao">
          <ValidacaoTab acoes={acoes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ValidacaoTab({ acoes }: { acoes: AcaoCorretiva[] }) {
  const validacoes = useValidacoes();
  const [sel, setSel] = useState<AcaoCorretiva | null>(null);
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
        <Card lit className="p-6">
          <div className="mb-6">
            <div className="t-h4">Previsto vs. real após a correção</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Pontos reais de validação por janela de observação (7, 15 e 30 dias após a ação)
            </div>
          </div>
          <div className="h-80">
            {serie.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={serie}>
                  <CartesianGrid {...gridProps} vertical={false} />
                  <XAxis dataKey="dia" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip {...tooltipProps} />
                  <Legend {...legendProps} />
                  <Bar
                    dataKey="previsto"
                    name="Previsto"
                    fill={chartColors.neutroRecuado}
                    radius={4}
                  >
                    <LabelList dataKey="previsto" position="top" {...labelListProps} />
                  </Bar>
                  <Bar dataKey="real" name="Real" fill={chartColors.destaque} radius={4}>
                    <LabelList dataKey="real" position="top" {...labelListProps} />
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
          <Card className="p-6 space-y-5 h-fit sticky top-20">
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
function MiniStat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <Card className="p-6 flex items-center gap-3">
      <div className={`rounded-md bg-muted p-2 ${accent ?? "text-primary"}`}>{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </Card>
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
