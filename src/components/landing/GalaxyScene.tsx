import { useId, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Cena orbital do hero — a representação do ecossistema de dados.
 *
 * A leitura é: dado entra pelas órbitas externas, percorre as conexões, chega
 * ao núcleo e vira inteligência. Os pacotes luminosos são esse trânsito; o
 * núcleo respira porque está processando.
 *
 * Duas decisões carregam o visual:
 *
 * 1. POEIRA. Centenas de grãos no plano do disco. Oito elipses limpas,
 *    sozinhas, leem como alvo — é a densidade que vira matéria. Por isso as
 *    órbitas são discretas de propósito e o peso mora na poeira e no núcleo.
 *
 * 2. INCLINAÇÃO POR ÓRBITA. Cada anel tem rotação própria, então o conjunto
 *    não é perfeitamente concêntrico. Anéis aninhados com o mesmo eixo leem
 *    como alvo plano; desalinhados, leem como sistema em três dimensões.
 *
 * Cada corpo anda por CSS Motion Path sobre a MESMA string que desenha sua
 * órbita, e mora dentro do mesmo grupo inclinado que ela — assim a inclinação
 * se aplica aos dois e nada sai de registro.
 *
 * Coordenadas e fases são fixas: nada de Math.random em render, para servidor
 * e cliente não divergirem na hidratação.
 */

const CX = 500;
const CY = 400;
const VB_W = 1000;
const VB_H = 820;

/** Achatamento do disco. Mais baixo = plano visto mais de raspão. */
const ACHATAMENTO = 0.34;

/** Amplitude de parallax da camada. Mesmo padrão de custom property do DS. */
const camada = (profundidade: string) => ({ "--dg-depth": profundidade }) as CSSProperties;

/** Elipse como path fechado — serve de traço visível e de trilha do corpo. */
function orbitaPath(rx: number, ry: number) {
  return `M ${CX - rx} ${CY} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
}

/** rx e inclinação própria. As duas últimas passam da moldura, de propósito. */
const ORBITAS = [
  { rx: 112, inclinacao: -4 },
  { rx: 168, inclinacao: 3 },
  { rx: 232, inclinacao: -7 },
  { rx: 300, inclinacao: 2 },
  { rx: 372, inclinacao: -3 },
  { rx: 446, inclinacao: 6 },
  { rx: 536, inclinacao: -5 },
  { rx: 638, inclinacao: 4 },
].map((o, i) => {
  const ry = Math.round(o.rx * ACHATAMENTO);
  return {
    ...o,
    ry,
    d: orbitaPath(o.rx, ry),
    // Alternar cheio e pontilhado quebra a leitura de anéis idênticos.
    pontilhada: i % 2 === 1,
    // As externas somem: profundidade vem de contraste decrescente.
    opacidade: Math.max(0.08, 0.4 - i * 0.042),
  };
});

/**
 * Gerador determinístico. Precisa ser estável entre servidor e cliente, então
 * é um LCG de semente fixa, avaliado uma vez no módulo — não Math.random.
 */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface Grao {
  x: number;
  y: number;
  r: number;
  o: number;
  laranja: boolean;
}

/**
 * Poeira do disco: anéis de grãos com dispersão radial, no plano das órbitas.
 * Divididos em interna e externa para o mobile descartar a metade de fora sem
 * perder a forma do disco.
 */
const [POEIRA_INTERNA, POEIRA_EXTERNA] = (() => {
  const rnd = prng(20260911);
  const dentro: Grao[] = [];
  const fora: Grao[] = [];

  for (let anel = 0; anel < 7; anel++) {
    const base = 104 + anel * 66;
    const quantos = 10 + anel * 4;

    for (let i = 0; i < quantos; i++) {
      const rx = base + (rnd() - 0.5) * 34;
      const a = rnd() * Math.PI * 2;
      const grao: Grao = {
        x: CX + rx * Math.cos(a),
        y: CY + rx * ACHATAMENTO * Math.sin(a),
        r: 0.7 + rnd() * 1.2,
        o: 0.16 + rnd() * 0.46,
        // Minoria laranja: o disco é neutro e o calor vem do núcleo.
        laranja: rnd() < 0.3,
      };
      (anel < 3 ? dentro : fora).push(grao);
    }
  }

  return [dentro, fora];
})();

type Esfera = "clara" | "escura" | "laranja";

interface Corpo {
  orbita: number;
  r: number;
  esfera: Esfera;
  /** Posição na órbita, em %. Vale como estado estático sob reduced-motion. */
  fase: number;
  /** Segundos por volta. Nunca repetidos, para o conjunto não sincronizar. */
  duracao: number;
  reverso?: boolean;
}

const CORPOS: Corpo[] = [
  { orbita: 0, r: 5, esfera: "clara", fase: 18, duracao: 20 },
  { orbita: 1, r: 9, esfera: "escura", fase: 62, duracao: 27, reverso: true },
  { orbita: 2, r: 6, esfera: "laranja", fase: 8, duracao: 33 },
  { orbita: 2, r: 13, esfera: "clara", fase: 55, duracao: 38, reverso: true },
  { orbita: 3, r: 15, esfera: "escura", fase: 30, duracao: 47 },
  { orbita: 3, r: 4, esfera: "laranja", fase: 78, duracao: 43, reverso: true },
  { orbita: 4, r: 8, esfera: "clara", fase: 72, duracao: 57, reverso: true },
  { orbita: 4, r: 5, esfera: "laranja", fase: 20, duracao: 51 },
  { orbita: 5, r: 17, esfera: "escura", fase: 44, duracao: 68 },
  { orbita: 5, r: 7, esfera: "clara", fase: 88, duracao: 62, reverso: true },
  { orbita: 6, r: 11, esfera: "clara", fase: 12, duracao: 79 },
  { orbita: 6, r: 6, esfera: "escura", fase: 66, duracao: 84, reverso: true },
  { orbita: 7, r: 20, esfera: "escura", fase: 36, duracao: 96 },
  { orbita: 7, r: 9, esfera: "clara", fase: 82, duracao: 90, reverso: true },
];

interface Pacote {
  orbita: number;
  r: number;
  laranja: boolean;
  duracao: number;
  /** Atraso positivo: escalona a entrada para não piscarem todos junto. */
  atraso: number;
  reverso?: boolean;
}

const PACOTES: Pacote[] = [
  { orbita: 0, r: 2.5, laranja: true, duracao: 13, atraso: 0 },
  { orbita: 0, r: 2, laranja: false, duracao: 15, atraso: 6 },
  { orbita: 1, r: 2, laranja: false, duracao: 17, atraso: 3, reverso: true },
  { orbita: 1, r: 2.5, laranja: true, duracao: 19, atraso: 9, reverso: true },
  { orbita: 2, r: 2.5, laranja: true, duracao: 21, atraso: 5 },
  { orbita: 2, r: 2, laranja: false, duracao: 23, atraso: 14 },
  { orbita: 3, r: 2, laranja: false, duracao: 26, atraso: 1 },
  { orbita: 3, r: 2.5, laranja: true, duracao: 24, atraso: 12, reverso: true },
  { orbita: 4, r: 2, laranja: false, duracao: 31, atraso: 7 },
  { orbita: 4, r: 2.5, laranja: true, duracao: 29, atraso: 18 },
  { orbita: 5, r: 2.5, laranja: true, duracao: 36, atraso: 15 },
  { orbita: 5, r: 2, laranja: false, duracao: 33, atraso: 24, reverso: true },
  { orbita: 6, r: 2.5, laranja: true, duracao: 42, atraso: 9 },
  { orbita: 7, r: 2, laranja: false, duracao: 52, atraso: 20, reverso: true },
];

/** Estrelas do espaço em volta: [x, y, raio, opacidade]. Centro fica limpo. */
const ESTRELAS: [number, number, number, number][] = [
  [64, 98, 1.2, 0.5], [148, 212, 1, 0.35], [92, 366, 1.4, 0.42], [186, 508, 1, 0.3],
  [58, 624, 1.2, 0.38], [232, 702, 1, 0.28], [318, 88, 1, 0.32], [402, 176, 1.3, 0.45],
  [286, 296, 1, 0.26], [352, 640, 1.2, 0.36], [268, 758, 1, 0.3], [438, 726, 1.3, 0.4],
  [556, 62, 1.1, 0.34], [648, 132, 1, 0.28], [742, 74, 1.4, 0.46], [836, 168, 1, 0.32],
  [918, 96, 1.2, 0.4], [962, 254, 1, 0.3], [878, 330, 1.3, 0.44], [946, 452, 1, 0.28],
  [902, 566, 1.2, 0.36], [820, 668, 1, 0.3], [958, 690, 1.3, 0.42], [736, 744, 1, 0.26],
  [620, 776, 1.2, 0.34], [524, 736, 1, 0.3], [688, 262, 1, 0.24], [788, 452, 1.1, 0.3],
  [136, 46, 1, 0.26], [24, 462, 1.1, 0.3], [408, 42, 1, 0.24], [976, 382, 1, 0.26],
  [46, 748, 1, 0.28], [862, 764, 1.1, 0.3], [196, 122, 1, 0.22], [598, 196, 1, 0.22],
  [306, 458, 1, 0.2], [712, 606, 1, 0.24], [118, 540, 1, 0.24], [986, 566, 1, 0.22],
];

/** Índices de ESTRELAS que cintilam. O resto fica estático e sai de graça. */
const CINTILAM = [1, 4, 7, 12, 16, 19, 22, 25, 28, 31, 34, 37];

/** Raios ambientais saindo do núcleo — as conexões da rede. */
const RAIOS = [
  { angulo: -8, ate: 430, opacidade: 0.14 },
  { angulo: 34, ate: 300, opacidade: 0.1 },
  { angulo: 96, ate: 240, opacidade: 0.08 },
  { angulo: 152, ate: 380, opacidade: 0.12 },
  { angulo: 208, ate: 260, opacidade: 0.08 },
  { angulo: 268, ate: 340, opacidade: 0.1 },
];

/** Arco curto e luminoso por órbita: o indicador de segmento ativo. */
const SEGMENTOS: Record<number, { de: number; ate: number }> = {
  2: { de: 300, ate: 344 },
  4: { de: 128, ate: 166 },
  6: { de: 214, ate: 246 },
};

function pontoElipse(rx: number, ry: number, grau: number) {
  const a = (grau * Math.PI) / 180;
  return { x: CX + rx * Math.cos(a), y: CY + ry * Math.sin(a) };
}

function arcoElipse(rx: number, ry: number, de: number, ate: number) {
  const s = pontoElipse(rx, ry, de);
  const e = pontoElipse(rx, ry, ate);
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${rx} ${ry} 0 0 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

/* -------------------------------------------------------------------------- */

export function GalaxyScene({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const id = (nome: string) => `dg-gx-${nome}-${uid}`;

  const esferas: Record<Esfera, string> = {
    clara: id("clara"),
    escura: id("escura"),
    laranja: id("laranja"),
  };

  const grao = (g: Grao, i: number) => (
    <circle
      key={`g-${i}`}
      cx={g.x.toFixed(2)}
      cy={g.y.toFixed(2)}
      r={g.r.toFixed(2)}
      fill={g.laranja ? "var(--brand-orange)" : "#ffffff"}
      opacity={g.o.toFixed(2)}
    />
  );

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        aria-hidden="true"
        className="h-full w-full overflow-visible"
      >
        <defs>
          {/* Luz vinda de cima e da esquerda em todas as esferas: fonte única
              mantém a cena coerente como espaço, não como colagem. */}
          <radialGradient id={esferas.clara} cx="0.32" cy="0.27" r="0.78">
            <stop offset="0%" stopColor="#e6e6ea" />
            <stop offset="45%" stopColor="#8a8a93" />
            <stop offset="100%" stopColor="#1b1b1e" />
          </radialGradient>
          <radialGradient id={esferas.escura} cx="0.3" cy="0.25" r="0.8">
            <stop offset="0%" stopColor="#7a7a83" />
            <stop offset="42%" stopColor="#33333a" />
            <stop offset="100%" stopColor="#0b0b0d" />
          </radialGradient>
          <radialGradient id={esferas.laranja} cx="0.3" cy="0.26" r="0.8">
            <stop offset="0%" stopColor="#ffb492" />
            <stop offset="40%" stopColor="var(--brand-orange)" />
            <stop offset="100%" stopColor="#6b1907" />
          </radialGradient>

          {/* Miolo quente pequeno: o branco sai rápido para o laranja, senão o
              centro vira um disco branco chapado e domina a metade direita. */}
          <radialGradient id={id("nucleo")}>
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="16%" stopColor="#ffe0cd" />
            <stop offset="42%" stopColor="var(--brand-orange-light)" />
            <stop offset="74%" stopColor="var(--brand-orange)" />
            <stop offset="100%" stopColor="var(--brand-orange-dark)" />
          </radialGradient>

          {/* Bloom em três degraus. O brilho não vem de um halo só: vem da
              queda contínua do branco quente até o laranja transparente. */}
          <radialGradient id={id("bloomNear")}>
            <stop offset="0%" stopColor="#fff0e6" stopOpacity="0.5" />
            <stop offset="34%" stopColor="var(--brand-orange-light)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id("halo")}>
            <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity="0.34" />
            <stop offset="46%" stopColor="var(--brand-orange)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id("bloomFar")}>
            <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity="0.15" />
            <stop offset="58%" stopColor="#b4300f" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#b4300f" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Estrelas: camada mais ao fundo, parallax mínimo. */}
        <g className="dg-parallax" style={camada("4px")}>
          {ESTRELAS.map(([x, y, r, o], i) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={r}
              fill="#ffffff"
              opacity={o}
              className={CINTILAM.includes(i) ? "dg-gx-twinkle" : undefined}
              style={CINTILAM.includes(i) ? { animationDelay: `${(i % 7) * 0.9}s` } : undefined}
            />
          ))}
        </g>

        {/* Bloom distante entra ANTES do disco: é névoa atrás da matéria. */}
        <circle cx={CX} cy={CY} r="430" fill={`url(#${id("bloomFar")})`} className="dg-gx-core" />

        {/* Sistema orbital. Dois níveis de grupo, não um: .dg-parallax escreve
            `transform` por CSS, e em SVG o CSS vence o atributo `transform`.
            Juntos no mesmo <g>, a inclinação seria descartada em silêncio. */}
        <g className="dg-parallax" style={camada("9px")}>
          <g transform={`rotate(-16 ${CX} ${CY})`}>
            {RAIOS.map((raio) => {
              const p = pontoElipse(raio.ate, raio.ate * ACHATAMENTO, raio.angulo);
              const o = pontoElipse(46, 46 * ACHATAMENTO, raio.angulo);
              return (
                <line
                  key={raio.angulo}
                  x1={o.x}
                  y1={o.y}
                  x2={p.x}
                  y2={p.y}
                  stroke="var(--brand-orange)"
                  strokeWidth="1"
                  opacity={raio.opacidade}
                />
              );
            })}

            {/* Poeira do disco — o que dá matéria à galáxia. Estática: são
                muitos nós, e animar qualquer um custaria caro. */}
            <g>{POEIRA_INTERNA.map(grao)}</g>
            <g className="hidden sm:block">{POEIRA_EXTERNA.map(grao)}</g>

            {/* Um grupo por órbita, com a inclinação própria dela. Órbita,
                pacotes e corpos moram juntos, então a rotação pega nos três. */}
            {ORBITAS.map((o, i) => {
              const segmento = SEGMENTOS[i];
              return (
                <g key={o.rx} transform={`rotate(${o.inclinacao} ${CX} ${CY})`}>
                  <path
                    d={o.d}
                    fill="none"
                    stroke="var(--border-strong)"
                    strokeWidth="1"
                    strokeDasharray={o.pontilhada ? "1.5 9" : undefined}
                    opacity={o.opacidade}
                  />

                  {segmento && (
                    <path
                      d={arcoElipse(o.rx, o.ry, segmento.de, segmento.ate)}
                      fill="none"
                      stroke="var(--brand-orange)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.6"
                    />
                  )}

                  {PACOTES.filter((p) => p.orbita === i).map((p, k) => (
                    <circle
                      key={`pkt-${i}-${k}`}
                      r={p.r}
                      fill={p.laranja ? "var(--brand-orange)" : "#ffffff"}
                      opacity="0.85"
                      className="dg-gx-packet"
                      style={{
                        offsetPath: `path("${o.d}")`,
                        animationDuration: `${p.duracao}s`,
                        animationDelay: `${p.atraso}s`,
                        animationDirection: p.reverso ? "reverse" : "normal",
                      }}
                    />
                  ))}

                  {/* O delay negativo casa a fase animada com a estática, para
                      a cena parada sob reduced-motion ser a mesma composição. */}
                  {CORPOS.filter((c) => c.orbita === i).map((c, k) => (
                    <circle
                      key={`corpo-${i}-${k}`}
                      r={c.r}
                      fill={`url(#${esferas[c.esfera]})`}
                      className="dg-gx-travel"
                      style={{
                        offsetPath: `path("${o.d}")`,
                        offsetDistance: `${c.fase}%`,
                        animationDuration: `${c.duracao}s`,
                        animationDelay: `-${((c.fase / 100) * c.duracao).toFixed(2)}s`,
                        animationDirection: c.reverso ? "reverse" : "normal",
                      }}
                    />
                  ))}
                </g>
              );
            })}
          </g>
        </g>

        {/* Núcleo, por cima de tudo. Só os blooms respiram; o miolo e o ponto
            de luz ficam firmes, senão o centro da cena pulsa e cansa. */}
        <g className="dg-parallax" style={camada("6px")}>
          <circle cx={CX} cy={CY} r="215" fill={`url(#${id("halo")})`} className="dg-gx-core" />
          <circle cx={CX} cy={CY} r="92" fill={`url(#${id("bloomNear")})`} className="dg-gx-core" />
          <circle cx={CX} cy={CY} r="26" fill={`url(#${id("nucleo")})`} />
          <circle cx={CX} cy={CY} r="7" fill="#ffffff" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
}
