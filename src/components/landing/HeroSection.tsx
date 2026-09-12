import { useNavigate } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeatureMarkers } from "./FeatureMarkers";
import { GalaxyScene } from "./GalaxyScene";
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
  // z-[3] fica ACIMA do disco (z-[1]); a vinheta sobe para z-[4] para poder
  // atenuar estes corpos atrás do texto. Sem z-index eles pintavam atrás da
  // galáxia por ordem de DOM, invertendo a profundidade da composição.
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
      {/* Grande, embaixo à esquerda — a única com luz quente na borda. */}
      <div
        className="dg-parallax absolute bottom-[-38vw] left-[-16vw] h-[58vw] w-[58vw] rounded-pill"
        style={{
          ...camada("22px"),
          background:
            "radial-gradient(circle at 60% 13%, rgba(255,124,74,0.22) 0%, rgba(255,74,31,0.06) 26%, rgba(13,13,15,0.95) 54%, rgba(7,7,9,0.99) 100%)",
          boxShadow: "inset 0 2px 0 rgba(255,150,108,0.18)",
        }}
      />

      {/* Escura, embaixo à direita. */}
      <div
        className="dg-parallax absolute bottom-[-20vw] right-[-9vw] h-[34vw] w-[34vw] rounded-pill"
        style={{
          ...camada("18px"),
          background:
            "radial-gradient(circle at 40% 16%, rgba(154,154,166,0.18) 0%, rgba(38,38,43,0.72) 32%, rgba(8,8,10,0.98) 100%)",
          boxShadow: "inset 0 1px 0 rgba(200,200,212,0.12)",
        }}
      />

      {/* Pequena, topo à direita. */}
      <div
        className="dg-parallax absolute right-[-2vw] top-[-9vw] h-[17vw] w-[17vw] rounded-pill"
        style={{
          ...camada("26px"),
          background:
            "radial-gradient(circle at 34% 30%, rgba(176,176,188,0.26) 0%, rgba(46,46,52,0.74) 38%, rgba(9,9,11,0.97) 100%)",
        }}
      />
    </div>
  );
}

function ScrollHint() {
  return (
    <a
      href="#what-is"
      className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 rounded-md px-3 py-2 text-muted-foreground/70 transition-colors duration-[var(--motion-default)] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-orange)] lg:flex"
    >
      <ArrowDown className="dg-scroll-hint h-4 w-4" aria-hidden="true" />
      <span className="t-overline">Scroll para explorar</span>
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
      {/* Nebulosa. Cinco gradientes empilhados em UM elemento, sem filtro de
          blur: gradiente já é suave, e blur em área grande custa repaint caro
          por frame junto do parallax. É esta camada que dá a atmosfera quente
          da referência — sem ela as órbitas ficam soltas no preto e a cena lê
          como diagrama, não como espaço. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 48% 42% at 76% 22%, rgba(255,74,31,0.26), transparent 70%)",
            "radial-gradient(ellipse 36% 34% at 95% 48%, rgba(255,92,42,0.20), transparent 72%)",
            "radial-gradient(ellipse 44% 38% at 66% 68%, rgba(188,48,20,0.16), transparent 74%)",
            "radial-gradient(ellipse 28% 24% at 88% 6%, rgba(255,122,72,0.15), transparent 68%)",
            // Streak diagonal: a faixa de luz que atravessa o canto superior
            // direito da referência e amarra a nebulosa ao disco.
            "linear-gradient(128deg, transparent 52%, rgba(255,96,45,0.10) 64%, transparent 76%)",
          ].join(","),
        }}
      />

      {/* O grid técnico do hero saiu: a textura do body já desenha uma malha de
          64px em todo o site, e a daqui caía na mesma fase, somando as duas
          linhas no mesmo pixel. Era esse empilhamento que deixava a grade
          nítida na primeira dobra. */}

      <ForegroundBodies />

      {/* Galáxia: em fluxo no mobile, depois do texto; absoluta e sangrando
          para fora da viewport no desktop. Ocupa 70% e avança até ~38% da
          largura, então o disco alcança o centro como na referência — uma
          instância só, duplicar em dois breakpoints dobraria as animações. */}
      <div className="relative z-[1] mt-4 w-full px-4 pb-16 sm:px-10 lg:absolute lg:pb-0 lg:inset-y-0 lg:right-[-8%] lg:mt-0 lg:flex lg:w-[70%] lg:items-center lg:px-0">
        <GalaxyScene className="mx-auto aspect-[1000/820] w-full max-w-[560px] lg:max-w-none" />
      </div>

      {/* Vinheta à esquerda. Com o disco avançando até 38%, as órbitas externas
          passam por trás do texto; este escurecimento devolve o contraste sem
          precisar encurtar a composição. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-[4] hidden w-[52%] lg:block"
        style={{
          background:
            "linear-gradient(to right, var(--background) 0%, rgba(5,5,5,0.82) 42%, transparent 100%)",
        }}
      />

      <FeatureMarkers />

      {/* Conteúdo. z-10 mantém texto à frente de qualquer corpo. */}
      <div className="dg-shell relative z-10 flex flex-col pt-14 lg:pt-0">
        {/* A dobra fecha em 100vh só aqui: viewport menos a navbar. No mobile a
            altura é o conteúdo, senão o título brigaria com a galáxia. */}
        <div className="flex items-center lg:min-h-[calc(100svh_-_70px)]">
          <div className="flex flex-col items-start gap-8 lg:max-w-[880px]">
            {/* Sem text-balance: ele briga com o <br /> explícito e podia
                reequilibrar as duas linhas em quatro. */}
            <h1 className="t-hero text-foreground">
              Dados unificados,
              <br />
              possibilidades <span className="text-primary">ilimitadas.</span>
            </h1>

            <p className="t-body-lg max-w-[580px] text-pretty text-foreground/65">
              Conecte, analise e coloque seus dados em ação com inteligência, em grande escala, em
              todo o seu ecossistema
            </p>

            <Button
              size="lg"
              onClick={() => navigate({ to: "/login" })}
              className="group mt-1 h-[56px] px-9 text-base"
            >
              Acessar plataforma
              {/* ml-3, não gap: na referência a seta fica visivelmente
                  separada do rótulo, não colada nele. */}
              <ArrowRight className="ml-3 h-[18px] w-[18px] transition-transform duration-[var(--motion-default)] ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
            </Button>

            <p className="t-body-sm text-muted-foreground">
              Sem cadastro? Sem problemas, teste pelo perfil de demonstração
            </p>
          </div>
        </div>
      </div>

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
