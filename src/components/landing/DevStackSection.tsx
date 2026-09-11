import type { LucideIcon } from "lucide-react";
import { Activity, Brain, Code, Database, Zap } from "lucide-react";

import { SectionHeader } from "./SectionHeader";

/**
 * Stack real, agrupada por camada em vez de listada como logo wall (PDR §7).
 *
 * Tudo aqui é verificável no repositório: as dependências saem do
 * package.json, as funções de netlify/functions, os modelos de previsão do
 * catálogo de telas e o modelo de IA do default em assistente-ia.ts. Nada de
 * tecnologia aspiracional — se não está no projeto, não está nesta lista.
 */
interface Camada {
  icon: LucideIcon;
  nome: string;
  papel: string;
  itens: string[];
}

const CAMADAS: Camada[] = [
  {
    icon: Database,
    nome: "Data Layer",
    papel: "A base vive no navegador; o Databricks entra quando há credencial.",
    itens: [
      "IndexedDB via Dexie",
      "PapaParse — CSV/TXT",
      "SheetJS — Excel",
      "Databricks SQL Warehouse",
      "Snapshot versionado em JSON",
    ],
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
      "Motor de regras local — fallback sem IA",
    ],
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
  },
  {
    icon: Activity,
    nome: "Infrastructure",
    papel: "Build e entrega estática, com as funções no mesmo deploy.",
    itens: ["Netlify", "Vite 8", "Bun"],
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
  },
];

function StackCard({ icon: Icon, nome, papel, itens }: Camada) {
  return (
    <article className="dg-glass dg-bento grid gap-6 p-7 md:grid-cols-[240px_1fr] md:gap-8">
      <div className="flex flex-col gap-3">
        <span className="inline-flex items-center gap-2.5">
          <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <h3 className="t-h4 text-foreground">{nome}</h3>
        </span>
        <p className="t-body-sm text-pretty text-muted-foreground">{papel}</p>
      </div>

      <ul className="flex flex-wrap content-start gap-2">
        {itens.map((item) => (
          <li
            key={item}
            className="t-micro rounded-pill border border-[color:var(--border-default)] bg-[color:var(--surface-02)] px-3 py-1.5 text-muted-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function DevStackSection() {
  return (
    <section id="dev-stack" className="scroll-mt-24 border-t border-[color:var(--border-subtle)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-24 md:px-10 md:py-32">
        <SectionHeader
          eyebrow="Architecture"
          title="Dev Stack"
          description="O produto inteiro roda no navegador do operador: a base fica em IndexedDB e cada integração externa passa por uma função serverless, sem servidor de aplicação no meio."
        />

        <div className="dg-stagger flex flex-col gap-4">
          {CAMADAS.map((c) => (
            <StackCard key={c.nome} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}
