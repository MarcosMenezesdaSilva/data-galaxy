// Netlify Function (v2 API). Informa apenas SE o Databricks está configurado
// (DATABRICKS_HOST, DATABRICKS_WAREHOUSE_ID, DATABRICKS_TOKEN presentes) —
// nunca expõe os valores, só um booleano, no mesmo padrão de notify-status.ts
// e ia-status.ts.

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

  const configurado = Boolean(
    process.env.DATABRICKS_HOST &&
    process.env.DATABRICKS_WAREHOUSE_ID &&
    process.env.DATABRICKS_TOKEN,
  );

  return jsonResponse({ configurado });
};
