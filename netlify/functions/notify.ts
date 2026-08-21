// Netlify Function (v2 API — Web Request/Response, runtime Node).
// Dispara notificações reais via Twilio (WhatsApp/SMS) ou webhook do Teams.
// Nenhuma credencial fica no código: tudo é lido de variáveis de ambiente em
// runtime (configuradas no painel do Netlify). Quando as variáveis não
// existem, a function responde `{ ok: false, motivo: "nao_configurado" }`
// em vez de erro — isso é esperado antes da configuração real.

type Canal = "whatsapp" | "sms" | "teams";

interface NotifyBody {
  canal: Canal;
  destinatario?: string;
  titulo: string;
  mensagem: string;
}

type EnvioResultado = { ok: true } | { ok: false; motivo: "falha_envio"; detalhe: string };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isCanalValido(v: unknown): v is Canal {
  return v === "whatsapp" || v === "sms" || v === "teams";
}

async function enviarTwilio(params: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  corpo: string;
}): Promise<EnvioResultado> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${params.accountSid}/Messages.json`;
  const form = new URLSearchParams();
  form.set("To", params.to);
  form.set("From", params.from);
  form.set("Body", params.corpo);
  const auth = Buffer.from(`${params.accountSid}:${params.authToken}`).toString("base64");

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!resp.ok) {
      let detalhe = `Twilio respondeu status ${resp.status}`;
      try {
        const errJson = (await resp.json()) as { message?: string };
        if (errJson?.message) detalhe = errJson.message;
      } catch {
        // corpo de erro não era JSON — mantém detalhe genérico acima
      }
      return { ok: false, motivo: "falha_envio", detalhe };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      motivo: "falha_envio",
      detalhe: err instanceof Error ? err.message : "Erro de rede ao contatar o Twilio",
    };
  }
}

async function enviarTeams(
  webhookUrl: string,
  titulo: string,
  mensagem: string,
): Promise<EnvioResultado> {
  try {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        summary: titulo,
        themeColor: "FF5A47",
        title: titulo,
        text: mensagem,
      }),
    });
    if (!resp.ok) {
      return { ok: false, motivo: "falha_envio", detalhe: `Teams respondeu status ${resp.status}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      motivo: "falha_envio",
      detalhe: err instanceof Error ? err.message : "Erro de rede ao contatar o webhook do Teams",
    };
  }
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, motivo: "metodo_nao_permitido" }, 405);
  }

  let body: Partial<NotifyBody>;
  try {
    body = (await req.json()) as Partial<NotifyBody>;
  } catch {
    return jsonResponse({ ok: false, motivo: "requisicao_invalida" }, 400);
  }

  const { canal, destinatario, titulo, mensagem } = body;
  if (!isCanalValido(canal) || !titulo?.trim() || !mensagem?.trim()) {
    return jsonResponse({ ok: false, motivo: "requisicao_invalida" }, 400);
  }

  if (canal === "teams") {
    const webhook = process.env.TEAMS_WEBHOOK_URL;
    if (!webhook) {
      return jsonResponse({ ok: false, motivo: "nao_configurado" });
    }
    const resultado = await enviarTeams(webhook, titulo, mensagem);
    return jsonResponse(resultado);
  }

  // whatsapp | sms — via Twilio
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from =
    canal === "whatsapp" ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_SMS_FROM;

  if (!accountSid || !authToken || !from) {
    return jsonResponse({ ok: false, motivo: "nao_configurado" });
  }

  const destinoBruto =
    destinatario?.trim() ||
    (canal === "whatsapp"
      ? process.env.NOTIFY_DEFAULT_WHATSAPP_TO
      : process.env.NOTIFY_DEFAULT_SMS_TO);

  if (!destinoBruto) {
    return jsonResponse({ ok: false, motivo: "nao_configurado" });
  }

  const to =
    canal === "whatsapp"
      ? destinoBruto.startsWith("whatsapp:")
        ? destinoBruto
        : `whatsapp:${destinoBruto}`
      : destinoBruto;

  const resultado = await enviarTwilio({
    accountSid,
    authToken,
    from,
    to,
    corpo: `${titulo}\n\n${mensagem}`,
  });

  return jsonResponse(resultado);
};
