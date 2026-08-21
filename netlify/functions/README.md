# Netlify Functions — Data Galaxy

Duas functions serverless (API v2 do Netlify, Node runtime) que fazem o
disparo real de notificações. É o único lugar do projeto onde credenciais
podem existir — sempre lidas de variáveis de ambiente em runtime, nunca
commitadas no repositório.

- `notify.ts` — `POST /api/notify` (redirecionado para
  `/.netlify/functions/notify` via `netlify.toml`). Dispara WhatsApp/SMS
  (Twilio) ou Teams (webhook), conforme o `canal` enviado no body.
- `notify-status.ts` — `GET /api/notify-status`. Informa apenas se cada
  canal está configurado (`{ whatsapp, sms, teams }`, sempre booleano — nunca
  expõe os valores das variáveis).

## Variáveis de ambiente esperadas

| Variável                     | Uso                                                              |
| ----------------------------- | ----------------------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`          | Conta Twilio (WhatsApp e SMS)                                    |
| `TWILIO_AUTH_TOKEN`           | Token de autenticação Twilio (WhatsApp e SMS)                    |
| `TWILIO_WHATSAPP_FROM`        | Número remetente do WhatsApp, formato Twilio (`whatsapp:+1...`)  |
| `TWILIO_SMS_FROM`             | Número remetente do SMS                                          |
| `TEAMS_WEBHOOK_URL`           | URL do webhook de entrada (Incoming Webhook) do canal no Teams   |
| `NOTIFY_DEFAULT_WHATSAPP_TO`  | Destino padrão de WhatsApp para demonstração (opcional)          |
| `NOTIFY_DEFAULT_SMS_TO`       | Destino padrão de SMS para demonstração (opcional)                |

Sem essas variáveis, as functions respondem `{ ok: false, motivo: "nao_configurado" }`
em vez de erro — é o comportamento esperado até a configuração real ser feita.

## Como configurar em produção

No painel do Netlify: **Site settings → Environment variables**, adicione as
variáveis acima com os valores reais e faça um novo deploy (ou clique em
"Trigger deploy") para que a function passe a enxergá-las. Nunca coloque
valores reais no código-fonte, no `netlify.toml` ou em qualquer arquivo
versionado.
