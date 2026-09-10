import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useArtigos } from "@/lib/hooks";
import { fmtDate } from "@/lib/format";
import { db } from "@/lib/db";
import type { Artigo } from "@/lib/types";
import { Search, Star, Plus, BookOpen, Sparkles, User, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/conhecimento")({
  head: () => ({ meta: [{ title: "Base de Conhecimento — Data Galaxy" }] }),
  component: ConhecimentoPage,
});

function ConhecimentoPage() {
  const artigos = useArtigos();
  const [q, setQ] = useState("");
  const [aberto, setAberto] = useState<Artigo | null>(null);

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

      <Card className="p-6">
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

      <Card className="p-6 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <div className="text-sm font-semibold">Documentação oficial</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Estes artigos vêm do Dicionário de Dados oficial da Locaweb — regras de KPI, SLA por
              prioridade e definição de cada campo, não conteúdo sintético.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((a) => (
          <Card
            key={a.id_artigo}
            onClick={() => setAberto(a)}
            className="p-4 space-y-2 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="rounded-md bg-primary/10 text-primary p-1.5">
                <BookOpen className="h-4 w-4" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  favoritar(a.id!, a.favorito);
                }}
              >
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
            <p className="text-xs text-foreground/80 line-clamp-2">{a.solucao}</p>
            <div className="flex items-center justify-between pt-2 border-t border-border text-[11px] text-muted-foreground">
              <span>{a.autor}</span>
              <span>{fmtDate(a.data_criacao)}</span>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!aberto} onOpenChange={(open) => !open && setAberto(null)}>
        <DialogContent className="sm:max-w-lg">
          {aberto && (
            <>
              <DialogHeader>
                <DialogTitle>{aberto.titulo}</DialogTitle>
                <DialogDescription asChild>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {aberto.categoria}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {aberto.produto}
                    </Badge>
                    {aberto.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Causa raiz
                  </div>
                  <p className="mt-0.5">{aberto.causa_raiz}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Conteúdo
                  </div>
                  <p className="mt-0.5 leading-relaxed">{aberto.solucao}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {aberto.autor}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {fmtDate(aberto.data_criacao)}
                </span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
