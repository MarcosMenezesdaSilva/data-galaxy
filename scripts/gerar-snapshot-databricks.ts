// Gera um snapshot congelado dos dados reais do Databricks (incidentes,
// previsões, riscos) e grava em src/lib/databricks-snapshot.json — usado
// como carga PADRÃO do app (ver src/lib/init.ts), pra não depender de uma
// sincronização ao vivo (lenta, ~10-30s) durante uma apresentação com tempo
// contado.
//
// Roda manualmente quando quiser atualizar o snapshot com dado mais recente:
//   bun run scripts/gerar-snapshot-databricks.ts
//
// Reaproveita as mesmas queries e funções de mapeamento do botão "Sincronizar
// agora" (src/lib/databricks-sync.ts) — o snapshot é exatamente o que aquele
// botão traria, só que capturado uma vez e congelado no build.

import {
  QUERY_INCIDENTES,
  QUERY_PREVISOES,
  QUERY_RISCOS,
  mapearIncidente,
  mapearPrevisao,
  mapearRisco,
} from "../src/lib/databricks-sync";

const BASE_URL = "https://data-galaxy-nexusops.netlify.app";
const ESPERA_MS = 1800;
const MAX_TENTATIVAS = 60;

type ColunaResultado = { nome: string; tipo: string };
type RespostaFunction =
  | { ok: true; colunas: ColunaResultado[]; linhas: unknown[][]; truncado: boolean }
  | { ok: false; pendente: true; statementId: string }
  | { ok: false; pendente?: false; motivo: string; detalhe?: string };

async function chamarFunction(
  body: { statement: string } | { statementId: string },
): Promise<RespostaFunction> {
  const resp = await fetch(`${BASE_URL}/api/databricks-query`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await resp.json()) as RespostaFunction;
}

function linhasComoObjetos(resultado: {
  colunas: ColunaResultado[];
  linhas: unknown[][];
}): Record<string, unknown>[] {
  return resultado.linhas.map((linha) =>
    Object.fromEntries(resultado.colunas.map((c, i) => [c.nome, linha[i]])),
  );
}

async function executarConsulta(statement: string): Promise<Record<string, unknown>[]> {
  let resultado = await chamarFunction({ statement });
  for (
    let tentativa = 0;
    !resultado.ok && resultado.pendente && tentativa < MAX_TENTATIVAS;
    tentativa++
  ) {
    await new Promise((r) => setTimeout(r, ESPERA_MS));
    resultado = await chamarFunction({ statementId: resultado.statementId });
  }
  if (!resultado.ok) {
    throw new Error(
      `Consulta falhou: ${!resultado.ok && "motivo" in resultado ? resultado.motivo : "pendente/timeout"}`,
    );
  }
  return linhasComoObjetos(resultado);
}

async function main() {
  console.log("[snapshot] Buscando incidentes...");
  const linhasIncidentes = await executarConsulta(QUERY_INCIDENTES);
  const incidentes = linhasIncidentes.map(mapearIncidente);
  console.log(`[snapshot] ${incidentes.length} incidentes`);

  console.log("[snapshot] Buscando previsões...");
  const linhasPrevisoes = await executarConsulta(QUERY_PREVISOES);
  const previsoes = linhasPrevisoes.map(mapearPrevisao);
  console.log(`[snapshot] ${previsoes.length} previsões`);

  console.log("[snapshot] Buscando riscos...");
  const linhasRiscos = await executarConsulta(QUERY_RISCOS);
  const riscos = linhasRiscos.map(mapearRisco);
  console.log(`[snapshot] ${riscos.length} riscos`);

  const snapshot = {
    gerado_em: new Date().toISOString(),
    incidentes,
    previsoes,
    riscos,
  };

  await Bun.write("src/lib/databricks-snapshot.json", JSON.stringify(snapshot, null, 0));
  console.log("[snapshot] Salvo em src/lib/databricks-snapshot.json");
}

main().catch((err) => {
  console.error("[snapshot] Falhou:", err);
  process.exit(1);
});
