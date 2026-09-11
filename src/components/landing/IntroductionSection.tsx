import type { LucideIcon } from "lucide-react";
import { CheckCircle2, ShieldAlert, TrendingUp } from "lucide-react";

import { AmbientCircuit } from "./AmbientCircuit";
import { HowItWorksSection } from "./HowItWorksSection";
import { SectionHeader } from "./SectionHeader";

/**
 * Os três pilares de posicionamento. São conceito curto e escaneável, não
 * explicação: o mecanismo fica no "Como funciona", logo abaixo. Cada um
 * corresponde a uma tela real do produto — /previsoes, /riscos-ola e
 * /validacao — e nada aqui afirma o que aquela tela não faz.
 */
const PILARES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: TrendingUp,
    title: "Previsão antecipada",
    description: "Antecipa volume e tendências antes do impacto.",
  },
  {
    icon: ShieldAlert,
    title: "Risco explicável",
    description: "Mostra por que o risco aumentou e o que pesa no cenário.",
  },
  {
    icon: CheckCircle2,
    title: "Validação de impacto",
    description: "Compara previsto e realizado para comprovar a correção.",
  },
];

/**
 * Card horizontal e baixo: ícone à esquerda, conceito à direita. O formato
 * vertical anterior forçava parágrafo longo e triplicava a altura da seção
 * para dizer menos.
 */
function FeaturePillarCard({ icon: Icon, title, description }: (typeof PILARES)[number]) {
  return (
    <article className="dg-glass dg-bento flex items-start gap-5 p-5">
      <span
        aria-hidden="true"
        className="grid h-14 w-14 shrink-0 place-content-center rounded-md border border-[color:var(--border-brand)] bg-[color:var(--brand-orange-soft)]"
      >
        <Icon className="h-6 w-6 text-primary" />
      </span>

      <div className="flex flex-col gap-1.5 pt-0.5">
        <h3 className="t-h4 text-foreground">{title}</h3>
        <p className="t-body-sm text-pretty text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}

export function IntroductionSection() {
  return (
    <section id="what-is" className="relative scroll-mt-24 overflow-hidden">
      <AmbientCircuit />

      {/* Padding de topo curto de propósito: antes eram 96px/128px e a seção
          abria com uma faixa vazia que fazia a página parecer incompleta. */}
      <div className="dg-shell relative flex flex-col gap-12 pb-20 pt-16 md:gap-14 md:pb-24 md:pt-20">
        <SectionHeader
          title="O que é o Data Galaxy?"
          description="Uma plataforma de AIOps que conecta dados operacionais para antecipar incidentes, explicar riscos e comprovar se cada ação realmente resolveu o problema."
        />

        <div className="dg-stagger mx-auto grid w-full max-w-5xl gap-5 md:grid-cols-3">
          {PILARES.map((p) => (
            <FeaturePillarCard key={p.title} {...p} />
          ))}
        </div>
      </div>

      {/* "Como funciona" mora dentro desta seção: é a continuação da mesma
          âncora — primeiro o posicionamento, depois o mecanismo. */}
      <HowItWorksSection />
    </section>
  );
}
