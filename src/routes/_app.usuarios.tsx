import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Trash2, Pencil, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { USUARIOS } from "@/lib/store";
import { ROTAS_ATRIBUIVEIS } from "@/lib/nav";
import { ROTAS_POR_PERFIL } from "@/lib/permissions";
import {
  useUsuariosCustom,
  criarUsuario,
  excluirUsuario,
  atualizarRotasUsuario,
} from "@/lib/usuarios";
import { fmtDateTime } from "@/lib/format";
import type { UsuarioCustom } from "@/lib/types";

export const Route = createFileRoute("/_app/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Data Galaxy" }] }),
  component: UsuariosPage,
});

function labelRota(to: string): string {
  return ROTAS_ATRIBUIVEIS.find((r) => r.to === to)?.label ?? to;
}

function UsuariosPage() {
  const usuarios = useUsuariosCustom();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<UsuarioCustom | null>(null);

  function abrirCriacao() {
    setEditando(null);
    setDialogAberto(true);
  }

  function abrirEdicao(u: UsuarioCustom) {
    setEditando(u);
    setDialogAberto(true);
  }

  async function excluir(u: UsuarioCustom) {
    await excluirUsuario(u.id);
    toast.success(`Usuário ${u.nome} removido.`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        subtitle="Cria perfis demonstrativos com acesso configurável por tela — sem senha, mesmo modelo dos perfis fixos"
        actions={
          <Button size="sm" onClick={abrirCriacao}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Criar usuário
          </Button>
        }
      />

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm font-semibold">Perfis fixos</div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Vêm com o produto, não podem ser excluídos. Administrador exige senha real (Configurações
          não muda isso).
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Acesso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.values(USUARIOS).map((u) => {
              const rotas = ROTAS_POR_PERFIL[u.id];
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{u.cargo}</TableCell>
                  <TableCell>
                    {rotas === "todas" ? (
                      <Badge variant="outline" className="gap-1">
                        <ShieldCheck className="h-3 w-3" /> Todas as telas
                      </Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {rotas.map((r) => (
                          <Badge key={r} variant="secondary" className="text-[10px]">
                            {labelRota(r)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-semibold mb-1">Usuários criados</div>
        <p className="text-xs text-muted-foreground mb-4">
          Aparecem como mais um card na tela de login — sem senha, só a lista de telas que você
          escolher abaixo.
        </p>
        {usuarios === undefined ? (
          <div className="text-sm text-muted-foreground text-center py-6">Carregando...</div>
        ) : usuarios.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            Nenhum usuário criado ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Telas permitidas</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{u.cargo}</TableCell>
                  <TableCell>
                    {u.rotas.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Nenhuma</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {u.rotas.map((r) => (
                          <Badge key={r} variant="secondary" className="text-[10px]">
                            {labelRota(r)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDateTime(u.criadoEm)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => abrirEdicao(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-[color:var(--critical)]" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir {u.nome}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              A pessoa deixa de aparecer na tela de login. Se estiver com a sessão
                              aberta em algum navegador, perde o acesso na próxima navegação.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => excluir(u)}>
                              Confirmar exclusão
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <UsuarioDialog open={dialogAberto} onOpenChange={setDialogAberto} usuario={editando} />
    </div>
  );
}

function UsuarioDialog({
  open,
  onOpenChange,
  usuario,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  usuario: UsuarioCustom | null;
}) {
  const editando = usuario !== null;
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [cargo, setCargo] = useState(usuario?.cargo ?? "");
  const [rotas, setRotas] = useState<Set<string>>(new Set(usuario?.rotas ?? []));
  const [salvando, setSalvando] = useState(false);

  // Reabre o form limpo (ou pré-preenchido, se for edição) toda vez que o
  // diálogo é aberto — evita carregar estado da última vez que foi usado.
  function onOpenChangeInterno(v: boolean) {
    if (v) {
      setNome(usuario?.nome ?? "");
      setCargo(usuario?.cargo ?? "");
      setRotas(new Set(usuario?.rotas ?? []));
    }
    onOpenChange(v);
  }

  function alternarRota(to: string, marcado: boolean) {
    setRotas((atual) => {
      const nova = new Set(atual);
      if (marcado) nova.add(to);
      else nova.delete(to);
      return nova;
    });
  }

  async function salvar() {
    if (!nome.trim() || !cargo.trim()) {
      toast.error("Preencha nome e cargo.");
      return;
    }
    if (rotas.size === 0) {
      toast.error("Marque ao menos uma tela — sem nenhuma, o usuário não conseguiria ver nada.");
      return;
    }
    setSalvando(true);
    try {
      if (editando && usuario) {
        await atualizarRotasUsuario(usuario.id, Array.from(rotas));
        toast.success(`Acesso de ${usuario.nome} atualizado.`);
      } else {
        await criarUsuario({ nome, cargo, rotas: Array.from(rotas) });
        toast.success(`Usuário ${nome} criado — já aparece na tela de login.`);
      }
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar o usuário.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeInterno}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editando ? `Editar acesso — ${usuario?.nome}` : "Criar usuário"}
          </DialogTitle>
          <DialogDescription>
            Sem senha — a pessoa escolhe o card na tela de login, igual aos 3 perfis já existentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!editando && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="usuario-nome">Nome</Label>
                <Input
                  id="usuario-nome"
                  placeholder="Ex: Ana Souza"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="usuario-cargo">Cargo</Label>
                <Input
                  id="usuario-cargo"
                  placeholder="Ex: Analista de OLA"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Telas permitidas</Label>
            <div className="grid gap-1.5 sm:grid-cols-2 rounded-md border border-border p-3 max-h-72 overflow-y-auto">
              {ROTAS_ATRIBUIVEIS.map((r) => (
                <label
                  key={r.to}
                  className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent/40 cursor-pointer"
                >
                  <Checkbox
                    checked={rotas.has(r.to)}
                    onCheckedChange={(v) => alternarRota(r.to, v === true)}
                  />
                  <r.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{r.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {editando ? "Salvar acesso" : "Criar usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
