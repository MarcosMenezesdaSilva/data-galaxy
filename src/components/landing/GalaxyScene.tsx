import { useId, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, Database, Shield } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Cena orbital do hero — a representação do ecossistema de dados.
 *
 * A leitura é: dado entra pelas órbitas externas, percorre as conexões, chega
 * ao núcleo e vira inteligência. Os pacotes luminosos são esse trânsito; o
 * núcleo respira porque está processando.
 *
 * Geometria: seis elipses concêntricas com ry/rx ≈ 0,38 e o sistema inteiro
 * inclinado, que é o que dá a sensação de plano orbital visto de ângulo. Cada
 * corpo anda por CSS Motion Path sobre a MESMA string que desenha sua órbita
 * visível, então nada precisa ser recalculado e nada sai de registro.
 *
 * Coordenadas e fases são fixas: a app roda com SSR (@tanstack/react-start) e
 * qualquer valor aleatório divergiria entre servidor e cliente na hidratação.
 */

const CX = 500;
const CY = 400;
const VB_W = 1000;
const VB_H = 820;

/** Amplitude de parallax da camada. Mesmo padrão de custom property do DS. */
const camada = (profundidade: string) => ({ "--dg-depth": profundidade }) as CSSProperties;

/** Elipse como path fechado — serve de traço visível e de trilha do corpo. */
function orbitaPath(rx: number, ry: number) {
  return `M ${CX - rx} ${CY} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
}

const ORBITAS = [
  { rx: 112, ry: 43 },
  { rx: 168, ry: 64 },
  { rx: 232, ry: 88 },
  { rx: 300, ry: 114 },
  { rx: 372, ry: 141 },
  { rx: 446, ry: 170 },
].map((o, i) => ({
  ...o,
  d: orbitaPath(o.rx, o.ry),
  // Alternar traço cheio e pontilhado evita a leitura de "alvo" que seis
  // anéis idênticos produzem.
  pontilhada: i % 2 === 1,
}));

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
  { orbita: 4, r: 8, esfera: "clara", fase: 72, duracao: 57, reverso: true },
  { orbita: 4, r: 5, esfera: "laranja", fase: 20, duracao: 51 },
  { orbita: 5, r: 17, esfera: "escura", fase: 44, duracao: 68 },
  { orbita: 5, r: 7, esfera: "clara", fase: 88, duracao: 62, reverso: true },
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
  { orbita: 1, r: 2, laranja: false, duracao: 17, atraso: 3, reverso: true },
  { orbita: 1, r: 2, laranja: true, duracao: 19, atraso: 9, reverso: true },
  { orbita: 2, r: 2.5, laranja: true, duracao: 21, atraso: 5 },
  { orbita: 3, r: 2, laranja: false, duracao: 26, atraso: 1 },
  { orbita: 3, r: 2.5, laranja: true, duracao: 24, atraso: 12, reverso: true },
  { orbita: 4, r: 2, laranja: false, duracao: 31, atraso: 7 },
  { orbita: 5, r: 2.5, laranja: true, duracao: 36, atraso: 15 },
];

/** Estrelas de fundo: [x, y, raio, opacidade]. Centro fica limpo. */
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
const RAIOS: { angulo: number; de: number; ate: number; opacidade: number }[] = [
  { angulo: -8, de: 46, ate: 430, opacidade: 0.16 },
  { angulo: 34, de: 46, ate: 300, opacidade: 0.12 },
  { angulo: 96, de: 46, ate: 240, opacidade: 0.1 },
  { angulo: 152, de: 46, ate: 380, opacidade: 0.14 },
  { angulo: 208, de: 46, ate: 260, opacidade: 0.1 },
  { angulo: 268, de: 46, ate: 340, opacidade: 0.12 },
];

/** Arco curto e luminoso: o indicador de segmento ativo da órbita. */
const SEGMENTOS = [
  { orbita: 2, de: 300, ate: 344 },
  { orbita: 4, de: 128, ate: 166 },
];

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

interface Conceito {
  icon: LucideIcon;
  linha1: string;
  linha2: string;
  /** Lado do círculo em relação ao texto. */
  lado: "esquerda" | "direita";
  /** Posição no contêiner e amplitude de parallax. */
  estilo: CSSProperties;
  atraso: string;
  profundidade: string;
}

const CONCEITOS: Conceito[] = [
  {
    icon: Database,
    linha1: "Dados",
    linha2: "em tempo real",
    lado: "direita",
    estilo: { top: "16%", left: "7%" },
    atraso: "0s",
    profundidade: "10px",
  },
  {
    icon: Activity,
    linha1: "Detecção",
    linha2: "antecipada",
    lado: "esquerda",
    estilo: { top: "19%", right: "1%" },
    atraso: "1.4s",
    profundidade: "14px",
  },
  {
    icon: BarChart3,
    linha1: "Insights",
    linha2: "acionáveis",
    lado: "direita",
    estilo: { bottom: "26%", left: "9%" },
    atraso: "2.6s",
    profundidade: "12px",
  },
  {
    icon: Shield,
    linha1: "Operações",
    linha2: "mais seguras",
    lado: "esquerda",
    estilo: { bottom: "22%", right: "0%" },
    atraso: "3.8s",
    profundidade: "16px",
  },
];

/**
 * Rótulo conceitual. O texto é conteúdo de verdade — fica legível para leitor
 * de tela; só o círculo e o ícone são decorativos.
 */
function ConceptLabel({ icon: Icon, linha1, linha2, lado, estilo, atraso, profundidade }: Conceito) {
  const circulo = (
    <span
      aria-hidden="true"
      className="grid h-12 w-12 shrink-0 place-content-center rounded-pill border border-[color:var(--border-strong)] bg-[color:var(--surface-glass)] backdrop-blur-sm"
    >
      <Icon className="h-[18px] w-[18px] text-foreground/80" />
    </span>
  );

  return (
    <div
      className="dg-parallax absolute hidden lg:block"
      style={{ ...estilo, ...camada(profundidade) }}
    >
      <div
        className="dg-gx-float flex items-center gap-3.5"
        style={{ animationDelay: atraso }}
      >
        {lado === "esquerda" && circulo}
        <span className="t-micro leading-relaxed uppercase text-muted-foreground">
          {linha1}
          <br />
          {linha2}
        </span>
        {lado === "direita" && circulo}
      </div>
    </div>
  );
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

          <radialGradient id={id("nucleo")}>
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="28%" stopColor="#ffc4a8" />
            <stop offset="62%" stopColor="var(--brand-orange)" />
            <stop offset="100%" stopColor="var(--brand-orange-dark)" />
          </radialGradient>
          <radialGradient id={id("halo")}>
            <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity="0.5" />
            <stop offset="55%" stopColor="var(--brand-orange)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity="0" />
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

        {/* Sistema orbital. A inclinação é aplicada uma vez no grupo, então
            órbitas, corpos e pacotes compartilham o mesmo plano. */}
        {/* Dois grupos, não um: .dg-parallax escreve `transform` por CSS, e em
            SVG o CSS vence o atributo `transform`. Juntos no mesmo <g>, a
            inclinação do plano orbital seria descartada em silêncio. */}
        <g className="dg-parallax" style={camada("9px")}>
          <g transform={`rotate(-14 ${CX} ${CY})`}>
          {RAIOS.map((raio) => {
            const a = (raio.angulo * Math.PI) / 180;
            return (
              <line
                key={raio.angulo}
                x1={CX + raio.de * Math.cos(a)}
                y1={CY + raio.de * Math.sin(a) * 0.38}
                x2={CX + raio.ate * Math.cos(a)}
                y2={CY + raio.ate * Math.sin(a) * 0.38}
                stroke="var(--brand-orange)"
                strokeWidth="1"
                opacity={raio.opacidade}
              />
            );
          })}

          {ORBITAS.map((o) => (
            <path
              key={o.rx}
              d={o.d}
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="1"
              strokeDasharray={o.pontilhada ? "2 8" : undefined}
              opacity={o.pontilhada ? 0.85 : 0.6}
            />
          ))}

          {SEGMENTOS.map((s) => {
            const o = ORBITAS[s.orbita];
            return (
              <path
                key={`${s.orbita}-${s.de}`}
                d={arcoElipse(o.rx, o.ry, s.de, s.ate)}
                fill="none"
                stroke="var(--brand-orange)"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.65"
              />
            );
          })}

          {/* Pacotes de dado em trânsito. */}
          {PACOTES.map((p, i) => (
            <circle
              key={`pkt-${i}`}
              r={p.r}
              fill={p.laranja ? "var(--brand-orange)" : "#ffffff"}
              opacity="0.85"
              className="dg-gx-packet"
              style={{
                offsetPath: `path("${ORBITAS[p.orbita].d}")`,
                animationDuration: `${p.duracao}s`,
                animationDelay: `${p.atraso}s`,
                animationDirection: p.reverso ? "reverse" : "normal",
              }}
            />
          ))}

          {/* Corpos. O delay negativo casa a fase animada com a estática, para
              a cena parada sob reduced-motion ser a mesma composição. */}
          {CORPOS.map((c, i) => (
            <circle
              key={`corpo-${i}`}
              r={c.r}
              fill={`url(#${esferas[c.esfera]})`}
              className="dg-gx-travel"
              style={{
                offsetPath: `path("${ORBITAS[c.orbita].d}")`,
                offsetDistance: `${c.fase}%`,
                animationDuration: `${c.duracao}s`,
                animationDelay: `-${((c.fase / 100) * c.duracao).toFixed(2)}s`,
                animationDirection: c.reverso ? "reverse" : "normal",
              }}
            />
          ))}
          </g>
        </g>

        {/* Núcleo. Halo largo, corpo e ponto de luz — só o halo e o corpo
            respiram; o ponto central fica firme para o olho ter âncora. */}
        <g className="dg-parallax" style={camada("6px")}>
          <circle cx={CX} cy={CY} r="168" fill={`url(#${id("halo")})`} className="dg-gx-core" />
          <circle cx={CX} cy={CY} r="34" fill={`url(#${id("nucleo")})`} className="dg-gx-core" />
          <circle cx={CX} cy={CY} r="11" fill="#ffffff" opacity="0.95" />
        </g>
      </svg>

      {CONCEITOS.map((c) => (
        <ConceptLabel key={c.linha1} {...c} />
      ))}
    </div>
  );
}
