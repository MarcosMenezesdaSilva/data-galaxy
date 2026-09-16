import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Bot,
  CheckCircle2,
  Database,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  Search,
  ShieldAlert,
  TrendingUp,
  Zap,
} from "lucide-react";

import { BrandMark } from "@/components/Brand";
import { GalaxyScene } from "@/components/landing/GalaxyScene";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/apresentacao")({
  head: () => ({ meta: [{ title: "Apresentação — Data Galaxy" }] }),
  component: ApresentacaoPage,
});

/* ---------------------------------------------------------------------------
   Blocos compartilhados entre slides — mesma linguagem visual da landing
   (dg-glass/dg-bento), só que compactada pro formato de deck.
--------------------------------------------------------------------------- */

function Kicker({ n, label }: { n?: string; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      {n && <span className="dg-mono text-[11px] font-semibold text-primary">{n}</span>}
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function DeckCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("dg-glass rounded-2xl p-5", className)}>{children}</div>;
}

function StatCard({ num, cap, sub }: { num: string; cap: string; sub?: string }) {
  return (
    <DeckCard className="text-center">
      <div className="dg-mono text-[28px] font-bold text-[color:var(--brand-orange-light)]">
        {num}
      </div>
      <div className="mt-1.5 text-[10.5px] uppercase tracking-wide text-muted-foreground">
        {cap}
      </div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </DeckCard>
  );
}

function ModelRow({ tag, children }: { tag: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-02)] px-3 py-2.5 text-[12.5px] text-foreground">
      <span className="min-w-[64px] shrink-0 rounded-full border border-[color:var(--border-brand)] bg-[color:var(--brand-orange-soft)] px-2.5 py-0.5 text-center text-[9.5px] font-bold uppercase tracking-wide text-[color:var(--brand-orange-light)]">
        {tag}
      </span>
      {children}
    </div>
  );
}

function IconBox({ icon: Icon, size = 32 }: { icon: LucideIcon; size?: number }) {
  const iconSize = Math.round(size * 0.46);
  return (
    <span
      className="grid shrink-0 place-content-center rounded-[10px] border border-[color:var(--border-brand)] bg-[color:var(--brand-orange-soft)] text-[color:var(--brand-orange-light)]"
      style={{ width: size, height: size }}
    >
      <Icon style={{ width: iconSize, height: iconSize }} />
    </span>
  );
}

interface Comparacao {
  icon: LucideIcon;
  nome: string;
  sem: string;
  com: string;
}

const COMPARACOES: Comparacao[] = [
  {
    icon: Bot,
    nome: "Orbi, o assistente com IA",
    sem: 'Alguém cruza dados na mão pra responder "o que preciso saber agora".',
    com: "Pergunta em português e recebe a resposta na hora, com os dados reais.",
  },
  {
    icon: Bell,
    nome: "Alertas em WhatsApp, SMS e Teams",
    sem: "Alerta crítico fica só no painel — se ninguém olha, ninguém sabe.",
    com: "Chega direto onde a equipe já está: WhatsApp, SMS, Teams ou e-mail.",
  },
  {
    icon: LineChart,
    nome: "Previsão de incidentes",
    sem: "O pico só aparece quando já está acontecendo.",
    com: "Volume esperado com D+1 e D+7 de antecedência.",
  },
  {
    icon: LayoutDashboard,
    nome: "Um painel por perfil",
    sem: "Gestor, técnico e admin olham pro mesmo painel genérico.",
    com: "Cada perfil abre o painel modelado pro que ele decide.",
  },
  {
    icon: BadgeCheck,
    nome: "Prova de efetividade",
    sem: "Aplica a correção e não sabe se ela resolveu de fato.",
    com: "Compara previsto x realizado e comprova o efeito.",
  },
];

const EQUIPE = [
  { nome: "Alex Ribeiro Barros Jr.", rm: "RM562679", foto: "/equipe/alex.jpg" },
  { nome: "Felipe Alves Gonzaga", rm: "RM563135", foto: "/equipe/felipe.png" },
  { nome: "Gabriel S. de Morais", rm: "RM564060", foto: "/equipe/gabriel.png" },
  { nome: "Marcos Menezes", rm: "RM561547", foto: "/equipe/marcos.png" },
  { nome: "Thais Cesário de Souza", rm: "RM562987", foto: "/equipe/thais.jpg" },
];

const OBJETIVOS = [
  { icon: TrendingUp, titulo: "Prever o volume", desc: "D+1 e D+7 por produto." },
  { icon: ShieldAlert, titulo: "Priorizar por risco", desc: "Fila ordenada por violação." },
  { icon: Search, titulo: "Expor causa raiz", desc: "Agrupamento de recorrência." },
  { icon: BadgeCheck, titulo: "Comprovar efeito", desc: "Previsto x realizado." },
];

const SOLUCAO = [
  {
    icon: TrendingUp,
    titulo: "Previsão antecipada",
    desc: "Antecipa volume e tendências antes do impacto, com horizontes D+1 e D+7.",
  },
  {
    icon: ShieldAlert,
    titulo: "Risco explicável",
    desc: "Mostra por que o risco de violação aumentou e o que pesa no cenário.",
  },
  {
    icon: CheckCircle2,
    titulo: "Validação de impacto",
    desc: "Compara previsto e realizado pra comprovar se a correção funcionou.",
  },
];

const MODELOS = [
  { tag: "Previsão", texto: "AutoETS — volume de incidentes por produto" },
  { tag: "Baseline", texto: "Seasonal Naive — comparação contra o AutoETS" },
  { tag: "Risco", texto: "Gradient Boosting (GBM) — risco de violação de OLA" },
  { tag: "Padrão", texto: "Clusterização — agrupamento de recorrências" },
];

const TOTAL_SLIDES = 10;

function ApresentacaoPage() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setI((v) => (v + 1) % TOTAL_SLIDES);
      if (e.key === "ArrowLeft") setI((v) => (v - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function ir(idx: number) {
    setI((idx + TOTAL_SLIDES) % TOTAL_SLIDES);
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-foreground">
      {/* Mesma cena orbital do hero da home — deslocada pro canto e discreta,
          pra não competir com o conteúdo do slide. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40"
      >
        <GalaxyScene className="absolute -right-[55%] -top-[42%] h-[170%] w-[170%]" />
      </div>

      <button
        type="button"
        onClick={() => navigate({ to: "/" })}
        aria-label="Voltar para o site"
        className="fixed left-8 top-6 z-20 flex items-center gap-2 text-sm font-semibold"
      >
        <BrandMark size={20} />
        DATA GALAXY
      </button>

      <div className="dg-mono fixed right-8 top-6 z-20 text-xs text-muted-foreground">
        {String(i + 1).padStart(2, "0")} / {TOTAL_SLIDES}
      </div>

      <div className="relative z-10 h-full w-full">
        {Array.from({ length: TOTAL_SLIDES }, (_, idx) => (
          <div
            key={idx}
            className={cn(
              "absolute inset-0 flex flex-col justify-center overflow-y-auto px-[8vw] pb-24 pt-24 transition-opacity duration-300",
              idx === i ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <div className="mx-auto w-full max-w-6xl">
              {idx === 0 && <SlideCapa />}
              {idx === 1 && <SlideEquipe />}
              {idx === 2 && <SlideDesafio />}
              {idx === 3 && <SlideAchado />}
              {idx === 4 && <SlideObjetivo />}
              {idx === 5 && <SlideSolucao />}
              {idx === 6 && <SlideImpacto />}
              {idx === 7 && <SlideResultados />}
              {idx === 8 && <SlideArquitetura />}
              {idx === 9 && <SlideEncerramento onEntrar={() => navigate({ to: "/login" })} />}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-5 z-20 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => ir(i - 1)}
          aria-label="Slide anterior"
          className="grid h-9 w-9 place-content-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-02)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-[7px]">
          {Array.from({ length: TOTAL_SLIDES }, (_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => ir(idx)}
              aria-label={`Ir para o slide ${idx + 1}`}
              className={cn(
                "h-[7px] rounded-full transition-all",
                idx === i ? "w-5 bg-primary" : "w-[7px] bg-[color:var(--border-strong)]",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => ir(i + 1)}
          aria-label="Próximo slide"
          className="grid h-9 w-9 place-content-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-02)]"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Slides
--------------------------------------------------------------------------- */

function SlideCapa() {
  return (
    <div>
      <div className="mb-5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Challenge Locaweb · FIAP · NexusOps
      </div>
      <h1 className="t-display-lg text-balance text-5xl font-bold leading-[1.05] text-foreground sm:text-6xl">
        Dados unificados,
        <br />
        <span className="text-primary">possibilidades ilimitadas.</span>
      </h1>
      <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
        Plataforma de AIOps preditivo que antecipa o volume de incidentes, explica o risco de
        violação de OLA e comprova com dados o efeito de cada correção.
      </p>
      <div className="mt-7 flex gap-2.5">
        <span className="dg-chip text-[11.5px]">Turma 2TSCPV</span>
        <span className="dg-chip text-[11.5px]">Solução final · 2026/09</span>
      </div>
    </div>
  );
}

function SlideEquipe() {
  return (
    <div>
      <Kicker n="01" label="Quem somos" />
      <h2 className="t-h2 mb-1.5 text-foreground">Equipe NexusOps</h2>
      <p className="t-body-md mb-7 text-muted-foreground">Turma 2TSCPV</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {EQUIPE.map((p) => (
          <DeckCard key={p.rm} className="text-center">
            <img
              src={p.foto}
              alt={p.nome}
              className="mx-auto mb-3 h-16 w-16 rounded-full border border-[color:var(--border-brand)] object-cover shadow-[0_0_0_4px_var(--brand-orange-soft)]"
            />
            <div className="text-[12.5px] font-semibold text-foreground">{p.nome}</div>
            <div className="dg-mono mt-0.5 text-[10.5px] text-muted-foreground">{p.rm}</div>
          </DeckCard>
        ))}
      </div>
    </div>
  );
}

function SlideDesafio() {
  return (
    <div>
      <Kicker n="02" label="O desafio" />
      <h2 className="t-h2 mb-5 text-foreground">A operação descobre tarde demais</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <DeckCard>
          <div className="dg-mono mb-2 text-[26px] font-bold text-[color:var(--brand-orange-light)]">
            122.543
          </div>
          <p className="t-body-sm text-muted-foreground">
            Incidentes no histórico — dezenas de grupos e produtos, OLA medido em horário útil.
          </p>
        </DeckCard>
        <DeckCard>
          <h4 className="mb-2 text-[15px] font-semibold text-foreground">O problema</h4>
          <p className="t-body-sm text-muted-foreground">
            A violação só aparece depois de acontecer — sem como provar se a correção resolveu ou só
            adiou.
          </p>
        </DeckCard>
        <DeckCard>
          <h4 className="mb-2 text-[15px] font-semibold text-foreground">Por que pesa</h4>
          <p className="t-body-sm text-muted-foreground">
            Volume alto esconde taxa crítica: sem separar os dois, a priorização erra o alvo.
          </p>
        </DeckCard>
      </div>
    </div>
  );
}

function SlideAchado() {
  return (
    <div>
      <Kicker n="02" label="Achado central" />
      <h2 className="t-h2 mb-5 text-foreground">O pico de setembro não era degradação</h2>
      <div className="mb-3.5 grid gap-4 sm:grid-cols-3">
        <StatCard num="≈5×" cap="Salto no volume bruto" />
        <StatCard num="1.200→3.000" cap="Itens monitorados" />
        <StatCard num="0,97%" cap="Taxa real de violação" />
      </div>
      <DeckCard className="flex items-start gap-3.5">
        <IconBox icon={Lightbulb} />
        <div>
          <h4 className="mb-1 text-[15px] font-semibold text-foreground">
            Expansão de escopo, não degradação de infraestrutura
          </h4>
          <p className="t-body-sm text-muted-foreground">
            Os incidentes que entram no KPI ficaram estáveis durante todo o pico — o choque ficou
            invisível nas métricas oficiais. Não era um problema de infraestrutura pra corrigir: era
            um problema de leitura.
          </p>
        </div>
      </DeckCard>
    </div>
  );
}

function SlideObjetivo() {
  return (
    <div>
      <Kicker n="03" label="Objetivo do projeto" />
      <h2 className="t-h2 mb-3 text-foreground">De operação reativa a operação preditiva</h2>
      <p className="t-body-md mb-6 max-w-2xl text-muted-foreground">
        Desenvolver uma plataforma de AIOps preditivo que antecipe o volume de incidentes e o risco
        de violação de OLA, explique os fatores por trás de cada risco e comprove com dados o efeito
        de cada correção.
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {OBJETIVOS.map((o) => (
          <DeckCard key={o.titulo}>
            <IconBox icon={o.icon} />
            <h4 className="mb-1 mt-2.5 text-[14.5px] font-semibold text-foreground">{o.titulo}</h4>
            <p className="t-body-sm text-muted-foreground">{o.desc}</p>
          </DeckCard>
        ))}
      </div>
    </div>
  );
}

function SlideSolucao() {
  return (
    <div>
      <Kicker n="04" label="A solução" />
      <h2 className="t-h2 mb-6 text-foreground">Três movimentos, um ciclo fechado</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {SOLUCAO.map((s) => (
          <DeckCard key={s.titulo}>
            <h4 className="mb-2 text-[15px] font-semibold text-foreground">{s.titulo}</h4>
            <p className="t-body-sm text-muted-foreground">{s.desc}</p>
          </DeckCard>
        ))}
      </div>
    </div>
  );
}

function SlideImpacto() {
  return (
    <div>
      <Kicker label="O que muda" />
      <h2 className="t-h2 mb-2 text-foreground">Sem vs. com o Data Galaxy</h2>
      <p className="t-body-md mb-5 max-w-2xl text-muted-foreground">
        Cinco capacidades reais do produto, contra o que a operação faz hoje sem elas.
      </p>
      <div className="flex flex-col gap-2">
        {COMPARACOES.map((c) => (
          <div
            key={c.nome}
            className="dg-glass grid overflow-hidden rounded-2xl sm:grid-cols-[220px_1fr_1fr]"
          >
            <div className="flex items-center gap-2.5 border-b border-[color:var(--border-subtle)] p-3.5 text-xs font-semibold text-foreground sm:border-b-0 sm:border-r">
              <IconBox icon={c.icon} size={28} />
              {c.nome}
            </div>
            <div className="p-3.5 text-[11.5px] leading-snug text-muted-foreground">{c.sem}</div>
            <div className="border-t border-[color:var(--border-subtle)] bg-[linear-gradient(90deg,var(--brand-orange-soft),transparent_85%)] p-3.5 text-[11.5px] leading-snug text-foreground sm:border-t-0 sm:border-l">
              {c.com}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideResultados() {
  return (
    <div>
      <Kicker n="05" label="Resultados" />
      <h2 className="t-h2 mb-6 text-foreground">O que foi entregue</h2>

      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <StatCard num="122.543" cap="" sub="Incidentes no star schema, dez dimensões de análise" />
        <StatCard num="4" cap="" sub="Modelos versionados em MLflow" />
        <StatCard num="−68%" cap="" sub="Redução de incidentes no exemplo de correção validada" />
      </div>

      <DeckCard className="mb-3">
        <h4 className="mb-2.5 text-[15px] font-semibold text-foreground">
          Os 4 modelos em produção
        </h4>
        <div className="flex flex-col gap-1.5">
          {MODELOS.map((m) => (
            <ModelRow key={m.tag} tag={m.tag}>
              {m.texto}
            </ModelRow>
          ))}
        </div>
      </DeckCard>

      <div className="grid gap-3 sm:grid-cols-3">
        <DeckCard>
          <h4 className="mb-1.5 text-[14px] font-semibold text-foreground">Pipeline completo</h4>
          <p className="t-body-sm text-muted-foreground">
            Medallion no Databricks, do Bronze ao Gold.
          </p>
        </DeckCard>
        <DeckCard>
          <h4 className="mb-1.5 text-[14px] font-semibold text-foreground">Tempo real</h4>
          <p className="t-body-sm text-muted-foreground">
            Inferência contínua com PyFlink e Kafka.
          </p>
        </DeckCard>
        <DeckCard>
          <h4 className="mb-1.5 text-[14px] font-semibold text-foreground">Plataforma publicada</h4>
          <p className="t-body-sm text-muted-foreground">
            Navegável, sem cadastro, com dados reais.
          </p>
        </DeckCard>
      </div>
    </div>
  );
}

function SlideArquitetura() {
  return (
    <div>
      <Kicker n="06" label="Arquitetura" />
      <h2 className="t-h2 mb-1.5 text-foreground">Como o dado vira decisão</h2>
      <p className="t-body-md mb-4 max-w-2xl text-muted-foreground">
        Duas frentes que rodam separadas: lote pra treinar e consultar, streaming pra pontuar risco
        na hora.
      </p>
      <DeckCard className="p-2.5">
        <img
          src="/arquitetura-fluxo.png"
          alt="Diagrama da arquitetura: fluxo batch (ingestão, orquestração, processamento e consumo) e fluxo streaming (Kafka, Flink, model service e canais de notificação)"
          className="block max-h-[54vh] w-full rounded-xl bg-white object-contain"
        />
      </DeckCard>
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        <span className="dg-chip gap-2 text-[11.5px]">
          <Database className="h-3.5 w-3.5 text-primary" /> Batch — Databricks, Spark, MLflow
        </span>
        <span className="dg-chip gap-2 text-[11.5px]">
          <Zap className="h-3.5 w-3.5 text-primary" /> Streaming — Kafka, Flink, Twilio
        </span>
      </div>
    </div>
  );
}

function SlideEncerramento({ onEntrar }: { onEntrar: () => void }) {
  return (
    <div className="text-center">
      <div className="mb-4 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Encerramento
      </div>
      <h2 className="t-display-lg text-balance text-4xl font-bold text-foreground sm:text-5xl">
        Prever, priorizar com explicação
        <br />e comprovar o efeito.
      </h2>
      <p className="t-body-md mx-auto mt-5 mb-7 max-w-md text-muted-foreground">
        Pronto pra ver funcionando? Sem cadastro — escolha um perfil de demonstração.
      </p>
      <button
        type="button"
        onClick={onEntrar}
        className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-7 py-3.5 text-[14.5px] font-semibold text-primary-foreground"
      >
        Entrar na plataforma <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
