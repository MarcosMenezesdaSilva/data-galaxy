import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { BrandWordmark } from "@/components/Brand";
import { Button } from "@/components/ui/button";

/** Âncoras da narrativa: o que é → o que entrega → como é construído. */
const SECOES = [
  { href: "#what-is", label: "What is" },
  { href: "#what-we-provide", label: "What we provide" },
  { href: "#dev-stack", label: "Dev Stack" },
];

export function Navigation() {
  const navigate = useNavigate();

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
          {SECOES.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                className="rounded-pill px-2 py-2 text-[15px] text-muted-foreground transition-colors duration-[var(--motion-fast)] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-orange)]"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>

        <Button size="sm" onClick={() => navigate({ to: "/login" })}>
          Entrar <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </nav>
    </header>
  );
}
