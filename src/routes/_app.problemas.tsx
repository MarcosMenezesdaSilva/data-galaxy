import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIncidentes } from "@/lib/hooks";
import { fmtNumber } from "@/lib/format";
import { GitBranch, Layers, Zap, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/problemas")({
  head: () => ({ meta: [{ title: "Problemas e Recorrências — Data Galaxy" }] }),
  component: ProblemasPage,
});

// Limiar demonstrativo: combinações produto+grupo+categoria com mais
// ocorrências que isso são marcadas como "recorrentes".
const LIMIAR_RECORRENCIA = 5;

function ProblemasPage() {
  const incidentes = useIncidentes();

  // Clusterização real: agrupamento por produto + grupo designado + categoria,
  // com contagem de ocorrências (inspirado em K-Means, execução demonstrativa
  // local — sem hardcode de exemplos).
  const grupos = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        produto: string;
        grupo: string;
        categoria: string;
        total: number;
        primeira: string;
        ultima: string;
        media: number;
        recorrente: boolean;
      }
    >();
    incidentes.forEach((i) => {
      const produto = i.produto ?? "Não informado";
      const categoria = i.categoria ?? "Não informada";
      const key = `${produto}||${i.grupo_designado}||${categoria}`;
      const cur = map.get(key) ?? {
        key,
        produto,
        grupo: i.grupo_designado,
        categoria,
        total: 0,
        primeira: i.data_abertura,
        ultima: i.data_abertura,
        media: 0,
        recorrente: false,
      };
      cur.total += 1;
      if (i.data_abertura < cur.primeira) cur.primeira = i.data_abertura;
      if (i.data_abertura > cur.ultima) cur.ultima = i.data_abertura;
      cur.media = (cur.media * (cur.total - 1) + i.duracao_segundos) / cur.total;
      cur.recorrente = cur.total > LIMIAR_RECORRENCIA;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [incidentes]);

  const gruposTop = grupos.slice(0, 20);
  const recorrentes = useMemo(() => grupos.filter((g) => g.recorrente), [grupos]);
  const isolados = useMemo(() => grupos.filter((g) => g.total === 1), [grupos]);
  const moderados = useMemo(
    () => grupos.filter((g) => g.total > 1 && g.total <= LIMIAR_RECORRENCIA),
    [grupos],
  );

  const clusters = [
    {
      titulo: "Padrão recorrente",
      icon: GitBranch,
      color: "var(--brand)",
      desc: `Combinações produto/grupo/categoria com mais de ${LIMIAR_RECORRENCIA} ocorrências.`,
      exemplos: recorrentes.slice(0, 3).map((g) => `${g.produto} · ${g.grupo} (${g.total})`),
      total: recorrentes.length,
    },
    {
      titulo: "Padrão moderado",
      icon: Layers,
      color: "var(--info)",
      desc: "Combinações com recorrência intermediária, abaixo do limiar de alerta.",
      exemplos: moderados.slice(0, 3).map((g) => `${g.produto} · ${g.grupo} (${g.total})`),
      total: moderados.length,
    },
    {
      titulo: "Maior concentração",
      icon: Zap,
      color: "var(--accent-orange)",
      desc: "Top combinação por volume de incidentes na base carregada.",
      exemplos: gruposTop.slice(0, 3).map((g) => `${g.produto} · ${g.grupo} (${g.total})`),
      total: gruposTop[0]?.total ?? 0,
    },
    {
      titulo: "Incidente isolado",
      icon: Sparkles,
      color: "var(--success)",
      desc: "Combinações com uma única ocorrência, sem correlação recorrente.",
      exemplos: isolados.slice(0, 3).map((g) => `${g.produto} · ${g.grupo}`),
      total: isolados.length,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Problemas e Recorrências"
        subtitle="Agrupamento inspirado em K-Means · classificação demonstrativa"
        actions={<Badge variant="outline">Modo demonstração</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        {clusters.map((c) => (
          <Card key={c.titulo} className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="rounded-md p-2"
                style={{
                  background: `color-mix(in oklab, ${c.color} 15%, transparent)`,
                  color: c.color,
                }}
              >
                <c.icon className="h-4 w-4" />
              </div>
              <div className="font-semibold text-sm">{c.titulo}</div>
            </div>
            <p className="text-xs text-muted-foreground">{c.desc}</p>
            <div className="pt-1 border-t border-border">
              {c.exemplos.map((e, i) => (
                <div key={i} className="text-xs text-muted-foreground truncate">
                  · {e}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="grupos">
        <TabsList>
          <TabsTrigger value="grupos">Por descrição/grupo</TabsTrigger>
          <TabsTrigger value="produto">Por produto</TabsTrigger>
        </TabsList>
        <TabsContent value="grupos">
          <Card className="p-4">
            <div className="text-sm font-semibold mb-3">Top recorrências</div>
            <div className="space-y-2">
              {gruposTop.map((g) => (
                <div
                  key={g.key}
                  className="flex items-center gap-3 rounded-md border border-border p-3 hover:bg-accent/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-2">
                      {g.produto} · {g.grupo}
                      {g.recorrente && (
                        <Badge variant="outline" className="text-[10px]">
                          Recorrente
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Categoria: {g.categoria}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-primary">{fmtNumber(g.total)}</div>
                    <div className="text-[10px] text-muted-foreground">ocorrências</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="produto">
          <Card className="p-4">
            <div className="text-sm font-semibold mb-3">Reincidência por produto</div>
            <div className="grid gap-2 md:grid-cols-2">
              {(() => {
                const map = new Map<string, number>();
                grupos.forEach((g) => map.set(g.produto, (map.get(g.produto) ?? 0) + g.total));
                return Array.from(map, ([p, t]) => ({ p, t })).sort((a, b) => b.t - a.t);
              })().map((r) => (
                <div
                  key={r.p}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div className="text-sm">{r.p}</div>
                  <div className="text-sm font-semibold text-primary">{fmtNumber(r.t)}</div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
