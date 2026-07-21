import type { Incidente, Prioridade } from "./types";

// Colunas oficiais da base tratada da Locaweb (dicionário de dados) usadas
// para detectar se um arquivo .csv/.txt é a base tratada de incidentes.
export const COLUNAS_OFICIAIS = [
  "NUMERO_INCIDENTE",
  "PRIORIDADE",
  "PRODUTO",
  "CATEGORIA",
  "SUBCATEGORIA",
  "GRUPO_DESIGNADO",
  "ITEM_CONFIGURACAO",
  "CODIGO_FECHAMENTO",
  "DESCRICAO_RESUMIDA",
  "SOLUCAO",
  "ABERTO_POR",
  "INCIDENTE_PAI",
  "STATUS_INCIDENTE",
  "ENTROU_KPI_ORIGEM",
  "KPI_VIOLADO_ORIGEM",
  "DATA_ABERTURA",
  "DATA_RESOLUCAO",
  "DATA_ENCERRAMENTO",
  "DURACAO_SEGUNDOS",
  "PRIORIDADE_NUM",
  "DURACAO_HORAS",
  "DT_CARGA",
  "NM_USUARIO_CARGA",
  "FLAG_ELEGIVEL_KPI",
  "FLAG_DENTRO_SLA",
] as const;

/** Detecta se o cabeçalho de um arquivo corresponde à base tratada oficial. */
export function pareceBaseTratada(headers: string[]): boolean {
  const normalizados = new Set(headers.map((h) => h.trim().toUpperCase()));
  return normalizados.has("NUMERO_INCIDENTE") && normalizados.has("PRIORIDADE");
}

function normalizarChave(k: string): string {
  return k.trim().toUpperCase();
}

/** Converte "dd/mm/aaaa hh:mm:ss" (ou variações) para ISO 8601. Retorna undefined se inválido/vazio. */
export function parseDataBR(valor: unknown): string | undefined {
  if (valor == null) return undefined;
  const s = String(valor).trim();
  if (!s) return undefined;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const [, dd, mm, yyyy, hh = "0", min = "0", ss = "0"] = m;
    const d = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss),
    );
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  }
  const direto = new Date(s);
  if (!Number.isNaN(direto.getTime())) return direto.toISOString();
  return undefined;
}

/** Converte "SIM"/"NAO"/"N/A" (case-insensitive) para boolean/undefined. */
export function parseBoolSimNao(valor: unknown): boolean | undefined {
  if (valor == null) return undefined;
  const s = String(valor).trim().toUpperCase();
  if (!s || s === "N/A" || s === "NA") return undefined;
  if (s === "SIM" || s === "S" || s === "TRUE" || s === "1") return true;
  if (s === "NAO" || s === "NÃO" || s === "N" || s === "FALSE" || s === "0") return false;
  return undefined;
}

function vazioParaUndefined(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

function toNumberOrUndefined(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(String(v).replace(",", "."));
  return Number.isNaN(n) ? undefined : n;
}

const PRIORIDADES_VALIDAS: Prioridade[] = ["P1", "P2", "P3", "P4", "P5"];

export interface MapeamentoResultado {
  incidente: Partial<Incidente> | null;
  vazio: boolean;
}

/**
 * Mapeia uma linha bruta (chaves = cabeçalhos oficiais da base tratada) para
 * o formato interno de Incidente usado pela aplicação. Não inventa valores
 * para campos ausentes — produto/categoria/subcategoria/código de
 * fechamento/solução ficam undefined quando vazios na origem.
 */
export function mapearLinhaOficial(rowRaw: Record<string, unknown>): MapeamentoResultado {
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rowRaw)) row[normalizarChave(k)] = v;

  const valores = Object.values(row).map((v) => (v == null ? "" : String(v).trim()));
  const totalmenteVazia = valores.every((v) => v === "");
  if (totalmenteVazia) return { incidente: null, vazio: true };

  const prioridadeRaw = vazioParaUndefined(row.PRIORIDADE)?.toUpperCase();
  const prioridade = (
    prioridadeRaw && PRIORIDADES_VALIDAS.includes(prioridadeRaw as Prioridade)
      ? (prioridadeRaw as Prioridade)
      : "P4"
  ) as Prioridade;

  const duracaoSegundos = toNumberOrUndefined(row.DURACAO_SEGUNDOS) ?? 0;
  const statusIncidente = vazioParaUndefined(row.STATUS_INCIDENTE) ?? "Desconhecido";
  const incidentePai = vazioParaUndefined(row.INCIDENTE_PAI);

  const abertoPor = vazioParaUndefined(row.ABERTO_POR) ?? "Desconhecido";
  const origemMonitoramento = /monitor/i.test(abertoPor);

  const incidente: Partial<Incidente> = {
    numero_incidente: vazioParaUndefined(row.NUMERO_INCIDENTE) ?? "",
    prioridade,
    produto: vazioParaUndefined(row.PRODUTO) ?? null,
    categoria: vazioParaUndefined(row.CATEGORIA) ?? null,
    subcategoria: vazioParaUndefined(row.SUBCATEGORIA) ?? null,
    grupo_designado: vazioParaUndefined(row.GRUPO_DESIGNADO) ?? "Não informado",
    item_configuracao: vazioParaUndefined(row.ITEM_CONFIGURACAO) ?? null,
    codigo_fechamento: vazioParaUndefined(row.CODIGO_FECHAMENTO) ?? null,
    descricao_resumida: vazioParaUndefined(row.DESCRICAO_RESUMIDA) ?? "",
    solucao: vazioParaUndefined(row.SOLUCAO) ?? null,
    aberto_por: abertoPor,
    incidente_pai: incidentePai,
    status_incidente: statusIncidente,
    data_abertura: parseDataBR(row.DATA_ABERTURA) ?? "",
    data_resolucao: parseDataBR(row.DATA_RESOLUCAO),
    data_encerramento: parseDataBR(row.DATA_ENCERRAMENTO),
    duracao_segundos: duracaoSegundos,
    origem_incidente: origemMonitoramento ? "Monitoramento" : "Manual",
    tipo_abertura: origemMonitoramento ? "Automática" : "Manual",
    origem_dado: "IMPORTADO",
    gerado_para_mvp: false,
  };

  return { incidente, vazio: false };
}
