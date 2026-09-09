export const nf = new Intl.NumberFormat("pt-BR");
export const nfCompact = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function fmtNumber(n: number | undefined | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return nf.format(n);
}

export function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDuration(seconds: number) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}min`;
  return `${seconds}s`;
}

export function pct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

// Converte uma duração em minutos pra um texto legível, escolhendo a maior
// unidade (min/h/dias/meses) que ainda mantém o número numa faixa fácil de
// ler — usado sobretudo pro "tempo restante de SLA" dos riscos de OLA, que
// na base real varia de poucos minutos a dezenas de milhares (incidentes já
// bem além do prazo).
export function fmtDuracaoMin(minutos: number): string {
  const min = Math.round(Math.abs(minutos));
  if (min < 60) return `${min} min`;
  const horas = min / 60;
  if (horas < 48) return `${horas.toFixed(horas < 10 ? 1 : 0)}h`;
  const dias = horas / 24;
  if (dias < 60) return `${dias.toFixed(dias < 10 ? 1 : 0)} dias`;
  const meses = dias / 30;
  return `${meses.toFixed(1)} meses`;
}

// "Tempo restante" de um risco de OLA = tempo até o limite de SLA da
// prioridade ser atingido (limite do SLA − duração já decorrida do
// incidente). Quando negativo, o SLA já foi estourado há esse tempo — a UI
// nunca mostra o sinal de menos direto, só a direção (restante vs. atrasado)
// em texto/cor, pra não parecer um número quebrado.
export function fmtTempoRestanteSla(minutos: number): { texto: string; estourado: boolean } {
  const estourado = minutos < 0;
  const duracao = fmtDuracaoMin(minutos);
  return { texto: estourado ? `${duracao} atrasado` : `${duracao} restantes`, estourado };
}
