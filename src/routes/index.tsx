import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useApp } from "@/lib/store";
import { BrandMark } from "@/components/Brand";
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { IntroductionSection } from "@/components/landing/IntroductionSection";
import { CapabilitiesSection } from "@/components/landing/CapabilitiesSection";
import { ImpactSection } from "@/components/landing/ImpactSection";
import { DevStackSection } from "@/components/landing/DevStackSection";

const TITULO = "Data Galaxy: AIOps preditivo para incidentes e OLA";
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
        <IntroductionSection />
        <CapabilitiesSection />
        <ImpactSection />
        <DevStackSection />
      </main>

      <Footer />
    </div>
  );
}
