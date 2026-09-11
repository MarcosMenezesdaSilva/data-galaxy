// Linha do tempo unificada de um incidente: junta os eventos que hoje vivem
// espalhados em telas separadas (abertura/resolução do próprio incidente,
// riscos de OLA calculados, alertas disparados, ações corretivas tomadas e
// validações de efetividade) numa única ordem cronológica — o "loop
// reativo → preditivo" do produto, visto de ponta a ponta pra um incidente
// específico.
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Flag, ShieldAlert, Bell, Wrench, CheckCircle2, CircleCheck, Archive } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TipoEvento =
  | "abertura"
  | "risco"
  | "alerta"
  | "acao"
  | "validacao"
  | "resolucao"
  | "encerramento";

interface Evento {
  ts: number;
  tipo: TipoEvento;
  titulo: string;
  detalhe?: string;
}

const ESTILO_EVENTO: Record<TipoEvento, { icon: LucideIcon; cor: string }> = {
  abertura: { icon: Flag, cor: "var(--brand-orange)" },
  risco: { icon: ShieldAlert, cor: "var(--critical)" },
  alerta: { icon: Bell, cor: "var(--warning)" },
  acao: { icon: Wrench, cor: "var(--info)" },
  validacao: { icon: CheckCircle2, cor: "var(--success)" },
  resolucao: { icon: CircleCheck, cor: "var(--success)" },
  encerramento: { icon: Archive, cor: "var(--muted-foreground)" },
};

export function IncidenteTimeline({ numeroIncidente }: { numeroIncidente: string }) {
  // `.first()` resolve pra `undefined` tanto "a query ainda não rodou" quanto
  // "rodou e não achou" — indistinguível, e o incidente pode legitimamente
  // ainda não estar na tabela local (a carga em segundo plano de incidentes
  // é grande e pode não ter chegado nele ainda). Envolvendo o resultado num
  // objeto, só o "ainda não rodou" continua `undefined` — depois de resolver,
  // vira `{ incidente: null }` se não achou, o que destrava o loading mesmo
  // sem o registro do incidente em si (a timeline segue com o que já tem:
  // riscos/alertas/ações/validações, que vêm de tabelas bem menores e cheias).
  const resultadoIncidente = useLiveQuery(
    async () => ({
      incidente:
        (await db.incidentes.where("numero_incidente").equals(numeroIncidente).first()) ?? null,
    }),
    [numeroIncidente],
  );
  const incidente = resultadoIncidente?.incidente ?? null;
  const riscos = useLiveQuery(
    () => db.riscos.where("numero_incidente").equals(numeroIncidente).toArray(),
    [numeroIncidente],
  );
  const alertas = useLiveQuery(
    () => db.alertas.filter((a) => a.numero_incidente === numeroIncidente).toArray(),
    [numeroIncidente],
  );
  const acoes = useLiveQuery(
    () => db.acoes.where("numero_incidente").equals(numeroIncidente).toArray(),
    [numeroIncidente],
  );
  const validacoes = useLiveQuery(
    () => db.validacoes.where("numero_incidente").equals(numeroIncidente).toArray(),
    [numeroIncidente],
  );

  const carregando =
    resultadoIncidente === undefined ||
    riscos === undefined ||
    alertas === undefined ||
    acoes === undefined ||
    validacoes === undefined;

  if (carregando) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const eventos: Evento[] = [];

  if (incidente) {
    eventos.push({
      ts: +new Date(incidente.data_abertura),
      tipo: "abertura",
      titulo: "Incidente aberto",
      detalhe: incidente.descricao_resumida,
    });
  }
  for (const r of riscos ?? []) {
    eventos.push({
      ts: +new Date(r.data_calculo),
      tipo: "risco",
      titulo: `Risco de OLA calculado — ${r.faixa_risco}`,
      detalhe: `${r.probabilidade_violacao}% de probabilidade de violação`,
    });
  }
  for (const a of alertas ?? []) {
    eventos.push({
      ts: +new Date(a.data_criacao),
      tipo: "alerta",
      titulo: `Alerta disparado — ${a.severidade}`,
      detalhe: a.titulo,
    });
  }
  for (const ac of acoes ?? []) {
    eventos.push({
      ts: +new Date(ac.data_acao),
      tipo: "acao",
      titulo: `Ação corretiva — ${ac.tipo_acao}`,
      detalhe: `${ac.status}${ac.classificacao !== "Pendente" ? ` · ${ac.classificacao}` : ""}`,
    });
  }
  for (const v of validacoes ?? []) {
    eventos.push({
      ts: +new Date(v.data_validacao),
      tipo: "validacao",
      titulo: `Validação de efetividade — janela de ${v.janela_dias} dias`,
      detalhe: v.classificacao,
    });
  }
  if (incidente?.data_resolucao) {
    eventos.push({
      ts: +new Date(incidente.data_resolucao),
      tipo: "resolucao",
      titulo: "Incidente resolvido",
      detalhe: incidente.solucao ?? undefined,
    });
  }
  if (incidente?.data_encerramento) {
    eventos.push({
      ts: +new Date(incidente.data_encerramento),
      tipo: "encerramento",
      titulo: "Incidente encerrado",
    });
  }

  eventos.sort((a, b) => a.ts - b.ts);

  if (eventos.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Nenhum evento encontrado para o incidente {numeroIncidente}.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {!incidente && (
        <p className="text-[11px] text-muted-foreground">
          Detalhes do incidente ainda carregando em segundo plano — mostrando os eventos já
          disponíveis.
        </p>
      )}
      <ol className="relative ml-2 space-y-4 border-l border-border pl-4">
        {eventos.map((ev, i) => {
          const { icon: Icon, cor } = ESTILO_EVENTO[ev.tipo];
          return (
            <li key={i}>
              <div
                className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-background"
                style={{ boxShadow: `0 0 0 2px ${cor}` }}
              >
                <Icon className="h-2.5 w-2.5" style={{ color: cor }} />
              </div>
              <div className="text-[11px] text-muted-foreground">
                {fmtDateTime(ev.ts ? new Date(ev.ts).toISOString() : undefined)}
              </div>
              <div className="text-sm font-medium">{ev.titulo}</div>
              {ev.detalhe && <div className="text-xs text-muted-foreground">{ev.detalhe}</div>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
