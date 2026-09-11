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
        className="mx-auto flex max-w-6xl h-[70px] items-center justify-between gap-6 px-6 md:px-10"
      >
        <BrandWordmark />

        {/* As âncoras somem no mobile: lá a narrativa é o próprio scroll. */}
        <ul className="hidden items-center gap-1 md:flex">
          {SECOES.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                className="t-body-sm rounded-pill px-3 py-2 text-muted-foreground transition-colors duration-[var(--motion-fast)] hover:bg-[color:var(--surface-02)] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-orange)]"
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
