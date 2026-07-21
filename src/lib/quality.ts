import type { Incidente, Prioridade } from "./types";

const PRIORIDADES_VALIDAS: Prioridade[] = ["P1", "P2", "P3", "P4", "P5"];

// Campos relevantes para a análise de qualidade — cobertura/nulos.
const COLUNAS_RELEVANTES: (keyof Incidente)[] = [
  "numero_incidente",
  "prioridade",
  "produto",
  "categoria",
  "subcategoria",
  "grupo_designado",
  "codigo_fechamento",
  "solucao",
  "data_abertura",
  "data_resolucao",
  "status_incidente",
];

export interface QualityReport {
  totalRegistros: number;
  vaziosPorColuna: Record<string, number>;
  percentualVazioPorColuna: Record<string, number>;
  duplicados: number;
  datasInvalidas: number;
  duracoesNegativas: number;
  prioridadesInvalidas: number;
  distribuicaoNulos: Record<string, number>;
  coberturaProduto: number;
  coberturaCategoria: number;
  coberturaSubcategoria: number;
  coberturaSolucao: number;
  coberturaDataResolucao: number;
  inconsistenciasDatas: number;
  registrosAptosPct: number;
  registrosRejeitados: Array<Record<string, unknown>>;
}

function isVazio(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

/**
 * Calcula um relatório de qualidade sobre um conjunto de incidentes já
 * mapeados para os nomes de campo internos da aplicação (ver types.ts).
 * Usado tanto no fluxo de importação (antes da confirmação) quanto na tela
 * de Qualidade de Dados (sobre os dados atualmente carregados).
 */
export function computeQualityReport(rows: Partial<Incidente>[]): QualityReport {
  const total = rows.length;
  const vaziosPorColuna: Record<string, number> = {};
  for (const col of COLUNAS_RELEVANTES) vaziosPorColuna[col] = 0;

  let datasInvalidas = 0;
  let duracoesNegativas = 0;
  let prioridadesInvalidas = 0;
  let inconsistenciasDatas = 0;
  const vistos = new Set<string>();
  let duplicados = 0;
  const registrosRejeitados: Array<Record<string, unknown>> = [];

  for (const r of rows) {
    for (const col of COLUNAS_RELEVANTES) {
      if (isVazio(r[col])) vaziosPorColuna[col]++;
    }

    const numero = r.numero_incidente;
    if (numero) {
      if (vistos.has(numero)) {
        duplicados++;
        registrosRejeitados.push({ motivo: "duplicado", numero_incidente: numero });
      } else {
        vistos.add(numero);
      }
    }

    if (r.prioridade && !PRIORIDADES_VALIDAS.includes(r.prioridade)) prioridadesInvalidas++;

    const abertura = r.data_abertura ? new Date(r.data_abertura) : undefined;
    const resolucao = r.data_resolucao ? new Date(r.data_resolucao) : undefined;
    if (r.data_abertura && (!abertura || Number.isNaN(abertura.getTime()))) datasInvalidas++;
    if (r.data_resolucao && (!resolucao || Number.isNaN(resolucao.getTime()))) datasInvalidas++;
    if (
      abertura &&
      resolucao &&
      !Number.isNaN(abertura.getTime()) &&
      !Number.isNaN(resolucao.getTime())
    ) {
      if (resolucao.getTime() < abertura.getTime()) inconsistenciasDatas++;
    }

    if (typeof r.duracao_segundos === "number" && r.duracao_segundos < 0) duracoesNegativas++;
  }

  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
  const percentualVazioPorColuna: Record<string, number> = {};
  for (const col of COLUNAS_RELEVANTES) percentualVazioPorColuna[col] = pct(vaziosPorColuna[col]);

  const problemasTotais = datasInvalidas + duracoesNegativas + prioridadesInvalidas + duplicados;
  const registrosAptosPct = total
    ? Math.max(0, Math.round(((total - problemasTotais) / total) * 1000) / 10)
    : 0;

  return {
    totalRegistros: total,
    vaziosPorColuna,
    percentualVazioPorColuna,
    duplicados,
    datasInvalidas,
    duracoesNegativas,
    prioridadesInvalidas,
    distribuicaoNulos: vaziosPorColuna,
    coberturaProduto: 100 - percentualVazioPorColuna.produto,
    coberturaCategoria: 100 - percentualVazioPorColuna.categoria,
    coberturaSubcategoria: 100 - percentualVazioPorColuna.subcategoria,
    coberturaSolucao: 100 - percentualVazioPorColuna.solucao,
    coberturaDataResolucao: 100 - percentualVazioPorColuna.data_resolucao,
    inconsistenciasDatas,
    registrosAptosPct,
    registrosRejeitados,
  };
}
