import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, Brain, Code, Database, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";
import {
  DataLayerArt,
  DevToolsArt,
  InfrastructureArt,
  IntegrationArt,
  IntelligenceArt,
} from "./StackIllustrations";

/**
 * Stack real, agrupada por camada em vez de listada como logo wall.
 *
 * Tudo aqui é verificável no repositório: as dependências saem do
 * package.json, as funções de netlify/functions, os modelos de previsão do
 * catálogo de telas e o modelo de IA do default em assistente-ia.ts. Nenhuma
 * tecnologia aspiracional: se não está no projeto, não está nesta lista.
 *
 * Layout em 12 colunas, 4/4/4 e depois 6/6. As duas últimas camadas têm menos
 * itens, então ganham largura em vez de deixar espaço vazio no card.
 */
interface Camada {
  icon: LucideIcon;
  nome: string;
  papel: string;
  itens: string[];
  arte: ReactNode;
  /** Colunas no grid de 12 do desktop. */
  span: string;
  /** Caixa da ilustração dentro do card. */
  arteClasse: string;
  /** Trava a largura do texto antes da arte, para não correr por baixo dela. */
  textoClasse: string;
}

const CAMADAS: Camada[] = [
  {
    icon: Database,
    nome: "Data Layer",
    papel: "A base vive no navegador; o Databricks entra quando há credencial.",
    itens: [
      "IndexedDB via Dexie",
      "PapaParse para CSV e TXT",
      "SheetJS para Excel",
      "Databricks SQL Warehouse",
      "Snapshot versionado em JSON",
    ],
    arte: <DataLayerArt />,
    span: "lg:col-span-4",
    arteClasse: "right-[-8%] top-[4%] w-[54%]",
    textoClasse: "max-w-[58%]",
  },
  {
    icon: Brain,
    nome: "Intelligence Layer",
    papel: "Previsão, agrupamento e resposta em linguagem natural sobre os dados carregados.",
    itens: [
      "AutoETS · Seasonal Naive",
      "Agrupamento de recorrências",
      "Claude (claude-sonnet-5)",
      "RAG na Base de Conhecimento",
      "Motor de regras local, fallback sem IA",
    ],
    arte: <IntelligenceArt />,
    span: "lg:col-span-4",
    arteClasse: "right-[-6%] top-[2%] w-[52%]",
    textoClasse: "max-w-[56%]",
  },
  {
    icon: Zap,
    nome: "Integration Layer",
    papel: "Sete funções serverless isolam credencial e provedor do cliente.",
    itens: [
      "Netlify Functions",
      "Consulta e status do Databricks",
      "WhatsApp · SMS · Teams · e-mail",
      "Autenticação do painel admin",
    ],
    arte: <IntegrationArt />,
    span: "lg:col-span-4",
    arteClasse: "right-[-6%] top-[2%] w-[54%]",
    textoClasse: "max-w-[56%]",
  },
  {
    icon: Activity,
    nome: "Infrastructure",
    papel: "Build e entrega estática, com as funções no mesmo deploy.",
    itens: ["Netlify", "Vite 8", "Bun"],
    arte: <InfrastructureArt />,
    span: "lg:col-span-6",
    arteClasse: "right-[8%] top-[6%] w-[40%]",
    textoClasse: "max-w-[46%]",
  },
  {
    icon: Code,
    nome: "Developer Tools",
    papel: "Base do front, tipada de ponta a ponta.",
    itens: [
      "React 19 · TypeScript",
      "TanStack Router · Query · Start",
      "Tailwind CSS v4",
      "Radix UI",
      "Recharts",
      "Zustand · Zod",
    ],
    arte: <DevToolsArt />,
    span: "lg:col-span-6",
    arteClasse: "right-[3%] top-[8%] w-[42%]",
    textoClasse: "max-w-[50%]",
  },
];

function StackCard({ icon: Icon, nome, papel, itens, arte, span, arteClasse, textoClasse }: Camada) {
  return (
    <article
      className={cn(
        "dg-glass dg-bento relative flex min-h-[300px] flex-col gap-7 overflow-hidden p-8",
        span,
      )}
    >
      {/* A arte fica atrás do conteúdo e só entra no desktop: no card estreito
          ela roubaria a largura de que o texto precisa. */}
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute hidden aspect-[200/160] lg:block", arteClasse)}
      >
        {arte}
      </div>

      <div className={cn("relative z-10 flex flex-col gap-4", textoClasse)}>
        <span className="inline-flex items-center gap-3">
          <Icon className="h-7 w-7 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
          <h3 className="text-[22px] font-semibold tracking-tight text-foreground">{nome}</h3>
        </span>
        <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground">{papel}</p>
      </div>

      {/* mt-auto prende os chips no rodapé: com descrições de alturas
          diferentes, sem isso eles flutuariam em posições distintas. */}
      <ul className="relative z-10 mt-auto flex flex-wrap gap-2.5">
        {itens.map((item) => (
          <li key={item} className="dg-chip">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function DevStackSection() {
  return (
    <section id="dev-stack" className="relative scroll-mt-24 overflow-hidden">
      {/* Malha técnica da seção: 160px, com node laranja a cada terceira
          interseção. Vive aqui e não no body — a regra de fundo preto puro
          continua valendo no resto do site. */}
      <div aria-hidden="true" className="dg-tech-grid absolute inset-0" />

      <div className="dg-shell relative flex flex-col gap-14 pb-24 pt-20 md:pb-32 md:pt-24">
        <SectionHeader
          overline="Build fast • Deploy smart"
          title="Dev Stack"
          description="O produto inteiro roda no navegador: a base fica em IndexedDB e cada integração externa passa por uma função serverless, sem servidor de aplicação no meio."
        />

        <div className="dg-stagger grid gap-5 md:grid-cols-2 lg:grid-cols-12">
          {CAMADAS.map((c) => (
            <StackCard key={c.nome} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}
