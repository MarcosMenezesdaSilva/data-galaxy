// Catálogo das telas do Data Galaxy — usado pelo Assistente para explicar o
// que cada tela mostra sem inventar nada: descrição curta e fiel ao que a
// tela realmente exibe, mais o rótulo e apelidos usados para casar com a
// pergunta do usuário.
import type { Perfil } from "./store";

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
    rota: "/impacto",
    nome: "Impacto",
    descricao:
      "Compara o cenário reativo (sem o sistema, incidentes sem intervenção e violações já consumadas) com o cenário preditivo (riscos pegos a tempo, correções validadas, previsão D+1/D+7).",
    apelidos: ["impacto", "antes e depois", "reativo vs preditivo", "comparativo"],
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
      "Previsão de volume de incidentes por produto nos horizontes D+1 e D+7, usando os modelos AutoETS e Seasonal Naive, com intervalo de confiança.",
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
    rota: "/mudancas",
    nome: "Mudanças",
    descricao:
      "Cadastro de deploys, releases, expansões e configurações, correlacionando cada mudança com o volume de incidentes antes e depois dela.",
    apelidos: ["mudanças", "deploys", "releases"],
  },
  {
    rota: "/conhecimento",
    nome: "Base de Conhecimento",
    descricao: "Runbooks, postmortems e recomendações técnicas por produto e causa raiz.",
    apelidos: ["base de conhecimento", "conhecimento", "runbooks"],
  },
  {
    rota: "/dados",
    nome: "Gestão de Dados",
    descricao:
      "Importação de arquivos CSV, TXT ou Excel para alimentar a base — os dados ficam salvos localmente no navegador (IndexedDB).",
    apelidos: ["gestão de dados", "importar dados", "importação"],
  },
  {
    rota: "/qualidade-dados",
    nome: "Qualidade de Dados",
    descricao:
      "Análise de completude, duplicidade e consistência dos incidentes carregados, seja a base demo ou uma importada.",
    apelidos: ["qualidade de dados", "qualidade"],
  },
  {
    rota: "/linhagem-dados",
    nome: "Linhagem de Dados",
    descricao:
      "Fluxo de origem até consumo dos dados — da base bruta da Locaweb até os dashboards do Data Galaxy.",
    apelidos: ["linhagem de dados", "linhagem"],
  },
  {
    rota: "/relatorios",
    nome: "Relatórios",
    descricao: "Indicadores operacionais e de qualidade consolidados, prontos para exportar.",
    apelidos: ["relatórios", "relatorio"],
  },
  {
    rota: "/arquitetura",
    nome: "Arquitetura e Roadmap",
    descricao:
      "Componentes técnicos projetados no MVP, status atual de cada um e a evolução planejada.",
    apelidos: ["arquitetura", "roadmap"],
  },
  {
    rota: "/configuracoes",
    nome: "Configurações",
    descricao:
      "Preferências visuais, troca de perfil, faixas de risco, regras de OLA, o painel de teste dos canais de notificação (WhatsApp, SMS, Teams), a integração com o Databricks e a configuração da IA (Claude) que dá poder ao Assistente.",
    apelidos: ["configurações", "config", "ajustes"],
  },
];

export function telasDoPerfil(
  perfil: Perfil | null,
  podeAcessar: (p: Perfil | null, r: string) => boolean,
): Tela[] {
  return TELAS.filter((t) => podeAcessar(perfil, t.rota));
}
