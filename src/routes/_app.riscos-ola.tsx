import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { Bell, Wrench, Users, ExternalLink, Clock, Info, ShieldOff } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { RiscoOla } from "@/lib/types";
import { toast } from "sonner";

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
  const riscos = riscosRaw ?? [];
  const carregando = riscosRaw === undefined;
  const [sel, setSel] = useState<RiscoOla | null>(null);
  const atual = sel ?? riscos[0] ?? null;
  const navigate = useNavigate();

  // Estado local só para refletir visualmente que a ação já foi disparada
  // para o risco selecionado (evita reenviar a mesma ação sem feedback).
  const [alertasCriados, setAlertasCriados] = useState<Set<string>>(new Set());
  const [notificados, setNotificados] = useState<Set<string>>(new Set());
  const [acoesCriadas, setAcoesCriadas] = useState<Set<string>>(new Set());

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

  function notificar(r: RiscoOla) {
    setNotificados((s) => new Set(s).add(r.id_risco));
    toast.info(`Equipe ${r.grupo} notificada via Teams.`);
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

  if (riscos.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Riscos de OLA"
          subtitle="Ordenado pelo maior risco de violação · fatores explicáveis por incidente"
        />
        <EmptyState
          icon={<ShieldOff className="h-8 w-8" />}
          title="Nenhum risco de OLA calculado"
          description="Os riscos aparecem aqui a partir dos incidentes ativos carregados na base atual."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Riscos de OLA"
        subtitle="Ordenado pelo maior risco de violação · fatores explicáveis por incidente"
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
                  <TableHead className="text-right">Tempo</TableHead>
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
                    <TableCell className="text-right text-xs">
                      {r.tempo_restante_minutos} min
                    </TableCell>
                    <TableCell className="text-xs">{r.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {atual && (
          <Card className="p-5 space-y-5 h-fit sticky top-20">
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
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> Tempo restante
                </div>
                <div className="text-lg font-semibold">{atual.tempo_restante_minutos} min</div>
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
                onClick={() => notificar(atual)}
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
          </Card>
        )}
      </div>
    </div>
  );
}
