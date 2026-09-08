// Netlify Function (v2 API). Gate de senha pro perfil Administrador — existe
// porque este app não tem autenticação real (qualquer um que abrir o link
// podia virar admin só clicando). A senha fica só como variável de ambiente
// (ADMIN_PASSWORD) — nunca no bundle JS, nunca logada. A comparação roda
// aqui no servidor; o cliente só recebe { ok: true/false }.
//
// Isso não é um sistema de autenticação de verdade (não emite token
// assinado, não expira sessão) — é um gate simples o suficiente pra impedir
// que quem só tem o link do site acesse Configurações (Databricks, IA), sem
// depender de ninguém confiar em "não clique em Administrador".

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, motivo: "metodo_nao_permitido" }, 405);
  }

  const senhaEsperada = process.env.ADMIN_PASSWORD;
  if (!senhaEsperada) {
    return jsonResponse({ ok: false, motivo: "nao_configurado" });
  }

  let body: { senha?: string };
  try {
    body = (await req.json()) as { senha?: string };
  } catch {
    return jsonResponse({ ok: false, motivo: "requisicao_invalida" }, 400);
  }

  const senha = body.senha ?? "";
  if (senha !== senhaEsperada) {
    return jsonResponse({ ok: false, motivo: "senha_incorreta" });
  }

  return jsonResponse({ ok: true });
};
