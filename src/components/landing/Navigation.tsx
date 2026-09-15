import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sun, Moon } from "lucide-react";

import { BrandWordmark } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Âncoras da narrativa: o que é → o que entrega → como é construído.
 *
 * Os ids seguem em inglês porque são a âncora pública da URL (#what-is já
 * pode estar em link compartilhado); só os rótulos mudam.
 */
const SECOES = [
  { id: "what-is", label: "O que é" },
  { id: "what-we-provide", label: "O que oferecemos" },
  { id: "impacto", label: "O que muda" },
  { id: "dev-stack", label: "Dev Stack" },
];

const IDS = SECOES.map((s) => s.id);

/**
 * Qual seção o leitor está lendo, para acender o rótulo no menu.
 *
 * A faixa de observação é estreita e fica no terço superior da viewport: a
 * seção ativa é a que o leitor está começando a ler, não a que ocupa mais
 * pixels — com seções de altura muito diferente, "maior área visível" acende
 * o item errado durante metade do scroll.
 */
function useSecaoAtiva() {
  const [ativa, setAtiva] = useState<string | null>(null);

  useEffect(() => {
    const alvos = IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (alvos.length === 0) return;

    const observer = new IntersectionObserver(
      (entradas) => {
        const primeira = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (primeira) setAtiva(primeira.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    alvos.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return ativa;
}

export function Navigation() {
  const navigate = useNavigate();
  const ativa = useSecaoAtiva();
  const { theme, toggleTheme } = useApp();

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border-subtle)] bg-background/80 backdrop-blur-xl">
      <nav
        aria-label="Navegação principal"
        className="dg-shell relative flex h-[70px] items-center justify-between gap-6"
      >
        <BrandWordmark />

        {/* Âncoras centradas na viewport, não no espaço que sobra: com
            justify-between elas seguiriam a largura da logo e do botão, que
            são diferentes, e o menu ficaria só aproximadamente no meio.
            Somem no mobile, onde a narrativa é o próprio scroll. */}
        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex lg:gap-10">
          {SECOES.map((s) => {
            const atual = ativa === s.id;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={atual ? "true" : undefined}
                  className={cn(
                    "t-body-sm relative flex h-[70px] items-center px-1 transition-colors duration-[var(--motion-fast)]",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-orange)]",
                    atual ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                  {/* A linha fica na base da navbar, com a largura do rótulo.
                      aria-current acima já comunica o estado — o laranja não
                      é o único sinal. */}
                  {atual && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-[6px] h-[2px] rounded-pill bg-primary"
                    />
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button size="sm" onClick={() => navigate({ to: "/login" })}>
            Entrar <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </nav>
    </header>
  );
}
