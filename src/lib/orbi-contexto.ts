// Contexto que a Orbi mostra ao abrir em cada tela — o "estado inicial" do
// painel antes de qualquer pergunta: um resumo de uma linha da tela, ações
// recomendadas (cada uma já é um prompt pronto) e sugestões rápidas. Só as
// quatro telas citadas no pedido têm contexto dedicado; as demais caem no
// fallback, que reaproveita a descrição já cadastrada em telas.ts.
//
// As ações citadas na referência ("Gerar relatório", "Ajudar com SQL") foram
// trocadas por equivalentes reais: o produto não tem gerador de relatório
// nem console SQL, e a Orbi nunca promete uma funcionalidade que não existe
// — mesma regra do resto do produto.
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  ShieldAlert,
  TrendingUp,
  Wrench,
  BarChart3,
  GitCompare,
  PieChart,
  History,
  Users,
  SlidersHorizontal,
  Bell,
  AlertTriangle,
  Info,
} from "lucide-react";
import type { Tela } from "./telas";

export interface OrbiAcao {
  icon: LucideIcon;
  label: string;
  desc: string;
  prompt: string;
}

export interface OrbiContexto {
  contexto: string;
  acoes: OrbiAcao[];
  sugestoes: string[];
}

const CONTEXTOS: Record<string, OrbiContexto> = {
  "/dashboard": {
    contexto: "KPIs do dia, previsão, OLA e a fila de riscos mais urgentes",
    acoes: [
      {
        icon: BarChart3,
        label: "Resumo do dia",
        desc: "Panorama rápido do que está acontecendo agora",
        prompt: "O que preciso saber agora?",
      },
      {
        icon: ShieldAlert,
        label: "Riscos críticos",
        desc: "Quais riscos de OLA estão ativos e mais urgentes",
        prompt: "Quais riscos críticos estão ativos?",
      },
      {
        icon: TrendingUp,
        label: "Previsão da semana",
        desc: "Volume esperado de incidentes em D+7",
        prompt: "Qual a previsão de volume D+7?",
      },
      {
        icon: Wrench,
        label: "Efetividade das correções",
        desc: "Quantas ações corretivas realmente funcionaram",
        prompt: "As correções estão sendo efetivas?",
      },
    ],
    sugestoes: [
      "Como está o cumprimento de OLA?",
      "Qual grupo está mais sobrecarregado?",
      "Tem alerta pendente?",
    ],
  },

  "/previsoes": {
    contexto: "D+1 e D+7 · AutoETS e Seasonal Naive",
    acoes: [
      {
        icon: Sparkles,
        label: "Explicar esta previsão",
        desc: "Entenda os fatores que influenciam o resultado",
        prompt: "O que tem na tela de Previsões?",
      },
      {
        icon: GitCompare,
        label: "Comparar períodos",
        desc: "Veja a diferença entre D+1 e D+7",
        prompt: "Qual a diferença entre a previsão D+1 e D+7?",
      },
      {
        icon: PieChart,
        label: "Analisar por produto",
        desc: "Identifique os principais impactos por produto",
        prompt: "Qual produto tem maior volume previsto?",
      },
      {
        icon: History,
        label: "Histórico vs. previsão",
        desc: "Compare o volume real com o previsto",
        prompt: "Como está o histórico comparado à previsão?",
      },
    ],
    sugestoes: [
      "Por que o D+1 é menor que o D+7?",
      "Qual grupo mais impacta a previsão?",
      "Qual a previsão por produto?",
    ],
  },

  "/riscos-ola": {
    contexto: "Fila ordenada por probabilidade de violação",
    acoes: [
      {
        icon: ShieldAlert,
        label: "Riscos críticos agora",
        desc: "Os riscos com maior chance de violar o OLA",
        prompt: "Quais riscos críticos estão ativos?",
      },
      {
        icon: Users,
        label: "Grupo mais sobrecarregado",
        desc: "Quem concentra mais risco ativo agora",
        prompt: "Qual grupo está mais sobrecarregado?",
      },
      {
        icon: SlidersHorizontal,
        label: "Simular reforço de equipe",
        desc: "Como o simulador estima o impacto de reforçar um grupo",
        prompt: "Como funciona o simulador de reforço de equipe?",
      },
      {
        icon: History,
        label: "Linha do tempo de um risco",
        desc: "Onde ver a jornada completa de um incidente",
        prompt: "Como vejo a linha do tempo completa de um incidente?",
      },
    ],
    sugestoes: [
      "Qual o risco mais urgente agora?",
      "Quantos riscos já passaram do prazo de SLA?",
      "O que significa 'grupo sobrecarregado'?",
    ],
  },

  "/alertas": {
    contexto: "Reconhecer, tratar e finalizar alertas operacionais",
    acoes: [
      {
        icon: Bell,
        label: "Alertas pendentes",
        desc: "O que ainda não foi reconhecido",
        prompt: "Tem alerta pendente?",
      },
      {
        icon: AlertTriangle,
        label: "Mais urgentes agora",
        desc: "Prioridade de investigação pela severidade",
        prompt: "Quais alertas são mais urgentes agora?",
      },
      {
        icon: Info,
        label: "Como funciona esta tela",
        desc: "O que cada estado de alerta significa",
        prompt: "O que tem na tela de Alertas?",
      },
    ],
    sugestoes: ["Quantos alertas críticos existem?", "Qual produto tem mais alertas?"],
  },
};

/** Fallback pra qualquer tela sem contexto dedicado — reaproveita telas.ts. */
export function contextoDaTela(rota: string, tela: Tela | undefined): OrbiContexto {
  const dedicado = CONTEXTOS[rota];
  if (dedicado) return dedicado;

  return {
    contexto: tela?.descricao.split(".")[0] ?? "Data Galaxy",
    acoes: tela
      ? [
          {
            icon: Info,
            label: "O que tem nesta tela?",
            desc: "Entenda o que esta tela mostra",
            prompt: `O que tem na tela de ${tela.nome}?`,
          },
        ]
      : [],
    sugestoes: [],
  };
}
