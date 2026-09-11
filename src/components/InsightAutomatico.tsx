// Insight proativo — um card gerado automaticamente no Dashboard, sem
// precisar abrir o Assistente/Órbita IA e perguntar. Puramente regra local
// sobre os dados já carregados (sem custo de IA): pega o sinal mais
// relevante do momento (concentração de risco crítico num grupo,
// cumprimento de OLA abaixo do ideal, ou — na ausência de alerta — um
// resumo neutro) e mostra em destaque. Mesma lógica de honestidade do
// resto do produto: só afirma o que dá pra calcular direto da base.
import { Card } from "@/components/ui/card";
import { Sparkle, ShieldAlert, TrendingDown, CheckCircle2 } from "lucide-react";
import type { Incidente, RiscoOla } from "@/lib/types";

type Nivel = "critico" | "atencao" | "positivo";

interface Insight {
  nivel: Nivel;
  texto: string;
}

const ESTILO: Record<
  Nivel,
  { icon: typeof ShieldAlert; cor: string; borda: string; fundo: string }
> = {
  critico: {
    icon: ShieldAlert,
    cor: "var(--critical)",
    borda: "border-[color:var(--critical)]/35",
    fundo: "bg-[color:var(--critical)]/8",
  },
  atencao: {
    icon: TrendingDown,
    cor: "var(--warning)",
    borda: "border-[color:var(--warning)]/35",
    fundo: "bg-[color:var(--warning)]/8",
  },
  positivo: {
    icon: CheckCircle2,
    cor: "var(--success)",
    borda: "border-[color:var(--success)]/35",
    fundo: "bg-[color:var(--success)]/8",
  },
};

function gerarInsight(riscos: RiscoOla[], incidentes: Incidente[]): Insight {
  const riscosCriticosAtivos = riscos.filter(
    (r) => r.status === "Ativo" && r.faixa_risco === "Crítico",
  );

  // Prioridade 1: concentração de risco crítico num único grupo — o sinal
  // mais acionável (pra onde direcionar reforço agora).
  if (riscosCriticosAtivos.length >= 3) {
    const porGrupo = new Map<string, number>();
    for (const r of riscosCriticosAtivos) porGrupo.set(r.grupo, (porGrupo.get(r.grupo) ?? 0) + 1);
    const [grupoTop, qtd] = [...porGrupo.entries()].sort((a, b) => b[1] - a[1])[0];
    const pctConcentracao = Math.round((qtd / riscosCriticosAtivos.length) * 100);
    if (pctConcentracao >= 40) {
      return {
        nivel: "critico",
        texto: `${grupoTop} concentra ${pctConcentracao}% dos ${riscosCriticosAtivos.length} riscos críticos ativos agora — considere reforçar essa equipe antes que o SLA se esgote.`,
      };
    }
  }

  // Prioridade 2: cumprimento de OLA abaixo do ideal.
  const elegiveis = incidentes.filter((i) => i.elegivel_kpi);
  if (elegiveis.length > 0) {
    const dentroOla = elegiveis.filter((i) => i.dentro_ola).length;
    const cumprimento = (dentroOla / elegiveis.length) * 100;
    if (cumprimento < 85) {
      return {
        nivel: "atencao",
        texto: `Cumprimento de OLA em ${cumprimento.toFixed(1)}% — ${fmtN(elegiveis.length - dentroOla)} incidente(s) elegível(is) ficaram fora do prazo na base atual.`,
      };
    }
  }

  // Sem sinal de alerta: resumo neutro/positivo em vez de não mostrar nada.
  const riscosAtivos = riscos.filter((r) => r.status === "Ativo");
  if (riscosAtivos.length === 0) {
    return {
      nivel: "positivo",
      texto: "Nenhum risco de OLA ativo no momento — operação sob controle.",
    };
  }
  return {
    nivel: "positivo",
    texto: `${fmtN(riscosAtivos.length)} risco(s) de OLA ativo(s), sem concentração crítica em um único grupo — operação distribuída.`,
  };
}

function fmtN(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

export function InsightAutomatico({
  riscos,
  incidentes,
}: {
  riscos: RiscoOla[];
  incidentes: Incidente[];
}) {
  const insight = gerarInsight(riscos, incidentes);
  const { icon: Icon, cor, borda, fundo } = ESTILO[insight.nivel];

  return (
    <Card className={`flex items-start gap-3 p-4 ${borda} ${fundo}`}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${cor} 18%, transparent)` }}
      >
        <Icon className="h-4 w-4" style={{ color: cor }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <Sparkle className="h-2.5 w-2.5" /> Insight automático
        </div>
        <p className="mt-0.5 text-sm leading-relaxed">{insight.texto}</p>
      </div>
    </Card>
  );
}
