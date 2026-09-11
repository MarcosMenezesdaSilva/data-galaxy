// Catálogo das telas do Data Galaxy — usado pelo Assistente para explicar o
// que cada tela mostra sem inventar nada: descrição curta e fiel ao que a
// tela realmente exibe, mais o rótulo e apelidos usados para casar com a
// pergunta do usuário.
import { rotaPermitida } from "./permissions";

export interface Tela {
  rota: string;
  nome: string;
  descricao: string;
  apelidos: string[];
}

export const TELAS: Tela[] = [
  {
    rota: "/dashboard",
    nome: "Central de Operações",
    descricao:
      "Visão integrada com KPIs do dia, previsão D+1/D+7, cumprimento de OLA, tendência mensal, incidentes por grupo/prioridade e a fila de riscos mais urgentes.",
    apelidos: ["central de operações", "dashboard", "home", "início", "painel principal"],
  },
  {
    rota: "/assistente",
    nome: "Assistente",
    descricao:
      "Este chat — responde perguntas sobre incidentes, riscos, alertas, ações e previsões direto sobre os dados carregados na base. Quando a IA está configurada em Configurações, usa o Claude com os dados e artigos relevantes da Base de Conhecimento como contexto; sem IA configurada, usa um motor de regras local.",
    apelidos: ["assistente", "chat", "você mesmo"],
  },
  {
    rota: "/incidentes",
    nome: "Incidentes",
    descricao:
      "Lista completa de incidentes com filtros por prioridade, produto, grupo e status, e o detalhe de cada registro (duração, OLA, solução aplicada).",
    apelidos: ["incidentes", "lista de incidentes", "chamados"],
  },
  {
    rota: "/previsoes",
    nome: "Previsões",
    descricao:
      "Previsão de volume de incidentes por produto nos horizontes D+1 e D+7, usando os modelos AutoETS e Seasonal Naive, com intervalo de confiança. Traz também o gráfico Histórico vs. Previsão, comparando o volume real registrado dia a dia com o previsto para o mesmo período, e o detalhamento da previsão diária de D+1 a D+7.",
    apelidos: ["previsões", "previsão", "d+1", "d+7", "forecast"],
  },
  {
    rota: "/riscos-ola",
    nome: "Riscos de OLA",
    descricao:
      "Fila de riscos de violação de OLA ordenada por probabilidade, com os fatores explicáveis de cada um (pico de volume, grupo sobrecarregado, histórico) e as ações de notificar, criar alerta ou ação preventiva.",
    apelidos: ["riscos de ola", "riscos", "ola", "violação de ola"],
  },
  {
    rota: "/alertas",
    nome: "Alertas",
    descricao:
      "Caixa de entrada operacional de alertas — reconhecer, colocar em tratamento e finalizar, com severidade e canal de disparo (WhatsApp/SMS/Teams/e-mail).",
    apelidos: ["alertas", "central de alertas", "notificações"],
  },
  {
    rota: "/correcoes",
    nome: "Ações Corretivas",
    descricao:
      "Registro do ciclo completo de correções aplicadas a incidentes e riscos, do planejamento até a conclusão, com a classificação de efetividade.",
    apelidos: ["ações corretivas", "correções", "ações"],
  },
  {
    rota: "/validacao",
    nome: "Validação de Correções",
    descricao:
      "Compara o volume previsto com o volume real após uma correção, em janelas de 7/15/30 dias, para confirmar se ela foi realmente efetiva ou só paliativa.",
    apelidos: ["validação de correções", "validação", "efetividade"],
  },
  {
    rota: "/problemas",
    nome: "Problemas e Recorrências",
    descricao:
      "Agrupamento de incidentes recorrentes por padrão comum (inspirado em K-Means), para achar causas raiz que se repetem.",
    apelidos: ["problemas", "recorrências", "problemas e recorrências"],
  },
  {
    rota: "/conhecimento",
    nome: "Base de Conhecimento",
    descricao: "Runbooks, postmortems e recomendações técnicas por produto e causa raiz.",
    apelidos: ["base de conhecimento", "conhecimento", "runbooks"],
  },
  {
    rota: "/dados",
    nome: "Dados",
    descricao:
      "Tela única com três abas: Importação e Sincronização (arquivos CSV/TXT/Excel ou sincronização ao vivo com o Databricks, dados salvos localmente no navegador via IndexedDB), Qualidade (completude, duplicidade e consistência dos incidentes carregados) e Linhagem (fluxo de origem até consumo, da base bruta da Locaweb até os dashboards do Data Galaxy).",
    apelidos: [
      "gestão de dados",
      "dados",
      "importar dados",
      "importação",
      "qualidade de dados",
      "qualidade",
      "linhagem de dados",
      "linhagem",
    ],
  },
  {
    rota: "/configuracoes",
    nome: "Configurações",
    descricao:
      "Preferências visuais, troca de perfil, faixas de risco, regras de OLA, o painel de teste dos canais de notificação (WhatsApp, SMS, Teams), a integração com o Databricks e a configuração da IA (Claude) que dá poder ao Assistente.",
    apelidos: ["configurações", "config", "ajustes"],
  },
  {
    rota: "/usuarios",
    nome: "Usuários",
    descricao:
      "Exclusiva do Administrador. Cria usuários demonstrativos (sem senha — mesmo modelo dos perfis fixos) e escolhe exatamente quais telas cada um pode acessar. Também lista os 3 perfis fixos (Gestora de Operações, Operações/Técnico, Administrador) com o acesso de cada um.",
    apelidos: ["usuários", "gestão de usuários", "controle de acesso", "permissões"],
  },
];

/** Filtra o catálogo pelas rotas já resolvidas (ver useRotasPermitidas em usuarios.ts). */
export function telasDoPerfil(rotas: string[] | "todas" | null | undefined): Tela[] {
  return TELAS.filter((t) => rotaPermitida(rotas, t.rota));
}
