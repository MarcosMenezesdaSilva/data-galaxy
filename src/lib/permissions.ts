import type { Perfil } from "./store";

/**
 * Rotas visíveis/acessíveis por perfil fixo. "todas" libera qualquer rota.
 *
 * Critério (revisado — menos telas, história mais forte por perfil):
 * Administrador vê tudo (nada é perdido para a entrega/avaliação — todas as
 * telas continuam existindo e contando ponto, só não ficam no menu dos
 * outros dois perfis). Gestora de Operações fica só com a visão executiva
 * essencial: dashboard, previsão (capacidade de antecipação), riscos e
 * alertas. Operações/Técnico fica com a fila de trabalho do dia a dia:
 * dashboard, incidentes, riscos, alertas e ações corretivas, mais dados (é
 * quem importa/mantém a base).
 *
 * Usuários criados pelo Admin (ver src/lib/usuarios.ts) não entram aqui —
 * a lista de rotas deles fica salva por usuário no IndexedDB (tabela
 * `usuarios`) e é resolvida em tempo real por useRotasPermitidas().
 */
export const ROTAS_POR_PERFIL: Record<Perfil, string[] | "todas"> = {
  admin: "todas",
  gestor: ["/dashboard", "/assistente", "/previsoes", "/riscos-ola", "/alertas"],
  tecnico: [
    "/dashboard",
    "/assistente",
    "/incidentes",
    "/riscos-ola",
    "/alertas",
    "/correcoes",
    "/dados",
  ],
};

/**
 * Resolve se `path` é acessível dado um conjunto de rotas já resolvido —
 * "todas" (admin), uma lista (perfil fixo ou usuário customizado), ou null
 * (ninguém logado / usuário customizado que sumiu do IndexedDB).
 */
export function rotaPermitida(rotas: string[] | "todas" | null | undefined, path: string): boolean {
  if (!rotas) return false;
  if (rotas === "todas") return true;
  return rotas.some((r) => path === r || path.startsWith(`${r}/`));
}
