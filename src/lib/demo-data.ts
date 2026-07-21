import type {
  Incidente,
  Previsao,
  RiscoOla,
  Alerta,
  AcaoCorretiva,
  Mudanca,
  Artigo,
  RegraOla,
  Prioridade,
  FaixaRisco,
  Severidade,
  ClassificacaoAcao,
  Validacao,
  ProdutoServico,
  CriticidadeProduto,
} from "./types";

export const PRODUTOS = [
  "Hosting",
  "E-mail Corporativo",
  "Cloud",
  "Plataforma de APIs",
  "Portal do Cliente",
  "Sistema de Acesso",
  "Aplicação Financeira",
  "VPN Corporativa",
  "Backup",
  "Banco de Dados",
];

export const GRUPOS = [
  "Infraestrutura",
  "Plataforma",
  "Aplicações",
  "Redes",
  "Segurança",
  "Banco de Dados",
  "Cloud Operations",
  "Service Desk",
  "SRE",
  "Monitoramento",
];

const CATEGORIAS = [
  "Performance",
  "Disponibilidade",
  "Capacidade",
  "Conectividade",
  "Configuração",
  "Segurança",
];
const SUBCATEGORIAS = [
  "CPU",
  "Memória",
  "Disco",
  "Rede",
  "Autenticação",
  "Latência",
  "Timeout",
  "Erro 5xx",
];
const CODIGOS_FECHAMENTO = [
  "Resolvido",
  "Solução paliativa",
  "Sem intervenção",
  "Problema conhecido",
  "Duplicado",
];
const RESPONSAVEIS = [
  "Ana Ribeiro",
  "Bruno Alves",
  "Camila Oliveira",
  "Diego Torres",
  "Elisa Nunes",
  "Felipe Rocha",
  "Guilherme Santos",
  "Helena Dias",
];
const TIPOS_ACAO = [
  "Reinício de serviço",
  "Ajuste de configuração",
  "Aumento de capacidade",
  "Correção de código",
  "Rollback",
  "Ajuste de monitoramento",
  "Mudança de infraestrutura",
];

// Rótulo obrigatório exibido junto às Regras de OLA demonstrativas (tela de
// Configurações) — estes parâmetros são editáveis no MVP mas não substituem
// a validação formal da Locaweb sobre os limites reais de SLA/OLA.
export const REGRAS_OLA_DISCLAIMER = "Parâmetros demonstrativos — sujeitos à validação da Locaweb";

// Limites oficiais de SLA/OLA por prioridade (dicionário de dados real da
// Locaweb), em horas de duração do incidente (campo Duração) até o
// encerramento/resolução para ser considerado "dentro do SLA".
export const LIMITES_SLA_HORAS: Record<Prioridade, number> = {
  P1: 4,
  P2: 4,
  P3: 12,
  P4: 24,
  P5: 96,
};

// Parâmetros demonstrativos e editáveis usados pelo motor de alertas/risco
// preditivo (NÃO confundir com o SLA oficial acima). Valores iniciais
// corretos, em minutos.
export const LIMITES_REGRA_OLA_MINUTOS: Record<Prioridade, number> = {
  P1: 30,
  P2: 120,
  P3: 480,
  P4: 1440,
  P5: 2880,
};

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}
function rand(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min);
}
function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(rand(rng, min, max + 1));
}

// Seeded PRNG for reproducibility
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PRIORIDADES: Prioridade[] = ["P1", "P2", "P3", "P4", "P5"];

// Regra oficial de elegibilidade a KPI (dicionário de dados Locaweb):
// elegível SE E SOMENTE SE prioridade ∈ {P1,P2,P3} E incidente_pai vazio
// E status_incidente != "Sem Intervenção".
export function calcularElegivelKpi(
  inc: Pick<Incidente, "prioridade" | "incidente_pai" | "status_incidente">,
): boolean {
  const prioridadeElegivel =
    inc.prioridade === "P1" || inc.prioridade === "P2" || inc.prioridade === "P3";
  const semPai = !inc.incidente_pai;
  const naoSemIntervencao = inc.status_incidente !== "Sem Intervenção";
  return prioridadeElegivel && semPai && naoSemIntervencao;
}

// Regra oficial de "dentro do SLA": duração do incidente (em horas) até o
// encerramento/resolução comparada ao limite oficial por prioridade.
export function calcularDentroSla(prioridade: Prioridade, duracaoSegundos: number): boolean {
  const horas = duracaoSegundos / 3600;
  return horas <= LIMITES_SLA_HORAS[prioridade];
}

export function gerarIncidentes(n = 1000): Incidente[] {
  const rng = mulberry32(42);
  const out: Incidente[] = [];

  // Ruptura de volume real: concentração forte em set-dez/2025, mas cobrindo
  // datas antes e depois desse período (jan/2025 a fev/2026).
  const RANGE_ANTES: [Date, Date] = [new Date(2025, 0, 1), new Date(2025, 7, 31, 23, 59)];
  const RANGE_PICO: [Date, Date] = [new Date(2025, 8, 1), new Date(2025, 11, 31, 23, 59)];
  const RANGE_DEPOIS: [Date, Date] = [new Date(2026, 0, 1), new Date(2026, 1, 28, 23, 59)];

  function dataAleatoria(rng2: () => number): { data: Date; pico: boolean } {
    const r = rng2();
    if (r < 0.78) {
      const [a, b] = RANGE_PICO;
      return { data: new Date(a.getTime() + rng2() * (b.getTime() - a.getTime())), pico: true };
    }
    if (r < 0.93) {
      const [a, b] = RANGE_ANTES;
      return { data: new Date(a.getTime() + rng2() * (b.getTime() - a.getTime())), pico: false };
    }
    const [a, b] = RANGE_DEPOIS;
    return { data: new Date(a.getTime() + rng2() * (b.getTime() - a.getTime())), pico: true };
  }

  // Primeira passada: gera os incidentes "candidatos a pai" primeiro, para
  // que uma fração dos demais possa referenciá-los via incidente_pai.
  const numerosGerados: string[] = [];
  for (let i = 0; i < n; i++) numerosGerados.push(`INC${8600000 + i}`);

  for (let i = 0; i < n; i++) {
    const { data: abertura, pico } = dataAleatoria(rng);
    // Pós-setembro/2025: ~90-95% das aberturas são por monitoramento automático.
    // Antes disso, a maioria é manual.
    const monitor = pico ? rng() < 0.93 : rng() < 0.35;
    const duracao = randInt(rng, 30, 60 * 60 * 8);
    const resolucao = new Date(abertura.getTime() + duracao * 1000);
    const encerramento = new Date(resolucao.getTime() + randInt(rng, 60, 3600) * 1000);
    const prioridade = pick(PRIORIDADES, rng);

    // "Sem Intervenção" concentrado no período pós-set/2025 e majoritariamente
    // aberto por monitoramento, conforme o dicionário de dados oficial.
    const semIntervencao = pico && monitor && rng() < 0.55;
    const status = semIntervencao
      ? "Sem Intervenção"
      : pick(["Resolvido", "Encerrado", "Em andamento", "Reaberto"], rng);

    // Nulos reais (não strings vazias) para uma fração dos registros, imitando
    // a base real tratada — não inventamos valores para preencher.
    const produtoAusente = rng() < 0.06;
    const categoriaAusente = rng() < 0.08;
    const subcategoriaAusente = rng() < 0.1;
    const fechamentoAusente = status === "Em andamento" || rng() < 0.12;
    const solucaoAusente = status !== "Resolvido" || rng() < 0.2;

    // ~5-8% dos incidentes referenciam um "pai" já gerado anteriormente na
    // lista (necessário para demonstrar a regra de exclusão de KPI).
    const temPai = i > 50 && rng() < 0.065;
    const incidentePai = temPai ? numerosGerados[randInt(rng, 0, i - 1)] : undefined;

    const incidenteParcial: Pick<Incidente, "prioridade" | "incidente_pai" | "status_incidente"> = {
      prioridade,
      incidente_pai: incidentePai,
      status_incidente: status,
    };

    out.push({
      numero_incidente: numerosGerados[i],
      prioridade,
      produto: produtoAusente ? null : pick(PRODUTOS, rng),
      categoria: categoriaAusente ? null : pick(CATEGORIAS, rng),
      subcategoria: subcategoriaAusente ? null : pick(SUBCATEGORIAS, rng),
      grupo_designado: pick(GRUPOS, rng),
      item_configuracao: `IC${String(randInt(rng, 1, 9999)).padStart(5, "0")}`,
      data_abertura: abertura.toISOString(),
      data_resolucao: status !== "Em andamento" ? resolucao.toISOString() : undefined,
      data_encerramento:
        status === "Encerrado" || status === "Sem Intervenção"
          ? encerramento.toISOString()
          : undefined,
      duracao_segundos: duracao,
      status_incidente: status,
      codigo_fechamento: fechamentoAusente ? null : pick(CODIGOS_FECHAMENTO, rng),
      descricao_resumida: pick(
        [
          "Problem: Apache Busy Workers",
          "Problem: Disk I/O overload",
          "Alarm: Application Monitoring timeout",
          "Latency above threshold",
          "Database connection pool exhausted",
          "SSL certificate expired soon",
          "High memory usage",
          "Backup job failed",
        ],
        rng,
      ),
      solucao: solucaoAusente ? null : "Serviço reiniciado e monitoramento normalizado.",
      aberto_por: monitor ? "Monitoramento" : pick(RESPONSAVEIS, rng),
      incidente_pai: incidentePai,
      elegivel_kpi: calcularElegivelKpi(incidenteParcial),
      dentro_ola: calcularDentroSla(prioridade, duracao),
      origem_incidente: monitor ? "Monitoramento" : "Manual",
      tipo_abertura: monitor ? "Automática" : "Manual",
      origem_dado: "DEMONSTRACAO",
      gerado_para_mvp: true,
    });
  }
  return out.sort((a, b) => b.data_abertura.localeCompare(a.data_abertura));
}

export function gerarPrevisoes(): Previsao[] {
  const rng = mulberry32(7);
  const out: Previsao[] = [];
  const hoje = new Date();
  let idx = 0;
  for (const produto of PRODUTOS) {
    for (let d = 1; d <= 7; d++) {
      const base = randInt(rng, 40, 180);
      const prevista = new Date(hoje.getTime() + d * 86400000);
      out.push({
        id_previsao: `PRV${1000 + idx++}`,
        data_execucao: hoje.toISOString(),
        data_prevista: prevista.toISOString(),
        horizonte: d === 1 ? "D+1" : "D+7",
        produto,
        volume_previsto: base,
        limite_inferior: Math.round(base * 0.82),
        limite_superior: Math.round(base * 1.24),
        modelo: rng() < 0.6 ? "AutoETS" : "SeasonalNaive",
        versao_modelo: "v1.0.0-demo",
        origem_dado: "DEMONSTRACAO",
        gerado_para_mvp: true,
      });
    }
  }
  return out;
}

export function gerarRiscos(incidentes: Incidente[], produtos?: ProdutoServico[]): RiscoOla[] {
  const rng = mulberry32(11);
  const abertos = incidentes
    .filter((i) => i.status_incidente === "Em andamento" || i.status_incidente === "Reaberto")
    .slice(0, 40);
  const alvo =
    abertos.length >= 40 ? abertos : [...abertos, ...incidentes.slice(0, 40 - abertos.length)];

  // Cross-reference real: criticidade do catálogo de produtos/serviços e
  // proporção histórica de violações de SLA por produto (dados carregados),
  // em vez de sortear esses dois fatores aleatoriamente.
  const criticidadePorProduto = new Map((produtos ?? []).map((p) => [p.nome, p.criticidade]));
  const violacaoPorProduto = new Map<string, number>();
  const totalPorProduto = new Map<string, number>();
  incidentes.forEach((i) => {
    const p = i.produto ?? "Não informado";
    totalPorProduto.set(p, (totalPorProduto.get(p) ?? 0) + 1);
    if (!i.dentro_ola) violacaoPorProduto.set(p, (violacaoPorProduto.get(p) ?? 0) + 1);
  });

  return alvo.map((inc, i) => {
    const prob = Math.round(rand(rng, 15, 98));
    const faixa: FaixaRisco =
      prob >= 80 ? "Crítico" : prob >= 60 ? "Alto" : prob >= 30 ? "Médio" : "Baixo";
    const fatores: string[] = [];
    const altaRec = rng() < 0.4;
    if (altaRec) fatores.push("Alta recorrência");
    const pico = rng() < 0.5;
    if (pico) fatores.push("Pico de volume");
    const sobre = rng() < 0.35;
    if (sobre) fatores.push("Grupo sobrecarregado");
    const tme = rng() < 0.4;
    if (tme) fatores.push("Tempo médio elevado");

    const produtoNome = inc.produto ?? "Não informado";
    const criticidade = criticidadePorProduto.get(produtoNome);
    const produtoCritico = criticidade === "Alta" || criticidade === "Crítica";
    if (produtoCritico) fatores.push("Produto crítico");

    const totalProd = totalPorProduto.get(produtoNome) ?? 0;
    const violProd = violacaoPorProduto.get(produtoNome) ?? 0;
    const historicoViolacao = totalProd > 0 && violProd / totalProd > 0.15;
    if (historicoViolacao) fatores.push("Histórico de violação");

    if (inc.prioridade === "P1") fatores.push("Prioridade alta");
    if (fatores.length === 0) fatores.push("Padrão histórico");
    return {
      id_risco: `RSK${2000 + i}`,
      numero_incidente: inc.numero_incidente,
      data_calculo: new Date().toISOString(),
      probabilidade_violacao: prob,
      faixa_risco: faixa,
      tempo_restante_minutos: randInt(rng, 5, 360),
      alta_recorrencia: altaRec,
      pico_volume: pico,
      grupo_sobrecarregado: sobre,
      tempo_medio_elevado: tme,
      produto_critico: produtoCritico,
      historico_violacao: historicoViolacao,
      fatores_risco: fatores,
      produto: inc.produto ?? pick(PRODUTOS, rng),
      prioridade: inc.prioridade,
      grupo: inc.grupo_designado,
      status: rng() < 0.85 ? "Ativo" : "Mitigado",
      origem_dado: "DEMONSTRACAO",
      gerado_para_mvp: true,
    };
  });
}

const SEVERIDADES: Severidade[] = ["Informativo", "Atenção", "Alto", "Crítico"];

export function gerarAlertas(): Alerta[] {
  const rng = mulberry32(19);
  const out: Alerta[] = [];
  for (let i = 0; i < 25; i++) {
    const criacao = new Date(Date.now() - randInt(rng, 0, 72) * 3600 * 1000);
    const sev = pick(SEVERIDADES, rng);
    const status = pick(
      ["Novo", "Reconhecido", "Em tratamento", "Finalizado"],
      rng,
    ) as Alerta["status"];
    out.push({
      id_alerta: `ALT${3000 + i}`,
      titulo: pick(
        [
          "Pico previsto em Hosting D+1",
          "Risco crítico de violação OLA — Cloud",
          "Aumento anormal de latência em APIs",
          "Grupo Infraestrutura sobrecarregado",
          "Reincidência detectada — Banco de Dados",
          "Falha em backup — Aplicação Financeira",
        ],
        rng,
      ),
      descricao:
        "Correlação de risco identificada pelo módulo preditivo. Recomenda-se atuação preventiva.",
      severidade: sev,
      produto: pick(PRODUTOS, rng),
      grupo_responsavel: pick(GRUPOS, rng),
      responsavel: rng() < 0.5 ? pick(RESPONSAVEIS, rng) : undefined,
      status,
      data_criacao: criacao.toISOString(),
      data_reconhecimento:
        status !== "Novo" ? new Date(criacao.getTime() + 600000).toISOString() : undefined,
      data_inicio_tratamento:
        status === "Em tratamento" || status === "Finalizado"
          ? new Date(criacao.getTime() + 1200000).toISOString()
          : undefined,
      data_finalizacao:
        status === "Finalizado" ? new Date(criacao.getTime() + 7200000).toISOString() : undefined,
      canal_email: true,
      canal_teams: rng() < 0.7,
      canal_sms: sev === "Crítico" || sev === "Alto",
      canal_api: rng() < 0.5,
      volume_previsto: randInt(rng, 30, 400),
      origem_dado: "DEMONSTRACAO",
      gerado_para_mvp: true,
    });
  }
  return out.sort((a, b) => b.data_criacao.localeCompare(a.data_criacao));
}

const CLASSIFICACOES: ClassificacaoAcao[] = ["Efetiva", "Paliativa", "Inconclusiva"];

export function gerarAcoes(incidentes: Incidente[]): AcaoCorretiva[] {
  const rng = mulberry32(23);
  const out: AcaoCorretiva[] = [];
  for (let i = 0; i < 15; i++) {
    const inc = incidentes[randInt(rng, 0, incidentes.length - 1)];
    const cls = pick(CLASSIFICACOES, rng);
    const dataAcao = new Date(Date.now() - randInt(rng, 3, 30) * 86400000);
    const volumePrev = randInt(rng, 50, 300);
    const fator =
      cls === "Efetiva"
        ? rand(rng, 0.35, 0.65)
        : cls === "Paliativa"
          ? rand(rng, 0.85, 1.1)
          : rand(rng, 0.7, 0.95);
    out.push({
      id_acao: `ACT${4000 + i}`,
      numero_incidente: inc.numero_incidente,
      responsavel: pick(RESPONSAVEIS, rng),
      grupo_responsavel: inc.grupo_designado,
      tipo_acao: pick(TIPOS_ACAO, rng),
      descricao_acao: "Ajustes aplicados conforme runbook e monitoramento reforçado.",
      causa_provavel: pick(
        [
          "Configuração inadequada",
          "Capacidade insuficiente",
          "Falha de rede",
          "Bug de aplicação",
          "Sobrecarga sazonal",
        ],
        rng,
      ),
      data_acao: dataAcao.toISOString(),
      data_conclusao: new Date(dataAcao.getTime() + randInt(rng, 1, 8) * 3600000).toISOString(),
      produto: inc.produto ?? pick(PRODUTOS, rng),
      status: "Em validação",
      volume_previsto: volumePrev,
      volume_real: Math.round(volumePrev * fator),
      reincidencias_7_dias: cls === "Efetiva" ? randInt(rng, 0, 2) : randInt(rng, 3, 12),
      reincidencias_15_dias: cls === "Efetiva" ? randInt(rng, 0, 3) : randInt(rng, 4, 18),
      reincidencias_30_dias: cls === "Efetiva" ? randInt(rng, 0, 4) : randInt(rng, 6, 24),
      novas_violacoes: cls === "Efetiva" ? randInt(rng, 0, 2) : randInt(rng, 2, 8),
      classificacao: cls,
      conclusao:
        cls === "Efetiva"
          ? "Volume real caiu abaixo de 70% do previsto e reincidência controlada."
          : cls === "Paliativa"
            ? "Queda inicial, mas volume voltou a subir dentro da janela."
            : "Janela de validação ainda em curso.",
      origem_dado: "DEMONSTRACAO",
      gerado_para_mvp: true,
    });
  }
  return out;
}

export function gerarMudancas(): Mudanca[] {
  const rng = mulberry32(29);
  const tipos: Mudanca["tipo"][] = [
    "Deploy",
    "Atualização",
    "Configuração",
    "Expansão",
    "Migração",
    "Rollback",
    "Manutenção",
  ];
  return Array.from({ length: 10 }, (_, i) => {
    const antes = randInt(rng, 20, 90);
    return {
      id_mudanca: `CHG${5000 + i}`,
      tipo: pick(tipos, rng),
      produto: pick(PRODUTOS, rng),
      grupo: pick(GRUPOS, rng),
      descricao: pick(
        [
          "Deploy versão 2.4.1 API Gateway",
          "Atualização de kernel dos servidores web",
          "Expansão do cluster de banco de dados",
          "Migração de storage para nova zona",
          "Rollback do release anterior por regressão",
          "Ajuste de parâmetros do balanceador",
        ],
        rng,
      ),
      data: new Date(Date.now() - randInt(rng, 1, 90) * 86400000).toISOString(),
      incidentes_antes: antes,
      incidentes_depois: Math.round(antes * rand(rng, 0.5, 1.4)),
      status: pick(["Programada", "Executada", "Revertida"], rng) as Mudanca["status"],
      origem_dado: "DEMONSTRACAO",
      gerado_para_mvp: true,
    };
  });
}

export function gerarArtigos(): Artigo[] {
  const rng = mulberry32(31);
  return Array.from({ length: 20 }, (_, i) => ({
    id_artigo: `KB${6000 + i}`,
    titulo: pick(
      [
        "Runbook: Reinício seguro do Apache",
        "Diagnóstico de I/O elevado em disco",
        "Timeout em APIs — checklist",
        "Alertas de monitoramento — glossário",
        "Padrão de rollback de deploy",
        "Expansão de capacidade de banco de dados",
        "Investigação de reincidência de incidentes",
        "Configuração recomendada de OLA por produto",
      ],
      rng,
    ),
    categoria: pick(["Runbook", "Troubleshooting", "Boas práticas", "Postmortem"], rng),
    produto: pick(PRODUTOS, rng),
    causa_raiz: pick(
      ["Configuração", "Capacidade", "Bug", "Dependência externa", "Sazonalidade"],
      rng,
    ),
    solucao: "Aplicar o procedimento descrito e validar métricas por 30 minutos.",
    data_criacao: new Date(Date.now() - randInt(rng, 5, 300) * 86400000).toISOString(),
    autor: pick(RESPONSAVEIS, rng),
    favorito: rng() < 0.25,
    tags: [pick(CATEGORIAS, rng), pick(SUBCATEGORIAS, rng)],
    origem_dado: "DEMONSTRACAO" as const,
    gerado_para_mvp: true,
  }));
}

export function gerarRegras(): RegraOla[] {
  const rng = mulberry32(37);
  const out: RegraOla[] = [];
  let i = 0;
  for (const prod of PRODUTOS.slice(0, 6)) {
    for (const p of PRIORIDADES) {
      out.push({
        id_regra: `OLA${7000 + i++}`,
        prioridade: p,
        produto: prod,
        grupo_responsavel: pick(GRUPOS, rng),
        tempo_limite_minutos: LIMITES_REGRA_OLA_MINUTOS[p],
        percentual_alerta: 80,
        ativo: true,
        descricao: REGRAS_OLA_DISCLAIMER,
        origem_dado: "DEMONSTRACAO",
        gerado_para_mvp: true,
      });
    }
  }
  return out;
}

// Dados demonstrativos para a tela de Validação de Correções — histórico de
// efetividade por janela de observação (7/15/30 dias) por ação corretiva.
export function gerarValidacoes(acoes: AcaoCorretiva[]): Validacao[] {
  const rng = mulberry32(41);
  const out: Validacao[] = [];
  let i = 0;
  const janelas: Array<7 | 15 | 30> = [7, 15, 30];
  for (const a of acoes) {
    for (const janela of janelas) {
      const fatorJanela =
        janela === 7
          ? rand(rng, 0.9, 1.05)
          : janela === 15
            ? rand(rng, 0.75, 0.95)
            : rand(rng, 0.55, 0.85);
      const base = a.volume_previsto ?? 100;
      out.push({
        id_validacao: `VAL${8000 + i++}`,
        id_acao: a.id_acao,
        numero_incidente: a.numero_incidente,
        produto: a.produto,
        janela_dias: janela,
        volume_previsto: base,
        volume_real: Math.round(base * fatorJanela),
        reincidencias: a.classificacao === "Efetiva" ? randInt(rng, 0, 3) : randInt(rng, 3, 15),
        novas_violacoes: a.classificacao === "Efetiva" ? randInt(rng, 0, 2) : randInt(rng, 1, 6),
        classificacao: a.classificacao,
        data_validacao: new Date(new Date(a.data_acao).getTime() + janela * 86400000).toISOString(),
        observacoes: a.conclusao,
        origem_dado: "DEMONSTRACAO",
        gerado_para_mvp: true,
      });
    }
  }
  return out;
}

const CRITICIDADES: CriticidadeProduto[] = ["Baixa", "Média", "Alta", "Crítica"];

// Catálogo de produtos/serviços derivado dos produtos usados nos incidentes,
// com criticidade atribuída demonstrativa (usada no fator de risco
// "Produto crítico").
export function gerarProdutosServicos(): ProdutoServico[] {
  const rng = mulberry32(43);
  return PRODUTOS.map((nome, i) => ({
    id_produto: `PRD${9000 + i}`,
    nome,
    categoria: pick(CATEGORIAS, rng),
    criticidade: pick(CRITICIDADES, rng),
    grupo_responsavel: pick(GRUPOS, rng),
    ativo: true,
    origem_dado: "DEMONSTRACAO" as const,
    gerado_para_mvp: true,
  }));
}
