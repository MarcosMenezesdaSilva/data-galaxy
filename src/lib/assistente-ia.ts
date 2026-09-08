// Orquestra a chamada de IA de verdade do Assistente: monta os fatos
// operacionais (montarResumoDados), recupera artigos relevantes da Base de
// Conhecimento (buscarArtigosRelevantes) e chama a function que fala com a
// Anthropic. A key vive só como variável de ambiente no Netlify (ver
// netlify/functions/assistente-ia.ts) — o cliente nunca a vê nem a envia.
// Nunca deixa a Promise rejeitar — erro vira `ok: false`, pra quem chama
// poder cair de volta pro motor de regras sem drama.
import type { Artigo } from "./types";
import { montarResumoDados, type DadosAssistente } from "./assistente";
import { buscarArtigosRelevantes } from "./conhecimento-rag";

export type RespostaIA =
  | { ok: true; resposta: string; artigosUsados: string[] }
  | { ok: false; motivo: string; detalhe?: string };

export async function iaConfigurada(): Promise<boolean> {
  try {
    const resp = await fetch("/api/ia-status");
    const dados = (await resp.json()) as { configurado?: boolean };
    return Boolean(dados.configurado);
  } catch {
    return false;
  }
}

export async function perguntarIA(
  pergunta: string,
  dados: DadosAssistente,
  artigos: Artigo[],
): Promise<RespostaIA> {
  const fatos = montarResumoDados(dados);
  const relevantes = buscarArtigosRelevantes(pergunta, artigos);

  try {
    const resp = await fetch("/api/assistente-ia", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
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
