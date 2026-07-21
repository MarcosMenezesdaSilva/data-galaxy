import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PrioridadeBadge, OlaBadge } from "@/components/Badges";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Download, Filter, Eye, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmtDateTime, fmtDuration, fmtNumber } from "@/lib/format";
import { PRODUTOS, GRUPOS } from "@/lib/demo-data";
import Papa from "papaparse";
import type { Incidente } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/incidentes")({
  head: () => ({ meta: [{ title: "Incidentes — Data Galaxy" }] }),
  component: IncidentesPage,
});

function IncidentesPage() {
  const incidentesRaw = useLiveQuery(() => db.incidentes.toArray(), []);
  const incidentes = useMemo(() => incidentesRaw ?? [], [incidentesRaw]);
  const carregando = incidentesRaw === undefined;
  const [q, setQ] = useState("");
  const [produto, setProduto] = useState("todos");
  const [prio, setPrio] = useState("todas");
  const [grupo, setGrupo] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [origem, setOrigem] = useState("todos");
  const [ola, setOla] = useState("todos");
  const [sel, setSel] = useState<Incidente | null>(null);
  const [page, setPage] = useState(0);
  const perPage = 20;

  const filtrados = useMemo(() => {
    return incidentes.filter((i) => {
      if (
        q &&
        !`${i.numero_incidente} ${i.descricao_resumida} ${i.produto} ${i.grupo_designado}`
          .toLowerCase()
          .includes(q.toLowerCase())
      )
        return false;
      if (produto !== "todos" && i.produto !== produto) return false;
      if (prio !== "todas" && i.prioridade !== prio) return false;
      if (grupo !== "todos" && i.grupo_designado !== grupo) return false;
      if (status !== "todos" && i.status_incidente !== status) return false;
      if (origem !== "todos" && i.origem_incidente !== origem) return false;
      if (ola === "dentro" && !i.dentro_ola) return false;
      if (ola === "fora" && i.dentro_ola) return false;
      return true;
    });
  }, [incidentes, q, produto, prio, grupo, status, origem, ola]);

  const pagina = filtrados.slice(page * perPage, (page + 1) * perPage);
  const totalPag = Math.ceil(filtrados.length / perPage);

  function exportar() {
    const csv = Papa.unparse(filtrados);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incidentes-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtrados.length} incidentes exportados`);
  }

  const statusUnicos = Array.from(new Set(incidentes.map((i) => i.status_incidente)));

  if (carregando) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Incidentes"
        subtitle={`${fmtNumber(filtrados.length)} de ${fmtNumber(incidentes.length)} registros`}
        actions={
          <Button onClick={exportar} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" /> Exportar CSV
          </Button>
        }
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar por número, descrição, produto..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-72 h-9"
          />
          <Select value={produto} onValueChange={setProduto}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos produtos</SelectItem>
              {PRODUTOS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={prio} onValueChange={setPrio}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas prio.</SelectItem>
              {["P1", "P2", "P3", "P4", "P5"].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={grupo} onValueChange={setGrupo}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos grupos</SelectItem>
              {GRUPOS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              {statusUnicos.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={origem} onValueChange={setOrigem}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Toda origem</SelectItem>
              <SelectItem value="Monitoramento">Monitoramento</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
              <SelectItem value="API">API</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ola} onValueChange={setOla}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">OLA · todos</SelectItem>
              <SelectItem value="dentro">Dentro OLA</SelectItem>
              <SelectItem value="fora">Fora OLA</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setProduto("todos");
              setPrio("todas");
              setGrupo("todos");
              setStatus("todos");
              setOrigem("todos");
              setOla("todos");
            }}
          >
            <Filter className="h-4 w-4 mr-1" /> Limpar
          </Button>
        </div>
      </Card>

      {filtrados.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-8 w-8" />}
          title="Nenhum incidente encontrado"
          description="Ajuste ou limpe os filtros atuais para ver outros registros."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQ("");
                setProduto("todos");
                setPrio("todas");
                setGrupo("todos");
                setStatus("todos");
                setOrigem("todos");
                setOla("todos");
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Prio.</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Abertura</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>OLA</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagina.map((i) => (
                  <TableRow
                    key={i.numero_incidente}
                    className="hover:bg-accent/40 cursor-pointer"
                    onClick={() => setSel(i)}
                  >
                    <TableCell className="font-mono text-xs">{i.numero_incidente}</TableCell>
                    <TableCell>
                      <PrioridadeBadge p={i.prioridade} />
                    </TableCell>
                    <TableCell>{i.produto ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{i.grupo_designado}</TableCell>
                    <TableCell className="max-w-xs truncate">{i.descricao_resumida}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDateTime(i.data_abertura)}
                    </TableCell>
                    <TableCell className="text-xs">{fmtDuration(i.duracao_segundos)}</TableCell>
                    <TableCell className="text-xs">{i.status_incidente}</TableCell>
                    <TableCell>
                      <OlaBadge dentro={i.dentro_ola} />
                    </TableCell>
                    <TableCell className="text-xs">{i.origem_incidente}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSel(i);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
            <div>
              Página {page + 1} de {Math.max(totalPag, 1)}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setPage((p) => Math.min(totalPag - 1, p + 1))}
                disabled={page >= totalPag - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm">{sel.numero_incidente}</span>
                  <PrioridadeBadge p={sel.prioridade} />
                  <OlaBadge dentro={sel.dentro_ola} />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5 px-4">
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    Descrição
                  </div>
                  <p className="text-sm mt-1">{sel.descricao_resumida}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Produto" value={sel.produto} />
                  <Field label="Categoria" value={sel.categoria} />
                  <Field label="Grupo designado" value={sel.grupo_designado} />
                  <Field label="Item de configuração" value={sel.item_configuracao} />
                  <Field label="Status" value={sel.status_incidente} />
                  <Field label="Origem" value={sel.origem_incidente} />
                  <Field label="Aberto por" value={sel.aberto_por} />
                  <Field label="Duração" value={fmtDuration(sel.duracao_segundos)} />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                    Linha do tempo
                  </div>
                  <ol className="relative border-l border-border ml-2 space-y-3 pl-4">
                    <li>
                      <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary" />
                      <div className="text-xs text-muted-foreground">Abertura</div>
                      <div className="text-sm">{fmtDateTime(sel.data_abertura)}</div>
                    </li>
                    {sel.data_resolucao && (
                      <li>
                        <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-[color:var(--success)]" />
                        <div className="text-xs text-muted-foreground">Resolução</div>
                        <div className="text-sm">{fmtDateTime(sel.data_resolucao)}</div>
                      </li>
                    )}
                    {sel.data_encerramento && (
                      <li>
                        <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-muted-foreground" />
                        <div className="text-xs text-muted-foreground">Encerramento</div>
                        <div className="text-sm">{fmtDateTime(sel.data_encerramento)}</div>
                      </li>
                    )}
                  </ol>
                </div>
                {sel.solucao && (
                  <div>
                    <div className="text-xs font-medium uppercase text-muted-foreground">
                      Solução aplicada
                    </div>
                    <p className="text-sm mt-1 rounded-md bg-muted p-3">{sel.solucao}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}
