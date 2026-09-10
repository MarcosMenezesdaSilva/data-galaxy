/**
 * Tema de data visualization do Data Galaxy.
 *
 * A regra do DS para gráficos: o laranja pode aparecer com mais intensidade
 * aqui do que no resto da interface, mas não existe arco-íris. A diferenciação
 * entre séries vem primeiro de tom, opacidade e espessura dentro do próprio
 * sistema — só depois de cor nova.
 *
 * Hierarquia:
 *   destaque principal   → --chart-1  (laranja da marca)
 *   destaque secundário  → --chart-2  (laranja claro)
 *   dado neutro          → --chart-3  (cinza médio)
 *   dado secundário      → --chart-4  (cinza recuado)
 *
 * Todos os valores são variáveis CSS, então os gráficos acompanham o tema
 * claro/escuro sem nenhum código condicional.
 */

export const chartColors = {
  /** A série que a tela está tentando explicar. */
  destaque: "var(--chart-1)",
  /** A série de apoio que dialoga com o destaque (ex.: previsto vs. real). */
  destaqueSecundario: "var(--chart-2)",
  /** Contexto: histórico, baseline, "todo o resto". */
  neutro: "var(--chart-3)",
  /** Fundo de comparação, ainda mais recuado. */
  neutroRecuado: "var(--chart-4)",
  grid: "var(--chart-grid)",
  label: "var(--chart-label)",
} as const;

/**
 * Rampa categórica, em ordem de prioridade de leitura. Começa no laranja
 * (a fatia que importa) e vai recuando para neutros — quem olha entende a
 * hierarquia antes de ler a legenda.
 */
export const chartCategorical = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-5)",
  "var(--chart-4)",
  "var(--chart-6)",
] as const;

/** Eixos: label discreto, sem linha de eixo competindo com o dado. */
export const axisProps = {
  stroke: chartColors.label,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

/** Grid a 6% — presente o suficiente para orientar, invisível o bastante para não somar ruído. */
export const gridProps = {
  stroke: chartColors.grid,
  strokeDasharray: "3 3",
} as const;

/** Tooltip como card elevado do sistema, não como caixa branca padrão. */
export const tooltipProps = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border-default)",
    borderRadius: 12,
    boxShadow: "var(--shadow-card-elevated)",
    fontSize: 12,
    padding: "10px 12px",
  },
  labelStyle: { color: "var(--muted-foreground)", fontSize: 11, marginBottom: 4 },
  itemStyle: { padding: 0 },
} as const;

export const legendProps = {
  wrapperStyle: { fontSize: 11, color: chartColors.label, paddingTop: 8 },
} as const;

/** Rótulo desenhado sobre a área do gráfico (LabelList). */
export const labelListProps = {
  fontSize: 11,
  fill: chartColors.label,
} as const;

/** Brush (navegação temporal) coerente com as superfícies do sistema. */
export const brushProps = {
  height: 22,
  stroke: chartColors.destaque,
  fill: "var(--surface-03)",
  travellerWidth: 8,
} as const;
