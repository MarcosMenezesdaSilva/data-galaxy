// Netlify Function (v2 API). Proxy para a Messages API da Anthropic — existe
// pelo mesmo motivo da function do Databricks: o navegador não deve chamar a
// API externa direto (a key ficaria visível em qualquer devtools de quem
// abrir o site), e essa function nunca loga nem guarda a key em disco.
//
// A key vem de variável de ambiente (ANTHROPIC_API_KEY / ANTHROPIC_MODEL) —
// diferente do Databricks, aqui não faz sentido pedir pro Administrador
// digitar a key toda vez: o Assistente precisa funcionar pra qualquer pessoa
// que abrir o link publicado, não só em quem já configurou o próprio
// navegador. O risco de expor essa function pra qualquer visitante é baixo
// (pior caso: alguém gasta crédito de API mandando pergunta), diferente do
// Databricks, que dá acesso de leitura a um catálogo de dados real — por
// isso os dois ficaram com tratamento diferente.
//
// O modelo só responde com base nos FATOS e ARTIGOS que a gente manda no
// prompt (calculados/recuperados no cliente a partir dos dados reais) — o
// system prompt proíbe explicitamente inventar números ou nomes que não
// estejam ali. Isso preserva o mesmo compromisso do motor de regras antigo:
// nunca alegar um dado que a base não sustenta.

type ArtigoContexto = {
  titulo: string;
  categoria: string;
  produto: string;
  causa_raiz: string;
  solucao: string;
};

type TelaContexto = {
  nome: string;
  descricao: string;
};

type PedidoIA = {
  pergunta?: string;
  fatos?: string;
  artigos?: ArtigoContexto[];
  // Presente só nas chamadas do agente flutuante "Orbi" (um por tela) —
  // ausente aqui significa a chamada do Assistente geral (tela /assistente),
  // que mantém a persona original.
  tela?: TelaContexto;
};

type RespostaIA = { ok: true; resposta: string } | { ok: false; motivo: string; detalhe?: string };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const REGRAS_COMUNS = `Regras rígidas:
- Existem dois tipos de pergunta, e cada um tem sua própria fonte de verdade: (1) perguntas sobre NÚMEROS/DADOS (quantos, qual, quando, quem) — responda SOMENTE com base nos FATOS e ARTIGOS fornecidos na mensagem do usuário, nunca invente números, nomes de grupo/produto, causas raiz ou recomendações que não estejam explicitamente ali; (2) perguntas CONCEITUAIS sobre o produto (o que é isso, pra que serve essa tela/gráfico/funcionalidade, como funciona) — para essas, use livremente a descrição da tela atual e o conteúdo dos ARTIGOS "Tela: ..." que já estão no seu contexto (informados acima ou nos ARTIGOS), mesmo que o dado numérico exato não esteja nos FATOS. Nunca recuse explicar uma funcionalidade do produto só porque falta um número — combine o que você sabe sobre a tela com os FATOS que houver.
- Só diga "não tenho essa informação" quando a pergunta pedir um NÚMERO/DADO específico que realmente não está nos FATOS nem nos ARTIGOS — nunca para perguntas conceituais sobre o que o produto faz.
- Se um ARTIGO for usado na resposta, cite o título dele entre aspas.
- Estrutura da resposta, nesta ordem: (1) responda a pergunta feita diretamente, na primeira frase, citando o número/fato exato dos FATOS; (2) opcionalmente, UMA frase de recomendação prática; (3) só inclua um FATO adicional se ele for sobre o mesmo assunto perguntado — nunca troque de assunto (ex.: se perguntarem sobre grupo mais sobrecarregado, não desvie pra falar do incidente mais urgente, que é outro assunto).
- Máximo 3 frases no total. Direto ao ponto, sem rodeios nem ressalvas longas.
- Responda em português do Brasil, sem markdown (não use asteriscos, listas ou títulos).
- Você é uma camada de apoio à decisão — não afirme certezas absolutas sobre o futuro, fale em termos de risco e probabilidade quando for o caso.`;

// Sem `tela`: persona original do Assistente geral (tela /assistente). Com
// `tela`: persona da Orbi, o agente flutuante que aparece em cima de
// cada tela do painel — mesmo motor e mesmas regras de grounding, só muda a
// apresentação e o escopo preferencial de resposta.
function montarSystemPrompt(tela?: TelaContexto): string {
  const intro = tela
    ? `Você é a Orbi, a assistente de IA do Data Galaxy (plataforma de AIOps preditivo para incidentes e OLA da Locaweb, Challenge FIAP x Locaweb) que aparece flutuando sobre cada tela do painel para tirar dúvidas sobre ela. Agora você está sobre a tela "${tela.nome}": ${tela.descricao} Priorize responder sobre o que essa tela mostra; se a pergunta for sobre outro assunto do produto, responda normalmente com os FATOS fornecidos, sem recusar.`
    : `Você é o Assistente do Data Galaxy, uma plataforma de AIOps preditivo para incidentes e OLA da Locaweb (Challenge FIAP x Locaweb).`;
  return `${intro}\n\n${REGRAS_COMUNS}`;
}

function montarMensagem(pergunta: string, fatos: string, artigos: ArtigoContexto[]): string {
  const blocoArtigos = artigos.length
    ? artigos
        .map(
          (a) =>
            `- "${a.titulo}" (${a.categoria} · ${a.produto}) — causa raiz: ${a.causa_raiz}. Solução: ${a.solucao}`,
        )
        .join("\n")
    : "Nenhum artigo da Base de Conhecimento relevante para esta pergunta foi encontrado.";

  return `Pergunta do usuário: ${pergunta}

FATOS (dados operacionais em tempo real, calculados agora sobre a base carregada):
${fatos}

ARTIGOS RELEVANTES DA BASE DE CONHECIMENTO:
${blocoArtigos}`;
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, motivo: "metodo_nao_permitido" }, 405);
  }

  let body: PedidoIA;
  try {
    body = (await req.json()) as PedidoIA;
  } catch {
    return jsonResponse({ ok: false, motivo: "requisicao_invalida" }, 400);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5";
  const pergunta = body.pergunta?.trim();
  const fatos = body.fatos?.trim() || "Nenhum dado disponível.";
  const artigos = body.artigos ?? [];
  const tela = body.tela;

  if (!apiKey) {
    return jsonResponse({ ok: false, motivo: "nao_configurado" } satisfies RespostaIA);
  }
  if (!pergunta) {
    return jsonResponse(
      { ok: false, motivo: "requisicao_invalida", detalhe: "Preencha a pergunta." },
      400,
    );
  }

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        system: montarSystemPrompt(tela),
        messages: [{ role: "user", content: montarMensagem(pergunta, fatos, artigos) }],
      }),
    });

    if (!resp.ok) {
      let detalhe = `Anthropic respondeu status ${resp.status}`;
      try {
        const errJson = (await resp.json()) as { error?: { message?: string } };
        if (errJson?.error?.message) detalhe = errJson.error.message;
      } catch {
        // corpo de erro não era JSON — mantém detalhe genérico
      }
      return jsonResponse({ ok: false, motivo: "falha_ia", detalhe } satisfies RespostaIA);
    }

    const dados = (await resp.json()) as { content?: { type: string; text?: string }[] };
    const texto = dados.content?.find((c) => c.type === "text")?.text?.trim();

    if (!texto) {
      return jsonResponse({
        ok: false,
        motivo: "resposta_vazia",
        detalhe: "A IA não retornou texto.",
      } satisfies RespostaIA);
    }

    return jsonResponse({ ok: true, resposta: texto } satisfies RespostaIA);
  } catch (err) {
    return jsonResponse({
      ok: false,
      motivo: "erro_rede",
      detalhe: err instanceof Error ? err.message : "Erro de rede ao contatar a Anthropic",
    } satisfies RespostaIA);
  }
};
