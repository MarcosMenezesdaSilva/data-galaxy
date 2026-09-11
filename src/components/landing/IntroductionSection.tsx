import type { LucideIcon } from "lucide-react";
import { CheckCircle2, ShieldAlert, TrendingUp } from "lucide-react";

import { SectionHeader } from "./SectionHeader";

/**
 * Os três pilares respondem juntos "por que isto é diferente de um
 * dashboard": prever → explicar → comprovar. Cada um corresponde a uma tela
 * real do produto (/previsoes, /riscos-ola, /validacao), e a descrição não
 * afirma nada que aquela tela não faça.
 */
const PILARES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: TrendingUp,
    title: "Prevê o que ainda não aconteceu",
    description:
      "Volume de incidentes por produto nos horizontes D+1 e D+7, com os modelos AutoETS e Seasonal Naive e intervalo de confiança. A operação para de olhar só o retrovisor.",
  },
  {
    icon: ShieldAlert,
    title: "Explica o risco, sem caixa-preta",
    description:
      "A fila de riscos de violação de OLA vem ordenada por probabilidade, e cada item carrega os fatores que o produziram: pico de volume, grupo sobrecarregado e histórico.",
  },
  {
    icon: CheckCircle2,
    title: "Comprova se a correção resolveu",
    description:
      "Depois da ação, compara volume previsto e real em janelas de 7, 15 e 30 dias e classifica o resultado — efetiva de fato ou apenas paliativa.",
  },
];

function FeaturePillarCard({ icon: Icon, title, description }: (typeof PILARES)[number]) {
  return (
    <article className="dg-glass dg-bento flex h-full flex-col gap-5 p-7">
      <span
        aria-hidden="true"
        className="grid h-11 w-11 place-content-center rounded-md border border-[color:var(--border-brand)] bg-[color:var(--brand-orange-soft)]"
      >
        <Icon className="h-5 w-5 text-primary" />
      </span>

      <h3 className="t-h4 text-balance text-foreground">{title}</h3>
      <p className="t-body-sm text-pretty text-muted-foreground">{description}</p>
    </article>
  );
}

export function IntroductionSection() {
  return (
    <section id="what-is" className="scroll-mt-24 border-t border-[color:var(--border-subtle)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-24 md:px-10 md:py-32">
        <SectionHeader
          eyebrow="Introduction"
          title="What is Data Galaxy?"
          description="Uma plataforma de AIOps que fecha o ciclo inteiro da operação: prevê o que vem, explica por que virou risco e comprova se a correção aplicada resolveu."
        />

        {/* Mesma anatomia e mesma altura nos três (PDR §5). */}
        <div className="dg-stagger grid gap-5 md:grid-cols-3">
          {PILARES.map((p) => (
            <FeaturePillarCard key={p.title} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}
