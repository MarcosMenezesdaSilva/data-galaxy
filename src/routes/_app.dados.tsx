import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  Database as DBIcon,
  Trash2,
  DownloadCloud,
  RotateCcw,
  FileText,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Table as DexieTable } from "dexie";
import { db, clearAllData } from "@/lib/db";

function errMsg(e: unknown): string | undefined {
  return e instanceof Error ? e.message : e ? String(e) : undefined;
}
import { useImports } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { fmtDateTime, fmtNumber } from "@/lib/format";
import { seedIfEmpty, resetSeed } from "@/lib/init";
import { calcularDentroSla, calcularElegivelKpi } from "@/lib/demo-data";
import { pareceBaseTratada, mapearLinhaOficial } from "@/lib/import-mapping";
import { computeQualityReport, type QualityReport } from "@/lib/quality";
import type { Incidente } from "@/lib/types";
import { toast } from "sonner";

const TIPOS = [
  { id: "incidentes", label: "Incidentes", table: "incidentes" as const },
  { id: "regras_ola", label: "Regras de OLA", table: "regras" as const },
  { id: "previsoes", label: "Previsões", table: "previsoes" as const },
  { id: "riscos", label: "Riscos de OLA", table: "riscos" as const },
  { id: "alertas", label: "Alertas", table: "alertas" as const },
  { id: "acoes", label: "Ações e validações", table: "acoes" as const },
  { id: "mudancas", label: "Mudanças", table: "mudancas" as const },
  { id: "artigos", label: "Conhecimento", table: "artigos" as const },
];

const BATCH_SIZE = 3000;

export const Route = createFileRoute("/_app/dados")({
  head: () => ({ meta: [{ title: "Gestão de Dados — Data Galaxy" }] }),
  component: DadosPage,
});

function DadosPage() {
  const imports = useImports();
  const setModo = useApp((s) => s.setModo);
  const [tipo, setTipo] = useState("incidentes");
  const [preview, setPreview] = useState<Record<string, unknown>[] | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [rejeitados, setRejeitados] = useState<Record<string, unknown>[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fluxo especializado para a base tratada oficial de incidentes.
  const [incidentesMapeados, setIncidentesMapeados] = useState<Partial<Incidente>[] | null>(null);
  const [duplicadosCount, setDuplicadosCount] = useState(0);
  const [qualidade, setQualidade] = useState<QualityReport | null>(null);
  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const tipoSel = useMemo(() => TIPOS.find((t) => t.id === tipo)!, [tipo]);

  function pick() {
    inputRef.current?.click();
  }

  function limparEstadoArquivo() {
    setPreview(null);
    setArquivo(null);
    setRejeitados([]);
    setIncidentesMapeados(null);
    setQualidade(null);
    setDuplicadosCount(0);
    setProgresso(0);
  }

  async function onFile(file: File) {
    limparEstadoArquivo();
    setArquivo(file);
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        // Base bruta: apenas pré-visualização, não é a fonte principal quando
        // a base tratada (.txt/.csv) estiver disponível.
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
        setPreview(rows.slice(0, 100));
        toast.success(
          `Pré-visualização carregada: ${rows.length} linhas (arquivo bruto .xlsx/.xls)`,
        );
        return;
      }

      const isTxt = name.endsWith(".txt");
      const text = await file.text();
      // Detecta cabeçalho antes de decidir o delimitador definitivo.
      const headerProbe = Papa.parse(text, { header: false, preview: 1 });
      const headerRow = (headerProbe.data[0] as string[]) ?? [];
      const ehBaseTratada = isTxt || pareceBaseTratada(headerRow);

      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        delimiter: ehBaseTratada ? ";" : "",
      });
      const rows = parsed.data as Record<string, unknown>[];

      if (tipo === "incidentes" && ehBaseTratada) {
        processarBaseTratada(rows);
      } else {
        const validos = rows.filter((r) => r && typeof r === "object" && Object.keys(r).length > 1);
        const invalidos = rows.filter(
          (r) => !r || typeof r !== "object" || Object.keys(r).length <= 1,
        );
        setPreview(validos.slice(0, 100));
        setRejeitados(invalidos);
        toast.success(
          `Arquivo lido: ${validos.length} linhas válidas · ${invalidos.length} inválidas`,
        );
      }
    } catch (e) {
      toast.error("Falha ao ler o arquivo", { description: errMsg(e) });
    }
  }

  function processarBaseTratada(rowsRaw: Record<string, unknown>[]) {
    const mapeados: Partial<Incidente>[] = [];
    const vistos = new Set<string>();
    let duplicados = 0;
    let totalmenteVazias = 0;

    for (const raw of rowsRaw) {
      const { incidente, vazio } = mapearLinhaOficial(raw);
      if (vazio || !incidente) {
        totalmenteVazias++;
        continue;
      }
      const numero = incidente.numero_incidente;
      if (numero) {
        if (vistos.has(numero)) {
          duplicados++;
          continue;
        }
        vistos.add(numero);
      }
      // Aplica a fórmula oficial corrigida de elegibilidade de KPI e de SLA,
      // independentemente do que veio marcado na origem.
      const completo: Partial<Incidente> = {
        ...incidente,
        elegivel_kpi: calcularElegivelKpi({
          prioridade: incidente.prioridade!,
          incidente_pai: incidente.incidente_pai,
          status_incidente: incidente.status_incidente!,
        }),
        dentro_ola: calcularDentroSla(incidente.prioridade!, incidente.duracao_segundos ?? 0),
      };
      mapeados.push(completo);
    }

    setIncidentesMapeados(mapeados);
    setDuplicadosCount(duplicados);
    setQualidade(computeQualityReport(mapeados));
    toast.success(
      `Base tratada reconhecida: ${mapeados.length} incidentes válidos · ${duplicados} duplicados · ${totalmenteVazias} linhas vazias descartadas`,
    );
  }

  async function confirmarBaseTratada(modo: "substituir" | "acrescentar") {
    if (!incidentesMapeados || !arquivo) return;
    setImportando(true);
    setProgresso(0);
    try {
      if (modo === "substituir") await db.incidentes.clear();
      const total = incidentesMapeados.length;
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const lote = incidentesMapeados.slice(i, i + BATCH_SIZE) as Incidente[];
        await db.incidentes.bulkAdd(lote);
        setProgresso(Math.round(Math.min(100, ((i + lote.length) / total) * 100)));
        // Libera a UI entre lotes para não travar a thread principal.
        await new Promise((r) => setTimeout(r, 0));
      }
      await db.imports.add({
        arquivo: arquivo.name,
        tipo: "Incidentes (base tratada)",
        tamanho: arquivo.size,
        linhas_total: total + duplicadosCount,
        linhas_validas: total,
        linhas_erro: duplicadosCount,
        duplicados: duplicadosCount,
        data: new Date().toISOString(),
        usuario: "MVP",
        status: duplicadosCount === 0 ? "Sucesso" : "Parcial",
        camada: "Aplicação",
      });
      setModo("importado");
      toast.success(`${fmtNumber(total)} incidentes importados para o IndexedDB`);
      limparEstadoArquivo();
    } catch (e) {
      toast.error("Falha na importação", { description: errMsg(e) });
    } finally {
      setImportando(false);
    }
  }

  async function confirmar(modo: "substituir" | "acrescentar") {
    if (!preview || !arquivo) return;
    const tabela = db[tipoSel.table] as unknown as DexieTable<Record<string, unknown>, number>;
    if (modo === "substituir") await tabela.clear();
    try {
      await tabela.bulkAdd(preview);
      await db.imports.add({
        arquivo: arquivo.name,
        tipo: tipoSel.label,
        tamanho: arquivo.size,
        linhas_total: preview.length + rejeitados.length,
        linhas_validas: preview.length,
        linhas_erro: rejeitados.length,
        data: new Date().toISOString(),
        usuario: "MVP",
        status: rejeitados.length === 0 ? "Sucesso" : "Parcial",
        camada: "Aplicação",
      });
      setModo("importado");
      toast.success(`${preview.length} registros importados para ${tipoSel.label}`);
      limparEstadoArquivo();
    } catch (e) {
      toast.error("Falha na importação", { description: errMsg(e) });
    }
  }

  function downloadRejeitados() {
    if (!rejeitados.length) return;
    const csv = Papa.unparse(rejeitados);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rejeitados-${Date.now()}.csv`;
    a.click();
  }

  async function recarregarDemo() {
    await clearAllData();
    resetSeed();
    await seedIfEmpty();
    setModo("demo");
    toast.success("Dados demonstrativos recarregados");
  }

  async function exportarBackup() {
    const backup = {
      incidentes: await db.incidentes.toArray(),
      previsoes: await db.previsoes.toArray(),
      riscos: await db.riscos.toArray(),
      alertas: await db.alertas.toArray(),
      acoes: await db.acoes.toArray(),
      mudancas: await db.mudancas.toArray(),
      artigos: await db.artigos.toArray(),
      regras: await db.regras.toArray(),
      validacoes: await db.validacoes.toArray(),
      produtosServicos: await db.produtosServicos.toArray(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `data-galaxy-backup-${Date.now()}.json`;
    a.click();
    toast.success("Backup exportado");
  }

  async function limparTudo() {
    await clearAllData();
    resetSeed();
    setModo("demo");
    toast.message("Base local limpa");
  }

  const colunas = preview && preview.length ? Object.keys(preview[0]).slice(0, 8) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Dados"
        subtitle="Importe CSV, TXT (base tratada) ou Excel · dados persistidos localmente no navegador (IndexedDB)"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportarBackup}>
              <DownloadCloud className="h-4 w-4 mr-1.5" /> Backup
            </Button>
            <Button variant="outline" size="sm" onClick={recarregarDemo}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Recarregar demo
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-1.5 text-[color:var(--critical)]" /> Limpar base
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar toda a base local?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Todos os incidentes, alertas, ações e demais dados no IndexedDB serão removidos.
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={limparTudo}>Confirmar exclusão</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <div className="space-y-2">
            <div className="text-xs uppercase text-muted-foreground">Tipo de base</div>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full mt-2" onClick={pick}>
              <Upload className="h-4 w-4 mr-1.5" /> Selecionar arquivo
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </div>

          <div
            className="rounded-lg border-2 border-dashed border-border p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30"
            onClick={pick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) onFile(f);
            }}
          >
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-sm font-medium">
              Arraste um arquivo aqui ou clique para selecionar
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              CSV, TXT (base tratada, delimitada por ;) ou XLSX · até 20 MB · será importado como{" "}
              <b>{tipoSel.label}</b>
            </div>
          </div>
        </div>
      </Card>

      {qualidade && incidentesMapeados && arquivo && (
        <Card className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Relatório de validação — {arquivo.name}</div>
              <div className="text-xs text-muted-foreground">
                {(arquivo.size / 1024).toFixed(1)} KB · <b>{fmtNumber(qualidade.totalRegistros)}</b>{" "}
                incidentes válidos ·{" "}
                <span className="text-[color:var(--critical)]">
                  {duplicadosCount} duplicados descartados
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={importando}
              onClick={() => confirmarBaseTratada("acrescentar")}
            >
              Acrescentar
            </Button>
            <Button
              size="sm"
              disabled={importando}
              onClick={() => confirmarBaseTratada("substituir")}
            >
              Substituir base
            </Button>
          </div>

          {importando && (
            <div className="space-y-1.5">
              <Progress value={progresso} />
              <div className="text-xs text-muted-foreground">
                Importando em lotes de {fmtNumber(BATCH_SIZE)} registros · {progresso}%
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <QualityStat label="% aptos para análise" value={`${qualidade.registrosAptosPct}%`} />
            <QualityStat label="Datas inválidas" value={fmtNumber(qualidade.datasInvalidas)} />
            <QualityStat
              label="Durações negativas"
              value={fmtNumber(qualidade.duracoesNegativas)}
            />
            <QualityStat
              label="Prioridades inválidas"
              value={fmtNumber(qualidade.prioridadesInvalidas)}
            />
            <QualityStat label="Cobertura Produto" value={`${qualidade.coberturaProduto}%`} />
            <QualityStat label="Cobertura Categoria" value={`${qualidade.coberturaCategoria}%`} />
            <QualityStat label="Cobertura Solução" value={`${qualidade.coberturaSolucao}%`} />
            <QualityStat
              label="Inconsistência de datas"
              value={fmtNumber(qualidade.inconsistenciasDatas)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            A ausência de Produto, Categoria ou Subcategoria representa uma limitação da fonte e não
            deve ser corrigida com valores inventados. Veja o relatório completo na tela{" "}
            <b>Qualidade de Dados</b> após a importação.
          </p>
        </Card>
      )}

      {preview && arquivo && !incidentesMapeados && (
        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{arquivo.name}</div>
              <div className="text-xs text-muted-foreground">
                {(arquivo.size / 1024).toFixed(1)} KB · <b>{preview.length + rejeitados.length}</b>{" "}
                linhas ·{" "}
                <span className="text-[color:var(--success)]">{preview.length} válidas</span> ·{" "}
                <span className="text-[color:var(--critical)]">{rejeitados.length} com erro</span>
              </div>
            </div>
            {rejeitados.length > 0 && (
              <Button variant="ghost" size="sm" onClick={downloadRejeitados}>
                Baixar rejeitados
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => confirmar("acrescentar")}>
              Acrescentar
            </Button>
            <Button size="sm" onClick={() => confirmar("substituir")}>
              Substituir base
            </Button>
          </div>
          <div className="overflow-x-auto border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {colunas.map((c) => (
                    <TableHead key={c} className="text-xs">
                      {c}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.slice(0, 8).map((r, i) => (
                  <TableRow key={i}>
                    {colunas.map((c) => (
                      <TableCell key={c} className="text-xs max-w-xs truncate">
                        {String(r[c] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <DBIcon className="h-4 w-4 text-primary" />
          <div className="text-sm font-semibold">Histórico de importações</div>
        </div>
        {imports.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            Nenhuma importação registrada ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Válidas</TableHead>
                <TableHead>Erros</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="text-xs">{fmtDateTime(i.data)}</TableCell>
                  <TableCell className="text-sm">{i.arquivo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{i.tipo}</Badge>
                  </TableCell>
                  <TableCell className="text-[color:var(--success)]">
                    {fmtNumber(i.linhas_validas)}
                  </TableCell>
                  <TableCell className="text-[color:var(--critical)]">
                    {fmtNumber(i.linhas_erro)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={i.status === "Sucesso" ? "default" : "secondary"}
                      className="gap-1"
                    >
                      {i.status === "Sucesso" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {i.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function QualityStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2.5">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
