import type { Perfil } from "./store";

/**
 * Rotas visíveis/acessíveis por perfil. "todas" libera qualquer rota.
 * Critério: Administrador vê tudo (governança do sistema, inclusive
 * Configurações). Gestora de Operações vê o que apoia decisão estratégica
 * (KPIs, previsões, riscos, relatórios), sem telas de engenharia de dados
 * nem o painel de configurações. Operações/Técnico vê o dia a dia
 * operacional e a engenharia de dados (importação, qualidade, linhagem,
 * arquitetura), mas não relatórios executivos nem configurações do sistema.
 */
export const ROTAS_POR_PERFIL: Record<Perfil, string[] | "todas"> = {
  admin: "todas",
  gestor: [
    "/dashboard",
    "/incidentes",
    "/previsoes",
    "/riscos-ola",
    "/alertas",
    "/correcoes",
    "/validacao",
    "/problemas",
    "/mudancas",
    "/conhecimento",
    "/relatorios",
  ],
  tecnico: [
    "/dashboard",
    "/incidentes",
    "/previsoes",
    "/riscos-ola",
    "/alertas",
    "/correcoes",
    "/validacao",
    "/problemas",
    "/mudancas",
    "/conhecimento",
    "/dados",
    "/qualidade-dados",
    "/linhagem-dados",
    "/arquitetura",
  ],
};

export function podeAcessar(perfil: Perfil | null, path: string): boolean {
  if (!perfil) return false;
  const rotas = ROTAS_POR_PERFIL[perfil];
  if (rotas === "todas") return true;
  return rotas.some((r) => path === r || path.startsWith(`${r}/`));
}
