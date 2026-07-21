import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApp, USUARIOS, type Perfil } from "@/lib/store";
import { BrandWordmark } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Shield, LineChart, Wrench, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Data Galaxy" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { theme, toggleTheme, setPerfil } = useApp();
  const nav = useNavigate();

  function entrar(p: Perfil) {
    setPerfil(p);
    toast.success(`Bem-vindo(a), ${USUARIOS[p].nome.split(" ")[0]}!`);
    nav({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Left panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-[color:var(--accent-orange)]/10 border-r border-border">
        <BrandWordmark />
        <div className="space-y-6 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight text-foreground">
            De <span className="text-primary">reativo</span> a{" "}
            <span className="text-[color:var(--accent-orange)]">preditivo</span>.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Preveja incidentes, avalie riscos de OLA, registre ações e comprove se cada correção foi
            realmente efetiva. O ciclo completo AIOps em um só lugar.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: LineChart, label: "Previsão D+1 e D+7", tone: "text-primary" },
              {
                icon: Shield,
                label: "Risco de violação OLA",
                tone: "text-[color:var(--accent-orange)]",
              },
              { icon: Wrench, label: "Ações corretivas", tone: "text-[color:var(--info)]" },
              {
                icon: CheckCircle2,
                label: "Validação de efetividade",
                tone: "text-[color:var(--success)]",
              },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 backdrop-blur"
              >
                <f.icon className={`h-4 w-4 ${f.tone}`} />
                <span className="text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <div>
            <span className="font-semibold text-foreground">122.554</span> registros na carga final
          </div>
          <div>
            <span className="font-semibold text-foreground">248</span> violações mapeadas
          </div>
          <div>
            <span className="font-semibold text-foreground">94,8%</span> monitoramento automático
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <BrandWordmark />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="ml-auto rounded-full"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wider text-primary">
                Acesso demonstrativo
              </div>
              <h2 className="text-2xl font-semibold text-foreground">Selecione um perfil</h2>
              <p className="text-sm text-muted-foreground">
                Esta é a versão MVP frontend-first. Escolha um perfil demonstrativo — não há
                autenticação real.
              </p>
            </div>
            <div className="space-y-3">
              {Object.values(USUARIOS).map((u) => (
                <Card
                  key={u.id}
                  className="p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md group"
                  onClick={() => entrar(u.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-[color:var(--accent-orange)] flex items-center justify-center text-primary-foreground font-semibold">
                      {u.iniciais}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground">{u.nome}</div>
                      <div className="text-xs text-muted-foreground">{u.cargo}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-60 group-hover:opacity-100"
                    >
                      Entrar →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <p className="text-[11px] text-center text-muted-foreground">
              Challenge Locaweb 2026 · FIAP · Grupo NexusOps
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
