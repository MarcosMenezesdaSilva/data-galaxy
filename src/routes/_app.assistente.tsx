import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp, type Perfil } from "@/lib/store";
import { useIncidentes, useRiscos, useAlertas, useAcoes, usePrevisoes } from "@/lib/hooks";
import { responder, type Resposta } from "@/lib/assistente";
import { Bot, Send, Sparkles, AlertTriangle } from "lucide-react";

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

const QUICK_QS_POR_PERFIL: Record<string, string[]> = {
  gestor: [
    "O que preciso saber agora?",
    "Quais riscos críticos estão ativos?",
    "Como está o cumprimento de OLA?",
    "Qual a previsão de volume D+7?",
    "As correções estão sendo efetivas?",
    "O que tem na tela de Impacto?",
  ],
  tecnico: [
    "O que preciso saber agora?",
    "Quais riscos críticos estão ativos?",
    "Qual grupo está mais sobrecarregado?",
    "Tem alerta pendente?",
    "O que tem na tela de Gestão de Dados?",
  ],
  admin: [
    "O que preciso saber agora?",
    "Quais riscos críticos estão ativos?",
    "As correções estão sendo efetivas?",
    "O que tem na tela de Linhagem de Dados?",
    "O que tem na tela de Arquitetura e Roadmap?",
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

function AssistenteConversa({ perfil }: { perfil: Perfil | null }) {
  const incidentes = useIncidentes();
  const riscos = useRiscos();
  const alertas = useAlertas();
  const acoes = useAcoes();
  const previsoes = usePrevisoes();

  const quickQs = QUICK_QS_POR_PERFIL[perfil ?? "admin"] ?? QUICK_QS_POR_PERFIL.admin;

  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, isThinking]);

  function enviar(texto?: string) {
    const t = (texto ?? input).trim();
    if (!t || isThinking) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: t, ts: Date.now() }]);
    setIsThinking(true);
    const delay = 900 + Math.random() * 700;
    setTimeout(() => {
      const resposta = responder(t, { incidentes, riscos, alertas, acoes, previsoes }, perfil);
      setIsThinking(false);
      setMsgs((m) => [...m, { role: "assistant", resposta, isStreaming: true, ts: Date.now() }]);
    }, delay);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5 p-0 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Bot className="h-3.5 w-3.5" /> Assistente
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Assistente Data Galaxy
          </h1>
          <p className="text-sm text-muted-foreground">
            Pergunte sobre incidentes, riscos de OLA, alertas e previsões — as respostas vêm só dos
            dados carregados nesta base.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickQs.map((q) => (
            <button
              key={q}
              onClick={() => enviar(q)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {msgs.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-5 text-sm text-muted-foreground">
                Faça uma pergunta ou use uma sugestão acima. Toda resposta é calculada em tempo real
                sobre os incidentes, riscos, alertas, ações e previsões desta base.
              </CardContent>
            </Card>
          )}
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

        <div className="sticky bottom-3 mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") enviar();
            }}
            placeholder="Pergunte sobre riscos, OLA, alertas ou previsões..."
            className="flex-1 border-0 shadow-none focus-visible:ring-0"
          />
          <Button onClick={() => enviar()} size="sm" className="gap-1.5">
            <Send className="h-3.5 w-3.5" /> Enviar
          </Button>
        </div>
      </div>

      <aside className="space-y-3">
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Como funciona
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O assistente não usa um modelo de linguagem externo: ele interpreta a pergunta e
              calcula a resposta direto sobre os dados desta base (incidentes, riscos, alertas,
              ações e previsões). Se a pergunta não puder ser respondida com esses dados, ele diz
              isso em vez de inventar.
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-400/40 bg-amber-50/40 dark:bg-amber-950/10">
          <CardContent className="p-3 text-[11px] text-muted-foreground">
            <AlertTriangle className="mb-1 h-3 w-3 text-amber-600" /> Apoio à decisão — não
            substitui a análise do time operacional.
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-1.5">
          <Bot className="h-4 w-4 text-primary" />
          <div className="ml-1 flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-primary/60"
                style={{ animation: `dg-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <style>{`
            @keyframes dg-bounce {
              0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
              30% { transform: translateY(-6px); opacity: 1; }
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
