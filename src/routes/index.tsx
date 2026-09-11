import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useApp } from "@/lib/store";
import { BrandMark } from "@/components/Brand";
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { IntroductionSection } from "@/components/landing/IntroductionSection";
import { CapabilitiesSection } from "@/components/landing/CapabilitiesSection";
import { DevStackSection } from "@/components/landing/DevStackSection";

const TITULO = "Data Galaxy — AIOps preditivo para incidentes e OLA";
const DESCRICAO =
  "Prevê o volume de incidentes em D+1 e D+7, calcula o risco de violação de OLA antes que ele aconteça e comprova com dados se cada correção foi efetiva.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { name: "twitter:title", content: TITULO },
      { name: "twitter:description", content: DESCRICAO },
    ],
  }),
  component: Index,
});

/**
 * Números da análise exploratória. São a credibilidade concreta da página —
 * tudo o mais descreve capacidade, isto é medição — então ficam logo abaixo do
 * hero, como faixa e não como grid, para não competir com o bento adiante.
 */
const INDICADORES = [
  { valor: "122.554", label: "Registros na carga final da base tratada" },
  { valor: "94,8%", label: "Das aberturas por monitoramento automático" },
  { valor: "~76%", label: "Dos incidentes entre set e dez/2025" },
  { valor: "248", label: "Violações de OLA identificadas" },
];

function ProofStrip() {
  return (
    <section
      aria-label="Indicadores da análise exploratória"
      className="border-t border-[color:var(--border-subtle)]"
    >
      <div className="mx-auto max-w-6xl px-6 py-14 md:px-10">
        <div className="dg-stagger grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {INDICADORES.map((ind) => (
            <div key={ind.label} className="flex flex-col gap-2">
              <span className="dg-mono t-h2 text-primary">{ind.valor}</span>
              <span className="t-body-sm text-pretty text-muted-foreground">{ind.label}</span>
            </div>
          ))}
        </div>

        <p className="t-micro mt-10 uppercase text-muted-foreground">
          Análise exploratória da base tratada de incidentes
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[color:var(--border-subtle)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2.5">
            <BrandMark size={20} />
            <span className="t-micro uppercase text-muted-foreground">Data Galaxy by Locaweb</span>
          </span>
          <span className="t-micro uppercase text-muted-foreground">
            Challenge Locaweb 2026 · FIAP · Grupo NexusOps
          </span>
        </div>

        {/* Ressalva acadêmica: permanece na página, em peso menor. Apresentar
            base sintética como operação real seria overclaim. A discrição vem
            do tamanho e da cor — baixar a opacidade levaria o texto a 2,8:1 no
            tema claro, reprovando AA. */}
        <p className="t-body-sm max-w-3xl text-pretty text-muted-foreground">
          MVP acadêmico executado 100% no navegador, sem backend de aplicação. Inicia em modo
          demonstração com dados sintéticos e permite importar a base real tratada de incidentes. Os
          indicadores acima vêm da análise exploratória dessa base e não representam SLAs
          contratuais.
        </p>
      </div>
    </footer>
  );
}

function Index() {
  const perfil = useApp((s) => s.perfil);

  // Sessão demonstrativa ativa: pula a landing e vai direto ao produto.
  if (perfil) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen w-full bg-background">
      <Navigation />

      {/* Impacto → entendimento → capacidade → credibilidade técnica. */}
      <main>
        <HeroSection />
        <ProofStrip />
        <IntroductionSection />
        <CapabilitiesSection />
        <DevStackSection />
      </main>

      <Footer />
    </div>
  );
}
