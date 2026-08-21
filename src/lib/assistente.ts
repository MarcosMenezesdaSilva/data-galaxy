// Motor do Assistente Data Galaxy: classifica a intenção da pergunta e monta
// a resposta com base SOMENTE nos dados carregados no navegador (incidentes,
// riscos de OLA, alertas, ações corretivas e previsões — via Dexie). Não há
// modelo de linguagem por trás: é um classificador por palavra-chave que
// resolve contra os dados reais, exatamente para poder afirmar "baseado nos
// nossos dados" sem margem de invenção.
import type { AcaoCorretiva, Alerta, Incidente, Previsao, RiscoOla } from "./types";
import type { Perfil } from "./store";
import { fmtNumber, pct } from "./format";
import { TELAS, type Tela } from "./telas";
import { podeAcessar } from "./permissions";

export type Intencao =
  | "resumo_hoje"
  | "riscos_criticos"
  | "previsao_d1"
  | "previsao_d7"
  | "cumprimento_ola"
  | "grupo_sobrecarregado"
  | "efetividade_correcoes"
  | "alertas_pendentes"
  | "produto_risco"
  | "comparativo_impacto"
  | "explicar_tela"
  | "fallback"
  | "fora_escopo";

export interface Resposta {
  intencao: Intencao;
  resumo: string;
  detalhe?: string;
  recomendacao?: string;
  numeros: { label: string; valor: string }[];
  foraEscopo?: boolean;
}

function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function algumaPalavra(texto: string, palavras: string[]): boolean {
  const t = normalizar(texto);
  return palavras.some((p) => t.includes(normalizar(p)));
}

// Tenta achar um grupo ou produto citado na pergunta, comparando contra os
// valores que realmente existem na base carregada — assim a resposta nunca
// filtra por algo que não existe nos dados.
function extrairEntidade(
  pergunta: string,
  grupos: string[],
  produtos: string[],
): { grupo?: string; produto?: string } {
  const t = normalizar(pergunta);
  const grupo = grupos.find((g) => g.length > 2 && t.includes(normalizar(g)));
  const produto = produtos.find((p) => p.length > 2 && t.includes(normalizar(p)));
  return { grupo, produto };
}

// Acha a tela citada na pergunta comparando contra nome/apelidos do
// catálogo — pega o apelido mais longo que casar, pra evitar que um apelido
// curto e genérico (ex.: "alertas") ganhe de um mais específico por engano.
function extrairTela(pergunta: string): Tela | undefined {
  const t = normalizar(pergunta);
  let melhor: { tela: Tela; tamanho: number } | undefined;
  for (const tela of TELAS) {
    for (const apelido of tela.apelidos) {
      if (t.includes(normalizar(apelido)) && (!melhor || apelido.length > melhor.tamanho)) {
        melhor = { tela, tamanho: apelido.length };
      }
    }
  }
  return melhor?.tela;
}

export function classificarIntencao(pergunta: string): Intencao {
  if (
    algumaPalavra(pergunta, [
      "o que tem a tela",
      "o que tem na tela",
      "o que mostra a tela",
      "o que essa tela",
      "o que aquela tela",
      "pra que serve a tela",
      "para que serve a tela",
      "como funciona a tela",
      "explica a tela",
      "que informacao tem",
      "que informacoes tem",
    ])
  )
    return "explicar_tela";

  if (
    algumaPalavra(pergunta, [
      "reativo",
      "preditivo",
      "antes e depois",
      "sem intervencao",
      "diferenca de ter o sistema",
      "impacto de ter",
    ])
  )
    return "comparativo_impacto";

  if (algumaPalavra(pergunta, ["d+7", "d+ 7", "7 dias", "semana", "semanal"])) return "previsao_d7";
  if (algumaPalavra(pergunta, ["d+1", "d+ 1", "amanha", "previsao", "volume previsto"]))
    return "previsao_d1";

  if (
    algumaPalavra(pergunta, [
      "risco critico",
      "riscos criticos",
      "risco de violacao",
      "vai violar",
      "prestes a violar",
      "atencao agora",
      "prioridade agora",
    ])
  )
    return "riscos_criticos";

  if (
    algumaPalavra(pergunta, [
      "cumprimento de ola",
      "dentro do ola",
      "fora do ola",
      "violacao de ola",
      "sla",
      "quantas violacoes",
    ])
  )
    return "cumprimento_ola";

  if (
    algumaPalavra(pergunta, [
      "sobrecarregado",
      "grupo com mais risco",
      "time com mais",
      "equipe com mais",
      "qual grupo",
      "qual time",
    ])
  )
    return "grupo_sobrecarregado";

  if (
    algumaPalavra(pergunta, [
      "correcao efetiva",
      "correcoes efetivas",
      "acao funcionou",
      "acoes funcionaram",
      "validacao",
      "efetividade",
    ])
  )
    return "efetividade_correcoes";

  if (
    algumaPalavra(pergunta, [
      "alerta pendente",
      "alerta nao reconhecido",
      "alerta em aberto",
      "notificacao pendente",
      "quem nao viu",
    ])
  )
    return "alertas_pendentes";

  if (
    algumaPalavra(pergunta, [
      "resumo",
      "panorama",
      "o que preciso saber",
      "status geral",
      "como esta tudo",
      "visao geral",
      "hoje",
    ])
  )
    return "resumo_hoje";

  // Perguntas mencionando produto/grupo específico caem em produto_risco;
  // a extração de entidade decide se há dado suficiente pra responder.
  if (algumaPalavra(pergunta, ["produto", "grupo", "incidente em", "risco em", "servico"]))
    return "produto_risco";

  if (
    algumaPalavra(pergunta, [
      "clima",
      "futebol",
      "piada",
      "quem e voce",
      "receita",
      "hora e",
      "quanto e",
    ])
  )
    return "fora_escopo";

  return "fallback";
}

export interface DadosAssistente {
  incidentes: Incidente[];
  riscos: RiscoOla[];
  alertas: Alerta[];
  acoes: AcaoCorretiva[];
  previsoes: Previsao[];
}

export function responder(
  pergunta: string,
  dados: DadosAssistente,
  perfil: Perfil | null = null,
): Resposta {
  const { incidentes, riscos, alertas, acoes, previsoes } = dados;
  const intencao = classificarIntencao(pergunta);

  const gruposConhecidos = Array.from(new Set(riscos.map((r) => r.grupo)));
  const produtosConhecidos = Array.from(new Set(riscos.map((r) => r.produto)));
  const { grupo, produto } = extrairEntidade(pergunta, gruposConhecidos, produtosConhecidos);

  const riscosAtivos = riscos.filter((r) => r.status === "Ativo");
  const riscosCriticos = riscosAtivos.filter((r) => r.faixa_risco === "Crítico");

  if (intencao === "explicar_tela") {
    const tela = extrairTela(pergunta);
    if (!tela) {
      const disponiveis = TELAS.filter((t) => podeAcessar(perfil, t.rota));
      return {
        intencao,
        foraEscopo: true,
        resumo: "Não identifiquei qual tela você quer que eu explique.",
        detalhe: `As telas do seu menu são: ${disponiveis.map((t) => t.nome).join(", ")}.`,
        recomendacao: 'Exemplo: "O que tem na tela de Riscos de OLA?"',
        numeros: [],
      };
    }
    const noMenu = podeAcessar(perfil, tela.rota);
    return {
      intencao,
      resumo: `${tela.nome}: ${tela.descricao}`,
      detalhe: noMenu
        ? "Essa tela está no seu menu."
        : "Essa tela não aparece no seu menu atual — está disponível para outros perfis.",
      numeros: [],
    };
  }

  if (intencao === "fora_escopo") {
    return {
      intencao,
      foraEscopo: true,
      resumo: "Essa pergunta está fora do escopo do Data Galaxy.",
      detalhe:
        "Eu respondo só com base nos dados operacionais carregados na plataforma — incidentes, riscos de OLA, alertas, ações corretivas e previsões.",
      recomendacao:
        "Pergunte, por exemplo, sobre riscos críticos ativos, previsão de volume (D+1/D+7), cumprimento de OLA ou efetividade das correções.",
      numeros: [],
    };
  }

  if (intencao === "fallback") {
    return {
      intencao,
      foraEscopo: true,
      resumo:
        "Não encontrei dados suficientes na base carregada para responder isso com segurança.",
      detalhe: "Prefiro dizer que não sei a arriscar um número que os dados não sustentam.",
      recomendacao:
        "Tente perguntar sobre riscos críticos, previsão D+1/D+7, cumprimento de OLA, grupo mais sobrecarregado ou efetividade das correções.",
      numeros: [{ label: "Incidentes na base", valor: fmtNumber(incidentes.length) }],
    };
  }

  switch (intencao) {
    case "resumo_hoje": {
      const alertasNovos = alertas.filter((a) => a.status === "Novo").length;
      return {
        intencao,
        resumo: `Hoje há ${fmtNumber(riscosCriticos.length)} risco(s) crítico(s) de OLA ainda ativos e ${fmtNumber(alertasNovos)} alerta(s) novo(s) sem reconhecimento.`,
        detalhe: `No total, ${fmtNumber(riscosAtivos.length)} riscos estão ativos (todas as faixas) e a base tem ${fmtNumber(incidentes.length)} incidentes carregados.`,
        recomendacao:
          riscosCriticos.length > 0
            ? "Priorize os riscos críticos na tela de Riscos de OLA — eles têm a maior chance de virar violação."
            : "Nenhum risco crítico ativo agora — mantenha o monitoramento dos riscos Alto.",
        numeros: [
          { label: "Riscos críticos ativos", valor: fmtNumber(riscosCriticos.length) },
          { label: "Alertas novos", valor: fmtNumber(alertasNovos) },
          { label: "Incidentes na base", valor: fmtNumber(incidentes.length) },
        ],
      };
    }

    case "riscos_criticos": {
      const top = [...riscosCriticos].sort(
        (a, b) => b.probabilidade_violacao - a.probabilidade_violacao,
      )[0];
      return {
        intencao,
        resumo: riscosCriticos.length
          ? `Existem ${fmtNumber(riscosCriticos.length)} riscos críticos ativos agora, ainda não violados.`
          : "Não há riscos críticos ativos no momento.",
        detalhe: top
          ? `O mais urgente é o incidente ${top.numero_incidente} (${top.produto} · grupo ${top.grupo}), com ${pct(top.probabilidade_violacao)} de probabilidade de violação e ${fmtNumber(top.tempo_restante_minutos)} minutos restantes.`
          : undefined,
        recomendacao: riscosCriticos.length
          ? "Acesse Riscos de OLA e acione o grupo responsável do topo da lista antes que o tempo restante se esgote."
          : "Continue acompanhando os riscos em faixa Alto para evitar que eles escalem para Crítico.",
        numeros: [
          { label: "Riscos críticos ativos", valor: fmtNumber(riscosCriticos.length) },
          { label: "Riscos ativos (todas as faixas)", valor: fmtNumber(riscosAtivos.length) },
        ],
      };
    }

    case "previsao_d1":
    case "previsao_d7": {
      const horizonte = intencao === "previsao_d1" ? "D+1" : "D+7";
      const doHorizonte = previsoes.filter((p) => p.horizonte === horizonte);
      const total = doHorizonte.reduce((s, p) => s + p.volume_previsto, 0);
      const porProduto = new Map<string, number>();
      for (const p of doHorizonte)
        porProduto.set(p.produto, (porProduto.get(p.produto) ?? 0) + p.volume_previsto);
      const top = [...porProduto.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        intencao,
        resumo: doHorizonte.length
          ? `A previsão ${horizonte} soma ${fmtNumber(total)} incidentes esperados.`
          : `Não há previsão ${horizonte} calculada na base atual.`,
        detalhe: top
          ? `O produto com maior volume previsto é ${top[0]}, com ${fmtNumber(top[1])} incidentes estimados.`
          : undefined,
        recomendacao:
          "Veja a tela de Previsões para o detalhamento por produto e o intervalo de confiança do modelo (AutoETS/Seasonal Naive).",
        numeros: [
          { label: `Volume previsto ${horizonte}`, valor: fmtNumber(total) },
          { label: "Produtos previstos", valor: fmtNumber(porProduto.size) },
        ],
      };
    }

    case "cumprimento_ola": {
      const elegiveis = incidentes.filter((i) => i.elegivel_kpi);
      const dentroOla = elegiveis.filter((i) => i.dentro_ola).length;
      const cumprimento = elegiveis.length ? (dentroOla / elegiveis.length) * 100 : 0;
      const foraOla = elegiveis.length - dentroOla;
      return {
        intencao,
        resumo: `O cumprimento de OLA está em ${pct(cumprimento)}, considerando ${fmtNumber(elegiveis.length)} incidentes elegíveis para o KPI.`,
        detalhe: `${fmtNumber(foraOla)} incidente(s) elegível(is) ficaram fora do prazo de OLA na base carregada.`,
        recomendacao:
          foraOla > 0
            ? "Veja Riscos de OLA para agir nos casos ainda ativos antes que aumentem esse número."
            : "Cumprimento em dia — mantenha o monitoramento dos riscos ativos para preservar esse resultado.",
        numeros: [
          { label: "Cumprimento de OLA", valor: pct(cumprimento) },
          { label: "Incidentes fora do OLA", valor: fmtNumber(foraOla) },
        ],
      };
    }

    case "grupo_sobrecarregado": {
      const porGrupo = new Map<string, number>();
      for (const r of riscosAtivos) porGrupo.set(r.grupo, (porGrupo.get(r.grupo) ?? 0) + 1);
      const ranking = [...porGrupo.entries()].sort((a, b) => b[1] - a[1]);
      const top = ranking[0];
      return {
        intencao,
        resumo: top
          ? `O grupo com mais riscos ativos é ${top[0]}, com ${fmtNumber(top[1])} riscos abertos.`
          : "Não há riscos ativos atribuídos a nenhum grupo no momento.",
        detalhe: ranking[1]
          ? `Em seguida vem ${ranking[1][0]}, com ${fmtNumber(ranking[1][1])} riscos ativos.`
          : undefined,
        recomendacao: top
          ? `Considere reforçar ${top[0]} ou redistribuir parte da fila antes que o tempo restante dos riscos se esgote.`
          : undefined,
        numeros: ranking.slice(0, 3).map(([g, n]) => ({ label: g, valor: fmtNumber(n) })),
      };
    }

    case "efetividade_correcoes": {
      const definidas = acoes.filter((a) => a.classificacao !== "Pendente");
      const efetivas = definidas.filter((a) => a.classificacao === "Efetiva").length;
      const efetividade = definidas.length ? (efetivas / definidas.length) * 100 : null;
      return {
        intencao,
        resumo:
          efetividade == null
            ? "Ainda não há ações corretivas validadas o suficiente para calcular efetividade."
            : `${pct(efetividade)} das ações corretivas concluídas foram validadas como efetivas.`,
        detalhe:
          efetividade != null
            ? `São ${fmtNumber(efetivas)} ação(ões) efetiva(s) em ${fmtNumber(definidas.length)} avaliada(s) até agora.`
            : undefined,
        recomendacao:
          "Veja Validação de Correções para o detalhe por janela (7/15/30 dias) e reincidências.",
        numeros: [
          { label: "Ações avaliadas", valor: fmtNumber(definidas.length) },
          { label: "Ações efetivas", valor: fmtNumber(efetivas) },
        ],
      };
    }

    case "alertas_pendentes": {
      const pendentes = alertas.filter((a) => a.status === "Novo" || a.status === "Reconhecido");
      return {
        intencao,
        resumo: pendentes.length
          ? `Há ${fmtNumber(pendentes.length)} alerta(s) ainda sem tratamento finalizado.`
          : "Não há alertas pendentes no momento — todos foram tratados ou finalizados.",
        detalhe: pendentes[0]
          ? `O mais recente é "${pendentes[0].titulo}" (${pendentes[0].severidade}), do grupo ${pendentes[0].grupo_responsavel}.`
          : undefined,
        recomendacao: pendentes.length
          ? "Acesse Alertas para reconhecer e encaminhar os pendentes ao grupo responsável."
          : undefined,
        numeros: [
          { label: "Alertas pendentes", valor: fmtNumber(pendentes.length) },
          { label: "Total de alertas na base", valor: fmtNumber(alertas.length) },
        ],
      };
    }

    case "produto_risco": {
      if (!grupo && !produto) {
        return {
          intencao,
          foraEscopo: true,
          resumo:
            "Não identifiquei um produto ou grupo que exista na base carregada nessa pergunta.",
          detalhe:
            "Cite o nome exato de um produto ou grupo, como aparece nas telas de Riscos de OLA ou Incidentes.",
          recomendacao: 'Exemplo: "Como está o risco no grupo Cloud Operations?"',
          numeros: [],
        };
      }
      const filtrados = riscosAtivos.filter(
        (r) => (!grupo || r.grupo === grupo) && (!produto || r.produto === produto),
      );
      const criticos = filtrados.filter((r) => r.faixa_risco === "Crítico").length;
      const alvo = grupo ?? produto ?? "";
      return {
        intencao,
        resumo: filtrados.length
          ? `${alvo} tem ${fmtNumber(filtrados.length)} risco(s) ativo(s) de OLA, sendo ${fmtNumber(criticos)} crítico(s).`
          : `${alvo} não tem nenhum risco de OLA ativo no momento.`,
        recomendacao:
          criticos > 0 ? "Priorize os riscos críticos desse grupo/produto agora." : undefined,
        numeros: [
          { label: "Riscos ativos", valor: fmtNumber(filtrados.length) },
          { label: "Riscos críticos", valor: fmtNumber(criticos) },
        ],
      };
    }

    case "comparativo_impacto": {
      const semIntervencao = incidentes.filter(
        (i) => i.status_incidente === "Sem Intervenção",
      ).length;
      return {
        intencao,
        resumo: `Sem o Data Galaxy, ${fmtNumber(semIntervencao)} incidentes na base ficaram como "Sem Intervenção" — ninguém agiu antes do problema acontecer.`,
        detalhe: `Hoje o sistema já identifica ${fmtNumber(riscosCriticos.length)} riscos críticos ativos antes de virarem violação.`,
        recomendacao:
          "Veja a tela Impacto para o comparativo completo entre o cenário reativo e o preditivo.",
        numeros: [
          { label: '"Sem Intervenção" na base', valor: fmtNumber(semIntervencao) },
          { label: "Riscos críticos pegos a tempo", valor: fmtNumber(riscosCriticos.length) },
        ],
      };
    }
  }

  return {
    intencao: "fallback",
    foraEscopo: true,
    resumo: "Não consegui montar uma resposta segura para essa pergunta com os dados atuais.",
    numeros: [],
  };
}
