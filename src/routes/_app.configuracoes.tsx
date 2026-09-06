import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, useDatabricksConfig, USUARIOS, type FaixasRisco } from "@/lib/store";
import type { Perfil } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRegras } from "@/lib/hooks";
import { db } from "@/lib/db";
import { PRODUTOS, GRUPOS, REGRAS_OLA_DISCLAIMER } from "@/lib/demo-data";
import { Info, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import {
  enviarNotificacao,
  statusCanaisNotificacao,
  linkOptInWhatsapp,
  type Canal,
  type StatusCanais,
} from "@/lib/notify";
import { QRCodeSVG } from "qrcode.react";
import {
  executarConsultaDatabricks,
  configuracaoCompleta,
  normalizarWarehouseId,
  normalizarHost,
  type ConsultaResultado,
} from "@/lib/databricks";
import { Database, Loader2, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Data Galaxy" }] }),
  component: ConfigPage,
});

const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>();

function ConfigPage() {
  const { theme, setTheme, perfil, setPerfil, faixasRisco, setFaixasRisco } = useApp();
  const regras = useRegras();
  const [faixas, setFaixas] = useState<FaixasRisco>(faixasRisco);
  const faixasAlteradas = JSON.stringify(faixas) !== JSON.stringify(faixasRisco);

  const [statusCanais, setStatusCanais] = useState<StatusCanais | null>(null);
  const [destinoWhatsapp, setDestinoWhatsapp] = useState("");
  const [destinoSms, setDestinoSms] = useState("");
  const [enviandoTeste, setEnviandoTeste] = useState<Canal | null>(null);

  useEffect(() => {
    statusCanaisNotificacao().then(setStatusCanais);
  }, []);
  const linkOptIn = statusCanais ? linkOptInWhatsapp(statusCanais) : null;

  // Integração Databricks: host/warehouse/token entrados aqui pelo
  // Administrador, salvos no navegador (decisão consciente — ver comentário
  // na store). Nunca viram variável de ambiente no Netlify.
  const dbCfgSalva = useDatabricksConfig();
  const [dbHost, setDbHost] = useState(dbCfgSalva.host);
  const [dbWarehouse, setDbWarehouse] = useState(dbCfgSalva.warehouseId);
  const [dbToken, setDbToken] = useState(dbCfgSalva.token);
  const [dbTestando, setDbTestando] = useState(false);
  const [dbConexaoOk, setDbConexaoOk] = useState<boolean | null>(null);
  const [dbErro, setDbErro] = useState<string | null>(null);
  const [dbQuery, setDbQuery] = useState("SHOW TABLES IN fiap_analytics.gold");
  const [dbExecutando, setDbExecutando] = useState(false);
  const [dbResultado, setDbResultado] = useState<ConsultaResultado | null>(null);

  function salvarCredenciaisDatabricks() {
    const host = normalizarHost(dbHost);
    const warehouseId = normalizarWarehouseId(dbWarehouse);
    setDbHost(host);
    setDbWarehouse(warehouseId);
    dbCfgSalva.setConfig({ host, warehouseId, token: dbToken.trim() });
    setDbConexaoOk(null);
    setDbErro(null);
    toast.success("Credenciais do Databricks salvas neste navegador.");
  }

  function limparCredenciaisDatabricks() {
    dbCfgSalva.limpar();
    setDbHost("");
    setDbWarehouse("");
    setDbToken("");
    setDbConexaoOk(null);
    setDbErro(null);
    setDbResultado(null);
    toast.info("Credenciais do Databricks removidas deste navegador.");
  }

  async function testarConexaoDatabricks() {
    if (!configuracaoCompleta({ host: dbHost, warehouseId: dbWarehouse, token: dbToken })) {
      toast.warning("Preencha host, warehouse ID e token antes de testar.");
      return;
    }
    setDbTestando(true);
    setDbErro(null);
    const resultado = await executarConsultaDatabricks(
      { host: dbHost, warehouseId: dbWarehouse, token: dbToken },
      "SELECT 1",
    );
    setDbTestando(false);
    setDbConexaoOk(resultado.ok);
    if (resultado.ok) {
      toast.success("Conectado ao Databricks com sucesso.");
    } else {
      const detalhe = resultado.detalhe || "Não foi possível conectar ao Databricks.";
      setDbErro(detalhe);
      toast.error(detalhe);
    }
  }

  async function executarQueryDatabricks() {
    if (!configuracaoCompleta({ host: dbHost, warehouseId: dbWarehouse, token: dbToken })) {
      toast.warning("Preencha host, warehouse ID e token antes de consultar.");
      return;
    }
    if (!dbQuery.trim()) return;
    setDbExecutando(true);
    setDbResultado(null);
    const resultado = await executarConsultaDatabricks(
      { host: dbHost, warehouseId: dbWarehouse, token: dbToken },
      dbQuery,
    );
    setDbExecutando(false);
    setDbResultado(resultado);
    if (!resultado.ok) toast.error(resultado.detalhe || "A consulta falhou.");
  }

  async function testarCanal(canal: Canal, destinatario?: string) {
    setEnviandoTeste(canal);
    const resultado = await enviarNotificacao({
      canal,
      destinatario,
      titulo: "Teste de notificação — Data Galaxy",
      mensagem: "Se você recebeu isso, a integração está funcionando.",
    });
    setEnviandoTeste(null);
    if (resultado.ok) {
      toast.success("Notificação de teste enviada com sucesso.");
    } else if (resultado.motivo === "nao_configurado") {
      toast.warning("Esse canal ainda não está configurado (variáveis de ambiente ausentes).");
    } else {
      toast.error("Não foi possível enviar a notificação de teste agora.");
    }
  }

  function salvarFaixas() {
    setFaixasRisco(faixas);
    toast.success("Faixas de risco salvas");
  }

  function atualizarRegraDebounced(
    id: number,
    patch: Partial<{
      tempo_limite_minutos: number;
      percentual_alerta: number;
      grupo_responsavel: string;
    }>,
  ) {
    const timer = debounceTimers.get(id);
    if (timer) clearTimeout(timer);
    debounceTimers.set(
      id,
      setTimeout(async () => {
        await db.regras.update(id, patch);
        toast.success("Regra de OLA atualizada");
      }, 500),
    );
  }

  async function alternarAtivo(id: number, ativo: boolean) {
    await db.regras.update(id, { ativo });
    toast.success(ativo ? "Regra ativada" : "Regra desativada");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        subtitle="Preferências visuais, perfis, faixas de risco e regras de OLA"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 space-y-4">
          <div className="text-sm font-semibold">Aparência e perfil</div>
          <div className="flex items-center justify-between">
            <Label>Tema escuro</Label>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
            />
          </div>
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select value="pt-BR">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Perfil ativo</Label>
            <Select value={perfil ?? "gestor"} onValueChange={(v) => setPerfil(v as Perfil)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(USUARIOS).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome} — {u.cargo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="text-sm font-semibold">Faixas de risco</div>
          <div className="text-xs text-muted-foreground">
            Ajuste os limites das faixas usadas em riscos de OLA.
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { key: "baixoAte", label: "Baixo (até)" },
                { key: "medioAte", label: "Médio (até)" },
                { key: "altoAte", label: "Alto (até)" },
                { key: "criticoAte", label: "Crítico (até)" },
              ] as const
            ).map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  type="number"
                  value={faixas[f.key]}
                  onChange={(e) =>
                    setFaixas((prev) => ({ ...prev, [f.key]: Number(e.target.value) }))
                  }
                />
              </div>
            ))}
          </div>
          <Button size="sm" onClick={salvarFaixas} disabled={!faixasAlteradas}>
            Salvar faixas
          </Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="text-sm font-semibold">Regras demonstrativas de validação</div>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-5">
            <li>
              Efetiva: volume real ≤ <b>70%</b> do previsto E reincidência ≤ <b>10%</b> E até{" "}
              <b>2</b> novas violações.
            </li>
            <li>
              Paliativa: queda seguida de retomada OU volume ≥ <b>85%</b> do previsto OU
              reincidência &gt; <b>20%</b>.
            </li>
            <li>Inconclusiva: janela ainda não concluída ou dados insuficientes.</li>
          </ul>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info("Regras salvas (modo demonstrativo)")}
          >
            Salvar regras
          </Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="text-sm font-semibold">Preferências de notificações</div>
          {["E-mail", "Microsoft Teams", "SMS", "API"].map((c) => (
            <div key={c} className="flex items-center justify-between">
              <Label>{c}</Label>
              <Switch defaultChecked={c !== "SMS"} />
            </div>
          ))}
        </Card>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <div className="text-sm font-semibold">Canais de Notificação</div>
        </div>

        <div className="space-y-3">
          {/* WhatsApp */}
          <div className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">WhatsApp</span>
              <Badge
                variant="outline"
                className={
                  statusCanais?.whatsapp
                    ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[color:var(--success)]"
                    : "border-border bg-muted text-muted-foreground"
                }
              >
                {statusCanais === null
                  ? "Verificando..."
                  : statusCanais.whatsapp
                    ? "Configurado"
                    : "Não configurado"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="11999999999"
                value={destinoWhatsapp}
                onChange={(e) => setDestinoWhatsapp(e.target.value)}
                className="h-8 w-44"
                disabled={!statusCanais?.whatsapp}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!statusCanais?.whatsapp || enviandoTeste === "whatsapp"}
                onClick={() => testarCanal("whatsapp", destinoWhatsapp)}
                title={
                  statusCanais?.whatsapp ? undefined : "Configure a variável de ambiente primeiro"
                }
              >
                <Send className="h-3.5 w-3.5 mr-1.5" /> Enviar teste
              </Button>
            </div>
            {statusCanais?.whatsapp && (
              <div className="flex flex-col gap-2 text-[11px] text-muted-foreground sm:col-span-2">
                <div className="flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                  <span>
                    Quem vai receber precisa mandar uma mensagem primeiro para o número do sandbox
                    do Twilio — sem esse passo, o envio é aceito mas nunca chega.
                  </span>
                </div>
                {linkOptIn && (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => window.open(linkOptIn, "_blank", "noopener,noreferrer")}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Abrir WhatsApp e entrar no sandbox
                    </Button>
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-white p-1.5">
                        <QRCodeSVG value={linkOptIn} size={56} />
                      </div>
                      <span>Escaneie para entrar direto</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SMS */}
          <div className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">SMS</span>
              <Badge
                variant="outline"
                className={
                  statusCanais?.sms
                    ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[color:var(--success)]"
                    : "border-border bg-muted text-muted-foreground"
                }
              >
                {statusCanais === null
                  ? "Verificando..."
                  : statusCanais.sms
                    ? "Configurado"
                    : "Não configurado"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="11999999999"
                value={destinoSms}
                onChange={(e) => setDestinoSms(e.target.value)}
                className="h-8 w-44"
                disabled={!statusCanais?.sms}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!statusCanais?.sms || enviandoTeste === "sms"}
                onClick={() => testarCanal("sms", destinoSms)}
                title={statusCanais?.sms ? undefined : "Configure a variável de ambiente primeiro"}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" /> Enviar teste
              </Button>
            </div>
          </div>

          {/* Teams */}
          <div className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Microsoft Teams</span>
              <Badge
                variant="outline"
                className={
                  statusCanais?.teams
                    ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[color:var(--success)]"
                    : "border-border bg-muted text-muted-foreground"
                }
              >
                {statusCanais === null
                  ? "Verificando..."
                  : statusCanais.teams
                    ? "Configurado"
                    : "Não configurado"}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!statusCanais?.teams || enviandoTeste === "teams"}
              onClick={() => testarCanal("teams")}
              title={statusCanais?.teams ? undefined : "Configure a variável de ambiente primeiro"}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" /> Enviar teste
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>
            As credenciais reais (Twilio e webhook do Teams) são configuradas como variáveis de
            ambiente no painel do Netlify (Site settings → Environment variables), nunca no
            código-fonte.
          </p>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <div className="text-sm font-semibold">Integração Databricks</div>
          {dbConexaoOk === true && (
            <Badge className="border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[color:var(--success)]">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Conectado
            </Badge>
          )}
          {dbConexaoOk === false && (
            <Badge className="border-[color:var(--critical)]/30 bg-[color:var(--critical)]/10 text-[color:var(--critical)]">
              <XCircle className="h-3 w-3 mr-1" /> Falha na conexão
            </Badge>
          )}
        </div>

        {dbErro && (
          <div className="rounded-md border border-[color:var(--critical)]/30 bg-[color:var(--critical)]/5 p-2.5 text-xs text-[color:var(--critical)]">
            {dbErro}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Host</Label>
            <Input
              placeholder="dbc-xxxxxxxx-xxxx.cloud.databricks.com"
              value={dbHost}
              onChange={(e) => setDbHost(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Warehouse ID</Label>
            <Input
              placeholder="862f1d757356a3a5"
              value={dbWarehouse}
              onChange={(e) => setDbWarehouse(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Token de acesso pessoal</Label>
            <Input
              type="password"
              placeholder="dapi..."
              value={dbToken}
              onChange={(e) => setDbToken(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={salvarCredenciaisDatabricks}>
            Salvar credenciais
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={testarConexaoDatabricks}
            disabled={dbTestando}
          >
            {dbTestando ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Database className="h-3.5 w-3.5 mr-1.5" />
            )}
            Testar conexão
          </Button>
          <Button size="sm" variant="ghost" onClick={limparCredenciaisDatabricks}>
            Esquecer credenciais
          </Button>
        </div>

        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            SQL Warehouses → clique no warehouse → aba &ldquo;Connection details&rdquo;: o Host é o
            campo &ldquo;Server hostname&rdquo;. Não existe um campo &ldquo;Warehouse ID&rdquo;
            separado — ele é só a parte final do &ldquo;HTTP Path&rdquo; (depois de
            &ldquo;/warehouses/&rdquo;); pode colar o HTTP Path inteiro aqui que o app extrai o ID
            sozinho. Token: ícone de usuário (canto superior direito) → Settings → Developer →
            Access tokens → Generate new token. Salvo apenas neste navegador — nunca enviado a
            nenhum outro lugar além da function que fala com o Databricks.
          </span>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <Label className="text-xs">Consulta SQL (catálogo fiap_analytics)</Label>
          <Textarea
            value={dbQuery}
            onChange={(e) => setDbQuery(e.target.value)}
            className="font-mono text-xs h-20"
            placeholder="SELECT * FROM fiap_analytics.gold.fato_incidentes LIMIT 20"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={executarQueryDatabricks}
            disabled={dbExecutando}
          >
            {dbExecutando ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Database className="h-3.5 w-3.5 mr-1.5" />
            )}
            Executar consulta
          </Button>

          {dbResultado && !dbResultado.ok && (
            <div className="rounded-md border border-[color:var(--critical)]/30 bg-[color:var(--critical)]/5 p-3 text-xs text-[color:var(--critical)]">
              {dbResultado.detalhe || dbResultado.motivo}
            </div>
          )}

          {dbResultado?.ok && (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {dbResultado.colunas.map((c) => (
                      <TableHead key={c.nome} className="whitespace-nowrap text-xs">
                        {c.nome}
                        <span className="ml-1 text-[10px] text-muted-foreground">{c.tipo}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dbResultado.linhas.map((linha, i) => (
                    <TableRow key={i}>
                      {linha.map((valor, j) => (
                        <TableCell key={j} className="whitespace-nowrap text-xs">
                          {valor === null ? (
                            <span className="text-muted-foreground">null</span>
                          ) : (
                            String(valor)
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {dbResultado.linhas.length === 0 && (
                <div className="p-3 text-xs text-muted-foreground">Consulta sem resultados.</div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold">Regras de OLA cadastradas</div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Info className="h-3.5 w-3.5" /> {REGRAS_OLA_DISCLAIMER}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Tempo limite (min)</TableHead>
              <TableHead>% alerta</TableHead>
              <TableHead>Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regras.map((r) => (
              <TableRow key={r.id_regra}>
                <TableCell className="font-mono text-xs">{r.id_regra}</TableCell>
                <TableCell>{r.produto}</TableCell>
                <TableCell>{r.prioridade}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {r.grupo_responsavel}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={r.tempo_limite_minutos}
                    className="h-8 w-24"
                    onChange={(e) =>
                      r.id &&
                      atualizarRegraDebounced(r.id, {
                        tempo_limite_minutos: Number(e.target.value),
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={r.percentual_alerta}
                    className="h-8 w-20"
                    onChange={(e) =>
                      r.id &&
                      atualizarRegraDebounced(r.id, { percentual_alerta: Number(e.target.value) })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={r.ativo}
                    onCheckedChange={(v) => r.id && alternarAtivo(r.id, v)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4 bg-muted/30">
        <div className="text-sm font-semibold mb-2">Produtos e grupos configurados</div>
        <div className="grid gap-3 md:grid-cols-2 text-xs">
          <div>
            <div className="text-muted-foreground mb-1">Produtos ({PRODUTOS.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {PRODUTOS.map((p) => (
                <span key={p} className="rounded-md border border-border bg-card px-2 py-0.5">
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Grupos ({GRUPOS.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {GRUPOS.map((g) => (
                <span key={g} className="rounded-md border border-border bg-card px-2 py-0.5">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
