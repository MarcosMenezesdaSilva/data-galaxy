export type Prioridade = "P1" | "P2" | "P3" | "P4" | "P5";

// Rotula a procedência de cada registro: importado da base real tratada da
// Locaweb, ou gerado sinteticamente para viabilizar a demonstração do MVP.
export type OrigemDado = "IMPORTADO" | "DEMONSTRACAO";

export interface RegistroBase {
  origem_dado: OrigemDado;
  gerado_para_mvp: boolean;
}

export interface Incidente extends RegistroBase {
  id?: number;
  numero_incidente: string;
  prioridade: Prioridade;
  produto?: string | null;
  categoria?: string | null;
  subcategoria?: string | null;
  grupo_designado: string;
  item_configuracao?: string | null;
  data_abertura: string; // ISO
  data_resolucao?: string;
  data_encerramento?: string;
  duracao_segundos: number;
  status_incidente: string;
  codigo_fechamento?: string | null;
  descricao_resumida: string;
  solucao?: string | null;
  aberto_por: string;
  incidente_pai?: string;
  elegivel_kpi: boolean;
  dentro_ola: boolean;
  origem_incidente: "Monitoramento" | "Manual" | "API";
  tipo_abertura: "Automática" | "Manual";
}

export interface Previsao extends RegistroBase {
  id?: number;
  id_previsao: string;
  data_execucao: string;
  data_prevista: string;
  horizonte: "D+1" | "D+7";
  produto: string;
  categoria?: string;
  prioridade?: Prioridade;
  volume_previsto: number;
  limite_inferior: number;
  limite_superior: number;
  modelo: "AutoETS" | "SeasonalNaive";
  versao_modelo: string;
}

export type FaixaRisco = "Baixo" | "Médio" | "Alto" | "Crítico";

export interface RiscoOla extends RegistroBase {
  id?: number;
  id_risco: string;
  numero_incidente: string;
  data_calculo: string;
  probabilidade_violacao: number; // 0-100
  faixa_risco: FaixaRisco;
  tempo_restante_minutos: number;
  alta_recorrencia: boolean;
  pico_volume: boolean;
  grupo_sobrecarregado: boolean;
  tempo_medio_elevado: boolean;
  produto_critico: boolean;
  historico_violacao: boolean;
  fatores_risco: string[];
  produto: string;
  prioridade: Prioridade;
  grupo: string;
  status: "Ativo" | "Mitigado";
}

export type Severidade = "Informativo" | "Atenção" | "Alto" | "Crítico";
export type StatusAlerta = "Novo" | "Reconhecido" | "Em tratamento" | "Finalizado" | "Cancelado";

export interface Alerta extends RegistroBase {
  id?: number;
  id_alerta: string;
  numero_incidente?: string;
  titulo: string;
  descricao: string;
  severidade: Severidade;
  produto: string;
  grupo_responsavel: string;
  responsavel?: string;
  status: StatusAlerta;
  data_criacao: string;
  data_reconhecimento?: string;
  data_inicio_tratamento?: string;
  data_finalizacao?: string;
  canal_email: boolean;
  canal_teams: boolean;
  canal_sms: boolean;
  canal_api: boolean;
  volume_previsto?: number;
}

export type ClassificacaoAcao = "Efetiva" | "Paliativa" | "Inconclusiva" | "Pendente";

export interface AcaoCorretiva extends RegistroBase {
  id?: number;
  id_acao: string;
  numero_incidente?: string;
  id_alerta?: string;
  responsavel: string;
  grupo_responsavel: string;
  tipo_acao: string;
  descricao_acao: string;
  causa_provavel?: string;
  data_acao: string;
  data_conclusao?: string;
  produto: string;
  status: "Planejada" | "Em execução" | "Concluída" | "Cancelada" | "Em validação";
  volume_previsto?: number;
  volume_real?: number;
  reincidencias_7_dias?: number;
  reincidencias_15_dias?: number;
  reincidencias_30_dias?: number;
  novas_violacoes?: number;
  classificacao: ClassificacaoAcao;
  conclusao?: string;
  evidencia?: string;
}

export interface Mudanca extends RegistroBase {
  id?: number;
  id_mudanca: string;
  tipo:
    | "Deploy"
    | "Atualização"
    | "Configuração"
    | "Expansão"
    | "Migração"
    | "Rollback"
    | "Manutenção";
  produto: string;
  grupo: string;
  descricao: string;
  data: string;
  incidentes_antes: number;
  incidentes_depois: number;
  status: "Programada" | "Executada" | "Revertida";
}

export interface Artigo extends RegistroBase {
  id?: number;
  id_artigo: string;
  titulo: string;
  categoria: string;
  produto: string;
  causa_raiz: string;
  solucao: string;
  data_criacao: string;
  autor: string;
  favorito: boolean;
  tags: string[];
}

export interface RegraOla extends RegistroBase {
  id?: number;
  id_regra: string;
  prioridade: Prioridade;
  produto: string;
  grupo_responsavel: string;
  tempo_limite_minutos: number;
  percentual_alerta: number;
  ativo: boolean;
  descricao?: string;
}

export interface ImportLog {
  id?: number;
  arquivo: string;
  tipo: string;
  tamanho: number;
  linhas_total: number;
  linhas_validas: number;
  linhas_erro: number;
  duplicados?: number;
  data: string;
  usuario: string;
  status: "Sucesso" | "Parcial" | "Falha";
  camada?: "Raw" | "Staging" | "Processed" | "Aplicação";
}

// Efetividade de uma correção validada ao longo de janelas de observação —
// alimenta a tela de Validação de Correções.
export interface Validacao extends RegistroBase {
  id?: number;
  id_validacao: string;
  id_acao: string;
  numero_incidente?: string;
  produto: string;
  janela_dias: 7 | 15 | 30;
  volume_previsto: number;
  volume_real: number;
  reincidencias: number;
  novas_violacoes: number;
  classificacao: ClassificacaoAcao;
  data_validacao: string;
  observacoes?: string;
}

export type CriticidadeProduto = "Baixa" | "Média" | "Alta" | "Crítica";

// Catálogo simples de produtos/serviços monitorados, derivado dos produtos
// já referenciados nos incidentes.
export interface ProdutoServico extends RegistroBase {
  id?: number;
  id_produto: string;
  nome: string;
  categoria: string;
  criticidade: CriticidadeProduto;
  grupo_responsavel: string;
  ativo: boolean;
}
