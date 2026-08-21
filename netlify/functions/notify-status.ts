// Netlify Function (v2 API). Informa apenas SE cada canal de notificação
// está configurado (variáveis de ambiente presentes) — nunca expõe os
// valores das variáveis, só um booleano por canal.
//
// Exceção deliberada: o número do sandbox do WhatsApp (TWILIO_WHATSAPP_FROM)
// e o código de entrada (TWILIO_WHATSAPP_JOIN_CODE) não são segredos — são
// justamente os dados que precisam ser entregues a quem vai receber
// notificação, para essa pessoa mandar a mensagem de opt-in pro Twilio. Por
// isso, só esses dois campos saem em texto puro quando existirem.

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

  const whatsappNumero = process.env.TWILIO_WHATSAPP_FROM?.replace(/^whatsapp:/, "") || null;
  const whatsappJoinCode = process.env.TWILIO_WHATSAPP_JOIN_CODE || null;

  return jsonResponse({ whatsapp, sms, teams, whatsappNumero, whatsappJoinCode });
};
