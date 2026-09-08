// Cliente do gate de senha do Administrador (netlify/functions/admin-login.ts).
// O "autenticado" fica em sessionStorage — some ao fechar a aba, então quem
// abre o link do zero sempre precisa da senha de novo; não é uma sessão
// assinada de verdade, só o suficiente pra não deixar o perfil admin (e as
// integrações que ele acessa em Configurações) acessível só por conhecer a URL.

const CHAVE_SESSAO = "data-galaxy-admin-ok";

export function adminAutenticadoNestaSessao(): boolean {
  try {
    return sessionStorage.getItem(CHAVE_SESSAO) === "1";
  } catch {
    return false;
  }
}

export function marcarAdminAutenticado() {
  try {
    sessionStorage.setItem(CHAVE_SESSAO, "1");
  } catch {
    // sessionStorage indisponível (ex.: modo privado bloqueando) — sem
    // como persistir, a pessoa só vai precisar digitar a senha de novo.
  }
}

export type ResultadoLoginAdmin =
  | { ok: true }
  | { ok: false; motivo: "senha_incorreta" | "nao_configurado" | "erro_rede" | string };

export async function verificarSenhaAdmin(senha: string): Promise<ResultadoLoginAdmin> {
  try {
    const resp = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ senha }),
    });
    return (await resp.json()) as ResultadoLoginAdmin;
  } catch {
    return { ok: false, motivo: "erro_rede" };
  }
}
