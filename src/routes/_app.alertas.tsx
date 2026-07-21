import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KPICard } from "@/components/KPICard";
import { SeveridadeBadge, StatusAlertaBadge } from "@/components/Badges";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmtDateTime, fmtNumber } from "@/lib/format";
import { PRODUTOS, GRUPOS } from "@/lib/demo-data";
import type { Alerta } from "@/lib/types";
import {
  Bell,
  Zap,
  Check,
  PlayCircle,
  Wrench,
  ArrowUpRight,
  X,
  Mail,
  MessageSquare,
  Smartphone,
  Code,
  BellOff,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/alertas")({
  head: () => ({ meta: [{ title: "Central de Alertas — Data Galaxy" }] }),
  component: AlertasPage,
});

function AlertasPage() {
  const alertasRaw = useLiveQuery(() => db.alertas.orderBy("data_criacao").reverse().toArray(), []);
  const alertas = useMemo(() => alertasRaw ?? [], [alertasRaw]);
  const carregando = alertasRaw === undefined;
  const [sel, setSel] = useState<Alerta | null>(null);

  const stats = useMemo(
    () => ({
      novos: alertas.filter((a) => a.status === "Novo").length,
      reconhecidos: alertas.filter((a) => a.status === "Reconhecido").length,
      tratamento: alertas.filter((a) => a.status === "Em tratamento").length,
      criticos: alertas.filter(
        (a) => a.severidade === "Crítico" && a.status !== "Finalizado" && a.status !== "Cancelado",
      ).length,
      finalizados: alertas.filter((a) => a.status === "Finalizado").length,
    }),
    [alertas],
  );

  async function simular() {
    const novo: Alerta = {
      id_alerta: `ALT-SIM-${Date.now()}`,
      titulo: "Simulação: pico crítico previsto em Cloud",
      descricao: "Evento simulado pelo painel de operações. Volume esperado 3x acima da média.",
      severidade: "Crítico",
      produto: "Cloud",
      grupo_responsavel: "Cloud Operations",
      status: "Novo",
      data_criacao: new Date().toISOString(),
      canal_email: true,
      canal_teams: true,
      canal_sms: true,
      canal_api: true,
      volume_previsto: 620,
      origem_dado: "DEMONSTRACAO",
      gerado_para_mvp: true,
    };
    await db.alertas.add(novo);
    toast.error("Alerta crítico simulado criado", {
      description: "Cloud Operations foi acionado por todos os canais.",
    });
  }

  async function reconhecer(a: Alerta) {
    await db.alertas.update(a.id!, {
      status: "Reconhecido",
      data_reconhecimento: new Date().toISOString(),
    });
    toast.success("Alerta reconhecido");
  }
  async function iniciar(a: Alerta) {
    await db.alertas.update(a.id!, {
      status: "Em tratamento",
      data_inicio_tratamento: new Date().toISOString(),
    });
    toast.info("Tratamento iniciado");
  }
  async function finalizar(a: Alerta) {
    await db.alertas.update(a.id!, {
      status: "Finalizado",
      data_finalizacao: new Date().toISOString(),
    });
    toast.success("Alerta finalizado");
    setSel(null);
  }
  async function cancelar(a: Alerta) {
    await db.alertas.update(a.id!, { status: "Cancelado" });
    toast.message("Alerta cancelado");
    setSel(null);
  }

  if (carregando) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Alertas"
        subtitle="Caixa de entrada operacional · reconheça, trate e valide"
        actions={
          <Button onClick={simular} variant="default">
            <Zap className="h-4 w-4 mr-1.5" /> Simular evento crítico
          </Button>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <KPICard
          label="Novos"
          value={fmtNumber(stats.novos)}
          accent="critical"
          icon={<Bell className="h-4 w-4" />}
        />
        <KPICard
          label="Reconhecidos"
          value={fmtNumber(stats.reconhecidos)}
          accent="info"
          icon={<Check className="h-4 w-4" />}
        />
        <KPICard
          label="Em tratamento"
          value={fmtNumber(stats.tratamento)}
          accent="warning"
          icon={<PlayCircle className="h-4 w-4" />}
        />
        <KPICard
          label="Críticos"
          value={fmtNumber(stats.criticos)}
          accent="critical"
          icon={<Zap className="h-4 w-4" />}
        />
        <KPICard
          label="Finalizados"
          value={fmtNumber(stats.finalizados)}
          accent="success"
          icon={<Check className="h-4 w-4" />}
        />
      </div>

      <div className="text-xs text-muted-foreground">
        Cobertura de monitoramento: <b>{PRODUTOS.length}</b> produtos e <b>{GRUPOS.length}</b>{" "}
        grupos responsáveis habilitados para geração de alertas.
      </div>

      {alertas.length === 0 ? (
        <EmptyState
          icon={<BellOff className="h-8 w-8" />}
          title="Nenhum alerta registrado"
          description="Alertas aparecem aqui conforme o motor de risco identifica ameaças de violação de OLA."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severidade</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Vol. previsto</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Canais</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertas.map((a) => (
                <TableRow
                  key={a.id_alerta}
                  className="cursor-pointer hover:bg-accent/40"
                  onClick={() => setSel(a)}
                >
                  <TableCell>
                    <SeveridadeBadge s={a.severidade} />
                  </TableCell>
                  <TableCell className="max-w-sm truncate">{a.titulo}</TableCell>
                  <TableCell>{a.produto}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.grupo_responsavel}
                  </TableCell>
                  <TableCell className="text-sm">{fmtNumber(a.volume_previsto)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDateTime(a.data_criacao)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 text-muted-foreground">
                      {a.canal_email && <Mail className="h-3.5 w-3.5" />}
                      {a.canal_teams && <MessageSquare className="h-3.5 w-3.5" />}
                      {a.canal_sms && <Smartphone className="h-3.5 w-3.5" />}
                      {a.canal_api && <Code className="h-3.5 w-3.5" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusAlertaBadge s={a.status} />
                  </TableCell>
                  <TableCell>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <SeveridadeBadge s={sel.severidade} />
                  <StatusAlertaBadge s={sel.status} />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-5 px-4">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Título</div>
                  <div className="text-base font-semibold mt-0.5">{sel.titulo}</div>
                  <p className="text-sm text-muted-foreground mt-1">{sel.descricao}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Produto" value={sel.produto} />
                  <Field label="Grupo responsável" value={sel.grupo_responsavel} />
                  <Field label="Responsável" value={sel.responsavel ?? "—"} />
                  <Field label="Volume previsto" value={fmtNumber(sel.volume_previsto)} />
                  <Field label="Criado" value={fmtDateTime(sel.data_criacao)} />
                  <Field
                    label="Reconhecido"
                    value={sel.data_reconhecimento ? fmtDateTime(sel.data_reconhecimento) : "—"}
                  />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                    Canais de envio
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {sel.canal_email && <Chip icon={<Mail className="h-3 w-3" />}>E-mail</Chip>}
                    {sel.canal_teams && (
                      <Chip icon={<MessageSquare className="h-3 w-3" />}>Microsoft Teams</Chip>
                    )}
                    {sel.canal_sms && <Chip icon={<Smartphone className="h-3 w-3" />}>SMS</Chip>}
                    {sel.canal_api && <Chip icon={<Code className="h-3 w-3" />}>API</Chip>}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                    Linha do tempo
                  </div>
                  <ol className="relative border-l border-border ml-2 space-y-3 pl-4 text-sm">
                    <li>
                      <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary" />
                      Criado · {fmtDateTime(sel.data_criacao)}
                    </li>
                    {sel.data_reconhecimento && (
                      <li>
                        <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-[color:var(--info)]" />
                        Reconhecido · {fmtDateTime(sel.data_reconhecimento)}
                      </li>
                    )}
                    {sel.data_inicio_tratamento && (
                      <li>
                        <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-[color:var(--warning)]" />
                        Em tratamento · {fmtDateTime(sel.data_inicio_tratamento)}
                      </li>
                    )}
                    {sel.data_finalizacao && (
                      <li>
                        <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-[color:var(--success)]" />
                        Finalizado · {fmtDateTime(sel.data_finalizacao)}
                      </li>
                    )}
                  </ol>
                </div>
                <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                  {sel.status === "Novo" && (
                    <Button size="sm" onClick={() => reconhecer(sel)}>
                      <Check className="h-4 w-4 mr-1.5" /> Reconhecer
                    </Button>
                  )}
                  {(sel.status === "Novo" || sel.status === "Reconhecido") && (
                    <Button size="sm" variant="outline" onClick={() => iniciar(sel)}>
                      <PlayCircle className="h-4 w-4 mr-1.5" /> Iniciar tratamento
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Wrench className="h-4 w-4 mr-1.5" /> Criar ação corretiva
                  </Button>
                  {sel.status !== "Finalizado" && sel.status !== "Cancelado" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => finalizar(sel)}>
                        Finalizar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => cancelar(sel)}>
                        <X className="h-4 w-4 mr-1.5" /> Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}
function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5">
      {icon}
      {children}
    </span>
  );
}
