import { useId, type ReactNode } from "react";

/**
 * Ilustrações das camadas do Dev Stack.
 *
 * Linguagem comum das cinco, conforme o PDR: geometria simplificada, volume
 * suave, wireframe, laranja só como realce. A proporção é deliberada — 80 a
 * 90% neutro e 10 a 20% de marca; laranja em área grande aqui competiria com
 * o CTA da navbar, que precisa continuar sendo o único ponto de atenção fixo.
 *
 * Tudo é decorativo: o título, a descrição e os chips de cada card já dizem o
 * que a camada faz, então os SVGs são aria-hidden.
 *
 * Sem dependência de biblioteca de ícones: os glifos internos (nuvem, base,
 * pessoa) são paths próprios, para viverem no mesmo sistema de coordenadas do
 * desenho em vez de serem posicionados por cima dele.
 */

const LARANJA = "var(--brand-orange)";

/** Casca comum: mesma proporção e comportamento de escala nas cinco. */
function Arte({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 200 160" aria-hidden="true" className="h-full w-full overflow-visible">
      {children}
    </svg>
  );
}

/** Data Layer — base de dados com um anel orbital de leitura. */
export function DataLayerArt() {
  const uid = useId().replace(/:/g, "");
  const corpo = `dg-art-corpo-${uid}`;
  const topo = `dg-art-topo-${uid}`;

  return (
    <Arte>
      <defs>
        <linearGradient id={corpo} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#26262c" />
          <stop offset="42%" stopColor="#3c3c44" />
          <stop offset="100%" stopColor="#15151a" />
        </linearGradient>
        <linearGradient id={topo} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4a4a53" />
          <stop offset="100%" stopColor="#22222a" />
        </linearGradient>
      </defs>

      {/* Anel orbital: o único traço laranja da peça. */}
      <g transform="rotate(-16 100 88)">
        <ellipse
          cx="100"
          cy="88"
          rx="86"
          ry="30"
          fill="none"
          stroke={LARANJA}
          strokeWidth="1.2"
          opacity="0.55"
        />
        <circle cx="14" cy="88" r="2.5" fill={LARANJA} />
        <circle cx="186" cy="88" r="2" fill={LARANJA} opacity="0.7" />
        <circle cx="143" cy="114" r="1.8" fill={LARANJA} opacity="0.5" />
      </g>

      <path d="M 52 58 L 52 108 A 48 14 0 0 0 148 108 L 148 58 Z" fill={`url(#${corpo})`} />
      <ellipse cx="100" cy="58" rx="48" ry="14" fill={`url(#${topo})`} />
      <ellipse
        cx="100"
        cy="58"
        rx="48"
        ry="14"
        fill="none"
        stroke="#5c5c66"
        strokeWidth="1"
        opacity="0.5"
      />

      {/* Sulcos: só a metade da frente, que é a que se vê num cilindro. */}
      <path d="M 52 76 A 48 14 0 0 0 148 76" fill="none" stroke="#5c5c66" strokeWidth="1" opacity="0.35" />
      <path d="M 52 92 A 48 14 0 0 0 148 92" fill="none" stroke="#5c5c66" strokeWidth="1" opacity="0.28" />
    </Arte>
  );
}

/** Intelligence Layer — núcleo de inferência e os nós que o alimentam. */
export function IntelligenceArt() {
  const uid = useId().replace(/:/g, "");
  const nucleo = `dg-art-nuc-${uid}`;
  const esfera = `dg-art-esf-${uid}`;
  const halo = `dg-art-halo-${uid}`;

  const NOS: [number, number, number, boolean][] = [
    [52, 42, 11, false],
    [152, 46, 9, true],
    [36, 104, 8, false],
    [158, 110, 12, false],
    [96, 22, 7, true],
    [112, 138, 10, false],
  ];

  return (
    <Arte>
      <defs>
        <radialGradient id={nucleo} cx="0.34" cy="0.3">
          <stop offset="0%" stopColor="#ffd2bd" />
          <stop offset="45%" stopColor={LARANJA} />
          <stop offset="100%" stopColor="#7d1f08" />
        </radialGradient>
        <radialGradient id={esfera} cx="0.32" cy="0.28">
          <stop offset="0%" stopColor="#7e7e88" />
          <stop offset="46%" stopColor="#34343c" />
          <stop offset="100%" stopColor="#101014" />
        </radialGradient>
        <radialGradient id={halo}>
          <stop offset="0%" stopColor={LARANJA} stopOpacity="0.34" />
          <stop offset="100%" stopColor={LARANJA} stopOpacity="0" />
        </radialGradient>
      </defs>

      {NOS.map(([x, y, , quente]) => (
        <line
          key={`l-${x}-${y}`}
          x1="100"
          y1="80"
          x2={x}
          y2={y}
          stroke={quente ? LARANJA : "#4a4a52"}
          strokeWidth="1"
          opacity={quente ? 0.6 : 0.5}
        />
      ))}

      {/* Dado em trânsito: dois pontos a meio caminho, nas linhas quentes. */}
      {NOS.filter(([, , , q]) => q).map(([x, y]) => (
        <circle
          key={`d-${x}`}
          cx={100 + (x - 100) * 0.55}
          cy={80 + (y - 80) * 0.55}
          r="2"
          fill={LARANJA}
        />
      ))}

      <circle cx="100" cy="80" r="46" fill={`url(#${halo})`} />
      <circle cx="100" cy="80" r="14" fill={`url(#${nucleo})`} />

      {NOS.map(([x, y, r]) => (
        <circle key={`n-${x}-${y}`} cx={x} cy={y} r={r} fill={`url(#${esfera})`} />
      ))}
    </Arte>
  );
}

/** Integration Layer — o núcleo serverless e os provedores que ele isola. */
export function IntegrationArt() {
  const uid = useId().replace(/:/g, "");
  const f1 = `dg-art-f1-${uid}`;

  const CAIXAS: { x: number; y: number; glifo: string }[] = [
    // Nuvem
    {
      x: 150,
      y: 20,
      glifo: "M 10 20 A 6 6 0 0 1 11 8 A 8 8 0 0 1 26 9 A 5 5 0 0 1 25 20 Z",
    },
    // Base de dados
    { x: 14, y: 58, glifo: "M 10 10 A 8 3.5 0 1 1 26 10 L 26 22 A 8 3.5 0 1 1 10 22 Z" },
    // Pessoa
    { x: 156, y: 112, glifo: "M 18 13 A 5 5 0 1 1 18 12.9 M 9 26 A 9 7 0 0 1 27 26" },
  ];

  return (
    <Arte>
      <defs>
        <linearGradient id={f1} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#52525c" />
          <stop offset="100%" stopColor="#2a2a32" />
        </linearGradient>
      </defs>

      {CAIXAS.map((c) => (
        <line
          key={`lc-${c.x}`}
          x1="100"
          y1="86"
          x2={c.x + 18}
          y2={c.y + 18}
          stroke={LARANJA}
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.5"
        />
      ))}

      {/* Cubo isométrico: três faces, uma fonte de luz. */}
      <path d="M 100 54 L 132 72 L 100 90 L 68 72 Z" fill={`url(#${f1})`} />
      <path d="M 68 72 L 100 90 L 100 122 L 68 104 Z" fill="#1d1d23" />
      <path d="M 132 72 L 132 104 L 100 122 L 100 90 Z" fill="#2b2b33" />
      <path
        d="M 100 54 L 132 72 L 132 104 L 100 122 L 68 104 L 68 72 Z"
        fill="none"
        stroke={LARANJA}
        strokeWidth="1"
        opacity="0.35"
      />

      {CAIXAS.map((c) => (
        <g key={`c-${c.x}`} transform={`translate(${c.x} ${c.y})`}>
          <rect
            width="36"
            height="36"
            rx="9"
            fill="#15151a"
            stroke="#43434c"
            strokeWidth="1"
          />
          <path
            d={c.glifo}
            fill="none"
            stroke="#9a9aa4"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      ))}
    </Arte>
  );
}

/** Infrastructure — camadas de build e entrega empilhadas. */
export function InfrastructureArt() {
  const uid = useId().replace(/:/g, "");
  const plano = `dg-art-plano-${uid}`;

  const CAMADAS = [46, 76, 106];

  return (
    <Arte>
      <defs>
        <linearGradient id={plano} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {CAMADAS.map((cy, i) => {
        const ultima = i === CAMADAS.length - 1;
        return (
          <g key={cy}>
            <path
              d={`M 100 ${cy - 27} L 162 ${cy} L 100 ${cy + 27} L 38 ${cy} Z`}
              fill={`url(#${plano})`}
              stroke={ultima ? LARANJA : "#4c4c55"}
              strokeWidth={ultima ? 1.6 : 1}
              opacity={ultima ? 1 : 0.6 + i * 0.1}
            />
            {/* Só a base acende: é o deploy, o fim da pilha. */}
            {ultima && (
              <path
                d={`M 38 ${cy} L 100 ${cy + 27} L 162 ${cy}`}
                fill="none"
                stroke={LARANJA}
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}

      <circle cx="168" cy="34" r="2" fill={LARANJA} opacity="0.7" />
      <circle cx="30" cy="128" r="1.8" fill={LARANJA} opacity="0.5" />
    </Arte>
  );
}

/** Developer Tools — a janela de código e as duas marcas do front. */
export function DevToolsArt() {
  const uid = useId().replace(/:/g, "");
  const janela = `dg-art-jan-${uid}`;

  const LINHAS: [number, number, number][] = [
    [30, 62, 74],
    [30, 74, 52],
    [38, 86, 60],
    [38, 98, 40],
    [30, 110, 66],
  ];

  return (
    <Arte>
      <defs>
        <linearGradient id={janela} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#181820" />
          <stop offset="100%" stopColor="#0e0e12" />
        </linearGradient>
      </defs>

      <rect
        x="16"
        y="34"
        width="136"
        height="96"
        rx="9"
        fill={`url(#${janela})`}
        stroke="#3a3a43"
        strokeWidth="1"
      />
      <line x1="16" y1="52" x2="152" y2="52" stroke="#2c2c34" strokeWidth="1" />

      {/* Semáforo da janela: um ponto laranja, dois neutros. */}
      <circle cx="28" cy="43" r="2.4" fill={LARANJA} />
      <circle cx="37" cy="43" r="2.4" fill="#4a4a52" />
      <circle cx="46" cy="43" r="2.4" fill="#33333a" />

      {LINHAS.map(([x, y, w]) => (
        <rect key={y} x={x} y={y} width={w} height="4" rx="2" fill="#3d3d45" />
      ))}
      <rect x="30" y="62" width="14" height="4" rx="2" fill={LARANJA} opacity="0.8" />

      {/* Átomo do React. */}
      <g transform="translate(158 46)" opacity="0.9">
        <circle r="3.4" fill={LARANJA} />
        {[0, 60, 120].map((g) => (
          <ellipse
            key={g}
            rx="14"
            ry="5.4"
            fill="none"
            stroke="#8e8e98"
            strokeWidth="1.2"
            transform={`rotate(${g})`}
          />
        ))}
      </g>

      {/* Selo do TypeScript. */}
      <g transform="translate(146 96)">
        <rect width="36" height="36" rx="9" fill="#15151a" stroke="#43434c" strokeWidth="1" />
        <text
          x="18"
          y="23"
          textAnchor="middle"
          fill="#c6c8cf"
          style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}
        >
          TS
        </text>
      </g>
    </Arte>
  );
}
