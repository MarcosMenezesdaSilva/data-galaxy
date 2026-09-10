import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import { useApp, USUARIOS, type Perfil } from "@/lib/store";
import { BrandMark, BrandWordmark, Eyebrow } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPasswordDialog } from "@/components/AdminPasswordDialog";
import { adminAutenticadoNestaSessao } from "@/lib/admin-auth";
import { Sun, Moon, Shield, LineChart, Wrench, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Data Galaxy" }] }),
  component: LoginPage,
});

const CAPACIDADES = [
  { icon: LineChart, label: "Previsão D+1 e D+7" },
  { icon: Shield, label: "Risco de violação OLA" },
  { icon: Wrench, label: "Ações corretivas" },
  { icon: CheckCircle2, label: "Validação de efetividade" },
];

const NUMEROS = [
  { valor: "122.554", label: "registros na carga final" },
  { valor: "248", label: "violações mapeadas" },
  { valor: "94,8%", label: "monitoramento automático" },
];

// Atraso de entrada do stagger — custom property precisa de cast em CSSProperties.
const atraso = (ms: number) => ({ "--dg-delay": `${ms}ms` }) as CSSProperties;

function LoginPage() {
  const { theme, toggleTheme, setPerfil } = useApp();
  const nav = useNavigate();
  const [pedirSenhaAdmin, setPedirSenhaAdmin] = useState(false);

  function entrar(p: Perfil) {
    if (p === "admin" && !adminAutenticadoNestaSessao()) {
      setPedirSenhaAdmin(true);
      return;
    }
    setPerfil(p);
    toast.success(`Bem-vindo(a), ${USUARIOS[p].nome.split(" ")[0]}!`);
    nav({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen w-full bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Painel esquerdo — área cinematográfica: o símbolo entra, a rede pulsa,
          e o glow vive atrás da arte sem tocá-la. */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-[color:var(--border-subtle)] p-12 lg:flex">
        {/* Campo atmosférico: halo da marca respirando devagar, atrás de tudo */}
        <div
          aria-hidden="true"
          className="dg-breathe pointer-events-none absolute -left-1/4 top-[-20%] h-[560px] w-[560px] rounded-pill"
          style={{
            background: "radial-gradient(circle, var(--brand-orange-glow), transparent 62%)",
            opacity: 0.5,
          }}
        />

        <div className="relative">
          <BrandWordmark />
        </div>

        <div className="relative max-w-xl space-y-8">
          <Eyebrow className="dg-enter">Data intelligence</Eyebrow>

          <h1 className="t-display-lg dg-enter text-foreground" style={atraso(80)}>
            De <span className="text-muted-foreground">reativo</span>
            <br />a <span className="text-primary">preditivo</span>.
          </h1>

          <p className="t-body-lg dg-enter max-w-lg text-muted-foreground" style={atraso(180)}>
            Preveja incidentes, avalie riscos de OLA, registre ações e comprove se cada correção foi
            realmente efetiva. O ciclo completo AIOps em um só lugar.
          </p>

          <div className="dg-stagger grid grid-cols-2 gap-3">
            {CAPACIDADES.map((f) => (
              <div
                key={f.label}
                className="dg-hover-card flex items-center gap-3 rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-01)]/70 px-4 py-3 backdrop-blur"
              >
                <f.icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dg-enter relative flex flex-wrap items-center gap-8" style={atraso(320)}>
          {NUMEROS.map((n) => (
            <div key={n.label}>
              <div className="dg-mono t-h4 text-foreground">{n.valor}</div>
              <div className="t-micro mt-1 uppercase text-muted-foreground">{n.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Painel direito — seleção de perfil */}
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <BrandWordmark />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="ml-auto"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-4">
              {/* Símbolo animado também no mobile, onde o painel hero não existe */}
              <div className="lg:hidden">
                <BrandMark size={44} animated glow />
              </div>
              <Eyebrow>Acesso demonstrativo</Eyebrow>
              <h2 className="t-h2 text-foreground">Selecione um perfil</h2>
              <p className="t-body-sm text-muted-foreground">
                Esta é a versão MVP frontend-first. Escolha um perfil demonstrativo — não há
                autenticação real.
              </p>
            </div>

            <div className="dg-stagger space-y-3">
              {Object.values(USUARIOS).map((u) => (
                <Card
                  key={u.id}
                  lit
                  interactive
                  className="group cursor-pointer p-5"
                  onClick={() => entrar(u.id)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-sm font-medium text-white"
                      style={{ background: "var(--brand-gradient)" }}
                    >
                      {u.iniciais}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground">{u.nome}</div>
                      <div className="t-micro mt-0.5 uppercase text-muted-foreground">
                        {u.cargo}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-[var(--motion-default)] ease-[var(--ease-out-expo)] group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </Card>
              ))}
            </div>

            <p className="t-micro text-center uppercase text-muted-foreground">
              Challenge Locaweb 2026 · FIAP · Grupo NexusOps
            </p>
          </div>
        </div>
      </div>

      <AdminPasswordDialog
        open={pedirSenhaAdmin}
        onOpenChange={setPedirSenhaAdmin}
        onSucesso={() => entrar("admin")}
      />
    </div>
  );
}
