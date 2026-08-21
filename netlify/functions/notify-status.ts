// Netlify Function (v2 API). Informa apenas SE cada canal de notificação
// está configurado (variáveis de ambiente presentes) — nunca expõe os
// valores das variáveis, só um booleano por canal.

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

  const whatsapp = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM,
  );
  const sms = Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SMS_FROM,
  );
  const teams = Boolean(process.env.TEAMS_WEBHOOK_URL);

  return jsonResponse({ whatsapp, sms, teams });
};
