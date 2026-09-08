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
//
// Importante: essa function SÓ inicia a consulta e espera pouco (wait_timeout
// curto) — NÃO fica em loop esperando terminar. Consultas mais pesadas (ex.:
// os JOINs de sincronização) podem levar bem mais do que os ~10s que uma
// function síncrona do Netlify tolera antes de ser matada — foi exatamente
// isso que quebrou aqui da primeira vez. Quem faz o polling até terminar é o
// navegador, chamando databricks-status.ts (na verdade, este mesmo endpoint
// aceita `statementId` em vez de `statement` pra continuar consultando um
// statement já iniciado) repetidamente — ver src/lib/databricks.ts.

type DatabricksBody = {
  statement?: string;
  statementId?: string;
};

type ColunaResultado = { nome: string; tipo: string };
type QueryResultado =
  | { ok: true; colunas: ColunaResultado[]; linhas: unknown[][]; truncado: boolean }
  | { ok: false; pendente: true; statementId: string }
  | { ok: false; pendente?: false; motivo: string; detalhe?: string };

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

interface ExternalLink {
  chunk_index: number;
  row_offset: number;
  row_count: number;
  external_link: string;
  next_chunk_index?: number;
  next_chunk_internal_link?: string;
}

interface StatementStatus {
  statement_id: string;
  status: { state: string; error?: { message?: string } };
  manifest?: { schema?: { columns?: { name: string; type_name: string }[] }; truncated?: boolean };
  result?: { data_array?: unknown[][]; external_links?: ExternalLink[] };
}

// Consultas cujo resultado passa de 25 MB (ex.: o JOIN completo de incidentes,
// ~120 mil linhas) não cabem no modo INLINE padrão da Statement Execution API
// — o Databricks devolve o erro "Inline byte limit exceeded" e pede
// disposition=EXTERNAL_LINKS. Nesse modo o resultado vem em um ou mais
// "chunks", cada um com uma URL pré-assinada (external_link) pra baixar o
// JSON puro direto do storage (sem precisar do token do Databricks) — e,
// se houver mais chunks, um next_chunk_internal_link pra pedir o próximo.
// Isso baixa e concatena todos os chunks antes de responder ao cliente, pra
// manter o contrato de resposta (um array `linhas` já completo) igual ao que
// o resto do app espera.
async function coletarExternalLinks(
  host: string,
  token: string,
  primeiroLote: ExternalLink[],
): Promise<unknown[][]> {
  const linhas: unknown[][] = [];
  let lote: ExternalLink[] = primeiroLote;

  while (lote.length > 0) {
    const paginas = await Promise.all(
      lote.map(async (link) => {
        const resp = await fetch(link.external_link);
        return (await resp.json()) as unknown[][];
      }),
    );
    for (const pagina of paginas) linhas.push(...pagina);

    const ultimo = lote[lote.length - 1];
    if (ultimo.next_chunk_internal_link) {
      const resp = await fetch(`https://${host}${ultimo.next_chunk_internal_link}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dados = (await resp.json()) as { external_links?: ExternalLink[] };
      lote = dados.external_links ?? [];
    } else {
      lote = [];
    }
  }

  return linhas;
}

async function interpretarStatus(
  dados: StatementStatus,
  host: string,
  token: string,
): Promise<QueryResultado> {
  const estado = dados.status?.state;

  if (estado === "PENDING" || estado === "RUNNING") {
    return { ok: false, pendente: true, statementId: dados.statement_id };
  }

  if (estado !== "SUCCEEDED") {
    return {
      ok: false,
      motivo: "consulta_falhou",
      detalhe: dados.status?.error?.message ?? `Estado: ${estado}`,
    };
  }

  const colunasBrutas = dados.manifest?.schema?.columns ?? [];
  const colunas: ColunaResultado[] = colunasBrutas.map((c) => ({
    nome: c.name,
    tipo: c.type_name,
  }));

  const linhas = dados.result?.external_links
    ? await coletarExternalLinks(host, token, dados.result.external_links)
    : (dados.result?.data_array ?? []);

  return {
    ok: true,
    colunas,
    linhas,
    truncado: Boolean(dados.manifest?.truncated),
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

  const token = process.env.DATABRICKS_TOKEN;
  const warehouseId = process.env.DATABRICKS_WAREHOUSE_ID;
  const host = process.env.DATABRICKS_HOST ? limparHost(process.env.DATABRICKS_HOST) : undefined;

  if (!host || !token || !warehouseId) {
    return jsonResponse({ ok: false, motivo: "nao_configurado" } satisfies QueryResultado);
  }

  try {
    // Continuando um statement que já estava rodando.
    if (body.statementId) {
      const resp = await fetch(`https://${host}/api/2.0/sql/statements/${body.statementId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dados = (await resp.json()) as StatementStatus;
      return jsonResponse(await interpretarStatus(dados, host, token));
    }

    if (!body.statement?.trim()) {
      return jsonResponse(
        { ok: false, motivo: "requisicao_invalida", detalhe: "Preencha a consulta." },
        400,
      );
    }

    const resp = await fetch(`https://${host}/api/2.0/sql/statements`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        warehouse_id: warehouseId,
        statement: body.statement,
        wait_timeout: "5s",
        // Resultados grandes (ex.: o JOIN completo de incidentes, ~120 mil
        // linhas) passam do limite de 25 MB do modo INLINE padrão — pedir
        // EXTERNAL_LINKS de saída sempre é seguro mesmo pra consultas
        // pequenas (o Databricks devolve inline via link do mesmo jeito).
        disposition: "EXTERNAL_LINKS",
        format: "JSON_ARRAY",
      }),
    });

    if (!resp.ok) {
      let detalhe = `Databricks respondeu status ${resp.status}`;
      try {
        const errJson = (await resp.json()) as { message?: string; error_code?: string };
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

    const dados = (await resp.json()) as StatementStatus;
    return jsonResponse(await interpretarStatus(dados, host, token));
  } catch (err) {
    return jsonResponse({
      ok: false,
      motivo: "erro_rede",
      detalhe: err instanceof Error ? err.message : "Erro de rede ao contatar o Databricks",
    } satisfies QueryResultado);
  }
};
