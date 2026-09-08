// Sincroniza dados reais do Databricks (catálogo fiap_analytics) pro Dexie
// local — depois disso, TODAS as telas e o Assistente passam a refletir
// esses dados automaticamente, porque já leem do mesmo Dexie que o CSV
// import e a seed demo sempre alimentaram. Não precisa de nenhum código
// especial no Assistente pra "usar Databricks": ele só lê `useIncidentes`
// etc. como sempre leu.
//
// Mapeamento verificado contra o schema real (DESCRIBE + SELECT * LIMIT nas
// tabelas), não inventado — ver comentários por campo abaixo pra rastrear a
// origem de cada um.
import { executarConsultaDatabricks, linhasComoObjetos } from "./databricks";
import type { Incidente, Previsao, RiscoOla, Prioridade, FaixaRisco } from "./types";

// A Statement Execution API do Databricks devolve TODA célula como string no
// data_array (mesmo colunas BOOLEAN vêm como "true"/"false" em texto) — usar
// Boolean(valor) direto é um bug clássico aqui, porque "false" (string) é
// truthy em JS. Esse helper compara o texto de verdade.
function paraBooleano(valor: unknown): boolean {
  return String(valor).toLowerCase() === "true";
}

// ── Incidentes (gold.fato_incidentes + dimensões) ──────────────────────────

export const QUERY_INCIDENTES = `
SELECT
  f.numero,
  dpr.cod_prioridade,
  dp.cod_produto,
  dc.categoria,
  dc.subcategoria,
  dg.nome_grupo,
  dic.cod_item_config,
  ds.desc_status,
  dcf.desc_codigo_fechamento,
  dsol.desc_solucao,
  doa.desc_origem,
  f.incidente_pai,
  f.dt_aberto,
  f.dt_resolvido,
  f.dt_encerrado,
  f.duracao_seg,
  f.fl_entrou_kpi,
  f.fl_kpi_violado,
  f.descricao_resumida
FROM fiap_analytics.gold.fato_incidentes f
LEFT JOIN fiap_analytics.gold.dim_prioridade dpr ON dpr.sk_prioridade = f.sk_prioridade
LEFT JOIN fiap_analytics.gold.dim_produto dp ON dp.sk_produto = f.sk_produto
LEFT JOIN fiap_analytics.gold.dim_categoria dc ON dc.sk_categoria = f.sk_categoria
LEFT JOIN fiap_analytics.gold.dim_grupo dg ON dg.sk_grupo = f.sk_grupo
LEFT JOIN fiap_analytics.gold.dim_item_configuracao dic ON dic.sk_item_config = f.sk_item_config
LEFT JOIN fiap_analytics.gold.dim_status ds ON ds.sk_status = f.sk_status
LEFT JOIN fiap_analytics.gold.dim_codigo_fechamento dcf ON dcf.sk_codigo_fechamento = f.sk_codigo_fechamento
LEFT JOIN fiap_analytics.gold.dim_solucao dsol ON dsol.sk_solucao = f.sk_solucao
LEFT JOIN fiap_analytics.gold.dim_origem_abertura doa ON doa.sk_origem = f.sk_origem
ORDER BY f.dt_aberto DESC
`.trim();

export function mapearIncidente(row: Record<string, unknown>): Incidente {
  // dim_prioridade.cod_prioridade é 1-5; quando a origem não tem prioridade
  // identificada (sk -1), cai em P5 — não existe "prioridade desconhecida"
  // no nosso tipo, então usamos a mais baixa como fallback declarado aqui.
  const codPrioridade = row.cod_prioridade != null ? Number(row.cod_prioridade) : null;
  const prioridade: Prioridade =
    codPrioridade && codPrioridade >= 1 && codPrioridade <= 5
      ? (`P${codPrioridade}` as Prioridade)
      : "P5";

  const origem = String(row.desc_origem ?? "Não informado");
  const duracaoSegundos = Number(row.duracao_seg ?? 0);

  return {
    numero_incidente: String(row.numero ?? ""),
    prioridade,
    produto: row.cod_produto != null ? String(row.cod_produto) : null,
    categoria: row.categoria != null ? String(row.categoria) : null,
    subcategoria: row.subcategoria != null ? String(row.subcategoria) : null,
    grupo_designado: row.nome_grupo != null ? String(row.nome_grupo) : "Não informado",
    item_configuracao: row.cod_item_config != null ? String(row.cod_item_config) : null,
    data_abertura: row.dt_aberto ? String(row.dt_aberto) : "",
    data_resolucao: row.dt_resolvido ? String(row.dt_resolvido) : undefined,
    data_encerramento: row.dt_encerrado ? String(row.dt_encerrado) : undefined,
    duracao_segundos: duracaoSegundos,
    status_incidente: String(row.desc_status ?? "Não informado"),
    codigo_fechamento:
      row.desc_codigo_fechamento != null ? String(row.desc_codigo_fechamento) : null,
    descricao_resumida: String(row.descricao_resumida ?? ""),
    solucao: row.desc_solucao != null ? String(row.desc_solucao) : null,
    aberto_por: origem,
    incidente_pai: row.incidente_pai ? String(row.incidente_pai) : undefined,
    // fl_entrou_kpi/fl_kpi_violado já vêm calculados pela pipeline real do
    // Databricks — usamos direto em vez de recalcular localmente.
    elegivel_kpi: paraBooleano(row.fl_entrou_kpi),
    dentro_ola: !paraBooleano(row.fl_kpi_violado),
    origem_incidente: origem,
    tipo_abertura: /monitor/i.test(origem) ? "Automática" : "Manual",
    origem_dado: "IMPORTADO",
    gerado_para_mvp: false,
  };
}

// ── Previsões (ml.previsao_futuro) ──────────────────────────────────────────

export const QUERY_PREVISOES = `
SELECT data, horizonte, previsto, baseline, dt_geracao
FROM fiap_analytics.ml.previsao_futuro
WHERE unique_id = 'total' AND horizonte IN (1, 7)
ORDER BY data
`.trim();

export function mapearPrevisao(row: Record<string, unknown>): Previsao {
  const horizonteNum = Number(row.horizonte);
  const horizonte = horizonteNum === 1 ? "D+1" : "D+7";
  const previsto = Number(row.previsto ?? 0);

  return {
    id_previsao: `DB-${horizonte}-${row.data}`,
    data_execucao: row.dt_geracao ? String(row.dt_geracao) : new Date().toISOString(),
    data_prevista: String(row.data ?? ""),
    horizonte,
    // ml.previsao_futuro é uma série agregada (não quebrada por produto) —
    // "Todos os produtos" deixa isso explícito em vez de fingir que é de um
    // produto específico.
    produto: "Todos os produtos",
    volume_previsto: previsto,
    // A tabela não traz intervalo de confiança — usamos o próprio valor
    // previsto como os dois limites (intervalo de largura zero) em vez de
    // inventar uma margem que a origem não fornece.
    limite_inferior: previsto,
    limite_superior: previsto,
    modelo: "Databricks (ml.previsao_futuro)",
    versao_modelo: "gold/ml pipeline",
    origem_dado: "IMPORTADO",
    gerado_para_mvp: false,
  };
}

// ── Riscos de OLA (ml.risco_violacao + fato_incidentes) ────────────────────

export const QUERY_RISCOS = `
SELECT
  rv.numero,
  rv.duracao_prevista_seg,
  rv.faixa_risco,
  rv.dt_geracao,
  f.fl_resolvido,
  f.sla_limite_seg,
  f.duracao_seg,
  f.pct_consumo_sla,
  dp.cod_produto,
  dg.nome_grupo,
  dpr.cod_prioridade
FROM fiap_analytics.ml.risco_violacao rv
JOIN fiap_analytics.gold.fato_incidentes f ON f.numero = rv.numero
LEFT JOIN fiap_analytics.gold.dim_produto dp ON dp.sk_produto = f.sk_produto
LEFT JOIN fiap_analytics.gold.dim_grupo dg ON dg.sk_grupo = f.sk_grupo
LEFT JOIN fiap_analytics.gold.dim_prioridade dpr ON dpr.sk_prioridade = f.sk_prioridade
ORDER BY f.fl_resolvido ASC, rv.dt_geracao DESC
`.trim();
// ORDER BY fl_resolvido ASC traz primeiro os incidentes ainda em aberto (a
// minoria — a maior parte de risco_violacao é histórico já resolvido). Sem
// LIMIT: traz a tabela inteira, já que ela é pequena (pouco mais de mil
// linhas) — a tela de Riscos de OLA filtra por padrão só os "Ativo" (ver
// src/routes/_app.riscos-ola.tsx), o histórico fica disponível como opção.

// faixa_risco real vem como "1_ALTO (prevê estouro)", "2_ATENCAO (>70% do
// prazo)", "3_MODERADO", "4_BAIXO" — o prefixo numérico é a ordem de
// severidade real (1 = pior), então "1_ALTO" mapeia pra "Crítico" no nosso
// enum de 4 faixas, mesmo o texto dizendo "ALTO".
function mapearFaixaRisco(bruto: string): FaixaRisco {
  if (bruto.startsWith("1_")) return "Crítico";
  if (bruto.startsWith("2_")) return "Alto";
  if (bruto.startsWith("3_")) return "Médio";
  return "Baixo";
}

export function mapearRisco(row: Record<string, unknown>): RiscoOla {
  const faixaBruta = String(row.faixa_risco ?? "4_BAIXO");
  const faixa_risco = mapearFaixaRisco(faixaBruta);

  const slaLimiteSeg = Number(row.sla_limite_seg ?? 0);
  const duracaoSeg = Number(row.duracao_seg ?? 0);
  const tempoRestanteMinutos = Math.round((slaLimiteSeg - duracaoSeg) / 60);

  // pct_consumo_sla é real (vem da pipeline), mas pode passar de 100% em
  // casos já muito estourados — limitamos a 100 só pra caber no campo
  // "probabilidade" de 0-100 do nosso tipo, sem inventar o número em si.
  const pctConsumo = Number(row.pct_consumo_sla ?? 0);
  const probabilidade_violacao = Math.max(0, Math.min(100, Math.round(pctConsumo)));

  const codPrioridade = row.cod_prioridade != null ? Number(row.cod_prioridade) : null;
  const prioridade: Prioridade =
    codPrioridade && codPrioridade >= 1 && codPrioridade <= 5
      ? (`P${codPrioridade}` as Prioridade)
      : "P5";

  const fatores: string[] = [];
  if (pctConsumo > 100) fatores.push("SLA já estourado");
  else if (pctConsumo > 70) fatores.push("Consumo de SLA elevado");
  if (faixaBruta.includes("prevê estouro")) fatores.push("Modelo prevê estouro");
  if (fatores.length === 0) fatores.push("Dentro do padrão observado");

  return {
    id_risco: `DB-${row.numero}`,
    numero_incidente: String(row.numero ?? ""),
    data_calculo: row.dt_geracao ? String(row.dt_geracao) : new Date().toISOString(),
    probabilidade_violacao,
    faixa_risco,
    tempo_restante_minutos: tempoRestanteMinutos,
    // As dimensões de causa detalhada (recorrência, pico de volume...) não
    // existem nesta tabela do Databricks — deixamos false em vez de inferir
    // um valor que a origem não calcula.
    alta_recorrencia: false,
    pico_volume: false,
    grupo_sobrecarregado: false,
    tempo_medio_elevado: pctConsumo > 70,
    produto_critico: false,
    historico_violacao: faixaBruta.includes("prevê estouro"),
    fatores_risco: fatores,
    produto: row.cod_produto != null ? String(row.cod_produto) : "Não informado",
    prioridade,
    grupo: row.nome_grupo != null ? String(row.nome_grupo) : "Não informado",
    // O incidente correspondente já resolvido = risco mitigado; ainda
    // aberto = risco ativo. Vem do fl_resolvido real do fato, não de um
    // status próprio desta tabela (que não existe).
    status: paraBooleano(row.fl_resolvido) ? "Mitigado" : "Ativo",
    origem_dado: "IMPORTADO",
    gerado_para_mvp: false,
  };
}

// ── Orquestração ─────────────────────────────────────────────────────────

export interface ResultadoSincronizacao {
  ok: boolean;
  motivo?: string;
  detalhe?: string;
  incidentes?: number;
  previsoes?: number;
  riscos?: number;
}

export async function sincronizarDatabricks(): Promise<ResultadoSincronizacao> {
  const [resIncidentes, resPrevisoes, resRiscos] = await Promise.all([
    executarConsultaDatabricks(QUERY_INCIDENTES),
    executarConsultaDatabricks(QUERY_PREVISOES),
    executarConsultaDatabricks(QUERY_RISCOS),
  ]);

  if (!resIncidentes.ok) {
    return { ok: false, motivo: resIncidentes.motivo, detalhe: resIncidentes.detalhe };
  }
  if (!resPrevisoes.ok) {
    return { ok: false, motivo: resPrevisoes.motivo, detalhe: resPrevisoes.detalhe };
  }
  if (!resRiscos.ok) {
    return { ok: false, motivo: resRiscos.motivo, detalhe: resRiscos.detalhe };
  }

  const incidentes = linhasComoObjetos(resIncidentes).map(mapearIncidente);
  const previsoes = linhasComoObjetos(resPrevisoes).map(mapearPrevisao);
  const riscos = linhasComoObjetos(resRiscos).map(mapearRisco);

  const { db } = await import("./db");
  await db.incidentes.clear();
  await db.previsoes.clear();
  await db.riscos.clear();
  await db.incidentes.bulkAdd(incidentes);
  await db.previsoes.bulkAdd(previsoes);
  await db.riscos.bulkAdd(riscos);

  return {
    ok: true,
    incidentes: incidentes.length,
    previsoes: previsoes.length,
    riscos: riscos.length,
  };
}
