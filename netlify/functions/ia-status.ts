// Netlify Function (v2 API). Informa apenas SE a IA está configurada
// (ANTHROPIC_API_KEY presente) — nunca expõe o valor da variável, só um
// booleano, no mesmo padrão de notify-status.ts.

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "GET") {
    return jsonResponse({ ok: false, motivo: "metodo_nao_permitido" }, 405);
  }

  return jsonResponse({ configurado: Boolean(process.env.ANTHROPIC_API_KEY) });
};
