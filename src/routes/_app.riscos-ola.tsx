import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  LabelList,
} from "recharts";
import { axisProps, chartColors, gridProps, labelListProps, tooltipProps } from "@/lib/chart-theme";
import { QRCodeSVG } from "qrcode.react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrioridadeBadge, RiscoBadge } from "@/components/Badges";
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
import { RiskGauge } from "@/components/RiskGauge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { IncidenteTimeline } from "@/components/IncidenteTimeline";
import { SimuladorReforco } from "@/components/SimuladorReforco";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Wrench,
  Users,
  ExternalLink,
  Clock,
  Info,
  ShieldOff,
  MessageCircle,
  Send,
  Loader2,
  QrCode,
  History,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { RiscoOla } from "@/lib/types";
import { toast } from "sonner";
import {
  enviarNotificacao,
  statusCanaisNotificacao,
  linkOptInWhatsapp,
  type Canal,
  type StatusCanais,
} from "@/lib/notify";
import { fmtTempoRestanteSla } from "@/lib/format";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_app/riscos-ola")({
  head: () => ({ meta: [{ title: "Riscos de OLA — Data Galaxy" }] }),
  component: RiscosPage,
});

// Peso demonstrativo de cada fator na pontuação de risco — regra local
// explicável (sem IA externa), usada apenas para visualização do breakdown.
const PESO_FATOR: Record<string, number> = {
  "Prioridade alta": 30,
  "Produto crítico": 25,
  "Alta recorrência": 20,
  "Histórico de violação": 20,
  "Pico de volume": 18,
  "Grupo sobrecarregado": 15,
  "Tempo médio elevado": 15,
  "Padrão histórico": 10,
};

function breakdownFatores(fatores: string[]) {
  const pesos = fatores.map((f) => ({ fator: f, peso: PESO_FATOR[f] ?? 10 }));
  const total = pesos.reduce((s, f) => s + f.peso, 0) || 1;
  return pesos
    .map((f) => ({ ...f, contribuicaoPct: Math.round((f.peso / total) * 1000) / 10 }))
    .sort((a, b) => b.contribuicaoPct - a.contribuicaoPct);
}

function RiscosPage() {
  const riscosRaw = useLiveQuery(
    () => db.riscos.orderBy("probabilidade_violacao").reverse().toArray(),
    [],
  );
  const todosRiscos = riscosRaw ?? [];
  const carregando = riscosRaw === undefined;
  // A base real do Databricks traz risco calculado tanto de incidentes ainda
  // abertos quanto de incidentes já resolvidos (histórico) — por padrão só
  // mostramos os "Ativo" pra não passar a impressão de que há mais risco
  // aberto agora do que realmente existe; o histórico fica disponível ao
  // ligar o toggle.
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const riscosAtivos = todosRiscos.filter((r) => r.status === "Ativo");
  const riscos = mostrarHistorico ? todosRiscos : riscosAtivos;
  // Visão agregada que faltava na tela: o Simulador de reforço e o Insight
  // automático do Dashboard já raciocinam "por grupo", mas a tela nunca
  // mostrava esse ranking — só a fila individual. Mesmo padrão visual do
  // gráfico "Incidentes por grupo" do Dashboard.
  const riscosPorGrupo = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of riscosAtivos) map.set(r.grupo, (map.get(r.grupo) ?? 0) + 1);
    return Array.from(map, ([grupo, total]) => ({ grupo, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [riscosAtivos]);
  const [sel, setSel] = useState<RiscoOla | null>(null);
  const atual = sel ?? riscos[0] ?? null;
  const navigate = useNavigate();

  // Estado local só para refletir visualmente que a ação já foi disparada
  // para o risco selecionado (evita reenviar a mesma ação sem feedback).
  const [alertasCriados, setAlertasCriados] = useState<Set<string>>(new Set());
  const [notificados, setNotificados] = useState<Set<string>>(new Set());
  const [acoesCriadas, setAcoesCriadas] = useState<Set<string>>(new Set());

  // Diálogo de notificação: canal e destino digitados na hora, em vez de um
  // número fixo em variável de ambiente — pensado para demonstração ao vivo
  // (ex.: digitar o WhatsApp de alguém da banca durante o pitch e mandar na
  // hora).
  const [timelineAberta, setTimelineAberta] = useState(false);
  const [dialogNotificarAberto, setDialogNotificarAberto] = useState(false);
  const [canalEscolhido, setCanalEscolhido] = useState<Canal>("whatsapp");
  const [destino, setDestino] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [statusCanais, setStatusCanais] = useState<StatusCanais | null>(null);
  useEffect(() => {
    statusCanaisNotificacao().then(setStatusCanais);
  }, []);
  const linkOptIn = statusCanais ? linkOptInWhatsapp(statusCanais) : null;

  async function criarAlerta(r: RiscoOla) {
    await db.alertas.add({
      id_alerta: `ALT${Date.now()}`,
      numero_incidente: r.numero_incidente,
      titulo: `Risco de violação de OLA — ${r.produto}`,
      descricao: `Probabilidade de violação de ${r.probabilidade_violacao}% (${r.faixa_risco}) para o incidente ${r.numero_incidente}, grupo ${r.grupo}.`,
      severidade:
        r.faixa_risco === "Crítico" ? "Crítico" : r.faixa_risco === "Alto" ? "Alto" : "Atenção",
      produto: r.produto,
      grupo_responsavel: r.grupo,
      status: "Novo",
      data_criacao: new Date().toISOString(),
      canal_email: true,
      canal_teams: true,
      canal_sms: false,
      canal_api: false,
      origem_dado: "DEMONSTRACAO",
      gerado_para_mvp: true,
    });
    setAlertasCriados((s) => new Set(s).add(r.id_risco));
    toast.success("Alerta criado — visível na Central de Alertas.");
  }

  const NOME_CANAL: Record<Canal, string> = {
    teams: "Teams",
    whatsapp: "WhatsApp",
    sms: "SMS",
  };

  function abrirDialogNotificar() {
    setCanalEscolhido("whatsapp");
    setDestino("");
    setDialogNotificarAberto(true);
  }

  // Corpo da mensagem por canal — mesmo padrão visual (emoji + seções) nos
  // três, cada um com a sintaxe de negrito que o canal realmente renderiza:
  // WhatsApp usa *negrito* (Twilio), Teams usa **negrito** (Markdown do
  // MessageCard, com \n\n entre seções para garantir quebra de linha), SMS
  // fica em texto puro (asterisco apareceria literal).
  function montarNotificacao(r: RiscoOla): { titulo: string; mensagem: string } {
    const minutosAcao = Math.max(15, Math.round(r.tempo_restante_minutos * 0.3));
    const tempoSla = fmtTempoRestanteSla(r.tempo_restante_minutos).texto;
    const link = "https://data-galaxy-nexusops.netlify.app";

    if (canalEscolhido === "whatsapp") {
      return {
        titulo: `🚨 Data Galaxy — Risco ${r.faixa_risco}`,
        mensagem: [
          `📋 Incidente: ${r.numero_incidente}`,
          `🏷️ Produto: ${r.produto}`,
          `👥 Grupo: ${r.grupo}`,
          "",
          `📊 Probabilidade de violação: *${r.probabilidade_violacao}%*`,
          `⏱️ SLA: ${tempoSla}`,
          `⚠️ Fatores: ${r.fatores_risco.join(", ")}`,
          "",
          `✅ *Recomendação:*`,
          `Acionar o grupo ${r.grupo} nos próximos ${minutosAcao} minutos.`,
          "",
          `🔗 ${link}`,
          "",
          `_Data Galaxy • Challenge Locaweb 2026 • FIAP_`,
        ].join("\n"),
      };
    }

    if (canalEscolhido === "sms") {
      // Contas trial da Twilio limitam SMS a um único segmento (~160
      // caracteres GSM-7) — mensagem curta, sem emoji e sem acento (o
      // servidor também remove acento por segurança, mas já mandamos limpo
      // pra não depender só disso e manter previsível quantos caracteres
      // sobram pro conteúdo).
      return {
        titulo: `Data Galaxy - Risco ${r.faixa_risco.normalize("NFD").replace(/[̀-ͯ]/g, "")}`,
        mensagem: `INC ${r.numero_incidente} (${r.produto}): ${r.probabilidade_violacao}%, SLA ${tempoSla.normalize("NFD").replace(/[̀-ͯ]/g, "")}. Acionar ${r.grupo}.`,
      };
    }

    // Teams
    return {
      titulo: `🚨 Data Galaxy — Risco ${r.faixa_risco}`,
      mensagem: [
        `📋 Incidente: ${r.numero_incidente}`,
        "",
        `🏷️ Produto: ${r.produto}`,
        "",
        `👥 Grupo: ${r.grupo}`,
        "",
        `📊 Probabilidade de violação: **${r.probabilidade_violacao}%**`,
        "",
        `⏱️ SLA: ${tempoSla}`,
        "",
        `⚠️ Fatores: ${r.fatores_risco.join(", ")}`,
        "",
        `✅ **Recomendação:**`,
        "",
        `Acionar o grupo ${r.grupo} nos próximos ${minutosAcao} minutos.`,
        "",
        `🔗 [${link}](${link})`,
        "",
        `_Data Galaxy • Challenge Locaweb 2026 • FIAP_`,
      ].join("\n\n"),
    };
  }

  async function confirmarNotificacao(r: RiscoOla) {
    if (canalEscolhido !== "teams" && destino.trim().length < 8) {
      toast.error("Digite um número de destino válido (DDD + número, ex: 11999999999).");
      return;
    }

    setEnviando(true);
    const { titulo, mensagem } = montarNotificacao(r);
    const resultado = await enviarNotificacao({
      canal: canalEscolhido,
      destinatario: canalEscolhido === "teams" ? undefined : destino.trim(),
      titulo,
      mensagem,
    });
    setEnviando(false);

    // Marca o estado local independentemente do resultado, para manter o
    // feedback visual do botão consistente mesmo quando o canal ainda não
    // está configurado (o clique já foi "processado" do ponto de vista da UI).
    setNotificados((s) => new Set(s).add(r.id_risco));

    if (resultado.ok) {
      toast.success(
        canalEscolhido === "teams"
          ? `Equipe ${r.grupo} notificada via Teams.`
          : `Mensagem enviada por ${NOME_CANAL[canalEscolhido]} para ${destino.trim()}.`,
      );
      setDialogNotificarAberto(false);
    } else if (resultado.motivo === "nao_configurado") {
      toast.warning(
        `Canal ${NOME_CANAL[canalEscolhido]} ainda não configurado. Configure em Configurações → Notificações.`,
      );
    } else {
      // Mostra o motivo real que a Twilio devolveu (ex.: número não
      // verificado numa conta trial) em vez de um erro genérico — é o que
      // permite a pessoa entender e resolver sozinha na hora.
      toast.error(
        `Não foi possível enviar por ${NOME_CANAL[canalEscolhido]} agora.`,
        resultado.detalhe ? { description: resultado.detalhe } : undefined,
      );
    }
  }

  async function criarAcaoPreventiva(r: RiscoOla) {
    await db.acoes.add({
      id_acao: `ACT${Date.now()}`,
      numero_incidente: r.numero_incidente,
      responsavel: "A definir",
      grupo_responsavel: r.grupo,
      tipo_acao: "Ação preventiva",
      descricao_acao: `Ação preventiva aberta a partir do risco de OLA de ${r.produto} (${r.probabilidade_violacao}% de probabilidade).`,
      data_acao: new Date().toISOString(),
      produto: r.produto,
      status: "Planejada",
      classificacao: "Pendente",
      origem_dado: "DEMONSTRACAO",
      gerado_para_mvp: true,
    });
    setAcoesCriadas((s) => new Set(s).add(r.id_risco));
    toast.success("Ação preventiva criada — visível em Ações Corretivas.");
  }

  if (carregando) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
          <Skeleton className="h-[70vh] w-full" />
          <Skeleton className="h-[70vh] w-full" />
        </div>
      </div>
    );
  }

  const toggleHistorico = (
    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
      <Switch checked={mostrarHistorico} onCheckedChange={setMostrarHistorico} />
      Incluir histórico (resolvidos)
      {todosRiscos.length > 0 && (
        <span className="text-muted-foreground/70">
          · {riscosAtivos.length} ativo{riscosAtivos.length === 1 ? "" : "s"} de{" "}
          {todosRiscos.length}
        </span>
      )}
    </label>
  );

  if (riscos.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Riscos de OLA"
          subtitle="Ordenado pelo maior risco de violação · fatores explicáveis por incidente"
          actions={todosRiscos.length > 0 ? toggleHistorico : undefined}
        />
        <EmptyState
          icon={<ShieldOff className="h-8 w-8" />}
          title={
            !mostrarHistorico && todosRiscos.length > 0
              ? "Nenhum risco ativo no momento"
              : "Nenhum risco de OLA calculado"
          }
          description={
            !mostrarHistorico && todosRiscos.length > 0
              ? 'Todos os incidentes com risco calculado na base atual já foram resolvidos. Ligue "Incluir histórico" para vê-los.'
              : "Os riscos aparecem aqui a partir dos incidentes ativos carregados na base atual."
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Riscos de OLA"
        subtitle="Ordenado pelo maior risco de violação · fatores explicáveis por incidente"
        actions={toggleHistorico}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <Card className="p-0 overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incidente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Prio.</TableHead>
                  <TableHead className="text-right">Prob.</TableHead>
                  <TableHead>Faixa</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-right">SLA</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riscos.map((r) => (
                  <TableRow
                    key={r.id_risco}
                    className={`cursor-pointer ${atual?.id_risco === r.id_risco ? "bg-primary/5" : "hover:bg-accent/40"}`}
                    onClick={() => setSel(r)}
                  >
                    <TableCell className="font-mono text-xs">{r.numero_incidente}</TableCell>
                    <TableCell className="text-sm">{r.produto}</TableCell>
                    <TableCell>
                      <PrioridadeBadge p={r.prioridade} />
                    </TableCell>
                    <TableCell
                      className="text-right font-semibold"
                      style={{
                        color:
                          r.probabilidade_violacao >= 80
                            ? "var(--critical)"
                            : r.probabilidade_violacao >= 60
                              ? "var(--accent-orange)"
                              : r.probabilidade_violacao >= 30
                                ? "var(--warning)"
                                : "var(--success)",
                      }}
                    >
                      {r.probabilidade_violacao}%
                    </TableCell>
                    <TableCell>
                      <RiscoBadge f={r.faixa_risco} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.grupo}</TableCell>
                    <TableCell
                      className="text-right text-xs whitespace-nowrap"
                      style={{
                        color: fmtTempoRestanteSla(r.tempo_restante_minutos).estourado
                          ? "var(--critical)"
                          : undefined,
                      }}
                    >
                      {fmtTempoRestanteSla(r.tempo_restante_minutos).texto}
                    </TableCell>
                    <TableCell className="text-xs">{r.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {atual && (
          <Card className="p-6 space-y-5 h-fit sticky top-20">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Risco selecionado</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm">{atual.numero_incidente}</span>
                <PrioridadeBadge p={atual.prioridade} />
                <RiscoBadge f={atual.faixa_risco} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {atual.produto} · {atual.grupo}
              </div>
            </div>

            <div className="flex items-center justify-center py-2">
              <RiskGauge value={atual.probabilidade_violacao} size={150} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border p-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help w-fit">
                      <Clock className="h-3 w-3" /> SLA
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-64">
                    Tempo até o limite de SLA da prioridade ser atingido, calculado a partir de
                    quanto tempo o incidente já está em aberto. Quando já passou do limite, mostra
                    há quanto tempo está atrasado.
                  </TooltipContent>
                </Tooltip>
                <div
                  className="text-lg font-semibold"
                  style={{
                    color: fmtTempoRestanteSla(atual.tempo_restante_minutos).estourado
                      ? "var(--critical)"
                      : undefined,
                  }}
                >
                  {fmtTempoRestanteSla(atual.tempo_restante_minutos).texto}
                </div>
              </div>
              <div className="rounded-md border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> Grupo
                </div>
                <div className="text-sm font-medium">{atual.grupo}</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                Principais fatores
              </div>
              <div className="flex flex-wrap gap-1.5">
                {atual.fatores_risco.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-primary/10 text-primary text-[11px] px-2 py-0.5 border border-primary/20"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                Contribuição de cada fator (regra local explicável)
              </div>
              <div className="space-y-2">
                {breakdownFatores(atual.fatores_risco).map((f) => (
                  <div key={f.fator}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>{f.fator}</span>
                      <span className="font-medium">{f.contribuicaoPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${f.contribuicaoPct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md bg-muted p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-[color:var(--info)]" />
                <p className="text-xs leading-relaxed">
                  A combinação de <b>{atual.fatores_risco[0]?.toLowerCase()}</b>
                  {atual.fatores_risco[1] ? ` e ${atual.fatores_risco[1].toLowerCase()}` : ""}{" "}
                  indica alta chance de violação. Recomenda-se acionar o grupo <b>{atual.grupo}</b>{" "}
                  nos próximos {Math.max(15, Math.round(atual.tempo_restante_minutos * 0.3))}{" "}
                  minutos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                disabled={alertasCriados.has(atual.id_risco)}
                onClick={() => criarAlerta(atual)}
              >
                <Bell className="h-4 w-4 mr-1.5" />
                {alertasCriados.has(atual.id_risco) ? "Alerta criado ✓" : "Criar alerta"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={notificados.has(atual.id_risco)}
                onClick={abrirDialogNotificar}
              >
                <Users className="h-4 w-4 mr-1.5" />
                {notificados.has(atual.id_risco) ? "Notificado ✓" : "Notificar"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={acoesCriadas.has(atual.id_risco)}
                onClick={() => criarAcaoPreventiva(atual)}
              >
                <Wrench className="h-4 w-4 mr-1.5" />
                {acoesCriadas.has(atual.id_risco) ? "Ação criada ✓" : "Ação preventiva"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => navigate({ to: "/incidentes" })}>
                <ExternalLink className="h-4 w-4 mr-1.5" /> Similares
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setTimelineAberta(true)}
            >
              <History className="h-4 w-4 mr-1.5" /> Ver linha do tempo completa
            </Button>
          </Card>
        )}
      </div>

      {riscosPorGrupo.length > 0 && (
        <Card lit className="p-6">
          <div className="t-h4 mb-6">Riscos ativos por grupo responsável</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={riscosPorGrupo} layout="vertical" margin={{ left: 20, right: 48 }}>
                <CartesianGrid {...gridProps} horizontal={false} />
                <XAxis type="number" {...axisProps} allowDecimals={false} />
                <YAxis type="category" dataKey="grupo" {...axisProps} width={110} />
                <ChartTooltip {...tooltipProps} />
                <Bar dataKey="total" fill={chartColors.destaque} radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="total" position="right" {...labelListProps} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <SimuladorReforco riscosAtivos={riscosAtivos} />

      {atual && (
        <Sheet open={timelineAberta} onOpenChange={setTimelineAberta}>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span className="font-mono text-sm">{atual.numero_incidente}</span>
                <RiscoBadge f={atual.faixa_risco} />
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 px-4">
              <IncidenteTimeline numeroIncidente={atual.numero_incidente} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {atual && (
        <Dialog open={dialogNotificarAberto} onOpenChange={setDialogNotificarAberto}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Notificar grupo {atual.grupo}</DialogTitle>
              <DialogDescription>
                Escolha o canal. Para WhatsApp ou SMS, digite o DDD + número de destino — útil para
                demonstrar o envio ao vivo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <RadioGroup
                value={canalEscolhido}
                onValueChange={(v) => setCanalEscolhido(v as Canal)}
                className="grid grid-cols-3 gap-2"
              >
                <Label
                  htmlFor="canal-whatsapp"
                  className={`flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs cursor-pointer transition-colors ${canalEscolhido === "whatsapp" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"}`}
                >
                  <RadioGroupItem value="whatsapp" id="canal-whatsapp" className="sr-only" />
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Label>
                <Label
                  htmlFor="canal-sms"
                  className={`flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs cursor-pointer transition-colors ${canalEscolhido === "sms" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"}`}
                >
                  <RadioGroupItem value="sms" id="canal-sms" className="sr-only" />
                  <Send className="h-4 w-4" />
                  SMS
                </Label>
                <Label
                  htmlFor="canal-teams"
                  className={`flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs cursor-pointer transition-colors ${canalEscolhido === "teams" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"}`}
                >
                  <RadioGroupItem value="teams" id="canal-teams" className="sr-only" />
                  <Users className="h-4 w-4" />
                  Teams
                </Label>
              </RadioGroup>

              {canalEscolhido !== "teams" && (
                <div className="space-y-1.5">
                  <Label htmlFor="destino-notificacao">Número de destino</Label>
                  <Input
                    id="destino-notificacao"
                    placeholder="11999999999"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Só DDD + número — o +55 é adicionado automaticamente. Em conta Twilio trial, o
                    número precisa estar verificado (SMS) ou ter entrado no sandbox (WhatsApp).
                  </p>
                </div>
              )}

              {canalEscolhido === "sms" && (
                <div className="space-y-1.5 rounded-md border border-[color:var(--warning)]/35 bg-[color:var(--warning)]/5 p-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 shrink-0 text-[color:var(--warning)]" />
                    <span>
                      Conta Twilio <b>trial</b> só envia SMS para números já <b>verificados</b> na
                      conta — diferente do WhatsApp, não existe um passo de opt-in que a própria
                      pessoa faça pelo celular. Para liberar um número novo, quem administra a conta
                      Twilio precisa cadastrá-lo em{" "}
                      <b>Console Twilio → Phone Numbers → Verified Caller IDs</b> (a Twilio liga ou
                      manda um código pra confirmar). Isso deixa de ser necessário assim que a conta
                      Twilio deixa de ser trial.
                    </span>
                  </div>
                </div>
              )}

              {canalEscolhido === "whatsapp" && (
                <div className="space-y-2 rounded-md border border-[color:var(--warning)]/35 bg-[color:var(--warning)]/5 p-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 shrink-0 text-[color:var(--warning)]" />
                    <span>
                      Antes do primeiro envio, quem vai receber precisa mandar uma mensagem para o
                      número do sandbox do Twilio. Sem esse passo único, a Twilio aceita o envio mas
                      a mensagem nunca chega no WhatsApp da pessoa.
                    </span>
                  </div>
                  {linkOptIn ? (
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => window.open(linkOptIn, "_blank", "noopener,noreferrer")}
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Abrir WhatsApp e entrar no sandbox
                      </Button>
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-white p-1.5">
                          <QRCodeSVG value={linkOptIn} size={64} />
                        </div>
                        <span className="flex items-center gap-1 text-[11px]">
                          <QrCode className="h-3 w-3" /> A banca escaneia com o celular e já entra
                          no sandbox
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="block text-[11px]">
                      Configure <code>TWILIO_WHATSAPP_FROM</code> (e, opcionalmente,{" "}
                      <code>TWILIO_WHATSAPP_JOIN_CODE</code>) para liberar o botão e o QR code de
                      entrada automática.
                    </span>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => confirmarNotificacao(atual)}
                disabled={enviando}
                className="w-full sm:w-auto"
              >
                {enviando ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1.5" />
                )}
                {enviando ? "Enviando..." : `Enviar por ${NOME_CANAL[canalEscolhido]}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
