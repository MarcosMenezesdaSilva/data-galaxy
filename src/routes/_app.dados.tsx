import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/EmptyState";
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
  Database,
  Trash2,
  DownloadCloud,
  RotateCcw,
  FileText,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  FileCode,
  LayoutDashboard,
  ArrowRight,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Table as DexieTable } from "dexie";
import { db, clearAllData } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

function errMsg(e: unknown): string | undefined {
  return e instanceof Error ? e.message : e ? String(e) : undefined;
}
import { useImports } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { fmtDateTime, fmtNumber } from "@/lib/format";
import { seedIfEmpty, resetSeed } from "@/lib/init";
import { calcularDentroSla, calcularElegivelKpi } from "@/lib/demo-data";
import { pareceBaseTratada, mapearLinhaOficial } from "@/lib/import-mapping";
import { computeQualityReport } from "@/lib/quality";
import type { Incidente } from "@/lib/types";
import { toast } from "sonner";
import { sincronizarDatabricks, type ResultadoSincronizacao } from "@/lib/databricks-sync";

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

interface EtapaLinhagem {
  nome: string;
  camada: "Raw" | "Staging" | "Processed" | "Aplicação";
  descricao: string;
  icon: LucideIcon;
  cor: string;
}

const ETAPAS: EtapaLinhagem[] = [
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
    descricao: "Consumo final: Central de Operações, Previsões e Riscos de OLA.",
    icon: LayoutDashboard,
    cor: "var(--success)",
  },
];

export const Route = createFileRoute("/_app/dados")({
  head: () => ({ meta: [{ title: "Dados — Data Galaxy" }] }),
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
  const [qualidade, setQualidade] = useState<ReturnType<typeof computeQualityReport> | null>(null);
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

  const [sincronizando, setSincronizando] = useState(false);
  const [resultadoSync, setResultadoSync] = useState<ResultadoSincronizacao | null>(null);

  async function sincronizarComDatabricks() {
    setSincronizando(true);
    setResultadoSync(null);
    const resultado = await sincronizarDatabricks();
    setSincronizando(false);
    setResultadoSync(resultado);
    if (resultado.ok) {
      resetSeed();
      setModo("importado");
      toast.success(
        `Sincronizado: ${fmtNumber(resultado.incidentes ?? 0)} incidentes, ${fmtNumber(resultado.previsoes ?? 0)} previsões, ${fmtNumber(resultado.riscos ?? 0)} riscos.`,
      );
    } else {
      const detalhe =
        resultado.motivo === "nao_configurado"
          ? "Databricks ainda não configurado (variáveis de ambiente ausentes no Netlify)."
          : resultado.detalhe || "Não foi possível sincronizar com o Databricks.";
      toast.error(detalhe);
    }
  }

  async function recarregarDemo() {
    // resetSeed() primeiro: para qualquer carga em segundo plano ainda em
    // andamento antes de limpar a base, senão ela pode continuar inserindo
    // incidentes por cima da base recém-limpa e a contagem da nova carga
    // nunca bate zero (artigos/previsões/riscos ficam vazios).
    await resetSeed();
    await clearAllData();
    await seedIfEmpty();
    setModo("importado");
    toast.success("Dados padrão (Databricks) restaurados");
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
    await resetSeed();
    await clearAllData();
    setModo("demo");
    toast.message("Base local limpa");
  }

  const colunas = preview && preview.length ? Object.keys(preview[0]).slice(0, 8) : [];

  // ── Qualidade de dados ──────────────────────────────────────────────────
  const incidentesRaw = useLiveQuery(() => db.incidentes.toArray(), []);
  const incidentesQualidade = useMemo(() => incidentesRaw ?? [], [incidentesRaw]);
  const relatorio = useMemo(() => computeQualityReport(incidentesQualidade), [incidentesQualidade]);
  const [mostrarRejeitados, setMostrarRejeitados] = useState(false);

  function baixarRejeitadosQualidade() {
    if (!relatorio.registrosRejeitados.length) return;
    const csv = Papa.unparse(relatorio.registrosRejeitados);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qualidade-rejeitados-${Date.now()}.csv`;
    a.click();
  }

  // ── Linhagem ─────────────────────────────────────────────────────────────
  function ultimaOcorrencia(camada: EtapaLinhagem["camada"]) {
    return imports.find((i) => i.camada === camada);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dados"
        subtitle="Importação, sincronização, qualidade e linhagem da base · persistida localmente no navegador (IndexedDB)"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportarBackup}>
              <DownloadCloud className="h-4 w-4 mr-1.5" /> Backup
            </Button>
            <Button variant="outline" size="sm" onClick={recarregarDemo}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Restaurar dados padrão
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

      <Tabs defaultValue="importacao">
        <TabsList>
          <TabsTrigger value="importacao">Importação e Sincronização</TabsTrigger>
          <TabsTrigger value="qualidade">Qualidade</TabsTrigger>
          <TabsTrigger value="linhagem">Linhagem</TabsTrigger>
        </TabsList>

        {/* ── Importação e Sincronização ──────────────────────────────── */}
        <TabsContent value="importacao" className="space-y-6">
          <Card className="p-6">
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
                  CSV, TXT (base tratada, delimitada por ;) ou XLSX · até 20 MB · será importado
                  como <b>{tipoSel.label}</b>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">Sincronizar com Databricks</div>
            </div>
            <p className="text-xs text-muted-foreground">
              O app já carrega por padrão um retrato real do Databricks (incidentes, previsões
              D+1/D+7 e riscos de OLA). Este botão é opcional: puxa os dados ao vivo direto do
              catálogo (gold.fato_incidentes, ml.previsao_futuro, ml.risco_violacao) e substitui a
              base local — pode levar até ~1-2 minutos dependendo do warehouse.
            </p>
            <Button size="sm" onClick={sincronizarComDatabricks} disabled={sincronizando}>
              {sincronizando ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1.5" />
              )}
              {sincronizando ? "Sincronizando..." : "Sincronizar agora"}
            </Button>
            {resultadoSync && !resultadoSync.ok && (
              <div className="rounded-md border border-[color:var(--critical)]/30 bg-[color:var(--critical)]/5 p-2.5 text-xs text-[color:var(--critical)]">
                {resultadoSync.motivo === "nao_configurado"
                  ? "Databricks ainda não configurado (variáveis de ambiente ausentes no Netlify)."
                  : resultadoSync.detalhe || "Não foi possível sincronizar."}
              </div>
            )}
            {resultadoSync?.ok && (
              <div className="rounded-md border border-[color:var(--success)]/30 bg-[color:var(--success)]/5 p-2.5 text-xs text-[color:var(--success)]">
                Sincronizado: {fmtNumber(resultadoSync.incidentes ?? 0)} incidentes,{" "}
                {fmtNumber(resultadoSync.previsoes ?? 0)} previsões,{" "}
                {fmtNumber(resultadoSync.riscos ?? 0)} riscos de OLA.
              </div>
            )}
          </Card>

          {qualidade && incidentesMapeados && arquivo && (
            <Card className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">
                    Relatório de validação — {arquivo.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(arquivo.size / 1024).toFixed(1)} KB ·{" "}
                    <b>{fmtNumber(qualidade.totalRegistros)}</b> incidentes válidos ·{" "}
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
                <QualityStat
                  label="% aptos para análise"
                  value={`${qualidade.registrosAptosPct}%`}
                />
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
                <QualityStat
                  label="Cobertura Categoria"
                  value={`${qualidade.coberturaCategoria}%`}
                />
                <QualityStat label="Cobertura Solução" value={`${qualidade.coberturaSolucao}%`} />
                <QualityStat
                  label="Inconsistência de datas"
                  value={fmtNumber(qualidade.inconsistenciasDatas)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A ausência de Produto, Categoria ou Subcategoria representa uma limitação da fonte e
                não deve ser corrigida com valores inventados. Veja o relatório completo na aba{" "}
                <b>Qualidade</b> após a importação.
              </p>
            </Card>
          )}

          {preview && arquivo && !incidentesMapeados && (
            <Card className="p-6 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{arquivo.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(arquivo.size / 1024).toFixed(1)} KB ·{" "}
                    <b>{preview.length + rejeitados.length}</b> linhas ·{" "}
                    <span className="text-[color:var(--success)]">{preview.length} válidas</span> ·{" "}
                    <span className="text-[color:var(--critical)]">
                      {rejeitados.length} com erro
                    </span>
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

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-primary" />
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
        </TabsContent>

        {/* ── Qualidade ────────────────────────────────────────────────── */}
        <TabsContent value="qualidade" className="space-y-6">
          {!incidentesQualidade.length ? (
            <EmptyState
              icon={<Database className="h-8 w-8" />}
              title="Nenhum incidente carregado"
              description="Importe uma base ou aguarde o carregamento dos dados para ver o relatório de qualidade."
            />
          ) : (
            <>
              <Alert className="border-[color:var(--warning)]/40 bg-[color:var(--warning)]/5">
                <AlertTriangle className="h-4 w-4 text-[color:var(--warning)]" />
                <AlertDescription>
                  A ausência de Produto, Categoria ou Subcategoria representa uma limitação da fonte
                  e não deve ser corrigida com valores inventados.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3 md:grid-cols-4">
                <QStat
                  label="Total de registros"
                  value={fmtNumber(relatorio.totalRegistros)}
                  icon={<Database className="h-4 w-4" />}
                />
                <QStat
                  label="% aptos para análise"
                  value={`${relatorio.registrosAptosPct}%`}
                  icon={<ShieldAlert className="h-4 w-4" />}
                  accent="success"
                />
                <QStat
                  label="Duplicados"
                  value={fmtNumber(relatorio.duplicados)}
                  icon={<AlertTriangle className="h-4 w-4" />}
                  accent="critical"
                />
                <QStat
                  label="Inconsistências de datas"
                  value={fmtNumber(relatorio.inconsistenciasDatas)}
                  icon={<AlertTriangle className="h-4 w-4" />}
                  accent="warning"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-6">
                  <div className="text-sm font-semibold mb-3">Cobertura por campo-chave</div>
                  <div className="space-y-2.5">
                    <Coverage label="Produto" value={relatorio.coberturaProduto} />
                    <Coverage label="Categoria" value={relatorio.coberturaCategoria} />
                    <Coverage label="Subcategoria" value={relatorio.coberturaSubcategoria} />
                    <Coverage label="Solução" value={relatorio.coberturaSolucao} />
                    <Coverage label="Data de resolução" value={relatorio.coberturaDataResolucao} />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="text-sm font-semibold mb-3">Consistência e validade</div>
                  <div className="space-y-2 text-sm">
                    <QRow label="Datas inválidas" value={fmtNumber(relatorio.datasInvalidas)} />
                    <QRow
                      label="Durações negativas"
                      value={fmtNumber(relatorio.duracoesNegativas)}
                    />
                    <QRow
                      label="Prioridades fora de P1–P5"
                      value={fmtNumber(relatorio.prioridadesInvalidas)}
                    />
                    <QRow
                      label="Registros duplicados (por número)"
                      value={fmtNumber(relatorio.duplicados)}
                    />
                    <QRow
                      label="Resolução anterior à abertura"
                      value={fmtNumber(relatorio.inconsistenciasDatas)}
                    />
                  </div>
                </Card>
              </div>

              <Card className="p-6">
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

              <Card className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold">Registros rejeitados / duplicados</div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrarRejeitados((v) => !v)}
                    >
                      {mostrarRejeitados ? "Ocultar lista" : "Ver lista"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={baixarRejeitadosQualidade}
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
                    {relatorio.registrosRejeitados.length} registros — clique em "Ver lista" para
                    exibir.
                  </div>
                )}
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Linhagem ─────────────────────────────────────────────────── */}
        <TabsContent value="linhagem" className="space-y-6">
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
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {etapa.descricao}
                      </p>
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

          <Card className="p-6">
            <div className="text-sm font-semibold mb-3">
              Histórico real de importações (por camada)
            </div>
            {imports.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                Nenhuma importação registrada ainda — os dados atuais são demonstrativos (gerados
                para o MVP).
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

          <Card className="p-6 bg-muted/30">
            <p className="text-xs text-muted-foreground leading-relaxed">
              As três primeiras etapas (Raw, Staging, Processed) descrevem o pipeline de tratamento
              realizado fora do navegador, antes da importação. As datas de processamento de cada
              camada são reconstruídas a partir do histórico real de importações (tabela de
              importações do IndexedDB) sempre que disponível — nenhuma data é fictícia.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
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

function QStat({
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
    <Card className="p-6">
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

function QRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
