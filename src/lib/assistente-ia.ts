// Orquestra a chamada de IA de verdade do Assistente: monta os fatos
// operacionais (montarResumoDados), recupera artigos relevantes da Base de
// Conhecimento (buscarArtigosRelevantes) e chama a function que fala com a
// Anthropic. Nunca deixa a Promise rejeitar — erro vira `ok: false`, pra
// quem chama poder cair de volta pro motor de regras sem drama.
import type { Artigo } from "./types";
import { montarResumoDados, type DadosAssistente } from "./assistente";
import { buscarArtigosRelevantes } from "./conhecimento-rag";

export interface IAConfig {
  apiKey: string;
  model: string;
}

export type RespostaIA =
  | { ok: true; resposta: string; artigosUsados: string[] }
  | { ok: false; motivo: string; detalhe?: string };

export function iaConfigurada(cfg: Partial<IAConfig>): cfg is IAConfig {
  return Boolean(cfg.apiKey?.trim());
}

export async function perguntarIA(
  pergunta: string,
  dados: DadosAssistente,
  artigos: Artigo[],
  cfg: IAConfig,
): Promise<RespostaIA> {
  const fatos = montarResumoDados(dados);
  const relevantes = buscarArtigosRelevantes(pergunta, artigos);

  try {
    const resp = await fetch("/api/assistente-ia", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey: cfg.apiKey,
        model: cfg.model || undefined,
        pergunta,
        fatos,
        artigos: relevantes.map((a) => ({
          titulo: a.titulo,
          categoria: a.categoria,
          produto: a.produto,
          causa_raiz: a.causa_raiz,
          solucao: a.solucao,
        })),
      }),
    });
    const dadosResp = (await resp.json()) as
      | { ok: true; resposta: string }
      | { ok: false; motivo: string; detalhe?: string };
    if (!dadosResp.ok) return dadosResp;
    return {
      ok: true,
      resposta: dadosResp.resposta,
      artigosUsados: relevantes.map((a) => a.titulo),
    };
  } catch {
    return { ok: false, motivo: "erro_rede", detalhe: "Não foi possível contatar a function." };
  }
}
