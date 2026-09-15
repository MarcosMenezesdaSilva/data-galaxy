import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Bot,
  Check,
  LayoutDashboard,
  LineChart,
  X,
} from "lucide-react";

import { SectionHeader } from "./SectionHeader";

/**
 * Cinco capacidades do produto, comparadas contra a operação sem elas.
 *
 * Cada par é específico e verificável nas outras seções da própria página
 * (Orbi, alertas, previsão, painel por perfil, validação de efetividade) —
 * nada de número de impacto inventado. O Databricks fica de fora de
 * propósito: é detalhe de onde o dado vem, não algo que o usuário sente no
 * dia a dia — o lugar dele é o Dev Stack, não aqui.
 */
const COMPARACOES: { icon: LucideIcon; nome: string; sem: string; com: string }[] = [
  {
    icon: Bot,
    nome: "Orbi, o assistente com IA",
    sem: 'Alguém abre várias telas e cruza dados na mão pra responder "o que eu preciso saber agora".',
    com: "Pergunta em português pro Orbi e recebe a resposta na hora, com base nos dados reais carregados.",
  },
  {
    icon: Bell,
    nome: "Alertas em WhatsApp, SMS e Teams",
    sem: "Alerta crítico fica só dentro do painel — se ninguém está olhando naquele momento, ninguém sabe.",
    com: "Alerta chega direto onde a equipe já está: WhatsApp, SMS, Teams ou e-mail.",
  },
  {
    icon: LineChart,
    nome: "Previsão de incidentes por produto e grupo",
    sem: "O pico de incidentes só aparece quando já está acontecendo.",
    com: "Volume esperado com D+1 e D+7 de antecedência, aberto por produto e grupo.",
  },
  {
    icon: LayoutDashboard,
    nome: "Um painel por perfil",
    sem: "Gestor, técnico e admin olham pro mesmo painel genérico, mesmo decidindo coisas diferentes.",
    com: "Cada perfil abre o painel modelado pro que ele decide no dia a dia.",
  },
  {
    icon: BadgeCheck,
    nome: "Prova de que a correção funcionou",
    sem: "Aplica a correção e não dá pra saber, de fato, se ela resolveu o problema.",
    com: "Compara previsto x realizado depois da ação e comprova o efeito.",
  },
];

function ComparacaoRow({ icon: Icon, nome, sem, com }: (typeof COMPARACOES)[number]) {
  return (
    <div className="dg-glass dg-bento grid overflow-hidden md:grid-cols-[220px_1fr_44px_1fr]">
      <div className="flex items-center gap-3 border-b border-[color:var(--border-subtle)] p-5 md:border-b-0 md:border-r">
        <span className="grid h-9 w-9 shrink-0 place-content-center rounded-[10px] border border-[color:var(--border-brand)] bg-[color:var(--brand-orange-soft)] text-[color:var(--brand-orange-light)]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="t-body-sm font-semibold text-foreground">{nome}</span>
      </div>

      <div className="flex items-start gap-3 p-5 text-muted-foreground">
        <span className="mt-0.5 grid h-[22px] w-[22px] shrink-0 place-content-center rounded-pill bg-[color:var(--critical)]/12">
          <X className="h-[11px] w-[11px] text-[color:var(--critical)]" strokeWidth={3} />
        </span>
        <div>
          <div className="t-micro mb-1 uppercase tracking-wide text-[color:var(--critical)]/80">
            Sem
          </div>
          <p className="t-body-sm text-pretty">{sem}</p>
        </div>
      </div>

      <div className="hidden items-center justify-center text-[color:var(--border-strong)] md:flex">
        <ArrowRight className="h-5 w-5" />
      </div>

      <div className="flex items-start gap-3 border-t border-[color:var(--border-subtle)] p-5 md:border-t-0 [background:linear-gradient(180deg,var(--brand-orange-soft),transparent_60%)]">
        <span className="mt-0.5 grid h-[22px] w-[22px] shrink-0 place-content-center rounded-pill bg-[color:var(--success)]/12">
          <Check className="h-3 w-3 text-[color:var(--success)]" strokeWidth={3} />
        </span>
        <div>
          <div className="t-micro mb-1 uppercase tracking-wide text-primary">Com</div>
          <p className="t-body-sm text-pretty text-foreground">{com}</p>
        </div>
      </div>
    </div>
  );
}

export function ImpactSection() {
  return (
    <section id="impacto" className="scroll-mt-20 border-t border-[color:var(--border-subtle)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 md:px-10 md:py-24">
        <SectionHeader
          overline="O que muda"
          title="O que muda com o Data Galaxy"
          description="Cinco capacidades reais do produto, lado a lado com o que a operação faz hoje sem elas."
        />

        <div className="dg-stagger flex flex-col gap-3.5">
          {COMPARACOES.map((c) => (
            <ComparacaoRow key={c.nome} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}
