import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/Brand";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIncidentes, useAlertas, useRiscos, useAcoes, usePrevisoes } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { PRODUTOS, GRUPOS } from "@/lib/demo-data";
import { DashboardExecutivo } from "@/components/DashboardExecutivo";
import { DashboardOperacional } from "@/components/DashboardOperacional";
import { InsightAutomatico } from "@/components/InsightAutomatico";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Central de Operações — Data Galaxy" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { perfil } = useApp();
  const incidentes = useIncidentes();
  const alertas = useAlertas();
  const riscos = useRiscos();
  const acoes = useAcoes();
  const previsoes = usePrevisoes();
  const [produto, setProduto] = useState<string>("todos");
  const [prio, setPrio] = useState<string>("todas");
  const [grupo, setGrupo] = useState<string>("todos");

  const filtrados = useMemo(
    () =>
      incidentes.filter(
        (i) =>
          (produto === "todos" || i.produto === produto) &&
          (prio === "todas" || i.prioridade === prio) &&
          (grupo === "todos" || i.grupo_designado === grupo),
      ),
    [incidentes, produto, prio, grupo],
  );

  const incidentesPorNumero = useMemo(
    () => new Map(incidentes.map((i) => [i.numero_incidente, i])),
    [incidentes],
  );

  // Âncora temporal: a data mais recente presente na base carregada (em vez
  // do relógio da máquina), já que os dados demonstrativos são concentrados
  // em set-dez/2025 e uma base importada pode ter outra janela temporal.
  const dataAncora = useMemo(() => {
    if (!filtrados.length) return new Date();
    return new Date(Math.max(...filtrados.map((i) => new Date(i.data_abertura).getTime())));
  }, [filtrados]);

  const hoje = dataAncora.toDateString();
  const incHoje = filtrados.filter((i) => new Date(i.data_abertura).toDateString() === hoje).length;
  const criticos = riscos.filter((r) => r.faixa_risco === "Crítico" && r.status === "Ativo").length;
  // Capacidade de antecipação D+1/D+7 — critério explícito de avaliação do
  // desafio. Soma volume_previsto das previsões demonstrativas por horizonte.
  const prev1 = previsoes
    .filter((p) => p.horizonte === "D+1")
    .reduce((s, p) => s + p.volume_previsto, 0);
  const prev7 = previsoes
    .filter((p) => p.horizonte === "D+7")
    .reduce((s, p) => s + p.volume_previsto, 0);
  const ativos = alertas.filter((a) => a.status === "Novo" || a.status === "Em tratamento").length;
  const emVal = acoes.filter((a) => a.status === "Em validação").length;
  const efetivas = acoes.filter((a) => a.classificacao === "Efetiva").length;
  const paliativas = acoes.filter((a) => a.classificacao === "Paliativa").length;

  // Real vs previsto (últimos 14 dias, ancorados na data mais recente da base).
  // Estimador "Seasonal Naive" (citado no pitch do projeto, junto com AutoETS):
  // a previsão de um dia é o volume real observado no mesmo dia da semana
  // anterior — cálculo 100% determinístico a partir dos incidentes carregados.
  const serieVolumeSeasonalNaive = useMemo(() => {
    const contarPorDia = (dt: Date) => {
      const key = dt.toDateString();
      return filtrados.filter((i) => new Date(i.data_abertura).toDateString() === key).length;
    };
    const dias: { data: string; real: number; previsto: number }[] = [];
    for (let d = 13; d >= 0; d--) {
      const dt = new Date(dataAncora);
      dt.setDate(dt.getDate() - d);
      const semanaAnterior = new Date(dt);
      semanaAnterior.setDate(semanaAnterior.getDate() - 7);
      const real = contarPorDia(dt);
      const previsto = contarPorDia(semanaAnterior);
      dias.push({
        data: dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        real,
        previsto,
      });
    }
    return dias;
  }, [filtrados, dataAncora]);

  // Variação real semana a semana (para o banner de atenção da visão executiva)
  // — comparação entre os 7 dias mais recentes e os 7 dias imediatamente anteriores.
  const variacaoSemanal = useMemo(() => {
    const fimAtual = dataAncora.getTime();
    const inicioAtual = fimAtual - 7 * 86400000;
    const inicioAnterior = inicioAtual - 7 * 86400000;
    const semanaAtual = filtrados.filter((i) => {
      const t = new Date(i.data_abertura).getTime();
      return t > inicioAtual && t <= fimAtual;
    }).length;
    const semanaAnterior = filtrados.filter((i) => {
      const t = new Date(i.data_abertura).getTime();
      return t > inicioAnterior && t <= inicioAtual;
    }).length;
    const pct = semanaAnterior > 0 ? ((semanaAtual - semanaAnterior) / semanaAnterior) * 100 : 0;
    return { semanaAtual, semanaAnterior, pct };
  }, [filtrados, dataAncora]);

  const porGrupo = useMemo(() => {
    const map = new Map<string, number>();
    filtrados.forEach((i) => map.set(i.grupo_designado, (map.get(i.grupo_designado) ?? 0) + 1));
    return Array.from(map, ([grupo, total]) => ({ grupo, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filtrados]);

  const porPrio = useMemo(() => {
    const map: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 };
    filtrados.forEach((i) => {
      map[i.prioridade] = (map[i.prioridade] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtrados]);

  // Agrupamento por mês — alimenta o gráfico de tendência e o KPI mensal.
  const porMes = useMemo(() => {
    const m = new Map<string, number>();
    filtrados.forEach((i) => {
      const d = new Date(i.data_abertura);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return Array.from(m, ([mes, total]) => ({ mes, total })).sort((a, b) =>
      a.mes.localeCompare(b.mes),
    );
  }, [filtrados]);

  // Antes só mostrava os últimos 6 meses — com a base real completa
  // (2023-2025) isso escondia todo o histórico anterior ao pico de
  // set/2025. O gráfico agora recebe o período inteiro e usa zoom/pan
  // (Brush) pra navegar sem perder a visão geral da série.
  const serieMensalCompleta = porMes;

  const tendenciaMensalPct = useMemo(() => {
    if (porMes.length < 2) return null;
    const atual = porMes[porMes.length - 1];
    const anterior = porMes[porMes.length - 2];
    if (anterior.total === 0) return null;
    return ((atual.total - anterior.total) / anterior.total) * 100;
  }, [porMes]);

  // Cumprimento de OLA: só entram no denominador incidentes marcados como
  // elegíveis a KPI (regra de negócio já aplicada na importação/geração).
  const cumprimentoOla = useMemo(() => {
    const elegiveis = filtrados.filter((i) => i.elegivel_kpi);
    if (!elegiveis.length) return null;
    return (elegiveis.filter((i) => i.dentro_ola).length / elegiveis.length) * 100;
  }, [filtrados]);

  // Efetividade das correções: considera "definidas" as classificações
  // Efetiva/Paliativa/Inconclusiva — excluímos apenas "Pendente" (ação ainda
  // não avaliada). "Inconclusiva" entra no denominador (é um desfecho final
  // da janela de validação) mas não conta como sucesso no numerador.
  const efetividadeCorrecoes = useMemo(() => {
    const definidas = acoes.filter((a) => a.classificacao !== "Pendente");
    if (!definidas.length) return null;
    return (definidas.filter((a) => a.classificacao === "Efetiva").length / definidas.length) * 100;
  }, [acoes]);

  // Grupos com maior risco acumulado — soma da probabilidade de violação dos
  // riscos ativos de cada grupo (não filtrado pelos seletores acima, mesmo
  // critério já usado para o KPI "Riscos críticos ativos").
  const gruposRisco = useMemo(() => {
    const map = new Map<string, number>();
    riscos
      .filter((r) => r.status === "Ativo")
      .forEach((r) => {
        map.set(r.grupo, (map.get(r.grupo) ?? 0) + r.probabilidade_violacao);
      });
    return Array.from(map, ([grupo, total]) => ({ grupo, total: Math.round(total) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [riscos]);

  // Crescimento do risco acumulado por grupo, mês a mês — para os 5 grupos
  // do topo de `gruposRisco`. A data de cálculo do risco em si não varia nos
  // dados demo (é sempre "agora"), então usamos a data de abertura do
  // incidente ligado a cada risco como o momento em que aquele risco surgiu.
  // Soma cumulativa: o total de um grupo só sobe mês a mês (reflete riscos
  // ativos se acumulando), nunca "recua" sozinho — só cai de verdade quando o
  // risco correspondente vira Mitigado e some da base de riscos Ativos.
  //
  // Fallback: em bases importadas, é comum um risco referenciar um incidente
  // fora do lote atualmente carregado (import parcial) — sem correspondência
  // em incidentesPorNumero. Nesse caso usamos data_calculo do próprio risco
  // em vez de descartar o registro, pra não subestimar o total do grupo.
  const gruposRiscoSerie = useMemo(() => {
    const gruposTop = gruposRisco.slice(0, 5).map((g) => g.grupo);
    if (gruposTop.length === 0)
      return { grupos: gruposTop, dados: [] as Record<string, number | string>[] };

    const porGrupoMes = new Map<string, Map<string, number>>();
    const mesesSet = new Set<string>();

    riscos
      .filter((r) => r.status === "Ativo" && gruposTop.includes(r.grupo))
      .forEach((r) => {
        const inc = incidentesPorNumero.get(r.numero_incidente);
        const dataRef = inc?.data_abertura ?? r.data_calculo;
        const d = new Date(dataRef);
        const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        mesesSet.add(mes);
        if (!porGrupoMes.has(r.grupo)) porGrupoMes.set(r.grupo, new Map());
        const mapaGrupo = porGrupoMes.get(r.grupo)!;
        mapaGrupo.set(mes, (mapaGrupo.get(mes) ?? 0) + r.probabilidade_violacao);
      });

    const meses = Array.from(mesesSet).sort();
    const acumulado = new Map<string, number>(gruposTop.map((g) => [g, 0]));
    const dados = meses.map((mes) => {
      const linha: Record<string, number | string> = { mes };
      gruposTop.forEach((g) => {
        const incremento = porGrupoMes.get(g)?.get(mes) ?? 0;
        const novoTotal = (acumulado.get(g) ?? 0) + incremento;
        acumulado.set(g, novoTotal);
        linha[g] = Math.round(novoTotal);
      });
      return linha;
    });

    return { grupos: gruposTop, dados };
  }, [riscos, incidentesPorNumero, gruposRisco]);

  // Fila de ação do técnico: riscos já vêm ordenados por probabilidade de
  // violação (query Dexie), aqui só limitamos a um tamanho de lista razoável.
  const topRiscos = useMemo(() => riscos.slice(0, 15), [riscos]);

  const alertasNaoReconhecidos = useMemo(
    () =>
      [...alertas]
        .filter((a) => a.status === "Novo")
        .sort((a, b) => +new Date(b.data_criacao) - +new Date(a.data_criacao))
        .slice(0, 8),
    [alertas],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Operações"
        subtitle="Visão integrada de incidentes, previsões e riscos operacionais."
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={produto} onValueChange={setProduto}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os produtos</SelectItem>
                {PRODUTOS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={prio} onValueChange={setPrio}>
              <SelectTrigger className="w-full sm:w-[176px] h-9">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas prioridades</SelectItem>
                {["P1", "P2", "P3", "P4", "P5"].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={grupo} onValueChange={setGrupo}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os grupos</SelectItem>
                {GRUPOS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <InsightAutomatico riscos={riscos} incidentes={filtrados} />

      {perfil === "tecnico" ? (
        <DashboardOperacional
          incHoje={incHoje}
          ativos={ativos}
          totalAlertas={alertas.length}
          emVal={emVal}
          efetivas={efetivas}
          paliativas={paliativas}
          criticos={criticos}
          totalRiscos={riscos.length}
          topRiscos={topRiscos}
          incidentesPorNumero={incidentesPorNumero}
          alertasNaoReconhecidos={alertasNaoReconhecidos}
          porGrupo={porGrupo}
          serieVolumeSeasonalNaive={serieVolumeSeasonalNaive}
        />
      ) : (
        <DashboardExecutivo
          prev1={prev1}
          prev7={prev7}
          cumprimentoOla={cumprimentoOla}
          tendenciaMensalPct={tendenciaMensalPct}
          efetividadeCorrecoes={efetividadeCorrecoes}
          criticos={criticos}
          totalRiscos={riscos.length}
          variacaoSemanal={variacaoSemanal}
          serieMensal={serieMensalCompleta}
          gruposRiscoSerie={gruposRiscoSerie}
          porPrio={porPrio}
          serieVolumeSeasonalNaive={serieVolumeSeasonalNaive}
        />
      )}
    </div>
  );
}
