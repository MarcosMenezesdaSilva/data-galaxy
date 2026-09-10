import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { useApp } from "@/lib/store";
import { BrandMark, BrandWordmark, Eyebrow } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowRight,
  LineChart,
  Shield,
  Wrench,
  CheckCircle2,
  Info,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Data Galaxy — AIOps preditivo para incidentes e OLA" }] }),
  component: Index,
});

const INDICADORES = [
  { valor: "122.554", label: "Registros na carga final da base tratada" },
  { valor: "94,8%", label: "Das aberturas ocorreram por monitoramento automático" },
  { valor: "~76%", label: "Dos incidentes concentrados entre set-dez/2025" },
  { valor: "248", label: "Violações de OLA identificadas na análise exploratória" },
];

const CAPACIDADES = [
  { icon: LineChart, label: "Previsão D+1 e D+7", desc: "Modelos AutoETS e Seasonal Naive" },
  { icon: Shield, label: "Risco de violação de OLA", desc: "Fatores explicáveis, sem caixa-preta" },
  { icon: Wrench, label: "Ações corretivas", desc: "Registro e acompanhamento de tratativas" },
  {
    icon: CheckCircle2,
    label: "Validação de efetividade",
    desc: "Comprova se a correção funcionou",
  },
];

const atraso = (ms: number) => ({ "--dg-delay": `${ms}ms` }) as CSSProperties;

function Index() {
  const perfil = useApp((s) => s.perfil);
  const navigate = useNavigate();

  // Usuário com sessão demonstrativa ativa: pula a landing e vai direto ao produto.
  if (perfil) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <BrandWordmark />
        <Button size="sm" onClick={() => navigate({ to: "/login" })}>
          Entrar <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </header>

      <main className="px-6 md:px-12">
        {/* Hero — o símbolo abre a página com a sequência da rede */}
        <section className="relative mx-auto max-w-4xl py-24 text-center md:py-32">
          <div
            aria-hidden="true"
            className="dg-breathe pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/3 rounded-pill"
            style={{
              background: "radial-gradient(circle, var(--brand-orange-glow), transparent 62%)",
              opacity: 0.55,
            }}
          />

          <div className="relative flex flex-col items-center gap-8">
            <BrandMark size={72} animated glow />

            <Eyebrow className="dg-enter" style={atraso(60)}>
              Challenge Locaweb × FIAP · NexusOps
            </Eyebrow>

            <h1 className="t-display-lg dg-enter text-foreground" style={atraso(140)}>
              De incidentes <span className="text-muted-foreground">reativos</span>
              <br />a operações <span className="text-primary">preditivas</span>.
            </h1>

            <p
              className="t-body-lg dg-enter mx-auto max-w-2xl text-muted-foreground"
              style={atraso(220)}
            >
              Data Galaxy antecipa picos de incidentes, calcula o risco de violação de OLA/SLA antes
              que ele aconteça e comprova, com dados, se cada correção aplicada foi realmente
              efetiva — tudo rodando localmente no seu navegador.
            </p>

            <div className="dg-enter" style={atraso(300)}>
              <Button size="lg" onClick={() => navigate({ to: "/login" })}>
                Acessar plataforma <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Indicadores da EDA */}
        <section className="mx-auto max-w-5xl pb-24">
          <TooltipProvider delayDuration={150}>
            <div className="dg-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {INDICADORES.map((ind) => (
                <Card key={ind.label} brand interactive className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="dg-mono t-h2 text-primary">{ind.valor}</div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="t-micro inline-flex cursor-help items-center gap-1 rounded-pill border border-[color:var(--border-default)] px-2 py-0.5 uppercase text-muted-foreground">
                          <Info className="h-3 w-3" /> EDA
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        Indicador da análise exploratória — calculado sobre a base tratada de
                        incidentes durante a fase de EDA do projeto.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{ind.label}</p>
                </Card>
              ))}
            </div>
          </TooltipProvider>
        </section>

        {/* Capacidades */}
        <section className="mx-auto max-w-5xl pb-24">
          <div className="dg-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPACIDADES.map((f) => (
              <Card key={f.label} lit interactive className="p-6">
                <f.icon className="h-5 w-5 text-primary" />
                <div className="mt-6 text-sm font-medium text-foreground">{f.label}</div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Ressalva acadêmica */}
        <section className="mx-auto max-w-3xl pb-24">
          <Card className="flex items-start gap-4 bg-transparent p-6 shadow-none">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--warning)]" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Este é um MVP acadêmico executado 100% no navegador (IndexedDB local, sem backend).
              Ele inicia em modo demonstração com dados sintéticos e permite importar a base real
              tratada de incidentes para análise. Os valores acima refletem a análise exploratória
              da base tratada e não representam SLAs contratuais.
            </p>
          </Card>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--border-subtle)] px-6 py-8 md:px-12">
        <span className="inline-flex items-center gap-2.5">
          <BrandMark size={20} />
          <span className="t-micro uppercase text-muted-foreground">Data Galaxy by Locaweb</span>
        </span>
        <span className="t-micro uppercase text-muted-foreground">
          Challenge Locaweb 2026 · FIAP · Grupo NexusOps
        </span>
      </footer>
    </div>
  );
}
