// Cliente HTTP para a integração com Databricks (via
// netlify/functions/databricks-query.ts). A credencial vive só como variável
// de ambiente no Netlify — o cliente nunca a vê nem a envia, só manda a
// consulta. Assim como notify.ts, nunca deixa a Promise rejeitar: qualquer
// erro vira um resultado `ok: false`.

export interface ColunaResultado {
  nome: string;
  tipo: string;
}

export type ConsultaResultado =
  | { ok: true; colunas: ColunaResultado[]; linhas: unknown[][]; truncado: boolean }
  | { ok: false; motivo: string; detalhe?: string };

export async function databricksConfigurado(): Promise<boolean> {
  try {
    const resp = await fetch("/api/databricks-status");
    const dados = (await resp.json()) as { configurado?: boolean };
    return Boolean(dados.configurado);
  } catch {
    return false;
  }
}

export async function executarConsultaDatabricks(statement: string): Promise<ConsultaResultado> {
  try {
    const resp = await fetch("/api/databricks-query", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ statement }),
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
