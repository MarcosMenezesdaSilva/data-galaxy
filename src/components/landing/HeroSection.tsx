import { useNavigate } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";

import { Eyebrow } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { GalaxyVisual } from "./GalaxyVisual";

const atraso = (ms: number) => ({ "--dg-delay": `${ms}ms` }) as CSSProperties;

/**
 * Hero. Comunica a proposta inteira sem depender de scroll (PDR §19): eyebrow,
 * headline, duas linhas de apoio e um único CTA — nada mais compete por
 * atenção. O visual divide o palco no desktop e desce para baixo do texto no
 * mobile, onde a ordem é conteúdo → CTA → produto.
 */
export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      {/* Profundidade ambiente. Duas fontes de luz: uma quente na diagonal do
          visual, uma fria e larga atrás do texto para afastá-lo do preto. */}
      <div aria-hidden="true" className="dg-grid-field absolute inset-0" />
      <span
        aria-hidden="true"
        className="dg-orb right-[-10%] top-[-20%] h-[560px] w-[560px]"
        style={{ background: "var(--brand-orange-glow)", opacity: 0.5 }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-16 md:grid-cols-[1.05fr_0.95fr] md:gap-8 md:px-10 md:pb-32 md:pt-24">
        <div className="flex flex-col items-start gap-7">
          <Eyebrow className="dg-enter" style={atraso(40)}>
            Challenge Locaweb × FIAP · NexusOps
          </Eyebrow>

          <h1 className="t-display-lg dg-enter text-balance text-foreground" style={atraso(120)}>
            De incidentes <span className="text-muted-foreground">reativos</span> a operações{" "}
            <span className="text-primary">preditivas</span>.
          </h1>

          <p
            className="t-body-lg dg-enter max-w-xl text-pretty text-muted-foreground"
            style={atraso(200)}
          >
            O Data Galaxy prevê o volume de incidentes em D+1 e D+7, calcula o risco de violação de
            OLA antes que ele aconteça e comprova, com dados, se cada correção funcionou.
          </p>

          <div className="dg-enter flex flex-wrap items-center gap-4" style={atraso(280)}>
            <Button size="lg" onClick={() => navigate({ to: "/login" })}>
              Acessar plataforma <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <span className="t-body-sm text-muted-foreground">
              Sem cadastro — entra por perfil de demonstração.
            </span>
          </div>
        </div>

        {/* O visual entra depois do texto na ordem de leitura e na animação:
            primeiro a promessa, depois a representação dela. */}
        <GalaxyVisual className="dg-enter-fade mx-auto max-w-md md:max-w-none" />
      </div>
    </section>
  );
}
