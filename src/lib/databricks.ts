// Cliente HTTP para a integração com Databricks (via
// netlify/functions/databricks-query.ts). A credencial vive só como variável
// de ambiente no Netlify — o cliente nunca a vê nem a envia, só manda a
// consulta. Assim como notify.ts, nunca deixa a Promise rejeitar: qualquer
// erro vira um resultado `ok: false`.
//
// A function só inicia a consulta e devolve rápido (às vezes "pendente");
// quem espera até terminar é este cliente, chamando de novo com o
// statementId em intervalos curtos — necessário porque consultas mais
// pesadas (os JOINs de sincronização) podem passar dos ~10s que uma
// function síncrona do Netlify tolera antes de ser matada.

export interface ColunaResultado {
  nome: string;
  tipo: string;
}

export type ConsultaResultado =
  | { ok: true; colunas: ColunaResultado[]; linhas: unknown[][]; truncado: boolean }
  | { ok: false; motivo: string; detalhe?: string };

type RespostaFunction =
  | { ok: true; colunas: ColunaResultado[]; linhas: unknown[][]; truncado: boolean }
  | { ok: false; pendente: true; statementId: string }
  | { ok: false; pendente?: false; motivo: string; detalhe?: string };

export async function databricksConfigurado(): Promise<boolean> {
  try {
    const resp = await fetch("/api/databricks-status");
    const dados = (await resp.json()) as { configurado?: boolean };
    return Boolean(dados.configurado);
  } catch {
    return false;
  }
}

async function chamarFunction(
  body: { statement: string } | { statementId: string },
): Promise<RespostaFunction> {
  const resp = await fetch("/api/databricks-query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await resp.json()) as RespostaFunction;
}

const ESPERA_MS = 1800;
const MAX_TENTATIVAS = 60; // ~108s de espera total, dá margem pra consultas pesadas

export async function executarConsultaDatabricks(statement: string): Promise<ConsultaResultado> {
  try {
    let resultado = await chamarFunction({ statement });

    for (
      let tentativa = 0;
      !resultado.ok && resultado.pendente && tentativa < MAX_TENTATIVAS;
      tentativa++
    ) {
      await new Promise((r) => setTimeout(r, ESPERA_MS));
      resultado = await chamarFunction({ statementId: resultado.statementId });
    }

    if (!resultado.ok && resultado.pendente) {
      return {
        ok: false,
        motivo: "tempo_esgotado",
        detalhe: "A consulta demorou demais para responder.",
      };
    }

    return resultado;
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
