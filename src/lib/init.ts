import { db } from "./db";
import {
  gerarAlertas,
  gerarAcoes,
  gerarMudancas,
  gerarArtigos,
  gerarRegras,
  gerarValidacoes,
  gerarProdutosServicos,
} from "./demo-data";
import snapshotAmostra from "./databricks-snapshot-amostra.json";
import type { Incidente, Previsao, RiscoOla } from "./types";

// Snapshot congelado de dados reais do Databricks (ver
// scripts/gerar-snapshot-databricks.ts), usado como carga PADRÃO do app —
// assim qualquer visitante já abre com dados reais, sem precisar clicar em
// "Sincronizar agora" (que consulta o Databricks ao vivo e pode levar
// minutos pro volume real). O botão continua disponível em Dados para
// atualizar com dado mais recente quando houver tempo.
//
// É dividido em dois arquivos por causa do tamanho real da base (~120 mil
// incidentes, ~83 MB de JSON): um import estático de tudo isso trava o
// carregamento inicial da página por minutos, porque o bundle inteiro
// precisa terminar de baixar e fazer parse antes de qualquer código rodar.
// Por isso só a amostra inicial (mais recente) é importada de forma
// estática — pequena, carrega instantâneo — e o restante
// (databricks-snapshot-resto.json) é buscado via import() dinâmico dentro
// de continuarCargaEmSegundoPlano(), o que faz o Vite colocar esse arquivo
// grande num chunk separado, baixado em segundo plano sem bloquear nada.
const incidentesAmostra = snapshotAmostra.incidentes as Incidente[];
const previsoesSnapshot = snapshotAmostra.previsoes as Previsao[];
const riscosSnapshot = snapshotAmostra.riscos as RiscoOla[];

const LOTE_SEGUNDO_PLANO = 8000;

let seedPromise: Promise<void> | null = null;
let cargaSegundoPlanoEmAndamento = false;

// Baixa (só quando chamado — import dinâmico) e insere o restante dos
// incidentes reais em lotes, cedendo o event loop entre um lote e outro pra
// não travar a interface. Idempotente/retomável: compara a contagem atual
// da tabela com o total esperado (amostra + resto), então funciona tanto na
// primeira carga quanto ao continuar de onde parou depois de um reload no
// meio do processo.
async function continuarCargaEmSegundoPlano() {
  if (cargaSegundoPlanoEmAndamento) return;
  cargaSegundoPlanoEmAndamento = true;
  try {
    const { default: snapshotResto } = await import("./databricks-snapshot-resto.json");
    const incidentesResto = snapshotResto.incidentes as Incidente[];

    // O quanto já foi inserido além da amostra inicial (0 na primeira carga;
    // >0 se está retomando depois de um reload no meio do processo).
    let offsetResto = Math.max(0, (await db.incidentes.count()) - incidentesAmostra.length);
    while (offsetResto < incidentesResto.length) {
      const lote = incidentesResto.slice(offsetResto, offsetResto + LOTE_SEGUNDO_PLANO);
      await db.incidentes.bulkAdd(lote);
      offsetResto += lote.length;
      await new Promise((r) => setTimeout(r, 0));
    }
  } catch (err) {
    console.error("[init] Falha ao completar carga em segundo plano de incidentes:", err);
  } finally {
    cargaSegundoPlanoEmAndamento = false;
  }
}

export function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const count = await db.incidentes.count();
    if (count === 0) {
      const acoes = gerarAcoes(incidentesAmostra);
      const produtosServicos = gerarProdutosServicos();
      await db.incidentes.bulkAdd(incidentesAmostra);
      await db.previsoes.bulkAdd(previsoesSnapshot);
      await db.riscos.bulkAdd(riscosSnapshot);
      await db.alertas.bulkAdd(gerarAlertas());
      await db.acoes.bulkAdd(acoes);
      await db.mudancas.bulkAdd(gerarMudancas());
      await db.artigos.bulkAdd(gerarArtigos());
      await db.regras.bulkAdd(gerarRegras());
      await db.validacoes.bulkAdd(gerarValidacoes(acoes));
      await db.produtosServicos.bulkAdd(produtosServicos);
    }
  })();
  seedPromise.then(() => void continuarCargaEmSegundoPlano());
  return seedPromise;
}

export function resetSeed() {
  seedPromise = null;
}
