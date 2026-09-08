import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import { verificarSenhaAdmin, marcarAdminAutenticado } from "@/lib/admin-auth";

// Diálogo de senha exigido antes de entrar como Administrador — some perfil
// nenhum de verdade requer senha neste MVP, mas o admin acessa Configurações
// (integrações com Databricks e a IA), então esse é o único que precisa de
// um gate real. Ver netlify/functions/admin-login.ts e src/lib/admin-auth.ts.
export function AdminPasswordDialog({
  open,
  onOpenChange,
  onSucesso,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSucesso: () => void;
}) {
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    if (!senha.trim()) return;
    setEnviando(true);
    setErro(null);
    const resultado = await verificarSenhaAdmin(senha);
    setEnviando(false);
    if (resultado.ok) {
      marcarAdminAutenticado();
      setSenha("");
      onOpenChange(false);
      onSucesso();
      return;
    }
    setErro(
      resultado.motivo === "senha_incorreta"
        ? "Senha incorreta."
        : resultado.motivo === "nao_configurado"
          ? "O acesso de Administrador ainda não foi configurado (variável ADMIN_PASSWORD ausente)."
          : "Não foi possível verificar a senha agora.",
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setSenha("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Acesso de Administrador
          </DialogTitle>
          <DialogDescription>
            O perfil Administrador acessa integrações sensíveis (Databricks, IA) — digite a senha
            pra continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="senha-admin">Senha</Label>
          <Input
            id="senha-admin"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmar();
            }}
            autoFocus
          />
          {erro && <p className="text-xs text-[color:var(--critical)]">{erro}</p>}
        </div>

        <DialogFooter>
          <Button onClick={confirmar} disabled={enviando || !senha.trim()} className="w-full">
            {enviando ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
            {enviando ? "Verificando..." : "Entrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
