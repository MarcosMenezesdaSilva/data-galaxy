import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { computeQualityReport } from "@/lib/quality";
import { fmtNumber } from "@/lib/format";
import { AlertTriangle, Database, Download, ShieldAlert } from "lucide-react";
import Papa from "papaparse";

export const Route = createFileRoute("/_app/qualidade-dados")({
  head: () => ({ meta: [{ title: "Qualidade de Dados — Data Galaxy" }] }),
  component: QualidadeDadosPage,
});

const LABELS_COLUNA: Record<string, string> = {
  numero_incidente: "Número do incidente",
  prioridade: "Prioridade",
  produto: "Produto",
  categoria: "Categoria",
  subcategoria: "Subcategoria",
  grupo_designado: "Grupo designado",
  codigo_fechamento: "Código de fechamento",
  solucao: "Solução",
  data_abertura: "Data de abertura",
  data_resolucao: "Data de resolução",
  status_incidente: "Status do incidente",
};

function QualidadeDadosPage() {
  const incidentesRaw = useLiveQuery(() => db.incidentes.toArray(), []);
  const incidentes = useMemo(() => incidentesRaw ?? [], [incidentesRaw]);
  const carregando = incidentesRaw === undefined;
  const [mostrarRejeitados, setMostrarRejeitados] = useState(false);

  const relatorio = useMemo(() => computeQualityReport(incidentes ?? []), [incidentes]);

  function baixarRejeitados() {
    if (!relatorio.registrosRejeitados.length) return;
    const csv = Papa.unparse(relatorio.registrosRejeitados);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qualidade-rejeitados-${Date.now()}.csv`;
    a.click();
  }

  if (carregando) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!incidentes.length) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Qualidade de Dados"
          subtitle="Análise de completude, duplicidade e consistência da base carregada"
        />
        <EmptyState
          icon={<Database className="h-8 w-8" />}
          title="Nenhum incidente carregado"
          description="Importe uma base ou aguarde o carregamento dos dados demonstrativos para ver o relatório de qualidade."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Qualidade de Dados"
        subtitle="Análise de completude, duplicidade e consistência dos incidentes atualmente carregados (demo ou importados)"
      />

      <Alert className="border-[color:var(--warning)]/40 bg-[color:var(--warning)]/5">
        <AlertTriangle className="h-4 w-4 text-[color:var(--warning)]" />
        <AlertDescription>
          A ausência de Produto, Categoria ou Subcategoria representa uma limitação da fonte e não
          deve ser corrigida com valores inventados.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat
          label="Total de registros"
          value={fmtNumber(relatorio.totalRegistros)}
          icon={<Database className="h-4 w-4" />}
        />
        <Stat
          label="% aptos para análise"
          value={`${relatorio.registrosAptosPct}%`}
          icon={<ShieldAlert className="h-4 w-4" />}
          accent="success"
        />
        <Stat
          label="Duplicados"
          value={fmtNumber(relatorio.duplicados)}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="critical"
        />
        <Stat
          label="Inconsistências de datas"
          value={fmtNumber(relatorio.inconsistenciasDatas)}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm font-semibold mb-3">Cobertura por campo-chave</div>
          <div className="space-y-2.5">
            <Coverage label="Produto" value={relatorio.coberturaProduto} />
            <Coverage label="Categoria" value={relatorio.coberturaCategoria} />
            <Coverage label="Subcategoria" value={relatorio.coberturaSubcategoria} />
            <Coverage label="Solução" value={relatorio.coberturaSolucao} />
            <Coverage label="Data de resolução" value={relatorio.coberturaDataResolucao} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold mb-3">Consistência e validade</div>
          <div className="space-y-2 text-sm">
            <Row label="Datas inválidas" value={fmtNumber(relatorio.datasInvalidas)} />
            <Row label="Durações negativas" value={fmtNumber(relatorio.duracoesNegativas)} />
            <Row
              label="Prioridades fora de P1–P5"
              value={fmtNumber(relatorio.prioridadesInvalidas)}
            />
            <Row
              label="Registros duplicados (por número)"
              value={fmtNumber(relatorio.duplicados)}
            />
            <Row
              label="Resolução anterior à abertura"
              value={fmtNumber(relatorio.inconsistenciasDatas)}
            />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Distribuição de nulos por coluna</div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coluna</TableHead>
                <TableHead className="text-right">Vazios</TableHead>
                <TableHead className="text-right">% vazio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(relatorio.vaziosPorColuna).map(([col, n]) => (
                <TableRow key={col}>
                  <TableCell className="text-sm">{LABELS_COLUNA[col] ?? col}</TableCell>
                  <TableCell className="text-right">{fmtNumber(n)}</TableCell>
                  <TableCell className="text-right">
                    {relatorio.percentualVazioPorColuna[col]}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Registros rejeitados / duplicados</div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMostrarRejeitados((v) => !v)}>
              {mostrarRejeitados ? "Ocultar lista" : "Ver lista"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={baixarRejeitados}
              disabled={!relatorio.registrosRejeitados.length}
            >
              <Download className="h-4 w-4 mr-1.5" /> Baixar CSV
            </Button>
          </div>
        </div>
        {relatorio.registrosRejeitados.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert className="h-6 w-6" />}
            title="Nenhum registro rejeitado"
            description="Todos os incidentes carregados passaram pela verificação de duplicidade."
          />
        ) : mostrarRejeitados ? (
          <div className="overflow-x-auto border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Número do incidente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorio.registrosRejeitados.slice(0, 50).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{String(r.motivo)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {String(r.numero_incidente)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {relatorio.registrosRejeitados.length} registros — clique em "Ver lista" para exibir.
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "critical" | "success" | "warning";
}) {
  const map = {
    critical: "text-[color:var(--critical)]",
    success: "text-[color:var(--success)]",
    warning: "text-[color:var(--warning)]",
  } as const;
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
        {icon} {label}
      </div>
      <div className={`text-2xl font-semibold mt-1 ${accent ? map[accent] : ""}`}>{value}</div>
    </Card>
  );
}

function Coverage({ label, value }: { label: string; value: number }) {
  const color = value >= 90 ? "var(--success)" : value >= 70 ? "var(--warning)" : "var(--critical)";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
