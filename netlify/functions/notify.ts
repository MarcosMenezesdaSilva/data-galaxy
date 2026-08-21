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

// Serializa em JSON escapando todo caractere fora da faixa ASCII básica como
// sequência de escape. Usado só no payload para o Teams: o fluxo de Power
// Automate (Workflows do Teams) estava corrompendo emoji/acentuação mesmo
// com o corpo em UTF-8 e o charset declarado no header — provavelmente uma
// etapa intermediária do fluxo decodificando com outro charset. A sequência
// de escape é puro ASCII na esteira da requisição, então não tem como ser
// mal-interpretada; qualquer parser JSON decodifica de volta pro caractere
// certo do outro lado.
function jsonEscapandoUnicode(valor: unknown): string {
  const texto = JSON.stringify(valor);
  let saida = "";
  for (let i = 0; i < texto.length; i++) {
    const codigo = texto.charCodeAt(i);
    saida += codigo > 127 ? "\\u" + codigo.toString(16).padStart(4, "0") : texto[i];
  }
  return saida;
}

// Números digitados sem DDI são assumidos como Brasil (+55) — a maioria dos
// usuários do MVP é daqui, e esquecer o "+55" era a causa mais comum de
// "canal não configurado" (na real, o número é que estava inválido para a
// Twilio). Se já vier com "+", respeita como está (permite outros países).
function normalizarNumero(numero: string): string {
  const bruto = numero.trim();
  if (bruto.startsWith("+")) return bruto;
  const digitos = bruto.replace(/\D/g, "");
  return `+55${digitos}`;
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
      console.error(`[notify] Twilio rejeitou o envio para ${params.to}: ${detalhe}`);
      return { ok: false, motivo: "falha_envio", detalhe };
    }
    // A Twilio aceita (2xx) assim que a mensagem entra na fila — isso NÃO
    // garante entrega. Logamos sid/status para conferir depois em Monitor →
    // Logs → Messaging no console da Twilio, ou pelo Message SID direto.
    try {
      const okJson = (await resp.json()) as { sid?: string; status?: string };
      console.log(
        `[notify] Twilio aceitou o envio para ${params.to} — sid=${okJson.sid} status=${okJson.status}`,
      );
    } catch {
      // corpo de sucesso não era JSON (não deveria acontecer) — ignora
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
      headers: { "content-type": "application/json; charset=utf-8" },
      // Corpo serializado escapando Unicode (ver jsonEscapandoUnicode) — o
      // charset no header sozinho não bastou para o Power Automate preservar
      // emoji/acentuação.
      body: jsonEscapandoUnicode({
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

  const destinoNormalizado = destinoBruto.startsWith("whatsapp:")
    ? destinoBruto
    : normalizarNumero(destinoBruto);
  const to =
    canal === "whatsapp"
      ? destinoNormalizado.startsWith("whatsapp:")
        ? destinoNormalizado
        : `whatsapp:${destinoNormalizado}`
      : destinoNormalizado;

  // WhatsApp interpreta *texto* como negrito — deixa o título em destaque.
  // SMS é texto puro; asteriscos apareceriam literalmente, então não usamos.
  const prefixo = canal === "whatsapp" ? `*${titulo}*` : titulo;

  console.log(`[notify] Pedido recebido: canal=${canal} destino=***${to.slice(-4)} from=${from}`);

  const resultado = await enviarTwilio({
    accountSid,
    authToken,
    from,
    to,
    corpo: `${prefixo}\n\n${mensagem}`,
  });

  return jsonResponse(resultado);
};
