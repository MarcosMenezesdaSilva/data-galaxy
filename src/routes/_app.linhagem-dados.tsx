import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useImports } from "@/lib/hooks";
import { fmtDateTime } from "@/lib/format";
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  Database,
  LayoutDashboard,
  ArrowRight,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/_app/linhagem-dados")({
  head: () => ({ meta: [{ title: "Linhagem de Dados — Data Galaxy" }] }),
  component: LinhagemDadosPage,
});

interface Etapa {
  nome: string;
  camada: "Raw" | "Staging" | "Processed" | "Aplicação";
  descricao: string;
  icon: LucideIcon;
  cor: string;
}

const ETAPAS: Etapa[] = [
  {
    nome: "LW-DATASET.xlsx",
    camada: "Raw",
    descricao: "Arquivo original exportado da base de incidentes da Locaweb, sem tratamento.",
    icon: FileSpreadsheet,
    cor: "var(--info)",
  },
  {
    nome: "incidentes_staging.csv",
    camada: "Staging",
    descricao: "Camada intermediária: normalização de colunas e tipos antes do tratamento final.",
    icon: FileCode,
    cor: "var(--accent-orange)",
  },
  {
    nome: "incidentes_tratados.txt",
    camada: "Processed",
    descricao:
      "Dados tratados (delimitados por ;) prontos para análise — mapeados para o dicionário oficial.",
    icon: FileText,
    cor: "var(--warning)",
  },
  {
    nome: "IndexedDB (navegador)",
    camada: "Aplicação",
    descricao:
      "Dados importados localmente no Data Galaxy — persistidos no IndexedDB do navegador.",
    icon: Database,
    cor: "var(--brand)",
  },
  {
    nome: "Dashboards e análises",
    camada: "Aplicação",
    descricao: "Consumo final: Central de Operações, Previsões, Riscos de OLA e Relatórios.",
    icon: LayoutDashboard,
    cor: "var(--success)",
  },
];

function LinhagemDadosPage() {
  const imports = useImports();

  function ultimaOcorrencia(camada: Etapa["camada"]) {
    return imports.find((i) => i.camada === camada);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Linhagem de Dados"
        subtitle="Fluxo de origem até consumo · da base bruta da Locaweb aos dashboards do Data Galaxy"
      />

      <Card className="p-6 overflow-x-auto">
        <div className="flex items-stretch gap-2 min-w-[900px]">
          {ETAPAS.map((etapa, i) => {
            const ocorrencia = ultimaOcorrencia(etapa.camada);
            return (
              <div key={etapa.nome} className="flex items-center flex-1 last:flex-initial">
                <div className="flex-1 rounded-lg border border-border p-4 space-y-2 bg-card">
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-md p-2"
                      style={{
                        background: `color-mix(in oklab, ${etapa.cor} 15%, transparent)`,
                        color: etapa.cor,
                      }}
                    >
                      <etapa.icon className="h-4 w-4" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {etapa.camada}
                    </Badge>
                  </div>
                  <div className="text-sm font-semibold leading-tight">{etapa.nome}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{etapa.descricao}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                    <Clock className="h-3 w-3" />
                    {ocorrencia ? (
                      <span>Processado em {fmtDateTime(ocorrencia.data)}</span>
                    ) : (
                      <span>Sem registro de importação para esta camada ainda</span>
                    )}
                  </div>
                </div>
                {i < ETAPAS.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold mb-3">Histórico real de importações (por camada)</div>
        {imports.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            Nenhuma importação registrada ainda — os dados atuais são demonstrativos (gerados para o
            MVP).
          </div>
        ) : (
          <div className="space-y-2">
            {imports.map((i) => (
              <div
                key={i.id}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
              >
                <Badge variant="outline" className="text-[10px]">
                  {i.camada ?? "Aplicação"}
                </Badge>
                <span className="flex-1 min-w-0 truncate">{i.arquivo}</span>
                <span className="text-xs text-muted-foreground">{fmtDateTime(i.data)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 bg-muted/30">
        <p className="text-xs text-muted-foreground leading-relaxed">
          As três primeiras etapas (Raw, Staging, Processed) descrevem o pipeline de tratamento
          realizado fora do navegador, antes da importação. As datas de processamento de cada camada
          são reconstruídas a partir do histórico real de importações (tabela de importações do
          IndexedDB) sempre que disponível — nenhuma data é fictícia.
        </p>
      </Card>
    </div>
  );
}
