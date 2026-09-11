// Orbi — o agente flutuante presente em cada tela do painel (exceto o
// Assistente geral, onde já existe um chat inteiro). Mesmo motor de resposta
// do Assistente (regras locais + Claude quando configurado), só que
// contextualizado pela tela atual: a persona muda ("Orbi, focada na
// tela X"), mas o grounding nos dados reais é o mesmo — nunca inventa nada.
// (Nomes internos do componente/arquivo continuam "Orbita*" — só o nome
// exibido pro usuário virou "Orbi".)
//
// O botão fica sempre montado (barato), mas o painel — com suas queries de
// Dexie (inclusive `incidentes`, ~120 mil linhas) — só é montado quando
// aberto, pra não pagar esse custo em toda tela o tempo todo.
import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { X, Send, Sparkle, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { useRotasPermitidas, useUsuarioAtual } from "@/lib/usuarios";
import { TELAS, type Tela } from "@/lib/telas";
import { contextoDaTela } from "@/lib/orbi-contexto";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function telaAtual(pathname: string): Tela | undefined {
  return TELAS.find((t) => pathname === t.rota || pathname.startsWith(`${t.rota}/`));
}

export function OrbitaIA() {
  const { perfil } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  // Sem perfil logado (tela de login) ou dentro do próprio Assistente geral
  // (já é um chat inteiro, duplicar aqui só confunde) — não mostra nada.
  if (!perfil || pathname === "/assistente") return null;

  const tela = telaAtual(pathname);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir Orbi"
          className={cn(
            "fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full pl-2.5 pr-4 py-2.5",
            "bg-card border border-[color:var(--border-brand)] shadow-lg",
            "transition-transform duration-[var(--motion-fast)] hover:scale-105 active:scale-95",
          )}
        >
          <OrbitaIcon />
          <span className="text-sm font-semibold text-foreground">Orbi</span>
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </button>
      )}

      {open && (
        <OrbitaPainel
          key={tela?.rota ?? "geral"}
          tela={tela}
          perfil={perfil}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// Núcleo + um único ponto orbitando — versão compacta do visual da landing
// (GalaxyVisual), reaproveitando os mesmos tokens de cor e a keyframe
// `dg-orbit` já definida globalmente em styles.css.
function OrbitaIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" style={{ width: size, height: size }} aria-hidden="true">
      <circle
        cx="20"
        cy="20"
        r="14"
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      <g style={{ animation: "dg-orbit 6s linear infinite", transformOrigin: "20px 20px" }}>
        <circle cx="34" cy="20" r="2.5" fill="var(--brand-orange)" />
      </g>
      <circle cx="20" cy="20" r="7" fill="var(--brand-orange)" />
      <circle cx="20" cy="20" r="2.5" fill="#ffffff" opacity="0.92" />
    </svg>
  );
}

type Msg = { role: "user" | "assistant"; text?: string; resposta?: Resposta; ts: number };

function OrbitaPainel({
  tela,
  perfil,
  onClose,
}: {
  tela: Tela | undefined;
  perfil: string;
  onClose: () => void;
}) {
  const incidentes = useIncidentes();
  const riscos = useRiscos();
  const alertas = useAlertas();
  const acoes = useAcoes();
  const previsoes = usePrevisoes();
  const artigos = useArtigos();
  const rotasPermitidas = useRotasPermitidas(perfil);
  const usuario = useUsuarioAtual(perfil);

  const [iaDisponivel, setIaDisponivel] = useState<boolean | null>(null);
  useEffect(() => {
    iaConfigurada().then(setIaDisponivel);
  }, []);

  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, isThinking]);

  const dados = { incidentes, riscos, alertas, acoes, previsoes };
  const ctx = contextoDaTela(tela?.rota ?? "", tela);
  const primeiroNome = (usuario?.nome ?? "").split(" ")[0];

  async function enviar(texto?: string) {
    const t = (texto ?? input).trim();
    if (!t || isThinking) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: t, ts: Date.now() }]);
    setIsThinking(true);

    let resposta: Resposta;
    if (iaDisponivel) {
      const resultado = await perguntarIA(
        t,
        dados,
        artigos,
        tela ? { nome: tela.nome, descricao: tela.descricao } : undefined,
      );
      resposta = resultado.ok
        ? {
            intencao: "ia",
            resumo: resultado.resposta,
            detalhe: resultado.artigosUsados.length
              ? `Fontes: ${resultado.artigosUsados.map((a) => `"${a}"`).join(", ")}.`
              : undefined,
            numeros: [],
            fonte: "ia",
          }
        : responder(t, dados, rotasPermitidas);
    } else {
      resposta = responder(t, dados, rotasPermitidas);
    }

    setIsThinking(false);
    setMsgs((m) => [...m, { role: "assistant", resposta, ts: Date.now() }]);
  }

  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-40 flex h-[min(720px,calc(100vh-2.5rem))] w-[min(400px,calc(100vw-2.5rem))]",
        "flex-col overflow-hidden rounded-2xl border border-[color:var(--border-brand)] bg-card shadow-2xl",
        "animate-in fade-in slide-in-from-bottom-4 duration-200",
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
          <OrbitaIcon size={32} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">Orbi AI</span>
            <span className="rounded-full bg-primary/15 px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wide text-primary">
              Beta
            </span>
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            Seu assistente de dados e operações
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {msgs.length === 0 ? (
          <>
            <div className="flex gap-3 rounded-2xl border border-border bg-background/60 p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12">
                <OrbitaIcon size={22} />
              </div>
              <p className="text-xs leading-relaxed text-foreground/90">
                {primeiroNome ? `Olá, ${primeiroNome}! ` : "Olá! "}
                {tela
                  ? `Estou analisando a tela de ${tela.nome} e posso ajudar a entender os dados, gerar insights e executar análises.`
                  : "Posso ajudar a entender os dados carregados no Data Galaxy."}
              </p>
            </div>

            <div>
              <div className="mb-2 t-micro uppercase text-muted-foreground">Contexto atual</div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/12 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium">{tela ? tela.nome : "Data Galaxy"}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{ctx.contexto}</div>
                </div>
              </div>
            </div>

            {ctx.acoes.length > 0 && (
              <div>
                <div className="mb-2 t-micro uppercase text-muted-foreground">
                  O que você pode fazer aqui
                </div>
                <div className="space-y-1.5">
                  {ctx.acoes.map((a) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.label}
                        onClick={() => enviar(a.prompt)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/60 p-2.5 text-left transition-colors hover:bg-muted"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--info)]/12 text-[color:var(--info)]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium">{a.label}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{a.desc}</div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {ctx.sugestoes.length > 0 && (
              <div>
                <div className="mb-2 t-micro uppercase text-muted-foreground">
                  Sugestões rápidas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ctx.sugestoes.map((s) => (
                    <button
                      key={s}
                      onClick={() => enviar(s)}
                      className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-left text-[11px] hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-xs text-primary-foreground">
                  {m.text}
                </div>
              </div>
            ) : (
              <div
                key={i}
                className="space-y-1.5 rounded-2xl border border-border bg-background/60 p-3"
              >
                {m.resposta!.fonte === "ia" && (
                  <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-primary">
                    <Sparkles className="h-2.5 w-2.5" /> Claude
                  </div>
                )}
                <p className="text-xs leading-relaxed text-foreground/90">{m.resposta!.resumo}</p>
                {m.resposta!.detalhe && (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {m.resposta!.detalhe}
                  </p>
                )}
                {m.resposta!.recomendacao && (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {m.resposta!.recomendacao}
                  </p>
                )}
              </div>
            ),
          )
        )}
        {isThinking && (
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/60 p-3">
            <Sparkle
              className="h-3.5 w-3.5 text-primary"
              style={{ animation: "dg-thinking-spin 1.6s ease-in-out infinite" }}
              fill="currentColor"
            />
            <span className="text-xs text-muted-foreground">Pensando...</span>
            <style>{`
              @keyframes dg-thinking-spin {
                0% { transform: rotate(0deg) scale(0.85); opacity: 0.6; }
                50% { transform: rotate(180deg) scale(1.15); opacity: 1; }
                100% { transform: rotate(360deg) scale(0.85); opacity: 0.6; }
              }
            `}</style>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-2.5">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") enviar();
            }}
            placeholder="Digite sua pergunta aqui..."
            className="h-9 flex-1 border-0 text-xs shadow-none focus-visible:ring-0"
          />
          <Button onClick={() => enviar()} size="icon" className="h-8 w-8 shrink-0">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="mt-1.5 px-0.5 text-[10px] text-muted-foreground">
          O Orbi pode cometer erros. Sempre confira as informações.
        </p>
      </div>
    </div>
  );
}
