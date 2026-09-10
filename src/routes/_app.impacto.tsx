import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { useIncidentes, useRiscos, useAcoes, usePrevisoes } from "@/lib/hooks";
import { fmtNumber, pct, fmtDuracaoMin } from "@/lib/format";
import {
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  CheckCircle2,
  Bell,
  ArrowRight,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/_app/impacto")({
  head: () => ({ meta: [{ title: "Impacto — Data Galaxy" }] }),
  component: ImpactoPage,
});

function ImpactoPage() {
  const incidentes = useIncidentes();
  const riscos = useRiscos();
  const acoes = useAcoes();
  const previsoes = usePrevisoes();

  // Tudo calculado direto sobre a base carregada (demo ou importada) — nada
  // aqui é retroativamente "recalculado como se o modelo já existisse";
  // riscos críticos ativos e ainda não violados são o que o motor de risco
  // já identifica agora, em tempo real.
  const semIntervencao = useMemo(
    () => incidentes.filter((i) => i.status_incidente === "Sem Intervenção").length,
    [incidentes],
  );
  const foraOla = useMemo(() => {
    const elegiveis = incidentes.filter((i) => i.elegivel_kpi);
    return elegiveis.filter((i) => !i.dentro_ola).length;
  }, [incidentes]);
  const pctMonitoramento = useMemo(() => {
    if (!incidentes.length) return 0;
    return (
      (incidentes.filter((i) => i.origem_incidente === "Monitoramento").length /
        incidentes.length) *
      100
    );
  }, [incidentes]);

  const riscosCriticosAtivos = useMemo(
    () => riscos.filter((r) => r.faixa_risco === "Crítico" && r.status === "Ativo"),
    [riscos],
  );
  // Antecedência média = só entre os riscos que ainda não estouraram o SLA
  // (tempo_restante_minutos > 0). Um risco já atrasado não tem "antecedência"
  // — misturar esses valores negativos na média distorceria (ou até
  // inverteria o sinal de) essa métrica, que é justamente sobre pegar o
  // problema antes de virar violação.
  const riscosCriticosDentroDoPrazo = useMemo(
    () => riscosCriticosAtivos.filter((r) => r.tempo_restante_minutos > 0),
    [riscosCriticosAtivos],
  );
  const tempoMedioAntecedencia = useMemo(() => {
    if (!riscosCriticosDentroDoPrazo.length) return 0;
    return Math.round(
      riscosCriticosDentroDoPrazo.reduce((s, r) => s + r.tempo_restante_minutos, 0) /
        riscosCriticosDentroDoPrazo.length,
    );
  }, [riscosCriticosDentroDoPrazo]);

  const prev1 = useMemo(
    () => previsoes.filter((p) => p.horizonte === "D+1").reduce((s, p) => s + p.volume_previsto, 0),
    [previsoes],
  );
  const prev7 = useMemo(
    () => previsoes.filter((p) => p.horizonte === "D+7").reduce((s, p) => s + p.volume_previsto, 0),
    [previsoes],
  );

  const efetividade = useMemo(() => {
    const definidas = acoes.filter((a) => a.classificacao !== "Pendente");
    if (!definidas.length) return null;
    return (definidas.filter((a) => a.classificacao === "Efetiva").length / definidas.length) * 100;
  }, [acoes]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Impacto"
        subtitle="O que muda para a Locaweb do cenário reativo para o preditivo"
      />

      <Card className="p-6 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <p className="text-sm leading-relaxed">
            Hoje, <b>{fmtNumber(semIntervencao)}</b> incidentes na base carregada tiveram status{" "}
            <b>&ldquo;Sem Intervenção&rdquo;</b> — o problema aconteceu e ninguém agiu antes. O Data
            Galaxy já identifica <b>{fmtNumber(riscosCriticosAtivos.length)}</b> riscos críticos{" "}
            <b>ainda ativos</b>
            {riscosCriticosDentroDoPrazo.length > 0 ? (
              <>
                , dos quais <b>{riscosCriticosDentroDoPrazo.length}</b> ainda podem ser resolvidos{" "}
                <b>antes de virarem violação</b> (antecedência média de{" "}
                <b>{fmtDuracaoMin(tempoMedioAntecedencia)}</b>).
              </>
            ) : (
              <>
                {" "}
                — nenhum deles dentro do prazo de SLA no momento, o que também é um sinal: são
                situações que o monitoramento tradicional nunca teria sinalizado, e que agora ficam
                visíveis e priorizáveis em vez de invisíveis.
              </>
            )}
          </p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Reativo */}
        <Card className="p-6 space-y-4 border-[color:var(--critical)]/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[color:var(--critical)]" />
            <div>
              <div className="text-sm font-semibold">Cenário reativo</div>
              <div className="text-xs text-muted-foreground">Sem o Data Galaxy — hoje</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              label="Sem Intervenção"
              value={fmtNumber(semIntervencao)}
              accent="critical"
              hint="Aconteceu, ninguém agiu"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <KPICard
              label="Fora do OLA"
              value={fmtNumber(foraOla)}
              accent="critical"
              hint="Violações já consumadas"
              icon={<ShieldAlert className="h-4 w-4" />}
            />
          </div>
          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground leading-relaxed">
            <b className="text-foreground">{pct(pctMonitoramento)}</b> das aberturas vêm de
            monitoramento automático — o modelo atual avisa quando o problema{" "}
            <b className="text-foreground">já aconteceu</b>, não antes disso.
          </div>
        </Card>

        {/* Preditivo */}
        <Card className="p-6 space-y-4 border-[color:var(--success)]/20">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-[color:var(--success)]" />
            <div>
              <div className="text-sm font-semibold">Cenário preditivo</div>
              <div className="text-xs text-muted-foreground">Com o Data Galaxy — agora</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              label="Riscos pegos a tempo"
              value={fmtNumber(riscosCriticosDentroDoPrazo.length)}
              accent="success"
              hint={
                riscosCriticosDentroDoPrazo.length > 0
                  ? `~${fmtDuracaoMin(tempoMedioAntecedencia)} de antecedência`
                  : `de ${fmtNumber(riscosCriticosAtivos.length)} críticos ativos identificados`
              }
              icon={<ShieldAlert className="h-4 w-4" />}
            />
            <KPICard
              label="Correções efetivas"
              value={efetividade == null ? "—" : pct(efetividade)}
              accent="success"
              hint="Validadas, não só aplicadas"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <KPICard
              label="Previsão D+1"
              value={fmtNumber(prev1)}
              accent="orange"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <KPICard
              label="Previsão D+7"
              value={fmtNumber(prev7)}
              accent="orange"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>
          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
            <Bell className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Ao identificar um risco, o grupo responsável é notificado em segundos via{" "}
              <b className="text-foreground">WhatsApp, SMS ou Teams</b> — não depende de alguém
              perceber o problema sozinho.
            </span>
          </div>
          <Link
            to="/riscos-ola"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Ver riscos ativos agora <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
      </div>
    </div>
  );
}
