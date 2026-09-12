import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/store";
import { useRotasPermitidas } from "@/lib/usuarios";
import { rotaPermitida } from "@/lib/permissions";
import {
  useIncidentes,
  useRiscos,
  useAlertas,
  useAcoes,
  usePrevisoes,
  useArtigos,
} from "@/lib/hooks";
import { responder, type Resposta } from "@/lib/assistente";
import { perguntarIA, iaConfigurada } from "@/lib/assistente-ia";
import {
  Send,
  Sparkles,
  Sparkle,
  AlertTriangle,
  BarChart3,
  GitCompare,
  Info,
  ShieldAlert,
  Lightbulb,
  Clock,
  MessageSquare,
  Zap,
  ShieldCheck,
  Bell,
  TrendingUp,
  Database,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/_app/assistente")({
  head: () => ({ meta: [{ title: "Assistente — Data Galaxy" }] }),
  component: AssistentePage,
});

type Msg = {
  role: "user" | "assistant";
  text?: string;
  resposta?: Resposta;
  ts: number;
  isStreaming?: boolean;
};

// Chips de destaque do cabeçalho — só reforçam o que o restante da tela já
// prova (dados reais, IA com contexto, nunca inventa), não afirmam nada novo.
const CHIPS_DESTAQUE: { icon: LucideIcon; label: string }[] = [
  { icon: Clock, label: "Dados em tempo real" },
  { icon: MessageSquare, label: "Respostas com contexto" },
  { icon: Zap, label: "Mais produtividade" },
  { icon: ShieldCheck, label: "Nunca inventa dado" },
];

// Ações em destaque — cada uma dispara uma pergunta real, resolvida pelo
// mesmo motor (regras locais ou Claude) usado no resto do chat. Nenhuma
// promete algo que o produto não tem (sem gerador de relatório, sem SQL).
const ACOES_DESTAQUE: {
  icon: LucideIcon;
  label: string;
  desc: string;
  prompt: string;
  accent: string;
}[] = [
  {
    icon: BarChart3,
    label: "Entender dados da operação",
    desc: "Tire dúvidas sobre incidentes, previsões, riscos e alertas.",
    prompt: "O que preciso saber agora?",
    accent: "text-primary bg-primary/12",
  },
  {
    icon: GitCompare,
    label: "Analisar e comparar",
    desc: "Compare grupos, produtos e indicadores da operação.",
    prompt: "Qual grupo está mais sobrecarregado?",
    accent: "text-[color:var(--info)] bg-[color:var(--info)]/12",
  },
  {
    icon: Info,
    label: "Explicar uma tela",
    desc: "Entenda o que cada tela do painel mostra e pra que serve.",
    prompt: "O que tem na tela de Riscos de OLA?",
    accent: "text-[color:var(--warning)] bg-[color:var(--warning)]/12",
  },
  {
    icon: ShieldAlert,
    label: "Ver riscos críticos",
    desc: "Priorize os riscos de OLA com maior chance de violação.",
    prompt: "Quais riscos críticos estão ativos?",
    accent: "text-[color:var(--critical)] bg-[color:var(--critical)]/12",
  },
  {
    icon: Lightbulb,
    label: "Explorar insights",
    desc: "Receba um resumo do que mais precisa de atenção agora.",
    prompt: "As correções estão sendo efetivas?",
    accent: "text-[color:var(--violet)] bg-[color:var(--violet)]/12",
  },
];

// "Navegue por contexto" — atalhos pras telas mais consultadas a partir do
// Assistente. Filtrados por rotaPermitida antes de renderizar, então um
// perfil sem acesso a uma tela nunca vê o atalho pra ela.
const NAV_CONTEXTO: {
  icon: LucideIcon;
  to: string;
  label: string;
  desc: string;
  accent: string;
}[] = [
  {
    icon: AlertTriangle,
    to: "/incidentes",
    label: "Incidentes",
    desc: "Lista, filtros e linha do tempo",
    accent: "text-primary bg-primary/12",
  },
  {
    icon: TrendingUp,
    to: "/previsoes",
    label: "Previsões",
    desc: "Volume D+1/D+7 e histórico",
    accent: "text-[color:var(--warning)] bg-[color:var(--warning)]/12",
  },
  {
    icon: ShieldAlert,
    to: "/riscos-ola",
    label: "Riscos de OLA",
    desc: "Fila de risco e simulador",
    accent: "text-[color:var(--violet)] bg-[color:var(--violet)]/12",
  },
  {
    icon: Bell,
    to: "/alertas",
    label: "Alertas",
    desc: "Reconhecer e priorizar",
    accent: "text-[color:var(--info)] bg-[color:var(--info)]/12",
  },
  {
    icon: Database,
    to: "/dados",
    label: "Dados",
    desc: "Importação, qualidade e linhagem",
    accent: "text-[color:var(--success)] bg-[color:var(--success)]/12",
  },
];

const DICAS_ORBI: { icon: LucideIcon; label: string; desc: string }[] = [
  {
    icon: Zap,
    label: "Seja específico",
    desc: "Inclua período, produto ou grupo pra respostas mais precisas.",
  },
  {
    icon: Database,
    label: "Use o contexto",
    desc: "Em cada tela, a Orbi flutuante já parte dos dados daquela página.",
  },
  {
    icon: ShieldCheck,
    label: "Valide informações",
    desc: "As respostas se baseiam nos dados reais — confira o que for crítico.",
  },
];

const QUICK_QS_POR_PERFIL: Record<string, string[]> = {
  gestor: [
    "O que preciso saber agora?",
    "Quais riscos críticos estão ativos?",
    "Como está o cumprimento de OLA?",
    "Qual a previsão de volume D+7?",
    "As correções estão sendo efetivas?",
  ],
  tecnico: [
    "O que preciso saber agora?",
    "Quais riscos críticos estão ativos?",
    "Qual grupo está mais sobrecarregado?",
    "Tem alerta pendente?",
    "As correções estão sendo efetivas?",
  ],
  admin: [
    "O que preciso saber agora?",
    "Quais riscos críticos estão ativos?",
    "As correções estão sendo efetivas?",
    "O que tem na tela de Dados?",
  ],
};

function AssistentePage() {
  const { perfil } = useApp();
  // Cada perfil é uma pessoa diferente conversando. `key` força o React a
  // desmontar e montar uma instância nova de AssistenteConversa a cada troca
  // de perfil — isso zera TODO o estado local (mensagens, input, timers em
  // andamento) de uma vez, sem depender de lembrar de resetar cada useState
  // manualmente sempre que alguém mexer neste componente no futuro.
  return <AssistenteConversa key={perfil ?? "sem-perfil"} perfil={perfil} />;
}

function AssistenteConversa({ perfil }: { perfil: string | null }) {
  const navigate = useNavigate();
  const incidentes = useIncidentes();
  const riscos = useRiscos();
  const alertas = useAlertas();
  const acoes = useAcoes();
  const previsoes = usePrevisoes();
  const artigos = useArtigos();
  const rotasPermitidas = useRotasPermitidas(perfil);
  const [iaDisponivel, setIaDisponivel] = useState<boolean | null>(null);
  useEffect(() => {
    iaConfigurada().then(setIaDisponivel);
  }, []);

  const quickQs = QUICK_QS_POR_PERFIL[perfil ?? "admin"] ?? QUICK_QS_POR_PERFIL.admin;
  const navContexto = NAV_CONTEXTO.filter((item) => rotaPermitida(rotasPermitidas, item.to));

  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, isThinking]);

  const dados = { incidentes, riscos, alertas, acoes, previsoes };

  async function enviar(texto?: string) {
    const t = (texto ?? input).trim();
    if (!t || isThinking) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: t, ts: Date.now() }]);
    setIsThinking(true);

    // Efeito "pensando" mínimo mesmo quando a IA responde rápido — reforça
    // que algo está processando em vez de trocar de estado instantaneamente.
    const inicio = Date.now();
    const atrasoMinimo = 900 + Math.random() * 700;

    let resposta: Resposta;
    if (iaDisponivel) {
      const resultado = await perguntarIA(t, dados, artigos);
      if (resultado.ok) {
        resposta = {
          intencao: "ia",
          resumo: resultado.resposta,
          detalhe: resultado.artigosUsados.length
            ? `Fontes consultadas: ${resultado.artigosUsados.map((a) => `"${a}"`).join(", ")}.`
            : undefined,
          numeros: [],
          fonte: "ia",
        };
      } else {
        // IA falhou (sem rede, key inválida, etc.) — cai pro motor de regras
        // local em vez de deixar a conversa travada.
        resposta = responder(t, dados, rotasPermitidas);
      }
    } else {
      resposta = responder(t, dados, rotasPermitidas);
    }

    const faltam = atrasoMinimo - (Date.now() - inicio);
    setTimeout(
      () => {
        setIsThinking(false);
        setMsgs((m) => [...m, { role: "assistant", resposta, isStreaming: true, ts: Date.now() }]);
      },
      Math.max(0, faltam),
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-0">
      {/* Hero — mascote, identidade e chips de destaque */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div
          className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-[color:var(--border-brand)] sm:h-40 sm:w-40"
          style={{ boxShadow: "0 0 60px var(--brand-orange-glow)" }}
        >
          <img
            src="/orbi-mascote.png"
            alt="Mascote da Orbi"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <span className="mb-2 inline-block rounded-full border border-[color:var(--border-strong)] bg-[color:var(--brand-orange-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Beta
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Orbi</h1>
          <div className="mt-0.5 text-sm font-medium text-muted-foreground">
            Assistente Data Galaxy
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Pergunte sobre incidentes, riscos de OLA, alertas e previsões — as respostas vêm dos
            dados reais carregados nesta base.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CHIPS_DESTAQUE.map((c) => (
              <span
                key={c.label}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground"
              >
                <c.icon className="h-3.5 w-3.5 text-primary" /> {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {msgs.length === 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Como posso te ajudar hoje?</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ACOES_DESTAQUE.map((a) => (
              <button
                key={a.label}
                onClick={() => enviar(a.prompt)}
                className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-[color:var(--border-strong)] hover:bg-muted/40"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${a.accent}`}
                >
                  <a.icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex items-center justify-between gap-2 text-sm font-medium text-foreground">
                  {a.label}
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{a.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Campo de pergunta — fica na mesma posição sempre, com ou sem conversa em andamento */}
      <div>
        <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--border-strong)] bg-card p-2 shadow-sm">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") enviar();
            }}
            placeholder="Pergunte algo para o Orbi..."
            className="flex-1 border-0 shadow-none focus-visible:ring-0"
          />
          <Button onClick={() => enviar()} size="sm" className="gap-1.5">
            <Send className="h-3.5 w-3.5" /> Enviar
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
          <AlertTriangle className="h-3 w-3 shrink-0" /> O Orbi pode cometer erros. Sempre confira
          as informações importantes.
        </div>
      </div>

      {msgs.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <PainelInfo icon={MessageSquare} titulo="Exemplos de perguntas">
            <div className="space-y-0.5">
              {quickQs.map((q) => (
                <button
                  key={q}
                  onClick={() => enviar(q)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-xs text-foreground/90 hover:bg-muted"
                >
                  {q}
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </PainelInfo>

          <PainelInfo icon={GitCompare} titulo="Navegue por contexto">
            <p className="mb-2 text-[11px] text-muted-foreground">
              A Orbi flutuante entende a tela em que você está. Acesse rapidamente:
            </p>
            <div className="space-y-0.5">
              {navContexto.map((item) => (
                <button
                  key={item.to}
                  onClick={() => navigate({ to: item.to })}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${item.accent}`}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground">{item.label}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </PainelInfo>

          <PainelInfo icon={Lightbulb} titulo="Dicas do Orbi">
            <div className="space-y-3">
              {DICAS_ORBI.map((d) => (
                <div key={d.label} className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
                    <d.icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-foreground">{d.label}</div>
                    <div className="text-[11px] leading-relaxed text-muted-foreground">
                      {d.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PainelInfo>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0 space-y-4">
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {m.text}
                  </div>
                </div>
              ) : (
                <RespostaCard key={i} r={m.resposta!} isStreaming={m.isStreaming} />
              ),
            )}
            {isThinking && <ThinkingBubble />}
            <div ref={endRef} />
          </div>

          {/* Coluna compacta — as ações/exemplos/contexto continuam a um
              clique de distância durante a conversa, só que reduzidos a
              ícone + rótulo (sem a descrição longa dos cards grandes). */}
          <aside className="space-y-3 lg:sticky lg:top-6 lg:h-fit">
            <PainelCompacto titulo="Ações rápidas">
              {ACOES_DESTAQUE.map((a) => (
                <button
                  key={a.label}
                  onClick={() => enviar(a.prompt)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-foreground/90 hover:bg-muted"
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] ${a.accent}`}
                  >
                    <a.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate">{a.label}</span>
                </button>
              ))}
            </PainelCompacto>

            <PainelCompacto titulo="Exemplos">
              {quickQs.map((q) => (
                <button
                  key={q}
                  onClick={() => enviar(q)}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-foreground/90 hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </PainelCompacto>

            {navContexto.length > 0 && (
              <PainelCompacto titulo="Navegue">
                {navContexto.map((item) => (
                  <button
                    key={item.to}
                    onClick={() => navigate({ to: item.to })}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-muted"
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] ${item.accent}`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="truncate text-foreground/90">{item.label}</span>
                  </button>
                ))}
              </PainelCompacto>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function PainelInfo({
  icon: Icon,
  titulo,
  children,
}: {
  icon: LucideIcon;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" /> {titulo}
      </div>
      {children}
    </Card>
  );
}

// Versão reduzida do PainelInfo pra coluna lateral durante a conversa — sem
// descrição longa, só ícone + rótulo, pra caber num espaço bem mais estreito.
function PainelCompacto({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card className="p-3">
      <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </div>
      <div className="space-y-0.5">{children}</div>
    </Card>
  );
}

// Troquei os 3 pontinhos clássicos por um sparkle girando/pulsando — uma
// homenagem discreta ao Claude, que é quem de fato responde aqui quando a
// IA está configurada.
function ThinkingBubble() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2.5">
          <Sparkle
            className="h-4 w-4 text-primary"
            style={{ animation: "dg-thinking-spin 1.6s ease-in-out infinite" }}
            fill="currentColor"
          />
          <span className="text-sm text-muted-foreground">Pensando...</span>
          <style>{`
            @keyframes dg-thinking-spin {
              0% { transform: rotate(0deg) scale(0.85); opacity: 0.6; }
              50% { transform: rotate(180deg) scale(1.15); opacity: 1; }
              100% { transform: rotate(360deg) scale(0.85); opacity: 0.6; }
            }
          `}</style>
        </div>
      </CardContent>
    </Card>
  );
}

type Campo = "resumo" | "detalhe" | "recomendacao";
type StreamState = {
  fase: Campo | "numeros" | "done";
  resumo: string;
  detalhe: string;
  recomendacao: string;
};
const ORDEM: StreamState["fase"][] = ["resumo", "detalhe", "recomendacao", "numeros", "done"];

function RespostaCard({ r, isStreaming }: { r: Resposta; isStreaming?: boolean }) {
  const VELOCIDADE = 22;
  const PAUSA = 350;

  const estadoFinal: StreamState = {
    fase: "done",
    resumo: r.resumo,
    detalhe: r.detalhe ?? "",
    recomendacao: r.recomendacao ?? "",
  };

  const [stream, setStream] = useState<StreamState>(
    isStreaming ? { fase: "resumo", resumo: "", detalhe: "", recomendacao: "" } : estadoFinal,
  );

  useEffect(() => {
    if (!isStreaming) {
      setStream(estadoFinal);
      return;
    }
    setStream({ fase: "resumo", resumo: "", detalhe: "", recomendacao: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r]);

  useEffect(() => {
    if (!isStreaming) return;
    if (stream.fase === "numeros" || stream.fase === "done") return;

    const cfgMap: Partial<
      Record<Campo, { alvo: string; campo: Campo; proxima: StreamState["fase"] }>
    > = {
      resumo: {
        alvo: r.resumo,
        campo: "resumo",
        proxima: r.detalhe ? "detalhe" : r.recomendacao ? "recomendacao" : "numeros",
      },
      detalhe: {
        alvo: r.detalhe ?? "",
        campo: "detalhe",
        proxima: r.recomendacao ? "recomendacao" : "numeros",
      },
      recomendacao: { alvo: r.recomendacao ?? "", campo: "recomendacao", proxima: "numeros" },
    };
    const cfg = cfgMap[stream.fase as Campo];
    if (!cfg) return;

    const atual = stream[cfg.campo].length;
    if (atual >= cfg.alvo.length) {
      const t = setTimeout(() => setStream((s) => ({ ...s, fase: cfg.proxima })), PAUSA);
      return () => clearTimeout(t);
    }

    const interval = setInterval(() => {
      setStream((s) => {
        const cur = s[cfg.campo];
        if (cur.length >= cfg.alvo.length) {
          clearInterval(interval);
          return s;
        }
        return { ...s, [cfg.campo]: cfg.alvo.slice(0, cur.length + 1) };
      });
    }, VELOCIDADE);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, stream.fase, stream.resumo, stream.detalhe, stream.recomendacao]);

  useEffect(() => {
    if (!isStreaming || stream.fase !== "numeros") return;
    const t = setTimeout(() => setStream((s) => ({ ...s, fase: "done" })), 500);
    return () => clearTimeout(t);
  }, [isStreaming, stream.fase]);

  const faseAtualIdx = ORDEM.indexOf(stream.fase);
  const mostrarNumeros = !isStreaming || stream.fase === "numeros" || stream.fase === "done";

  const secoes: { texto: string; campo: Campo }[] = [
    { texto: r.resumo, campo: "resumo" },
    ...(r.detalhe ? [{ texto: r.detalhe, campo: "detalhe" as Campo }] : []),
    ...(r.recomendacao ? [{ texto: r.recomendacao, campo: "recomendacao" as Campo }] : []),
  ];

  return (
    <Card>
      <CardContent className="space-y-3 p-5 text-sm">
        {r.fonte === "ia" && (
          <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-primary">
            <Sparkles className="h-3 w-3" /> Respondido com Claude
          </div>
        )}
        {secoes.map((s) => {
          const idx = ORDEM.indexOf(s.campo);
          const ativa = isStreaming && stream.fase === s.campo;
          const futura = isStreaming && faseAtualIdx < idx;
          if (futura) return null;
          const texto = ativa ? stream[s.campo] : s.texto;
          return (
            <p key={s.campo} className="leading-relaxed text-foreground/90">
              {texto}
              {ativa && <span className="animate-pulse">▋</span>}
            </p>
          );
        })}

        {mostrarNumeros && r.numeros.length > 0 && (
          <div
            className={
              "flex flex-wrap gap-2 pt-1 " +
              (isStreaming && stream.fase === "numeros" ? "animate-in fade-in duration-500" : "")
            }
          >
            {r.numeros.map((n, i) => (
              <span
                key={i}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                <b className="text-foreground">{n.valor}</b> {n.label}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
