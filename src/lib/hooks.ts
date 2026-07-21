import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";

// Re-export dexie hooks
export { useLiveQuery };

export function useIncidentes() {
  return useLiveQuery(() => db.incidentes.toArray(), []) ?? [];
}
export function useAlertas() {
  return useLiveQuery(() => db.alertas.orderBy("data_criacao").reverse().toArray(), []) ?? [];
}
export function useRiscos() {
  return (
    useLiveQuery(() => db.riscos.orderBy("probabilidade_violacao").reverse().toArray(), []) ?? []
  );
}
export function usePrevisoes() {
  return useLiveQuery(() => db.previsoes.toArray(), []) ?? [];
}
export function useAcoes() {
  return useLiveQuery(() => db.acoes.toArray(), []) ?? [];
}
export function useMudancas() {
  return useLiveQuery(() => db.mudancas.toArray(), []) ?? [];
}
export function useArtigos() {
  return useLiveQuery(() => db.artigos.toArray(), []) ?? [];
}
export function useRegras() {
  return useLiveQuery(() => db.regras.toArray(), []) ?? [];
}
export function useImports() {
  return useLiveQuery(() => db.imports.orderBy("data").reverse().toArray(), []) ?? [];
}
export function useValidacoes() {
  return useLiveQuery(() => db.validacoes.toArray(), []) ?? [];
}
export function useProdutosServicos() {
  return useLiveQuery(() => db.produtosServicos.toArray(), []) ?? [];
}
