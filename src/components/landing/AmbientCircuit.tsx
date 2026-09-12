/**
 * Circuito ambiental das bordas.
 *
 * Substitui os planetas do hero como fonte de atmosfera nas seções internas:
 * linhas finas laranja, nodes respirando e sinais percorrendo os traços, todos
 * cortados pela viewport. A regra é o centro da página ficar limpo — a
 * sofisticação vem de sinal isolado na periferia, não de malha cobrindo tudo.
 *
 * Os rótulos são <text> dentro do próprio SVG, não HTML posicionado por fora:
 * assim vivem no mesmo sistema de coordenadas das linhas e não saem de
 * alinhamento quando o contêiner muda de tamanho.
 *
 * Tudo aqui é decorativo. Os fragmentos de texto são atmosfera, não conteúdo —
 * lidos fora de ordem por leitor de tela seriam ruído, então o conjunto é
 * aria-hidden e nada da página depende deles.
 */

/** Traço que recebe o sinal viajante, de cada lado. */
const TRILHA_ESQ = "M 12 40 H 150 V 132 L 88 194 V 292 H 150";
const TRILHA_DIR = "M 320 28 H 176 V 104 V 176 H 246";

const NOS_ESQ: [number, number, number][] = [
  [12, 40, 0],
  [150, 40, 0.7],
  [88, 194, 1.5],
  [150, 292, 2.2],
  [58, 486, 2.9],
];

const NOS_DIR: [number, number, number][] = [
  [176, 104, 0.4],
  [246, 176, 1.1],
  [212, 300, 1.9],
  [212, 430, 2.6],
  [280, 500, 3.3],
];

const TRACO = "var(--brand-orange)";

function No({ x, y, atraso }: { x: number; y: number; atraso: number }) {
  return (
    <g>
      {/* Halo separado do ponto: só ele pulsa, então o node não "engorda" —
          o que cresce é a luz em volta. */}
      <circle
        cx={x}
        cy={y}
        r="5"
        fill={TRACO}
        opacity="0.25"
        className="dg-node-pulse"
        style={{ animationDelay: `${atraso}s` }}
      />
      <circle cx={x} cy={y} r="2.2" fill={TRACO} />
    </g>
  );
}

function Sinal({ trilha, duracao, atraso }: { trilha: string; duracao: number; atraso: number }) {
  return (
    <circle
      r="2"
      fill="#ffffff"
      className="dg-signal"
      style={{
        offsetPath: `path("${trilha}")`,
        animationDuration: `${duracao}s`,
        animationDelay: `${atraso}s`,
      }}
    />
  );
}

const rotulo = {
  fill: "var(--muted-foreground)",
  fontSize: 10,
  letterSpacing: 1,
  fontWeight: 500,
} as const;

/**
 * `variante` só desloca os dois SVGs na vertical. Com duas seções usando o
 * circuito na mesma página, offsets iguais leriam como imagem repetida.
 */
export function AmbientCircuit({ variante = "a" }: { variante?: "a" | "b" }) {
  const alto = variante === "a" ? "11%" : "26%";
  const baixo = variante === "a" ? "5%" : "34%";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
    >
      {/* Esquerda. width/height batem com o viewBox para o texto sair em 1:1 e
          não escalar junto com o desenho. */}
      <svg
        width="300"
        height="620"
        viewBox="0 0 300 620"
        className="absolute left-0"
        style={{ opacity: 0.55, top: alto }}
      >
        <path d={TRILHA_ESQ} fill="none" stroke={TRACO} strokeWidth="1" opacity="0.32" />
        <path d="M 0 392 H 58 V 486" fill="none" stroke={TRACO} strokeWidth="1" opacity="0.2" />

        <text x="164" y="36" style={rotulo}>
          DADOS
        </text>
        <text x="164" y="52" style={rotulo}>
          EM TEMPO REAL
        </text>

        {NOS_ESQ.map(([x, y, atraso]) => (
          <No key={`${x}-${y}`} x={x} y={y} atraso={atraso} />
        ))}

        <Sinal trilha={TRILHA_ESQ} duracao={9} atraso={0} />
      </svg>

      {/* Direita. */}
      <svg
        width="340"
        height="700"
        viewBox="0 0 340 700"
        className="absolute right-0"
        style={{ opacity: 0.55, top: baixo }}
      >
        <path d={TRILHA_DIR} fill="none" stroke={TRACO} strokeWidth="1" opacity="0.32" />
        <path
          d="M 340 300 H 212 V 430 V 500 H 280"
          fill="none"
          stroke={TRACO}
          strokeWidth="1"
          opacity="0.22"
        />

        <text x="192" y="100" style={rotulo}>
          OPERAÇÕES
        </text>
        <text x="192" y="116" style={rotulo}>
          MAIS INTELIGENTES
        </text>

        <text x="226" y="296" style={rotulo}>
          DO DADO
        </text>
        <text x="226" y="312" style={rotulo}>
          À AÇÃO
        </text>
        <text x="226" y="328" style={rotulo}>
          RESULTADOS
        </text>
        <text x="226" y="344" style={rotulo}>
          REAIS
        </text>

        {NOS_DIR.map(([x, y, atraso]) => (
          <No key={`${x}-${y}`} x={x} y={y} atraso={atraso} />
        ))}

        <Sinal trilha={TRILHA_DIR} duracao={11} atraso={2.5} />
      </svg>
    </div>
  );
}
