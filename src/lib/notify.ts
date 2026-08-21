// Cliente HTTP para o disparo real de notificações (Netlify Functions em
// netlify/functions/notify.ts e notify-status.ts). Nunca deixa a Promise
// rejeitar — qualquer erro de rede/parse (ex.: function não implantada em
// `bun run dev` local sem `netlify dev`) vira um resultado `ok: false`, para
// nenhuma tela quebrar por causa disso.

export type Canal = "whatsapp" | "sms" | "teams";

export interface NotificarInput {
  canal: Canal;
  destinatario?: string;
  titulo: string;
  mensagem: string;
}

export interface NotificarResultado {
  ok: boolean;
  motivo?: string;
  detalhe?: string;
}

export interface StatusCanais {
  whatsapp: boolean;
  sms: boolean;
  teams: boolean;
  // Número do sandbox do WhatsApp e código de entrada — não são segredos,
  // são justamente o que precisa chegar em quem vai receber a notificação
  // para essa pessoa fazer o opt-in mandando a mensagem pro Twilio.
  whatsappNumero: string | null;
  whatsappJoinCode: string | null;
}

// Link de "clique para conversar" do WhatsApp, já com o texto do código de
// entrada preenchido — abrir isso (ou escanear o QR code do mesmo link) joga
// a pessoa direto no chat com o número do sandbox, só falta apertar enviar.
export function linkOptInWhatsapp(status: StatusCanais): string | null {
  if (!status.whatsappNumero) return null;
  const numero = status.whatsappNumero.replace(/[^\d]/g, "");
  const texto = status.whatsappJoinCode || "Olá! Quero receber notificações do Data Galaxy.";
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export async function enviarNotificacao(input: NotificarInput): Promise<NotificarResultado> {
  try {
    const resp = await fetch("/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await resp.json()) as NotificarResultado;
    return data;
  } catch {
    return { ok: false, motivo: "erro_rede" };
  }
}

export async function statusCanaisNotificacao(): Promise<StatusCanais> {
  try {
    const resp = await fetch("/api/notify-status");
    const data = (await resp.json()) as StatusCanais;
    return {
      whatsapp: Boolean(data.whatsapp),
      sms: Boolean(data.sms),
      teams: Boolean(data.teams),
      whatsappNumero: data.whatsappNumero ?? null,
      whatsappJoinCode: data.whatsappJoinCode ?? null,
    };
  } catch {
    return {
      whatsapp: false,
      sms: false,
      teams: false,
      whatsappNumero: null,
      whatsappJoinCode: null,
    };
  }
}
