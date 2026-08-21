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
    };
  } catch {
    return { whatsapp: false, sms: false, teams: false };
  }
}
