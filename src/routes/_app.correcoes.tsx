import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClassifBadge } from "@/components/Badges";
import { useAcoes } from "@/lib/hooks";
import { db } from "@/lib/db";
import { useApp } from "@/lib/store";
import { fmtDate } from "@/lib/format";
import { PRODUTOS, GRUPOS } from "@/lib/demo-data";
import type { AcaoCorretiva } from "@/lib/types";
import { Plus, Wrench, CheckCircle2, Clock, ListChecks } from "lucide-react";
import { toast } from "sonner";

const TIPOS = [
  "Reinício de serviço",
  "Ajuste de configuração",
  "Aumento de capacidade",
  "Correção de código",
  "Rollback",
  "Ajuste de monitoramento",
  "Mudança de infraestrutura",
  "Outro",
];

export const Route = createFileRoute("/_app/correcoes")({
  head: () => ({ meta: [{ title: "Ações Corretivas — Data Galaxy" }] }),
  component: CorrecoesPage,
});

function CorrecoesPage() {
  const acoes = useAcoes();
  const modo = useApp((s) => s.modo);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    numero: "",
    produto: "Hosting",
    grupo: "Infraestrutura",
    responsavel: "",
    tipo: "Reinício de serviço",
    descricao: "",
    causa: "",
  });

  async function criar() {
    if (!form.numero || !form.descricao) {
      toast.error("Preencha número do incidente e descrição.");
      return;
    }
    const acao: AcaoCorretiva = {
      id_acao: `ACT-${Date.now()}`,
      numero_incidente: form.numero,
      produto: form.produto,
      grupo_responsavel: form.grupo,
      responsavel: form.responsavel || "—",
      tipo_acao: form.tipo,
      descricao_acao: form.descricao,
      causa_provavel: form.causa,
      data_acao: new Date().toISOString(),
      status: "Planejada",
      classificacao: "Pendente",
      // Registro manual do usuário — herda a origem do modo atual, mas não é
      // um registro sintético gerado automaticamente para o seed do MVP.
      origem_dado: modo === "demo" ? "DEMONSTRACAO" : "IMPORTADO",
      gerado_para_mvp: false,
    };
    await db.acoes.add(acao);
    toast.success("Ação corretiva registrada");
    setOpen(false);
    setForm({
      numero: "",
      produto: "Hosting",
      grupo: "Infraestrutura",
      responsavel: "",
      tipo: "Reinício de serviço",
      descricao: "",
      causa: "",
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ações Corretivas"
        subtitle="Registre, acompanhe e valide o ciclo completo de correções"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1.5" /> Nova ação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova ação corretiva</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Número do incidente">
                    <Input
                      value={form.numero}
                      onChange={(e) => setForm({ ...form, numero: e.target.value })}
                      placeholder="INC0000000"
                    />
                  </FormField>
                  <FormField label="Responsável">
                    <Input
                      value={form.responsavel}
                      onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                      placeholder="Nome"
                    />
                  </FormField>
                  <FormField label="Produto">
                    <Select
                      value={form.produto}
                      onValueChange={(v) => setForm({ ...form, produto: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUTOS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Grupo">
                    <Select
                      value={form.grupo}
                      onValueChange={(v) => setForm({ ...form, grupo: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRUPOS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Tipo de ação">
                    <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Causa provável">
                    <Input
                      value={form.causa}
                      onChange={(e) => setForm({ ...form, causa: e.target.value })}
                    />
                  </FormField>
                </div>
                <FormField label="Descrição da ação">
                  <Textarea
                    rows={4}
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  />
                </FormField>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={criar}>Registrar ação</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MiniStat
          icon={<Wrench className="h-4 w-4" />}
          label="Total de ações"
          value={String(acoes.length)}
        />
        <MiniStat
          icon={<Clock className="h-4 w-4" />}
          label="Em validação"
          value={String(acoes.filter((a) => a.status === "Em validação").length)}
          accent="text-[color:var(--info)]"
        />
        <MiniStat
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Efetivas"
          value={String(acoes.filter((a) => a.classificacao === "Efetiva").length)}
          accent="text-[color:var(--success)]"
        />
        <MiniStat
          icon={<ListChecks className="h-4 w-4" />}
          label="Paliativas"
          value={String(acoes.filter((a) => a.classificacao === "Paliativa").length)}
          accent="text-[color:var(--warning)]"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Incidente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Classificação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {acoes.map((a) => (
              <TableRow key={a.id_acao}>
                <TableCell className="font-mono text-xs">{a.id_acao}</TableCell>
                <TableCell className="font-mono text-xs">{a.numero_incidente}</TableCell>
                <TableCell className="text-sm">{a.tipo_acao}</TableCell>
                <TableCell>{a.produto}</TableCell>
                <TableCell className="text-sm">{a.responsavel}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {fmtDate(a.data_acao)}
                </TableCell>
                <TableCell className="text-xs">{a.status}</TableCell>
                <TableCell>
                  <ClassifBadge c={a.classificacao} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-5">
        <div className="text-sm font-semibold mb-4">Timeline de uma ação típica</div>
        <div className="grid gap-4 md:grid-cols-5">
          {[
            { t: "Detecção", d: "Alerta preditivo" },
            { t: "Planejamento", d: "Ação atribuída" },
            { t: "Execução", d: "Aplicação no ambiente" },
            { t: "Validação", d: "Janela 7/15/30 dias" },
            { t: "Classificação", d: "Efetiva / Paliativa" },
          ].map((s, i) => (
            <div key={s.t} className="relative rounded-lg border border-border p-3">
              <div className="text-[10px] text-muted-foreground">Etapa {i + 1}</div>
              <div className="text-sm font-medium">{s.t}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.d}</div>
              <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
function MiniStat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`rounded-md bg-muted p-2 ${accent ?? "text-primary"}`}>{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </Card>
  );
}
