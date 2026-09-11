import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * Visual proprietário do hero: a operação lida como constelação.
 *
 * Não é ornamento. O núcleo é o motor de previsão; as órbitas são os
 * horizontes (hoje, D+1, D+7); os nodes são produtos e grupos emitindo
 * incidentes; as linhas são o dado chegando ao núcleo. Um único node está
 * laranja — o risco de OLA que o sistema detectou. É a mesma leitura que a
 * headline faz em texto, e por isso o SVG inteiro é aria-hidden.
 *
 * As coordenadas são fixas de propósito: a app roda com SSR
 * (@tanstack/react-start) e qualquer posição aleatória divergiria entre
 * servidor e cliente na hidratação.
 */

const CENTER = 220;
const VIEWBOX = 440;

interface OrbitNode {
  /** Ângulo em graus, 0 = leste, sentido horário. */
  a: number;
  /** Liga o node ao núcleo por uma linha de dado. */
  wired?: boolean;
  /** O node em risco. Existe exatamente um. */
  risk?: boolean;
}

interface Orbit {
  r: number;
  /** Segundos por volta. Velocidades diferentes evitam leitura de engrenagem. */
  duration: number;
  reverse?: boolean;
  nodes: OrbitNode[];
}

const ORBITS: Orbit[] = [
  {
    r: 80,
    duration: 54,
    nodes: [{ a: 28, wired: true }, { a: 152, wired: true }, { a: 262 }],
  },
  {
    r: 130,
    duration: 78,
    reverse: true,
    nodes: [
      { a: -8 },
      // No anel do meio: a linha até o núcleo tem comprimento suficiente
      // para ser lida como conexão, e não como raio do círculo.
      { a: 74, wired: true, risk: true },
      { a: 160 },
      { a: 232, wired: true },
      { a: 302 },
    ],
  },
  {
    r: 182,
    duration: 104,
    nodes: [{ a: 16 }, { a: 96, wired: true }, { a: 174 }, { a: 248 }, { a: 326 }],
  },
];

function pos(r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(a), y: CENTER + r * Math.sin(a) };
}

/** Arco do horizonte previsto, desenhado sobre a órbita externa. */
function arcPath(r: number, from: number, to: number) {
  const s = pos(r, from);
  const e = pos(r, to);
  const largeArc = Math.abs(to - from) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

export function GalaxyVisual({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const coreId = `dg-gx-core-${uid}`;
  const haloId = `dg-gx-halo-${uid}`;

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none relative aspect-square w-full", className)}
    >
      {/* Luz ambiente atrás da arte — elemento próprio, nunca deformando o SVG. */}
      <span
        className="dg-orb dg-breathe inset-[18%]"
        style={{ background: "var(--brand-orange-glow)" }}
      />

      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="relative h-full w-full">
        <defs>
          <radialGradient id={coreId}>
            <stop offset="0%" stopColor="var(--brand-orange-light)" />
            <stop offset="60%" stopColor="var(--brand-orange)" />
            <stop offset="100%" stopColor="var(--brand-orange-dark)" />
          </radialGradient>
          <radialGradient id={haloId}>
            <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {ORBITS.map((orbit, i) => (
          <g
            key={orbit.r}
            // A órbita externa é puramente ambiental: sai de cena no mobile,
            // onde o espaço tem que ir para conteúdo. Opacidade em vez de
            // display para não depender de media query em JS (SSR).
            className={i === 2 ? "opacity-0 sm:opacity-100" : undefined}
            style={{
              animation: `dg-orbit ${orbit.duration}s linear infinite`,
              animationDirection: orbit.reverse ? "reverse" : "normal",
              transformOrigin: `${CENTER}px ${CENTER}px`,
            }}
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r={orbit.r}
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="1"
              strokeDasharray={i === 1 ? "2 7" : undefined}
            />

            {/* Horizonte previsto: o único traço laranja fora do núcleo e do
                node em risco. Fica na órbita externa, onde é o D+7. */}
            {i === 2 && (
              <path
                d={arcPath(orbit.r, 292, 344)}
                fill="none"
                stroke="var(--brand-orange)"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.7"
              />
            )}

            {orbit.nodes.map((node) => {
              const p = pos(orbit.r, node.a);
              return (
                <g key={node.a}>
                  {node.wired && (
                    <line
                      x1={CENTER}
                      y1={CENTER}
                      x2={p.x}
                      y2={p.y}
                      stroke={node.risk ? "var(--brand-orange)" : "var(--border-strong)"}
                      strokeWidth="1"
                      opacity={node.risk ? 0.5 : 0.6}
                    />
                  )}
                  {node.risk && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="14"
                      fill={`url(#${haloId})`}
                      className="dg-breathe"
                    />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={node.risk ? 5 : 3}
                    fill={node.risk ? "var(--brand-orange)" : "var(--muted-foreground)"}
                    opacity={node.risk ? 1 : 0.55}
                  />
                </g>
              );
            })}
          </g>
        ))}

        {/* Núcleo — o motor. Halo, corpo em gradiente e o ponto de luz. */}
        <circle cx={CENTER} cy={CENTER} r="52" fill={`url(#${haloId})`} className="dg-breathe" />
        <circle cx={CENTER} cy={CENTER} r="19" fill={`url(#${coreId})`} />
        <circle cx={CENTER} cy={CENTER} r="6" fill="#ffffff" opacity="0.92" />
      </svg>
    </div>
  );
}
