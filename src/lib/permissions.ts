import type { Perfil } from "./store";

/**
 * Rotas visíveis/acessíveis por perfil. "todas" libera qualquer rota.
 *
 * Critério (revisado — menos telas, história mais forte por perfil):
 * Administrador vê tudo (nada é perdido para a entrega/avaliação — todas as
 * telas continuam existindo e contando ponto, só não ficam no menu dos
 * outros dois perfis). Gestora de Operações fica só com a visão executiva
 * essencial: dashboard, previsão (capacidade de antecipação), riscos e
 * relatórios, convergindo o operacional em Alertas em vez de espalhar por
 * várias telas. Operações/Técnico fica com a fila de trabalho do dia a dia:
 * dashboard, incidentes, riscos, alertas e ações corretivas, mais gestão de
 * dados (é quem importa/mantém a base).
 */
export const ROTAS_POR_PERFIL: Record<Perfil, string[] | "todas"> = {
  admin: "todas",
  gestor: [
    "/dashboard",
    "/assistente",
    "/previsoes",
    "/riscos-ola",
    "/alertas",
    "/relatorios",
    "/impacto",
  ],
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

export function podeAcessar(perfil: Perfil | null, path: string): boolean {
  if (!perfil) return false;
  const rotas = ROTAS_POR_PERFIL[perfil];
  if (rotas === "todas") return true;
  return rotas.some((r) => path === r || path.startsWith(`${r}/`));
}
