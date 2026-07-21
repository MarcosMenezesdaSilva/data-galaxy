import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { BrandWordmark } from "@/components/Brand";
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
  TrendingUp,
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

function Index() {
  const perfil = useApp((s) => s.perfil);
  const navigate = useNavigate();

  // Usuário com sessão demonstrativa ativa: pula a landing e vai direto ao produto.
  if (perfil) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <BrandWordmark />
        <Button size="sm" onClick={() => navigate({ to: "/login" })}>
          Entrar <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </header>

      <main className="px-6 md:px-10">
        {/* Hero */}
        <section className="mx-auto max-w-4xl text-center py-16 md:py-24 space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Challenge Locaweb × FIAP · Grupo NexusOps
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            De incidentes <span className="text-[color:var(--critical)]">reativos</span> a operações{" "}
            <span className="text-primary">preditivas</span>.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Data Galaxy antecipa picos de incidentes, calcula o risco de violação de OLA/SLA antes
            que ele aconteça e comprova, com dados, se cada correção aplicada foi realmente efetiva
            — tudo rodando localmente no seu navegador.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="lg" onClick={() => navigate({ to: "/login" })}>
              Acessar plataforma <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </section>

        {/* Indicadores */}
        <section className="mx-auto max-w-5xl pb-16">
          <TooltipProvider delayDuration={150}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {INDICADORES.map((ind) => (
                <Card key={ind.label} className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-primary">{ind.valor}</div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground cursor-help">
                          <Info className="h-3 w-3" /> EDA
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        Indicador da análise exploratória — calculado sobre a base tratada de
                        incidentes durante a fase de EDA do projeto.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ind.label}</p>
                </Card>
              ))}
            </div>
          </TooltipProvider>
        </section>

        {/* Capacidades */}
        <section className="mx-auto max-w-5xl pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: LineChart,
                label: "Previsão D+1 e D+7",
                desc: "Modelos AutoETS e Seasonal Naive",
              },
              {
                icon: Shield,
                label: "Risco de violação de OLA",
                desc: "Fatores explicáveis, sem caixa-preta",
              },
              {
                icon: Wrench,
                label: "Ações corretivas",
                desc: "Registro e acompanhamento de tratativas",
              },
              {
                icon: CheckCircle2,
                label: "Validação de efetividade",
                desc: "Comprova se a correção funcionou",
              },
            ].map((f) => (
              <Card key={f.label} className="p-4 space-y-2">
                <f.icon className="h-5 w-5 text-primary" />
                <div className="text-sm font-semibold">{f.label}</div>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mx-auto max-w-3xl pb-16">
          <Card className="p-4 flex items-start gap-3 bg-muted/30">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[color:var(--warning)]" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Este é um MVP acadêmico executado 100% no navegador (IndexedDB local, sem backend).
              Ele inicia em modo demonstração com dados sintéticos e permite importar a base real
              tratada de incidentes para análise. Os valores acima refletem a análise exploratória
              da base tratada e não representam SLAs contratuais.
            </p>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border px-6 md:px-10 py-6 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" /> Data Galaxy by Locaweb
        </span>
        <span>Challenge Locaweb 2026 · FIAP · Grupo NexusOps</span>
      </footer>
    </div>
  );
}
