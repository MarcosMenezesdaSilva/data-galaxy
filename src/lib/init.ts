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
import snapshotDatabricks from "./databricks-snapshot.json";
import type { Incidente, Previsao, RiscoOla } from "./types";

// Snapshot congelado de dados reais do Databricks (ver
// scripts/gerar-snapshot-databricks.ts), usado como carga PADRÃO do app —
// assim qualquer visitante já abre com dados reais, sem precisar clicar em
// "Sincronizar agora" (que consulta o Databricks ao vivo e pode levar
// dezenas de segundos). O botão continua disponível em Dados para atualizar
// com dado mais recente quando houver tempo.
const incidentesSnapshot = snapshotDatabricks.incidentes as Incidente[];
const previsoesSnapshot = snapshotDatabricks.previsoes as Previsao[];
const riscosSnapshot = snapshotDatabricks.riscos as RiscoOla[];

let seedPromise: Promise<void> | null = null;

export function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const count = await db.incidentes.count();
    if (count > 0) return;
    const acoes = gerarAcoes(incidentesSnapshot);
    const produtosServicos = gerarProdutosServicos();
    await db.incidentes.bulkAdd(incidentesSnapshot);
    await db.previsoes.bulkAdd(previsoesSnapshot);
    await db.riscos.bulkAdd(riscosSnapshot);
    await db.alertas.bulkAdd(gerarAlertas());
    await db.acoes.bulkAdd(acoes);
    await db.mudancas.bulkAdd(gerarMudancas());
    await db.artigos.bulkAdd(gerarArtigos());
    await db.regras.bulkAdd(gerarRegras());
    await db.validacoes.bulkAdd(gerarValidacoes(acoes));
    await db.produtosServicos.bulkAdd(produtosServicos);
  })();
  return seedPromise;
}

export function resetSeed() {
  seedPromise = null;
}
