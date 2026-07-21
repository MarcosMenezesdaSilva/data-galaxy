import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, USUARIOS, type FaixasRisco } from "@/lib/store";
import type { Perfil } from "@/lib/store";
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
import { Info } from "lucide-react";
import { toast } from "sonner";

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
