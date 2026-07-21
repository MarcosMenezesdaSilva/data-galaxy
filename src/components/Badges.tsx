import { cn } from "@/lib/utils";
import type {
  Prioridade,
  Severidade,
  FaixaRisco,
  ClassificacaoAcao,
  StatusAlerta,
} from "@/lib/types";

const base = "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium";

export function PrioridadeBadge({ p }: { p: Prioridade }) {
  const map: Record<Prioridade, string> = {
    P1: "bg-[color:var(--critical)]/10 text-[color:var(--critical)] border-[color:var(--critical)]/30",
    P2: "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/30",
    P3: "bg-[color:var(--info)]/10 text-[color:var(--info)] border-[color:var(--info)]/30",
    P4: "bg-muted text-muted-foreground border-border",
    P5: "bg-muted text-muted-foreground border-border opacity-70",
  };
  return <span className={cn(base, map[p])}>{p}</span>;
}

export function SeveridadeBadge({ s }: { s: Severidade }) {
  const map: Record<Severidade, string> = {
    Crítico:
      "bg-[color:var(--critical)]/10 text-[color:var(--critical)] border-[color:var(--critical)]/30",
    Alto: "bg-[color:var(--accent-orange)]/10 text-[color:var(--accent-orange)] border-[color:var(--accent-orange)]/30",
    Atenção:
      "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/30",
    Informativo: "bg-[color:var(--info)]/10 text-[color:var(--info)] border-[color:var(--info)]/30",
  };
  return <span className={cn(base, map[s])}>{s}</span>;
}

export function RiscoBadge({ f }: { f: FaixaRisco }) {
  const map: Record<FaixaRisco, string> = {
    Crítico:
      "bg-[color:var(--critical)]/10 text-[color:var(--critical)] border-[color:var(--critical)]/30",
    Alto: "bg-[color:var(--accent-orange)]/10 text-[color:var(--accent-orange)] border-[color:var(--accent-orange)]/30",
    Médio:
      "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/30",
    Baixo:
      "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/30",
  };
  return <span className={cn(base, map[f])}>{f}</span>;
}

export function ClassifBadge({ c }: { c: ClassificacaoAcao }) {
  const map: Record<ClassificacaoAcao, string> = {
    Efetiva:
      "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/30",
    Paliativa:
      "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/30",
    Inconclusiva: "bg-muted text-muted-foreground border-border",
    Pendente: "bg-[color:var(--info)]/10 text-[color:var(--info)] border-[color:var(--info)]/30",
  };
  return <span className={cn(base, map[c])}>{c}</span>;
}

export function StatusAlertaBadge({ s }: { s: StatusAlerta }) {
  const map: Record<StatusAlerta, string> = {
    Novo: "bg-[color:var(--critical)]/10 text-[color:var(--critical)] border-[color:var(--critical)]/30",
    Reconhecido: "bg-[color:var(--info)]/10 text-[color:var(--info)] border-[color:var(--info)]/30",
    "Em tratamento":
      "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/30",
    Finalizado:
      "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/30",
    Cancelado: "bg-muted text-muted-foreground border-border",
  };
  return <span className={cn(base, map[s])}>{s}</span>;
}

export function OlaBadge({ dentro }: { dentro: boolean }) {
  return (
    <span
      className={cn(
        base,
        dentro
          ? "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/30"
          : "bg-[color:var(--critical)]/10 text-[color:var(--critical)] border-[color:var(--critical)]/30",
      )}
    >
      {dentro ? "Dentro" : "Fora"}
    </span>
  );
}

export function ModoBadge({ modo, count }: { modo: "demo" | "importado"; count?: number }) {
  const nf = new Intl.NumberFormat("pt-BR");
  const texto =
    modo === "demo"
      ? "Modo demonstração"
      : `Dados importados${count != null ? ` — ${nf.format(count)} registros` : ""}`;
  return (
    <span
      className={cn(
        base,
        modo === "demo"
          ? "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/30"
          : "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/30",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {texto}
    </span>
  );
}
