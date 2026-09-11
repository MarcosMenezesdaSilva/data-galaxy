import { useNavigate } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GalaxyScene } from "./GalaxyScene";
import { TechStrip } from "./TechStrip";
import { useMouseParallax } from "./useMouseParallax";

/** Amplitude de parallax da camada. Mesmo padrão de custom property do DS. */
const camada = (profundidade: string) => ({ "--dg-depth": profundidade }) as CSSProperties;

/**
 * Corpos de foreground: fatias de planetas cortadas pelas bordas da dobra.
 * São o que dá escala — sem eles a galáxia flutua no vazio e a página perde a
 * leitura de ambiente.
 *
 * São divs com radial-gradient, não SVG: luz de cima em esfera escura sai mais
 * convincente com gradiente deslocado do que com stops em <circle>, e sangrar
 * para fora da viewport fica trivial.
 */
function ForegroundBodies() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Grande, embaixo à esquerda — a única com luz quente na borda. */}
      <div
        className="dg-parallax absolute bottom-[-62%] left-[-14%] h-[760px] w-[760px] rounded-pill"
        style={{
          ...camada("22px"),
          background:
            "radial-gradient(circle at 58% 14%, rgba(255,116,68,0.20) 0%, rgba(255,74,31,0.05) 28%, rgba(13,13,15,0.94) 56%, rgba(7,7,9,0.99) 100%)",
          boxShadow: "inset 0 2px 0 rgba(255,146,104,0.16)",
        }}
      />

      {/* Escura, embaixo à direita. */}
      <div
        className="dg-parallax absolute bottom-[-38%] right-[-12%] h-[460px] w-[460px] rounded-pill"
        style={{
          ...camada("18px"),
          background:
            "radial-gradient(circle at 42% 18%, rgba(150,150,162,0.16) 0%, rgba(38,38,43,0.70) 34%, rgba(8,8,10,0.98) 100%)",
          boxShadow: "inset 0 1px 0 rgba(200,200,212,0.10)",
        }}
      />

      {/* Pequena, topo à direita. */}
      <div
        className="dg-parallax absolute right-[-3%] top-[-14%] h-[210px] w-[210px] rounded-pill"
        style={{
          ...camada("26px"),
          background:
            "radial-gradient(circle at 34% 30%, rgba(176,176,188,0.24) 0%, rgba(46,46,52,0.72) 40%, rgba(9,9,11,0.97) 100%)",
        }}
      />
    </div>
  );
}

function ScrollHint() {
  return (
    <a
      href="#what-is"
      className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors duration-[var(--motion-default)] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-orange)] lg:flex"
    >
      <ArrowDown className="dg-scroll-hint h-4 w-4" aria-hidden="true" />
      <span className="t-micro uppercase">Scroll para explorar</span>
    </a>
  );
}

export function HeroSection() {
  const cena = useMouseParallax<HTMLElement>();
  const navigate = useNavigate();

  return (
    <section
      ref={cena}
      className="relative isolate flex flex-col overflow-hidden lg:block lg:min-h-[680px]"
    >
      {/* Grid técnico. A máscara o apaga em direção à galáxia, para a malha
          não cortar as órbitas. */}
      <div
        aria-hidden="true"
        className="dg-grid-field absolute inset-0"
        style={{
          maskImage: "linear-gradient(to right, #000 0%, #000 34%, transparent 74%)",
          WebkitMaskImage: "linear-gradient(to right, #000 0%, #000 34%, transparent 74%)",
        }}
      />

      <ForegroundBodies />

      {/* Galáxia: em fluxo no mobile, depois do texto; absoluta e sangrando
          para fora da viewport no desktop, onde ela precisa de escala. Uma
          instância só — duplicar em dois breakpoints dobraria as animações. */}
      <div className="relative z-0 mt-4 w-full px-4 sm:px-10 lg:absolute lg:inset-y-0 lg:right-[-9%] lg:mt-0 lg:flex lg:w-[64%] lg:items-center lg:px-0">
        <GalaxyScene className="mx-auto aspect-[1000/820] w-full max-w-[560px] lg:max-w-none" />
      </div>

      {/* Conteúdo. z-10 mantém texto à frente de qualquer corpo. */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-6 pt-14 md:px-10 lg:pt-0">
        {/* A dobra fecha em 100vh só aqui: viewport menos a navbar. No mobile a
            altura é o conteúdo, senão o título brigaria com a galáxia. */}
        <div className="flex items-center lg:min-h-[calc(100svh_-_70px)]">
          <div className="flex flex-col items-start gap-7 lg:max-w-[42%]">
            <h1 className="t-display-xl text-balance text-foreground">
              Dados unificados,
              <br />
              possibilidades <span className="text-primary">ilimitadas.</span>
            </h1>

            <p className="t-body-lg max-w-lg text-pretty text-muted-foreground">
              Conecte, analise e coloque seus dados em ação com inteligência, em grande escala, em
              todo o seu ecossistema
            </p>

            <Button
              size="lg"
              onClick={() => navigate({ to: "/login" })}
              className="group h-14 px-8 text-base"
            >
              Acessar plataforma
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-[var(--motion-default)] ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
            </Button>

            <p className="t-body-sm text-muted-foreground">
              Sem cadastro? Sem problemas, teste pelo perfil de demonstração
            </p>
          </div>
        </div>
      </div>

      <TechStrip className="relative z-10 mx-auto mt-14 w-full max-w-6xl px-6 pb-16 md:px-10 lg:absolute lg:bottom-[78px] lg:left-1/2 lg:mt-0 lg:-translate-x-1/2 lg:pb-0" />

      <ScrollHint />

      {/* Transição para a próxima seção. O overflow-hidden da dobra corta o
          planeta grande em linha reta; este fade dissolve esse corte antes da
          borda da seção seguinte. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-28"
        style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
      />
    </section>
  );
}
