import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, Database, Shield } from "lucide-react";

/**
 * Os quatro indicadores conceituais em volta da composição.
 *
 * Ficam posicionados contra a SEÇÃO do hero, não contra o contêiner da
 * galáxia. O contêiner da galáxia sangra para fora da viewport (right
 * negativo), então um marcador em `right: 0%` dele caía fora da tela — era
 * por isso que só dois dos quatro apareciam.
 *
 * Os percentuais saem da referência: dois na borda esquerda do disco (por
 * volta de 51% e 54% da largura) e dois junto à margem direita útil.
 */

interface Marcador {
  icon: LucideIcon;
  linha1: string;
  linha2: string;
  /** Lado do círculo em relação ao texto, para ele apontar ao disco. */
  lado: "esquerda" | "direita";
  posicao: CSSProperties;
  atraso: string;
  profundidade: string;
}

const MARCADORES: Marcador[] = [
  {
    icon: Database,
    linha1: "Dados",
    linha2: "em tempo real",
    lado: "direita",
    posicao: { top: "18%", left: "50%" },
    atraso: "0s",
    profundidade: "10px",
  },
  {
    icon: Activity,
    linha1: "Detecção",
    linha2: "antecipada",
    lado: "esquerda",
    posicao: { top: "21%", right: "7%" },
    atraso: "1.4s",
    profundidade: "15px",
  },
  {
    icon: BarChart3,
    linha1: "Insights",
    linha2: "acionáveis",
    lado: "direita",
    posicao: { top: "57%", left: "53%" },
    atraso: "2.6s",
    profundidade: "12px",
  },
  {
    icon: Shield,
    linha1: "Operações",
    linha2: "mais seguras",
    lado: "esquerda",
    posicao: { top: "57%", right: "4%" },
    atraso: "3.8s",
    profundidade: "17px",
  },
];

function FeatureMarker({
  icon: Icon,
  linha1,
  linha2,
  lado,
  posicao,
  atraso,
  profundidade,
}: Marcador) {
  const circulo = (
    <span
      aria-hidden="true"
      className="grid h-[52px] w-[52px] shrink-0 place-content-center rounded-pill border border-[color:var(--border-strong)] bg-[color:var(--surface-glass)] shadow-[var(--glow-sm)] backdrop-blur-sm"
    >
      <Icon className="h-[19px] w-[19px] text-foreground/85" />
    </span>
  );

  return (
    <div
      className="dg-parallax absolute hidden lg:block"
      style={{ ...posicao, ["--dg-depth"]: profundidade } as CSSProperties}
    >
      <div className="dg-gx-float flex items-center gap-4" style={{ animationDelay: atraso }}>
        {lado === "esquerda" && circulo}
        {/* tracking maior que o t-micro do DS: na referência estes rótulos são
            legenda de instrumento, e o espaçamento é o que dá esse caráter. */}
        <span className="whitespace-nowrap text-[11px] font-medium uppercase leading-[1.45] tracking-[0.09em] text-muted-foreground">
          {linha1}
          <br />
          {linha2}
        </span>
        {lado === "direita" && circulo}
      </div>
    </div>
  );
}

/** Camada dos quatro marcadores. Só o texto é conteúdo; ícone e círculo não. */
export function FeatureMarkers() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[6]">
      {MARCADORES.map((m) => (
        <FeatureMarker key={m.linha1} {...m} />
      ))}
    </div>
  );
}
