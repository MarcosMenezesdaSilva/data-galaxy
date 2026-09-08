// Busca lexical (RAG "de verdade", sem embedding) sobre a Base de
// Conhecimento — pontua cada artigo pela quantidade de termos da pergunta
// que aparecem no título/categoria/produto/causa raiz/solução/tags, e
// devolve os mais relevantes. Não é busca semântica, mas é recuperação real
// sobre o conteúdo dos artigos — nada de citar artigo que não bateu.
import type { Artigo } from "./types";

function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const PALAVRAS_IGNORADAS = new Set([
  "que",
  "para",
  "com",
  "uma",
  "dos",
  "das",
  "por",
  "como",
  "tem",
  "tenho",
  "isso",
  "essa",
  "esse",
  "sobre",
  "qual",
  "quais",
]);

function termosRelevantes(texto: string): string[] {
  return normalizar(texto)
    .split(/[^a-z0-9+]+/)
    .filter((t) => t.length > 2 && !PALAVRAS_IGNORADAS.has(t));
}

export interface ArtigoRelevante {
  titulo: string;
  categoria: string;
  produto: string;
  causa_raiz: string;
  solucao: string;
  pontuacao: number;
}

export function buscarArtigosRelevantes(
  pergunta: string,
  artigos: Artigo[],
  limite = 3,
): ArtigoRelevante[] {
  const termos = termosRelevantes(pergunta);
  if (termos.length === 0) return [];

  return artigos
    .map((a) => {
      const textoBusca = normalizar(
        `${a.titulo} ${a.categoria} ${a.produto} ${a.causa_raiz} ${a.solucao} ${a.tags.join(" ")}`,
      );
      const pontuacao = termos.reduce((s, t) => s + (textoBusca.includes(t) ? 1 : 0), 0);
      return {
        titulo: a.titulo,
        categoria: a.categoria,
        produto: a.produto,
        causa_raiz: a.causa_raiz,
        solucao: a.solucao,
        pontuacao,
      };
    })
    .filter((a) => a.pontuacao > 0)
    .sort((a, b) => b.pontuacao - a.pontuacao)
    .slice(0, limite);
}
