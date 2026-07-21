import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useArtigos } from "@/lib/hooks";
import { fmtDate } from "@/lib/format";
import { db } from "@/lib/db";
import { Search, Star, Plus, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/conhecimento")({
  head: () => ({ meta: [{ title: "Base de Conhecimento — Data Galaxy" }] }),
  component: ConhecimentoPage,
});

function ConhecimentoPage() {
  const artigos = useArtigos();
  const [q, setQ] = useState("");

  const filtrados = useMemo(
    () =>
      artigos.filter(
        (a) =>
          !q ||
          `${a.titulo} ${a.produto} ${a.categoria} ${a.causa_raiz}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [artigos, q],
  );

  async function favoritar(id: number, atual: boolean) {
    await db.artigos.update(id, { favorito: !atual });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Base de Conhecimento"
        subtitle="Runbooks, postmortems e recomendações"
        actions={
          <Button onClick={() => toast.info("Editor de artigo — em construção")}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo artigo
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artigos..."
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <div className="text-sm font-semibold">Recomendações do histórico</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sugestões baseadas em incidentes recentes: <b>Timeout em APIs — checklist</b>,{" "}
              <b>Diagnóstico de I/O elevado em disco</b>, <b>Runbook: Reinício seguro do Apache</b>.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((a) => (
          <Card
            key={a.id_artigo}
            className="p-4 space-y-2 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="rounded-md bg-primary/10 text-primary p-1.5">
                <BookOpen className="h-4 w-4" />
              </div>
              <button onClick={() => favoritar(a.id!, a.favorito)}>
                <Star
                  className={`h-4 w-4 ${a.favorito ? "fill-[color:var(--warning)] text-[color:var(--warning)]" : "text-muted-foreground"}`}
                />
              </button>
            </div>
            <div className="text-sm font-semibold leading-tight">{a.titulo}</div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-[10px]">
                {a.categoria}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {a.produto}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Causa raiz: {a.causa_raiz}</p>
            <div className="flex items-center justify-between pt-2 border-t border-border text-[11px] text-muted-foreground">
              <span>{a.autor}</span>
              <span>{fmtDate(a.data_criacao)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
