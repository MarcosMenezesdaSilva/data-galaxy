import Dexie, { type Table } from "dexie";
import type {
  Incidente,
  Previsao,
  RiscoOla,
  Alerta,
  AcaoCorretiva,
  Mudanca,
  Artigo,
  RegraOla,
  ImportLog,
  Validacao,
  ProdutoServico,
} from "./types";

export class DataGalaxyDB extends Dexie {
  incidentes!: Table<Incidente, number>;
  previsoes!: Table<Previsao, number>;
  riscos!: Table<RiscoOla, number>;
  alertas!: Table<Alerta, number>;
  acoes!: Table<AcaoCorretiva, number>;
  mudancas!: Table<Mudanca, number>;
  artigos!: Table<Artigo, number>;
  regras!: Table<RegraOla, number>;
  imports!: Table<ImportLog, number>;
  validacoes!: Table<Validacao, number>;
  produtosServicos!: Table<ProdutoServico, number>;

  constructor() {
    super("data_galaxy");
    this.version(1).stores({
      incidentes:
        "++id,numero_incidente,produto,prioridade,grupo_designado,status_incidente,data_abertura,origem_incidente,dentro_ola",
      previsoes: "++id,id_previsao,horizonte,produto,data_prevista",
      riscos: "++id,id_risco,numero_incidente,faixa_risco,produto,probabilidade_violacao",
      alertas: "++id,id_alerta,severidade,status,produto,data_criacao",
      acoes: "++id,id_acao,numero_incidente,status,classificacao,produto,data_acao",
      mudancas: "++id,id_mudanca,tipo,produto,data",
      artigos: "++id,id_artigo,produto,categoria,favorito",
      regras: "++id,id_regra,prioridade,produto,ativo",
      imports: "++id,tipo,data",
    });

    // v2: índices ampliados na tabela de incidentes (número, prioridade,
    // datas, grupo e produto) para acelerar filtros/relatórios, além das
    // novas coleções demonstrativas (validações e produtos/serviços) e
    // suporte a origem_dado nas coleções já existentes.
    this.version(2).stores({
      incidentes:
        "++id,&numero_incidente,prioridade,data_abertura,grupo_designado,produto,status_incidente,origem_incidente,dentro_ola,origem_dado",
      previsoes: "++id,id_previsao,horizonte,produto,data_prevista,origem_dado",
      riscos:
        "++id,id_risco,numero_incidente,faixa_risco,produto,probabilidade_violacao,origem_dado",
      alertas: "++id,id_alerta,severidade,status,produto,data_criacao,origem_dado",
      acoes: "++id,id_acao,numero_incidente,status,classificacao,produto,data_acao,origem_dado",
      mudancas: "++id,id_mudanca,tipo,produto,data,origem_dado",
      artigos: "++id,id_artigo,produto,categoria,favorito,origem_dado",
      regras: "++id,id_regra,prioridade,produto,ativo,origem_dado",
      imports: "++id,tipo,data,camada",
      validacoes: "++id,id_validacao,id_acao,numero_incidente,produto,janela_dias,origem_dado",
      produtosServicos: "++id,id_produto,nome,categoria,criticidade,origem_dado",
    });
  }
}

export const db = new DataGalaxyDB();

export async function clearAllData() {
  await Promise.all([
    db.incidentes.clear(),
    db.previsoes.clear(),
    db.riscos.clear(),
    db.alertas.clear(),
    db.acoes.clear(),
    db.mudancas.clear(),
    db.artigos.clear(),
    db.regras.clear(),
    db.imports.clear(),
    db.validacoes.clear(),
    db.produtosServicos.clear(),
  ]);
}
