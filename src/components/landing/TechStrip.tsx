/**
 * Faixa de tecnologias do hero.
 *
 * Conteúdo restrito às integrações que existem no código, conforme o §13 do
 * briefing ("usar apenas as integrações realmente autorizadas"): Databricks
 * (databricks-query), Anthropic (api.anthropic.com), Twilio (api.twilio.com),
 * Microsoft Teams (webhook em notify) e Netlify (host e functions).
 *
 * Ficaram de fora Google Cloud, AWS, Snowflake e MongoDB, que o projeto não
 * usa, e OpenAI — o Assistente roda em Claude, então aquele logo seria uma
 * afirmação falsa, não uma licença artística.
 *
 * Os nomes saem como wordmark tipográfico em vez de logo: sem os SVG oficiais
 * no repositório, desenhar sete marcas registradas à mão entregaria marca
 * errada. Para trocar por logo real, basta substituir o <span> por um <svg>
 * monocromático dentro do mesmo <li> — o espaçamento não muda.
 */
const INTEGRACOES = [
  "Databricks",
  "Anthropic",
  "Twilio",
  "Microsoft Teams",
  "Netlify",
];

export function TechStrip({ className }: { className?: string }) {
  return (
    <div className={className}>
      {/* justify-between no desktop: na referência os parceiros formam uma
          faixa que atravessa a base inteira do hero, não um bloco agrupado
          sob a coluna de texto. */}
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 lg:flex-nowrap lg:justify-between lg:gap-x-6">
        {INTEGRACOES.map((nome) => (
          <li
            key={nome}
            className="whitespace-nowrap text-[15px] font-medium tracking-tight text-foreground/45 transition-colors duration-[var(--motion-default)] hover:text-foreground/75"
          >
            {nome}
          </li>
        ))}
      </ul>
    </div>
  );
}
