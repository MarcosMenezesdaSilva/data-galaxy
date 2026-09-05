// Cliente HTTP para a integração com Databricks (via
// netlify/functions/databricks-query.ts). O host/warehouseId/token vêm da
// tela de Configurações — nunca ficam fixos no código. Assim como notify.ts,
// nunca deixa a Promise rejeitar: qualquer erro vira um resultado `ok: false`.

export interface DatabricksConfig {
  host: string;
  warehouseId: string;
  token: string;
}

export interface ColunaResultado {
  nome: string;
  tipo: string;
}

export type ConsultaResultado =
  | { ok: true; colunas: ColunaResultado[]; linhas: unknown[][]; truncado: boolean }
  | { ok: false; motivo: string; detalhe?: string };

export function configuracaoCompleta(cfg: Partial<DatabricksConfig>): cfg is DatabricksConfig {
  return Boolean(cfg.host?.trim() && cfg.warehouseId?.trim() && cfg.token?.trim());
}

export async function executarConsultaDatabricks(
  cfg: DatabricksConfig,
  statement: string,
): Promise<ConsultaResultado> {
  try {
    const resp = await fetch("/api/databricks-query", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...cfg, statement }),
    });
    return (await resp.json()) as ConsultaResultado;
  } catch {
    return { ok: false, motivo: "erro_rede", detalhe: "Não foi possível contatar a function." };
  }
}

// Linhas em formato de objeto (coluna → valor), mais fácil de usar do que o
// array posicional que a API do Databricks devolve.
export function linhasComoObjetos(resultado: {
  colunas: ColunaResultado[];
  linhas: unknown[][];
}): Record<string, unknown>[] {
  return resultado.linhas.map((linha) =>
    Object.fromEntries(resultado.colunas.map((c, i) => [c.nome, linha[i]])),
  );
}
