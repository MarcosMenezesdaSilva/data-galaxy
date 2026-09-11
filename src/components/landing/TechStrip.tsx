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
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 md:justify-start md:gap-x-14">
        {INTEGRACOES.map((nome) => (
          <li
            key={nome}
            className="text-[15px] font-medium tracking-tight text-muted-foreground/70 transition-colors duration-[var(--motion-default)] hover:text-muted-foreground"
          >
            {nome}
          </li>
        ))}
      </ul>
    </div>
  );
}
