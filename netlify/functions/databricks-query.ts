// Netlify Function (v2 API). Proxy para a Statement Execution API do
// Databricks (POST /api/2.0/sql/statements) — existe só porque o navegador
// não pode chamar a API do Databricks direto sem CORS, e porque assim o
// token nunca aparece no corpo de uma resposta logada por engano em algum
// lugar do lado do cliente.
//
// A credencial (DATABRICKS_HOST, DATABRICKS_WAREHOUSE_ID, DATABRICKS_TOKEN)
// vem de variável de ambiente — assim quem o Administrador chamar pra testar
// já acessa sem precisar configurar nada no próprio navegador. Isso só é
// seguro porque o perfil Administrador (única rota até esta tela) exige
// senha real (ver netlify/functions/admin-login.ts); sem esse gate, esta
// function abriria um console de SQL livre pro catálogo real pra qualquer
// visitante do site.

type DatabricksBody = {
  statement?: string;
};

type ColunaResultado = { nome: string; tipo: string };
type QueryResultado =
  | { ok: true; colunas: ColunaResultado[]; linhas: unknown[][]; truncado: boolean }
  | { ok: false; motivo: string; detalhe?: string };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Aceita o valor colado de qualquer jeito — com "https://" na frente, com
// caminho sobrando no final (ex.: ".../oidc" de alguma aba de login aberta),
// com ou sem barra final — e devolve só o hostname puro. Usa a própria API
// URL do navegador/runtime pra não reinventar parsing de URL na unha.
function limparHost(hostBruto: string): string {
  const bruto = hostBruto.trim();
  const comProtocolo = /^https?:\/\//.test(bruto) ? bruto : `https://${bruto}`;
  try {
    return new URL(comProtocolo).host;
  } catch {
    return bruto.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
}

interface StatementStatus {
  statement_id: string;
  status: { state: string; error?: { message?: string } };
  manifest?: { schema?: { columns?: { name: string; type_name: string }[] }; truncated?: boolean };
  result?: { data_array?: unknown[][] };
}

async function aguardarConclusao(
  host: string,
  token: string,
  statementId: string,
): Promise<StatementStatus> {
  // A API pode responder PENDING/RUNNING mesmo com wait_timeout — faz um
  // polling curto (até ~25s no total) antes de desistir.
  for (let tentativa = 0; tentativa < 12; tentativa++) {
    const resp = await fetch(`https://${host}/api/2.0/sql/statements/${statementId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dados = (await resp.json()) as StatementStatus;
    if (dados.status?.state !== "PENDING" && dados.status?.state !== "RUNNING") return dados;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return {
    statement_id: statementId,
    status: { state: "TIMEOUT", error: { message: "A consulta demorou demais para responder." } },
  };
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, motivo: "metodo_nao_permitido" }, 405);
  }

  let body: DatabricksBody;
  try {
    body = (await req.json()) as DatabricksBody;
  } catch {
    return jsonResponse({ ok: false, motivo: "requisicao_invalida" }, 400);
  }

  const { statement } = body;
  const token = process.env.DATABRICKS_TOKEN;
  const warehouseId = process.env.DATABRICKS_WAREHOUSE_ID;
  const host = process.env.DATABRICKS_HOST ? limparHost(process.env.DATABRICKS_HOST) : undefined;

  if (!host || !token || !warehouseId) {
    return jsonResponse({ ok: false, motivo: "nao_configurado" } satisfies QueryResultado);
  }
  if (!statement?.trim()) {
    return jsonResponse(
      { ok: false, motivo: "requisicao_invalida", detalhe: "Preencha a consulta." },
      400,
    );
  }

  try {
    const respInicial = await fetch(`https://${host}/api/2.0/sql/statements`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        warehouse_id: warehouseId,
        statement,
        wait_timeout: "10s",
      }),
    });

    if (!respInicial.ok) {
      let detalhe = `Databricks respondeu status ${respInicial.status}`;
      try {
        const errJson = (await respInicial.json()) as { message?: string; error_code?: string };
        if (errJson?.message) detalhe = errJson.message;
      } catch {
        // corpo de erro não era JSON — mantém detalhe genérico
      }
      return jsonResponse({
        ok: false,
        motivo: "falha_databricks",
        detalhe,
      } satisfies QueryResultado);
    }

    let dados = (await respInicial.json()) as StatementStatus;
    if (dados.status?.state === "PENDING" || dados.status?.state === "RUNNING") {
      dados = await aguardarConclusao(host, token, dados.statement_id);
    }

    if (dados.status?.state !== "SUCCEEDED") {
      return jsonResponse({
        ok: false,
        motivo: "consulta_falhou",
        detalhe: dados.status?.error?.message ?? `Estado: ${dados.status?.state}`,
      } satisfies QueryResultado);
    }

    const colunasBrutas = dados.manifest?.schema?.columns ?? [];
    const colunas: ColunaResultado[] = colunasBrutas.map((c) => ({
      nome: c.name,
      tipo: c.type_name,
    }));
    const linhas = dados.result?.data_array ?? [];

    return jsonResponse({
      ok: true,
      colunas,
      linhas,
      truncado: Boolean(dados.manifest?.truncated),
    } satisfies QueryResultado);
  } catch (err) {
    return jsonResponse({
      ok: false,
      motivo: "erro_rede",
      detalhe: err instanceof Error ? err.message : "Erro de rede ao contatar o Databricks",
    } satisfies QueryResultado);
  }
};
