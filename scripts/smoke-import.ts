// Valida o pipeline de importação (src/lib/import-mapping.ts + quality.ts)
// contra um arquivo real de incidentes tratados, fora do navegador.
// Uso: bun run scripts/smoke-import.ts <caminho-do-incidentes_tratados.txt>
import Papa from "papaparse";
import { readFileSync } from "fs";
import { mapearLinhaOficial, pareceBaseTratada } from "../src/lib/import-mapping";
import { computeQualityReport } from "../src/lib/quality";
import { calcularElegivelKpi, calcularDentroSla } from "../src/lib/demo-data";
import type { Incidente } from "../src/lib/types";

const path = process.argv[2];
if (!path) {
  console.error("Uso: bun run scripts/smoke-import.ts <caminho-do-incidentes_tratados.txt>");
  process.exit(1);
}
const text = readFileSync(path, "utf-8");

const headerProbe = Papa.parse(text, { header: false, preview: 1 });
const headerRow = headerProbe.data[0] as string[];
console.log("Header (25 cols esperado):", headerRow.length);
console.log("pareceBaseTratada:", pareceBaseTratada(headerRow));

const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, delimiter: ";" });
console.log("Linhas parseadas:", parsed.data.length, "| erros PapaParse:", parsed.errors.length);
if (parsed.errors.length) console.log(parsed.errors.slice(0, 3));

const mapeados: Partial<Incidente>[] = [];
let vazias = 0;
const vistos = new Set<string>();
let duplicados = 0;
for (const raw of parsed.data as Record<string, unknown>[]) {
  const { incidente, vazio } = mapearLinhaOficial(raw);
  if (vazio || !incidente) {
    vazias++;
    continue;
  }
  const numero = incidente.numero_incidente!;
  if (vistos.has(numero)) duplicados++;
  else vistos.add(numero);
  mapeados.push({
    ...incidente,
    elegivel_kpi: calcularElegivelKpi({
      prioridade: incidente.prioridade!,
      incidente_pai: incidente.incidente_pai,
      status_incidente: incidente.status_incidente!,
    }),
    dentro_ola: calcularDentroSla(incidente.prioridade!, incidente.duracao_segundos ?? 0),
  });
}

console.log("\n=== RESULTADO DO MAPEAMENTO ===");
console.log("Total mapeado:", mapeados.length, "| vazias:", vazias, "| duplicados:", duplicados);

const porPrioridade: Record<string, number> = {};
for (const m of mapeados) porPrioridade[m.prioridade!] = (porPrioridade[m.prioridade!] ?? 0) + 1;
console.log("Distribuição por prioridade:", porPrioridade);

const elegiveis = mapeados.filter((m) => m.elegivel_kpi).length;
const dentroOla = mapeados.filter((m) => m.dentro_ola).length;
console.log("Elegíveis KPI:", elegiveis, `(${((elegiveis / mapeados.length) * 100).toFixed(1)}%)`);
console.log(
  "Dentro do SLA (de todos):",
  dentroOla,
  `(${((dentroOla / mapeados.length) * 100).toFixed(1)}%)`,
);

const semIntervencao = mapeados.filter((m) => m.status_incidente === "Sem Intervenção").length;
console.log("Sem Intervenção:", semIntervencao);
const comPai = mapeados.filter((m) => m.incidente_pai).length;
console.log("Com incidente_pai preenchido:", comPai);
const semData = mapeados.filter((m) => !m.data_abertura).length;
console.log("Sem data_abertura válida:", semData);

console.log("\n=== QUALITY REPORT (amostra 5000) ===");
console.log(JSON.stringify(computeQualityReport(mapeados.slice(0, 5000) as Incidente[]), null, 2));

console.log("\nAmostra de 3 registros mapeados:");
console.log(JSON.stringify(mapeados.slice(0, 3), null, 2));
