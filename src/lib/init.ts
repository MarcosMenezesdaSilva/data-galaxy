import { db } from "./db";
import {
  gerarIncidentes,
  gerarPrevisoes,
  gerarRiscos,
  gerarAlertas,
  gerarAcoes,
  gerarMudancas,
  gerarArtigos,
  gerarRegras,
  gerarValidacoes,
  gerarProdutosServicos,
} from "./demo-data";

let seedPromise: Promise<void> | null = null;

export function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const count = await db.incidentes.count();
    if (count > 0) return;
    const incidentes = gerarIncidentes(1000);
    const acoes = gerarAcoes(incidentes);
    await db.incidentes.bulkAdd(incidentes);
    await db.previsoes.bulkAdd(gerarPrevisoes());
    await db.riscos.bulkAdd(gerarRiscos(incidentes));
    await db.alertas.bulkAdd(gerarAlertas());
    await db.acoes.bulkAdd(acoes);
    await db.mudancas.bulkAdd(gerarMudancas());
    await db.artigos.bulkAdd(gerarArtigos());
    await db.regras.bulkAdd(gerarRegras());
    await db.validacoes.bulkAdd(gerarValidacoes(acoes));
    await db.produtosServicos.bulkAdd(gerarProdutosServicos());
  })();
  return seedPromise;
}

export function resetSeed() {
  seedPromise = null;
}
